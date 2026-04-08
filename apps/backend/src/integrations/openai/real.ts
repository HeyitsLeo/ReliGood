/**
 * Real OpenAI adapter using the openai SDK.
 */
import OpenAI from 'openai'
import { env } from '../../config.js'
import { VISION_KEYWORDS_PROMPT } from '../../ai/prompts.js'
import type { ChatMessage, ChatResponse, VisionResponse } from './mock.js'

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  return _client
}

export async function chat(messages: ChatMessage[], opts?: { json?: boolean }): Promise<ChatResponse> {
  const client = getClient()
  const completion = await client.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...(opts?.json ? { response_format: { type: 'json_object' as const } } : {}),
    temperature: 0.3,
  })
  const content = completion.choices[0]?.message?.content ?? ''
  return { content }
}

export async function vision(imageUrl: string): Promise<VisionResponse> {
  const client = getClient()
  const completion = await client.chat.completions.create({
    model: env.OPENAI_VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_KEYWORDS_PROMPT },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 100,
    temperature: 0.2,
  })
  const raw = completion.choices[0]?.message?.content ?? 'unknown item'
  return { keywords: raw, description: raw }
}

export async function embed(text: string): Promise<number[]> {
  const client = getClient()
  const result = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text,
  })
  return result.data[0]?.embedding ?? []
}
