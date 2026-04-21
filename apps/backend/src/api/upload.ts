import type { FastifyInstance } from 'fastify'
import { uploadProductImage } from '../integrations/supabase/storage.js'
import { logger } from '../logger.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function registerUpload(app: FastifyInstance) {
  app.post('/api/upload/product-image', async (req, reply) => {
    try {
      const file = await req.file()

      if (!file) {
        return reply.code(400).send({ error: 'No file provided' })
      }

      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return reply.code(400).send({ error: 'Invalid file type. Allowed: jpg, png, webp, gif' })
      }

      const buffer = await file.toBuffer()

      if (buffer.length > MAX_FILE_SIZE) {
        return reply.code(400).send({ error: 'File too large. Max 5MB' })
      }

      const url = await uploadProductImage(buffer, file.filename)
      return { url }
    } catch (err: any) {
      logger.error({ err }, 'Image upload failed')
      return reply.code(500).send({
        error: err.message?.includes('SUPABASE')
          ? 'Image storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.'
          : `Upload failed: ${err.message || 'Unknown error'}`,
      })
    }
  })
}
