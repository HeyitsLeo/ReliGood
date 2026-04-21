import { logger } from '../logger.js'
import { expireOldListings } from '../domain/temp-listing-repo.js'

/** Called by BullMQ repeatable job to expire old temp listings. */
export async function processExpireListings(): Promise<void> {
  try {
    const count = await expireOldListings()
    if (count > 0) {
      logger.info({ expired: count }, 'expire-listings: removed expired temp listings')
    }
  } catch (err) {
    logger.error({ err }, 'expire-listings: failed')
    throw err
  }
}
