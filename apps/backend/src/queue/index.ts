import { Queue, Worker, type Job } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '../config.js'
import { QUEUE_NAMES } from '@zamgo/shared'
import { logger } from '../logger.js'
import type { InboundJobData } from './process-inbound.js'
import { processInbound } from './process-inbound.js'

let _connection: Redis | null = null
let _queue: Queue<InboundJobData> | null = null
let _worker: Worker<InboundJobData> | null = null

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
    async (job: Job<InboundJobData>) => {
      logger.info({ jobId: job.id, name: job.name }, 'worker: job picked up')
      await processInbound(job.data)
    },
    {
      connection: getConnection(),
      concurrency: 4,
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

export async function shutdownQueue(): Promise<void> {
  try {
    if (_worker) await _worker.close()
    if (_queue) await _queue.close()
    if (_connection) await _connection.quit()
  } catch (e) {
    logger.warn({ err: e }, 'shutdownQueue error')
  } finally {
    _worker = null
    _queue = null
    _connection = null
  }
}
