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
import { createProductRequest, updateStatus, updateMatch } from '../domain/product-request.js'
import { getMessage, insertMessage } from '../domain/messages.js'
import { getCustomerById, countCustomers } from '../domain/customer.js'
import { sendText } from '../integrations/whatsapp/index.js'
import { MAX_RECENT_MESSAGES, SIMILARITY_THRESHOLDS } from '@zamgo/shared'

export interface InboundJobData {
  messageId: string
  customerId: string
  rawText: string
  imageUrl?: string | null
}

const RESET_MAGIC_WORDS = ['reset', '/reset', 'restart', '/restart', '/start']

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

  // 0. Magic word: "reset" / "/reset" / "restart" → clear state and re-send welcome.
  //    Useful for testing the welcome flow without manually clearing Redis.
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

  // 1a. First-ever message from this customer → send ReliGood welcome message and stop.
  //     messageCount === 1 means this is their very first inbound in the current state window.
  if (state.messageCount === 1) {
    const welcomeText = await sendWelcome(customerId, customer.waPhone)
    state = appendAgentMessage(state, welcomeText)
    state.lastAgent = 'inquiry'
    state.lastIntents = [...state.lastIntents, 'greeting' as const].slice(-MAX_RECENT_MESSAGES)
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
        replyText = `Good news! We have "${top.title}" in stock for ZMW ${top.price_zmw.toFixed(
          2,
        )}. Reply YES to place your order. 📦`
        await updateStatus(pr.id, 'quoted')
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
        replyText = `Good news! We have "${judged.product.title}" in stock for ZMW ${judged.product.price_zmw.toFixed(
          2,
        )}. Reply YES to place your order. 📦`
        await updateStatus(pr.id, 'quoted')
      } else {
        // No confident match → conversational reply grounded in top candidates
        // so the LLM can naturally ask for more details (model, color, budget).
        replyText = await chatAnswer(state, candidates)
        await updateStatus(pr.id, 'closed')
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
