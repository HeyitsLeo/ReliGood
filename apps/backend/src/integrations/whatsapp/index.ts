import { env } from '../../config.js'
import * as mock from './mock.js'
import * as real from './real.js'
import * as twilio from './twilio.js'

type Impl = typeof mock

function resolveImpl(): Impl {
  if (env.ADAPTER_MODE !== 'real') return mock
  if (env.TWILIO_ACCOUNT_SID) return twilio as unknown as Impl
  return real as unknown as Impl
}

const impl: Impl = resolveImpl()

export const sendText = impl.sendText
export const sendImage = impl.sendImage
export const sendInteractiveList = impl.sendInteractiveList
export const getMediaUrl = impl.getMediaUrl

export type { InteractiveListItem } from './mock.js'
