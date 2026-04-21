import { DelayedError, Queue, Worker, type Job } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '../config.js'
import { QUEUE_NAMES } from '@zamgo/shared'
import { logger } from '../logger.js'
import { acquireCustomerLock, releaseCustomerLock } from '../ai/customer-lock.js'
import type { InboundJobData } from './process-inbound.js'
import { processInbound } from './process-inbound.js'
import { processExpireListings } from './expire-listings.js'

const EXPIRE_LISTINGS_QUEUE = 'expire-listings'

let _connection: Redis | null = null
let _queue: Queue<InboundJobData> | null = null
let _worker: Worker<InboundJobData> | null = null
let _expireQueue: Queue | null = null
let _expireWorker: Worker | null = null

function getConnection(): Redis {
  if (!_connection) {
    _connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  }
  return _connection
}

export function getInboundQueue(): Queue<InboundJobData> {
  if (!_queue) {
    _queue = new Queue<InboundJobData>(QUEUE_NAMES.INBOUND, {
      connection: getConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 100 },
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
      },
    })
  }
  return _queue
}

export function startWorker(): Worker<InboundJobData> {
  if (_worker) return _worker
  _worker = new Worker<InboundJobData>(
    QUEUE_NAMES.INBOUND,
    async (job: Job<InboundJobData>, token?: string) => {
      const { customerId } = job.data
      const lock = await acquireCustomerLock(customerId, env.CUSTOMER_LOCK_TTL_MS)
      if (!lock) {
        // Another worker owns this customer — free this slot immediately.
        logger.info({ jobId: job.id, customerId }, 'worker: customer busy, delaying')
        await job.moveToDelayed(Date.now() + 300, token)
        throw new DelayedError()
      }
      try {
        logger.info({ jobId: job.id, name: job.name }, 'worker: job picked up')
        await processInbound(job.data)
      } finally {
        await releaseCustomerLock(customerId, lock)
      }
    },
    {
      connection: getConnection(),
      concurrency: env.WORKER_CONCURRENCY,
    },
  )
  _worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'worker: job failed')
  })
  _worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'worker: job completed')
  })
  logger.info({ queue: QUEUE_NAMES.INBOUND }, 'worker started')
  return _worker
}

/** Start the expire-listings repeatable worker (runs every 60s). */
export function startExpireListingsWorker(): Worker {
  if (_expireWorker) return _expireWorker

  _expireQueue = new Queue(EXPIRE_LISTINGS_QUEUE, {
    connection: getConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 10 },
    },
  })

  // Add repeatable job: every 60 seconds
  _expireQueue.add('expire', {}, { repeat: { every: 60_000 } })

  _expireWorker = new Worker(
    EXPIRE_LISTINGS_QUEUE,
    async () => {
      await processExpireListings()
    },
    { connection: getConnection(), concurrency: 1 },
  )
  _expireWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'expire-listings: job failed')
  })
  logger.info('expire-listings worker started (every 60s)')
  return _expireWorker
}

export async function shutdownQueue(): Promise<void> {
  try {
    if (_expireWorker) await _expireWorker.close()
    if (_expireQueue) await _expireQueue.close()
    if (_worker) await _worker.close()
    if (_queue) await _queue.close()
    if (_connection) await _connection.quit()
  } catch (e) {
    logger.warn({ err: e }, 'shutdownQueue error')
  } finally {
    _expireWorker = null
    _expireQueue = null
    _worker = null
    _queue = null
    _connection = null
  }
}
