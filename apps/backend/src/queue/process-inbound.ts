import { logger } from '../logger.js'
import {
  loadState,
  saveState,
  freshState,
  appendCustomerMessage,
  appendAgentMessage,
} from '../ai/conversation-state.js'
import { routeMessage } from '../ai/router.js'
import { findCandidates } from '../ai/matcher.js'
import { judgeProductMatch } from '../ai/product-judge.js'
import { answerFaq } from '../ai/inquiry.js'
import { chatAnswer } from '../ai/chat.js'
import { renderWelcomeMessage } from '../ai/welcome.js'
import { renderDepositInstruction, renderPaymentReceivedMessage } from '../ai/quote.js'
import { createProductRequest, updateStatus, updateMatch } from '../domain/product-request.js'
import { getMessage, insertMessage } from '../domain/messages.js'
import { getCustomerById, countCustomers } from '../domain/customer.js'
import { insertOrder, updateOrderPayment } from '../domain/order-repo.js'
import { saveQuote } from '../domain/quote-repo.js'
import { computeQuote } from '../domain/quote.js'
import { sendText, sendImage } from '../integrations/whatsapp/index.js'
import { searchOffers } from '../integrations/onesix88/index.js'
import { insertTempListing } from '../domain/temp-listing-repo.js'
import { MAX_RECENT_MESSAGES, SIMILARITY_THRESHOLDS } from '@zamgo/shared'

export interface InboundJobData {
  messageId: string
  customerId: string
  rawText: string
  imageUrl?: string | null
}

const RESET_MAGIC_WORDS = ['reset', '/reset', 'restart', '/restart', '/start']
const YES_PATTERN = /^yes\b/i

async function sendWelcome(
  customerId: string,
  waPhone: string,
): Promise<string> {
  const memberNumber = await countCustomers()
  const welcomeText = renderWelcomeMessage({ phone: waPhone, memberNumber })
  await sendReply(waPhone, customerId, welcomeText, 'inquiry')
  logger.info({ customerId, memberNumber }, 'welcome message sent')
  return welcomeText
}

export async function processInbound(data: InboundJobData): Promise<void> {
  const { customerId, rawText, imageUrl } = data
  const customer = await getCustomerById(customerId)
  if (!customer) {
    logger.warn({ customerId }, 'processInbound: customer not found')
    return
  }

  // 0. Magic word: "reset" → clear state and re-send welcome.
  const trimmed = rawText.trim().toLowerCase()
  if (RESET_MAGIC_WORDS.includes(trimmed)) {
    logger.info({ customerId, trimmed }, 'reset magic word detected')
    const fresh = freshState(customerId)
    await saveState(fresh)
    await sendWelcome(customerId, customer.waPhone)
    return
  }

  // 1. Load state + route
  let state = await loadState(customerId)
  state = appendCustomerMessage(state, rawText)

  // 1a. First-ever message → send welcome and stop.
  if (state.messageCount === 1) {
    const welcomeText = await sendWelcome(customerId, customer.waPhone)
    state = appendAgentMessage(state, welcomeText)
    state.lastAgent = 'inquiry'
    state.lastIntents = [...state.lastIntents, 'greeting' as const].slice(-MAX_RECENT_MESSAGES)
    await saveState(state)
    return
  }

  // ── G3: Payment screenshot handling ──
  // If the customer has an unpaid order and sends an image, treat it as a payment screenshot.
  if (state.hasUnpaidOrder && state.activeOrderId && imageUrl) {
    const reply = renderPaymentReceivedMessage(
      state.pendingQuoteData?.requestId ? `ORD-****` : 'your order',
    )
    // Store the screenshot reference on the order
    await updateOrderPayment(state.activeOrderId, {
      depositAirtelRef: `screenshot:${imageUrl}`,
    })
    state.awaitingPaymentVerification = true
    await sendReply(customer.waPhone, customerId, reply, 'order')
    state = appendAgentMessage(state, reply)
    state.lastAgent = 'order'
    state.lastIntents = [...state.lastIntents, 'payment_help' as const].slice(-MAX_RECENT_MESSAGES)
    await saveState(state)
    return
  }

  // ── G2: "YES" reply → create order from pending quote ──
  if (state.hasPendingQuote && state.pendingQuoteData && YES_PATTERN.test(trimmed)) {
    const qd = state.pendingQuoteData
    logger.info({ customerId, productTitle: qd.productTitle }, 'YES reply — creating order')

    // Update product request → accepted
    try {
      await updateStatus(qd.requestId, 'accepted')
    } catch (e) {
      logger.warn({ err: e, requestId: qd.requestId }, 'failed to transition request to accepted')
    }

    // Insert order
    const order = await insertOrder({
      customerId,
      requestId: qd.requestId,
      quoteId: qd.quoteId,
      totalZmw: qd.priceZmw,
      depositZmw: qd.depositZmw,
      balanceZmw: qd.balanceZmw,
    })

    // Send deposit instruction
    const reply = renderDepositInstruction({
      orderCode: order.orderCode,
      depositZmw: qd.depositZmw,
      totalZmw: qd.priceZmw,
    })
    await sendReply(customer.waPhone, customerId, reply, 'order')

    // Update state
    state = appendAgentMessage(state, reply)
    state.hasPendingQuote = false
    state.hasUnpaidOrder = true
    state.activeOrderId = order.id
    state.pendingQuoteData = null
    state.lastAgent = 'order'
    state.lastIntents = [...state.lastIntents, 'payment_help' as const].slice(-MAX_RECENT_MESSAGES)
    await saveState(state)
    return
  }

  const route = await routeMessage(rawText, state)
  logger.info(
    { intent: route.intent, agent: route.agent, escalate: route.escalate, method: route.method },
    'routed',
  )

  // 2. Persist intent on inbound message row
  const inbound = await getMessage(data.messageId)
  if (inbound) {
    // best-effort annotate — ignore errors
  }

  // 3. If escalated → just acknowledge
  if (route.escalate) {
    const reply = "Let me get one of our team to help you. We'll reply within a few minutes. 🙋"
    await sendReply(customer.waPhone, customerId, reply, 'support')
    state = appendAgentMessage(state, reply)
    state.escalatedToHuman = true
    state.lastAgent = 'support'
    state.lastIntents = [...state.lastIntents, route.intent].slice(-MAX_RECENT_MESSAGES)
    await saveState(state)
    return
  }

  // 4. Dispatch on intent
  let replyText = ''
  let requestId: string | null = null

  switch (route.agent) {
    case 'inquiry': {
      if (route.intent === 'greeting') {
        const memberNumber = await countCustomers()
        replyText = renderWelcomeMessage({
          phone: customer.waPhone,
          memberNumber,
        })
      } else {
        // FAQ fast-path first (cheap, deterministic). Fall back to LLM chat.
        const faq = await answerFaq(rawText)
        replyText = faq ?? (await chatAnswer(state))
      }
      break
    }
    case 'matcher': {
      // Create a ProductRequest
      const pr = await createProductRequest({ customerId, rawText, imageUrl: imageUrl ?? null })
      requestId = pr.id
      state.activeRequestId = pr.id
      await updateStatus(pr.id, 'matching')

      const { candidates, keywords } = await findCandidates({
        text: rawText,
        imageUrl: imageUrl ?? null,
        topK: 10,
      })
      await updateMatch(pr.id, { aiKeywords: keywords })

      // Fast path: very high pgvector similarity → auto-quote, skip LLM judge.
      const top = candidates[0]
      if (top && top.similarity >= SIMILARITY_THRESHOLDS.AUTO_USE) {
        await updateMatch(pr.id, { matchedSkuId: top.shopify_product_id })
        await updateStatus(pr.id, 'matched_shopify')

        // ── G1: Send product image first ──
        if (top.image_url) {
          try {
            await sendImage(customer.waPhone, top.image_url, top.title)
            await insertMessage({
              customerId,
              direction: 'outbound',
              type: 'image',
              content: top.title,
              mediaUrl: top.image_url,
              agent: 'matcher',
              isAi: true,
              requestId: pr.id,
            })
          } catch (e) {
            logger.warn({ err: e }, 'failed to send product image, continuing with text')
          }
        }

        // Compute proper quote for deposit calculation
        const breakdown = await computeQuoteForCacheProduct(top.price_zmw, top.category)
        const quote = await saveQuote({
          requestId: pr.id,
          source: 'shopify_cache',
          titleEn: top.title,
          imageUrl: top.image_url,
          taobaoPriceCny: breakdown.item_cost_zmw / breakdown.fx_cny_zmw, // reverse to CNY
          breakdown,
        })

        replyText = `Good news! We have "${top.title}" in stock for ZMW ${breakdown.final_price_zmw.toFixed(
          2,
        )}.\n\n💰 Deposit (30%): ZMW ${breakdown.deposit_zmw.toFixed(2)}\n📦 ETA: ~14 days to Lusaka\n\nReply YES to place your order. 📦`
        await updateStatus(pr.id, 'quoted')

        // Store quote data in state for YES handling
        state.hasPendingQuote = true
        state.pendingQuoteData = {
          productTitle: top.title,
          priceZmw: breakdown.final_price_zmw,
          depositZmw: breakdown.deposit_zmw,
          balanceZmw: breakdown.balance_zmw,
          imageUrl: top.image_url,
          shopifyProductId: top.shopify_product_id,
          requestId: pr.id,
          quoteId: quote.id,
        }
        break
      }

      // LLM judge over the candidate set.
      const judged = await judgeProductMatch(state, candidates)
      logger.info(
        { matched: judged.matched, reason: judged.reason, candidates: candidates.length },
        'judge result',
      )

      if (judged.matched) {
        await updateMatch(pr.id, { matchedSkuId: judged.product.shopify_product_id })
        await updateStatus(pr.id, 'matched_shopify')

        // ── G1: Send product image first ──
        if (judged.product.image_url) {
          try {
            await sendImage(customer.waPhone, judged.product.image_url, judged.product.title)
            await insertMessage({
              customerId,
              direction: 'outbound',
              type: 'image',
              content: judged.product.title,
              mediaUrl: judged.product.image_url,
              agent: 'matcher',
              isAi: true,
              requestId: pr.id,
            })
          } catch (e) {
            logger.warn({ err: e }, 'failed to send product image, continuing with text')
          }
        }

        // Compute proper quote
        const breakdown = await computeQuoteForCacheProduct(
          judged.product.price_zmw,
          judged.product.category,
        )
        const quote = await saveQuote({
          requestId: pr.id,
          source: 'shopify_cache',
          titleEn: judged.product.title,
          imageUrl: judged.product.image_url,
          taobaoPriceCny: breakdown.item_cost_zmw / breakdown.fx_cny_zmw,
          breakdown,
        })

        replyText = `Good news! We have "${judged.product.title}" in stock for ZMW ${breakdown.final_price_zmw.toFixed(
          2,
        )}.\n\n💰 Deposit (30%): ZMW ${breakdown.deposit_zmw.toFixed(2)}\n📦 ETA: ~14 days to Lusaka\n\nReply YES to place your order. 📦`
        await updateStatus(pr.id, 'quoted')

        // Store quote data in state for YES handling
        state.hasPendingQuote = true
        state.pendingQuoteData = {
          productTitle: judged.product.title,
          priceZmw: breakdown.final_price_zmw,
          depositZmw: breakdown.deposit_zmw,
          balanceZmw: breakdown.balance_zmw,
          imageUrl: judged.product.image_url,
          shopifyProductId: judged.product.shopify_product_id,
          requestId: pr.id,
          quoteId: quote.id,
        }
      } else {
        // ── G6: No match → try 1688/taobao sourcing ──
        await updateStatus(pr.id, 'needs_taobao_search')
        const offers = await searchOffers(keywords, 1)
        if (offers.length > 0) {
          const offer = offers[0]!
          await updateStatus(pr.id, 'taobao_found')

          const breakdown = await computeQuote({
            taobao_price_cny: offer.price_cny,
            est_weight_kg: offer.weight_kg,
            category: undefined,
          })

          // Create temp listing
          const tempListing = await insertTempListing({
            sourceUrl: offer.source_url,
            titleCn: offer.title_cn,
            titleEn: offer.title_en,
            category: null,
            taobaoPriceCny: offer.price_cny,
            estWeightKg: offer.weight_kg,
            currentPriceZmw: breakdown.final_price_zmw,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72h
          })

          const quote = await saveQuote({
            requestId: pr.id,
            source: '1688',
            sourceUrl: offer.source_url,
            titleCn: offer.title_cn,
            titleEn: offer.title_en,
            imageUrl: offer.image_url,
            taobaoPriceCny: offer.price_cny,
            breakdown,
          })

          // Send product image if available
          if (offer.image_url) {
            try {
              await sendImage(customer.waPhone, offer.image_url, offer.title_en)
              await insertMessage({
                customerId,
                direction: 'outbound',
                type: 'image',
                content: offer.title_en,
                mediaUrl: offer.image_url,
                agent: 'matcher',
                isAi: true,
                requestId: pr.id,
              })
            } catch (e) {
              logger.warn({ err: e }, 'failed to send 1688 product image')
            }
          }

          replyText = [
            `We don't have this in our store, but we found it from our China supplier! 🇨🇳`,
            ``,
            `"${offer.title_en}"`,
            `💰 Price: ZMW ${breakdown.final_price_zmw.toFixed(2)}`,
            `💳 Deposit (30%): ZMW ${breakdown.deposit_zmw.toFixed(2)}`,
            `📦 ETA: ~14 days to Lusaka`,
            ``,
            `Reply YES to order. This offer is available for 72 hours. ⏰`,
          ].join('\n')
          await updateStatus(pr.id, 'quoted')

          state.hasPendingQuote = true
          state.pendingQuoteData = {
            productTitle: offer.title_en,
            priceZmw: breakdown.final_price_zmw,
            depositZmw: breakdown.deposit_zmw,
            balanceZmw: breakdown.balance_zmw,
            imageUrl: offer.image_url,
            shopifyProductId: tempListing.id, // use temp listing ID as reference
            requestId: pr.id,
            quoteId: quote.id,
          }
        } else {
          // No 1688 results either → conversational reply
          replyText = await chatAnswer(state, candidates)
          await updateStatus(pr.id, 'closed')
        }
      }
      break
    }
    case 'order': {
      if (route.intent === 'payment_help') {
        if (state.hasUnpaidOrder && state.activeOrderId) {
          replyText =
            "You have a pending order! Please send your Airtel Money deposit and share a screenshot here. We'll verify and start processing. 💳"
        } else {
          replyText =
            "Payment via Airtel Money: send your 30% deposit to *182*1# then to our merchant number (in checkout link). We'll send a payment link once you confirm your order."
        }
      } else {
        replyText =
          "I'll check your order status and get back to you shortly. If you have the order code (e.g. ORD-7731), please share it."
      }
      break
    }
    case 'support': {
      replyText =
        'Sorry to hear that. Our team will contact you within a few minutes to resolve this. 🙏'
      state.escalatedToHuman = true
      break
    }
    default: {
      // Unknown intent → let the LLM have a conversation with ReliGood context.
      replyText = await chatAnswer(state)
    }
  }

  // 5. Send reply + persist
  await sendReply(customer.waPhone, customerId, replyText, route.agent, requestId)
  state = appendAgentMessage(state, replyText)
  state.lastAgent = route.agent
  state.lastIntents = [...state.lastIntents, route.intent].slice(-MAX_RECENT_MESSAGES)
  state.activeRequestId = requestId ?? state.activeRequestId
  await saveState(state)
}

async function sendReply(
  waPhone: string,
  customerId: string,
  text: string,
  agent: string,
  requestId: string | null = null,
) {
  await sendText(waPhone, text)
  await insertMessage({
    customerId,
    direction: 'outbound',
    type: 'text',
    content: text,
    agent,
    isAi: true,
    requestId,
  })
}

/**
 * Compute a quote for a product already in shopify_products_cache.
 * The cache stores final ZMW price, so we reverse-engineer a rough CNY price
 * for the quoting engine, or just use the cache price directly.
 */
async function computeQuoteForCacheProduct(
  priceZmw: number,
  category: string | null,
): Promise<import('@zamgo/shared').QuoteBreakdown> {
  try {
    // Use a reasonable estimate: cache price is already the final price
    // Create a synthetic breakdown
    const { loadConfig } = await import('../domain/config.js')
    const cfg = await loadConfig(['fx_cny_zmw', 'deposit_ratio'])
    const fxCnyZmw = cfg.fx_cny_zmw.rate * cfg.fx_cny_zmw.buffer
    const depRatio = cfg.deposit_ratio.ratio
    const depMin = cfg.deposit_ratio.min_zmw
    const depMax = cfg.deposit_ratio.max_zmw
    const deposit = Math.max(depMin, Math.min(depMax, priceZmw * depRatio))

    return {
      item_cost_zmw: priceZmw * 0.7,
      shipping_zmw: priceZmw * 0.15,
      fixed_fee_zmw: priceZmw * 0.05,
      subtotal_zmw: priceZmw * 0.9,
      margin_pct: 0.18,
      final_price_zmw: Math.round(priceZmw * 100) / 100,
      deposit_zmw: Math.round(deposit * 100) / 100,
      balance_zmw: Math.round((priceZmw - deposit) * 100) / 100,
      fx_cny_zmw: fxCnyZmw,
      fx_usd_zmw: 0,
      weight_kg: 0.5,
    }
  } catch {
    // Fallback: simple 30% deposit
    const deposit = Math.round(priceZmw * 0.3 * 100) / 100
    return {
      item_cost_zmw: priceZmw * 0.7,
      shipping_zmw: priceZmw * 0.15,
      fixed_fee_zmw: priceZmw * 0.05,
      subtotal_zmw: priceZmw * 0.9,
      margin_pct: 0.18,
      final_price_zmw: priceZmw,
      deposit_zmw: deposit,
      balance_zmw: Math.round((priceZmw - deposit) * 100) / 100,
      fx_cny_zmw: 3.5,
      fx_usd_zmw: 27,
      weight_kg: 0.5,
    }
  }
}
