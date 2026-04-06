import './../config.js'
import { logger } from '../logger.js'
import { startWorker, shutdownQueue } from './index.js'
import { closeDb } from '@zamgo/db'

async function main() {
  startWorker()
  logger.info('worker entry: running')

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'worker shutting down')
    try {
      await shutdownQueue()
      await closeDb()
    } catch (e) {
      logger.error({ err: e }, 'worker shutdown error')
    }
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  logger.error({ err }, 'worker failed to start')
  process.exit(1)
})
