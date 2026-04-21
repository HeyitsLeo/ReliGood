import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { getDb } from '@zamgo/db'
import { shopifyProductsCache } from '@zamgo/db/schema'
import { eq, desc, and, ilike } from 'drizzle-orm'
import { env } from '../../config.js'
import { mockEmbed } from '@zamgo/db/mock-embed'

function generateProductId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (env.ADAPTER_MODE === 'real') {
    const { embed } = await import('../../integrations/openai/real.js')
    return embed(text)
  }
  return mockEmbed(text)
}

const productInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priceZmw: z.number().positive(),
  imageUrls: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
})

export const productsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          inStock: z.boolean().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(200).default(100),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = getDb()
      const conditions = []

      if (input?.category) {
        conditions.push(eq(shopifyProductsCache.category, input.category))
      }
      if (input?.inStock !== undefined) {
        conditions.push(eq(shopifyProductsCache.inStock, input.inStock))
      }
      if (input?.search) {
        conditions.push(ilike(shopifyProductsCache.title, `%${input.search}%`))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined
      const limit = input?.limit ?? 100
      const offset = input?.offset ?? 0

      const items = await db
        .select({
          id: shopifyProductsCache.id,
          shopifyProductId: shopifyProductsCache.shopifyProductId,
          title: shopifyProductsCache.title,
          description: shopifyProductsCache.description,
          category: shopifyProductsCache.category,
          priceZmw: shopifyProductsCache.priceZmw,
          imageUrls: shopifyProductsCache.imageUrls,
          tags: shopifyProductsCache.tags,
          inStock: shopifyProductsCache.inStock,
          syncedAt: shopifyProductsCache.syncedAt,
        })
        .from(shopifyProductsCache)
        .where(where)
        .orderBy(desc(shopifyProductsCache.syncedAt))
        .limit(limit)
        .offset(offset)

      return items
    }),

  getById: publicProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const db = getDb()
    const [item] = await db
      .select()
      .from(shopifyProductsCache)
      .where(eq(shopifyProductsCache.id, input))
      .limit(1)
    return item ?? null
  }),

  create: publicProcedure.input(productInput).mutation(async ({ input }) => {
    const db = getDb()
    const embeddingText = [input.title, input.description, ...(input.tags || [])].filter(Boolean).join(' ')
    const embedding = await generateEmbedding(embeddingText)

    const [created] = await db
      .insert(shopifyProductsCache)
      .values({
        shopifyProductId: generateProductId(),
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        priceZmw: input.priceZmw.toString(),
        imageUrls: input.imageUrls,
        tags: input.tags,
        inStock: input.inStock,
        embedding,
      })
      .returning()

    return created!
  }),

  update: publicProcedure
    .input(z.object({ id: z.string().uuid(), data: productInput.partial() }))
    .mutation(async ({ input }) => {
      const db = getDb()

      // Get current product to merge for embedding
      const [current] = await db
        .select()
        .from(shopifyProductsCache)
        .where(eq(shopifyProductsCache.id, input.id))
        .limit(1)

      if (!current) throw new Error('Product not found')

      const title = input.data.title ?? current.title
      const description = input.data.description ?? current.description
      const tags = input.data.tags ?? current.tags ?? []
      const embeddingText = [title, description, ...tags].filter(Boolean).join(' ')
      const embedding = await generateEmbedding(embeddingText)

      const updateData: Record<string, unknown> = { embedding, syncedAt: new Date() }
      if (input.data.title !== undefined) updateData.title = input.data.title
      if (input.data.description !== undefined) updateData.description = input.data.description
      if (input.data.category !== undefined) updateData.category = input.data.category
      if (input.data.priceZmw !== undefined) updateData.priceZmw = input.data.priceZmw.toString()
      if (input.data.imageUrls !== undefined) updateData.imageUrls = input.data.imageUrls
      if (input.data.tags !== undefined) updateData.tags = input.data.tags
      if (input.data.inStock !== undefined) updateData.inStock = input.data.inStock

      const [updated] = await db
        .update(shopifyProductsCache)
        .set(updateData)
        .where(eq(shopifyProductsCache.id, input.id))
        .returning()

      return updated!
    }),

  delete: publicProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
    const db = getDb()
    await db.delete(shopifyProductsCache).where(eq(shopifyProductsCache.id, input))
    return { ok: true }
  }),

  deleteAll: publicProcedure.mutation(async () => {
    const db = getDb()
    const deleted = await db.delete(shopifyProductsCache).returning({ id: shopifyProductsCache.id })
    return { ok: true, count: deleted.length }
  }),

  toggleStock: publicProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
    const db = getDb()
    const [current] = await db
      .select({ inStock: shopifyProductsCache.inStock })
      .from(shopifyProductsCache)
      .where(eq(shopifyProductsCache.id, input))
      .limit(1)

    if (!current) throw new Error('Product not found')

    const [updated] = await db
      .update(shopifyProductsCache)
      .set({ inStock: !current.inStock })
      .where(eq(shopifyProductsCache.id, input))
      .returning()

    return updated!
  }),
})
