import type { OneSix88Offer } from './mock.js'

export async function searchOffers(_keyword: string, _limit = 3): Promise<OneSix88Offer[]> {
  throw new Error('1688 real API not implemented')
}
