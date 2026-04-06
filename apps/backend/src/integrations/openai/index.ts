import { env } from '../../config.js'
import * as mock from './mock.js'
import * as real from './real.js'

type Impl = typeof mock

const impl: Impl = env.ADAPTER_MODE === 'real' ? (real as unknown as Impl) : mock

export const chat = impl.chat
export const vision = impl.vision
export const embed = impl.embed

export type { ChatMessage, ChatResponse, VisionResponse } from './mock.js'
