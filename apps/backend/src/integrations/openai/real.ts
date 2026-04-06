/**
 * Real OpenAI adapter stub. Fill in with @anthropic-ai/sdk or openai SDK
 * when migrating out of mock mode.
 */
import type { ChatMessage, ChatResponse, VisionResponse } from './mock.js'

export async function chat(_messages: ChatMessage[], _opts?: { json?: boolean }): Promise<ChatResponse> {
  throw new Error('OpenAI real adapter not implemented. Set ADAPTER_MODE=mock or fill in real.ts')
}

export async function vision(_imageUrl: string): Promise<VisionResponse> {
  throw new Error('OpenAI real vision not implemented')
}

export async function embed(_text: string): Promise<number[]> {
  throw new Error('OpenAI real embed not implemented')
}
