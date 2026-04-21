import { randomUUID } from 'node:crypto'
import { getRedis } from './conversation-state.js'

const PREFIX = 'lock:customer:'

const RELEASE_LUA =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end'

export async function acquireCustomerLock(
  customerId: string,
  ttlMs: number,
): Promise<string | null> {
  const token = randomUUID()
  const ok = await getRedis().set(PREFIX + customerId, token, 'PX', ttlMs, 'NX')
  return ok === 'OK' ? token : null
}

export async function releaseCustomerLock(
  customerId: string,
  token: string,
): Promise<void> {
  try {
    await getRedis().eval(RELEASE_LUA, 1, PREFIX + customerId, token)
  } catch {
    // lock auto-expires via PX; swallow release errors
  }
}
