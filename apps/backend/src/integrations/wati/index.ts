import { env } from '../../config.js'
import * as mock from './mock.js'
import * as real from './real.js'

type Impl = typeof mock

const impl: Impl = env.ADAPTER_MODE === 'real' ? (real as unknown as Impl) : mock

export const sendText = impl.sendText
export const sendInteractiveList = impl.sendInteractiveList

export type { InteractiveListItem } from './mock.js'
