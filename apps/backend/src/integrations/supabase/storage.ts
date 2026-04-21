import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from '../../config.js'
import { logger } from '../../logger.js'

const BUCKET = 'product-images'

let _client: SupabaseClient | null = null
let _bucketReady = false

function getClient(): SupabaseClient {
  if (!_client) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required for image upload')
    }
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  }
  return _client
}

async function ensureBucket(client: SupabaseClient): Promise<void> {
  if (_bucketReady) return

  const { data } = await client.storage.getBucket(BUCKET)
  if (!data) {
    const { error } = await client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    })
    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to create storage bucket: ${error.message}`)
    }
    logger.info('Created Supabase storage bucket: product-images')
  }
  _bucketReady = true
}

export async function uploadProductImage(file: Buffer, filename: string): Promise<string> {
  const client = getClient()
  await ensureBucket(client)

  // Generate a unique path to avoid collisions
  const ext = filename.split('.').pop() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: getContentType(ext),
    upsert: false,
  })

  if (error) {
    logger.error({ error, path }, 'Supabase storage upload failed')
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(url: string): Promise<void> {
  const client = getClient()

  // Extract path from the public URL
  const parts = url.split(`/storage/v1/object/public/${BUCKET}/`)
  if (parts.length < 2) return

  const path = parts[1]!
  const { error } = await client.storage.from(BUCKET).remove([path])

  if (error) {
    logger.error({ error, path }, 'Supabase storage delete failed')
  }
}

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    case 'gif': return 'image/gif'
    default: return 'image/jpeg'
  }
}
