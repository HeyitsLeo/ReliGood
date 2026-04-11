import { logger } from '../logger.js'
import {
  loadState,
  saveState,
  appendCustomerMessage,
  appendAgentMessage,
} from '../ai/conversation-state.js'
import { routeMessage } from '../ai/router.js'
import { matchProduct } from '../ai/matcher.js'
import { answerFaq, greetingResponse } from '../ai/inquiry.js'
import { renderQuoteMessage, renderMatchConfirmMessage, renderNotFoundMessage } from '../ai/quote.js'
import { renderWelcomeMessage } from '../ai/welcome.js'
import { createProductRequest, updateStatus, updateMatch } from '../domain/product-request.js'
import { computeQuote } from '../domain/quote.js'
import { saveQuote } from '../domain/quote-repo.js'
import { getMessage, insertMessage } from '../domain/messages.js'
import { getCustomerById, countCustomers } from '../domain/customer.js'
import { sendText } from '../integrations/whatsapp/index.js'
import { searchOffers } from '../integrations/onesix88/index.js'
import { MAX_RECENT_MESSAGES } from '@zamgo/shared'

export interface InboundJobData {
  messageId: string
  customerId: string
  rawText: string
  imageUrl?: string | null
}

export async function processInbound(data: InboundJobData): Promise<void> {
  const { customerId, rawText, imageUrl } = data
  const customer = await getCustomerById(customerId)
  if (!customer) {
    logger.warn({ customerId }, 'processInbound: customer not found')
    return
  }

  // 1. Load state + route
  let state = await loadState(customerId)
  state = appendCustomerMessage(state, rawText)

  // 1a. First-ever message from this customer → send ReliGood welcome message and stop.
  //     messageCount === 1 means this is their very first inbound in the current state window.
  if (state.messageCount === 1) {
    const memberNumber = await countCustomers()
    const welcomeText = renderWelcomeMessage({
      phone: customer.waPhone,
      memberNumber,
    })
    await sendReply(customer.waPhone, customerId, welcomeText, 'inquiry')
    state = appendAgentMessage(state, welcomeText)
    state.lastAgent = 'inquiry'
    state.lastIntents = [...state.lastIntents, 'greeting' as const].slice(-MAX_RECENT_MESSAGES)
    await saveState(state)
    logger.info({ customerId, memberNumber }, 'welcome message sent')
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

  // 3. If escalated → just acknowledge, no auto reply beyond "we'll follow up"
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
        replyText = greetingResponse(customer.waName ?? '')
      } else {
        const faq = await answerFaq(rawText)
        replyText =
          faq ??
          "Let me check with our team and get back to you. In the meantime, what product are you looking for?"
      }
      break
    }
    case 'matcher': {
      // Create a ProductRequest
      const pr = await createProductRequest({ customerId, rawText, imageUrl: imageUrl ?? null })
      requestId = pr.id
      state.activeRequestId = pr.id
      await updateStatus(pr.id, 'matching')

      const match = await matchProduct({ text: rawText, imageUrl: imageUrl ?? null })
      await updateMatch(pr.id, { aiKeywords: match.keywords })

      if (match.tier === 'auto_use' && match.bestMatch) {
        await updateMatch(pr.id, { matchedSkuId: match.bestMatch.shopify_product_id })
        await updateStatus(pr.id, 'matched_shopify')
        // Synthesize a quote from the SKU price (treat as already-ZMW, no fx needed)
        replyText = `Good news! We have "${match.bestMatch.title}" in stock for ZMW ${match.bestMatch.price_zmw.toFixed(
          2,
        )}. Reply YES to place your order. 📦`
        await updateStatus(pr.id, 'quoted')
      } else if (match.tier === 'needs_confirmation' && match.bestMatch) {
        await updateMatch(pr.id, { matchedSkuId: match.bestMatch.shopify_product_id })
        replyText = renderMatchConfirmMessage({
          productTitle: match.bestMatch.title,
          similarity: match.bestMatch.similarity,
        })
      } else {
        // Taobao path
        await updateStatus(pr.id, 'needs_taobao_search')
        const offers = await searchOffers(match.keywords, 3)
        if (offers.length === 0) {
          replyText = renderNotFoundMessage()
        } else {
          const top = offers[0]!
          const breakdown = await computeQuote({
            taobao_price_cny: top.price_cny,
            est_weight_kg: top.weight_kg,
            category: 'electronics_medium',
          })
          await saveQuote({
            requestId: pr.id,
            source: '1688',
            sourceUrl: top.source_url,
            titleCn: top.title_cn,
            titleEn: top.title_en,
            imageUrl: top.image_url,
            taobaoPriceCny: top.price_cny,
            breakdown,
          })
          await updateStatus(pr.id, 'taobao_found')
          await updateStatus(pr.id, 'quoted')
          replyText = renderQuoteMessage({
            productTitle: top.title_en,
            breakdown,
            etaDays: 14,
          })
        }
      }
      break
    }
    case 'order': {
      if (route.intent === 'payment_help') {
        replyText =
          "Payment via Airtel Money: send your 30% deposit to *182*1# then to our merchant number (in checkout link). We'll send a payment link once you confirm your order."
      } else {
        replyText =
          "I'll check your order status and get back to you shortly. If you have the order code (e.g. ORD-7731), please share it."
      }
      break
    }
    case 'support': {
      replyText =
        "Sorry to hear that. Our team will contact you within a few minutes to resolve this. 🙏"
      state.escalatedToHuman = true
      break
    }
    default: {
      replyText = "Got it 👍 our team will follow up shortly."
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
