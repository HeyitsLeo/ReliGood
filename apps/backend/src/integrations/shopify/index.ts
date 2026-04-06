// ----- Shopify adapter disabled — uncomment when ready to integrate -----
// import { env } from '../../config.js'
// import * as mock from './mock.js'
// import * as real from './real.js'
//
// type Impl = typeof mock
//
// const impl: Impl = env.ADAPTER_MODE === 'real' ? (real as unknown as Impl) : mock
//
// export const listProducts = impl.listProducts
// export const createDraftOrder = impl.createDraftOrder
