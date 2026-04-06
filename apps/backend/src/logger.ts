import pino from 'pino'
import { env } from './config.js'

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
})
