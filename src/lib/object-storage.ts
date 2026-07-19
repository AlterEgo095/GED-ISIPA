/**
 * Object storage abstraction — uses MinIO/S3 when configured, falls back to filesystem.
 * This allows the platform to scale to millions of documents by offloading
 * file storage to object storage (with sharding, replication, CDN).
 */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3'
import { readFile, writeFile, unlink, mkdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { encryptBuffer, decryptBuffer } from './encryption'

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_REGION = process.env.S3_REGION || 'us-east-1'
const S3_BUCKET = process.env.S3_BUCKET || 'ged-isipa'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
const S3_SECRET_KEY = process.env.S3_SECRET_KEY
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true'

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')
const ENCRYPTION_ENABLED = process.env.ENCRYPTION_ENABLED === 'true'

let s3Client: S3Client | null = null
let bucketInitialized = false

function getS3Client(): S3Client | null {
  if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) return null
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
      forcePathStyle: S3_FORCE_PATH_STYLE,
    })
  }
  return s3Client
}

async function ensureBucket(): Promise<void> {
  if (bucketInitialized) return
  const client = getS3Client()
  if (!client) return
  try {
    await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: '.init' }))
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
      await client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: '.init',
        Body: 'ged-isipa bucket initialized',
        ContentType: 'text/plain',
      }))
    } catch (e: any) {
      if (!e.name?.includes('BucketAlreadyOwnedByYou')) {
        console.error('[S3] Bucket creation failed:', e.message)
      }
    }
  }
  bucketInitialized = true
}

export interface ObjectStorageResult {
  key: string
  bucket?: string
  filePath?: string
  size: number
  storage: 's3' | 'filesystem'
}

/** Save a file to object storage (S3) or filesystem, with optional encryption. */
export async function saveToObjectStorage(
  orgId: string,
  data: Buffer,
  fileName: string,
): Promise<ObjectStorageResult> {
  const ext = path.extname(fileName)
  const key = `${orgId}/${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}${ext}`
  const bufferToStore = ENCRYPTION_ENABLED ? encryptBuffer(data) : data

  const s3 = getS3Client()
  if (s3) {
    await ensureBucket()
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: bufferToStore,
      ContentType: 'application/octet-stream',
    }))
    return { key, bucket: S3_BUCKET, size: data.length, storage: 's3' }
  }

  // Fallback: filesystem
  const dir = path.join(UPLOADS_ROOT, orgId)
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, key.split('/').pop()!)
  await writeFile(filePath, bufferToStore)
  return { key: filePath, filePath, size: data.length, storage: 'filesystem' }
}

/** Read a file from object storage or filesystem. Returns decrypted buffer. */
export async function readFromObjectStorage(
  key: string,
  storage: 's3' | 'filesystem' = 's3'
): Promise<Buffer> {
  if (storage === 's3' && getS3Client()) {
    const response = await getS3Client()!.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }))
    const buffer = Buffer.from(await response.Body!.transformToByteArray())
    return ENCRYPTION_ENABLED ? decryptBuffer(buffer) : buffer
  }

  // Filesystem
  if (!existsSync(key)) throw new Error('File not found: ' + key)
  const buffer = await readFile(key)
  return ENCRYPTION_ENABLED ? decryptBuffer(buffer) : buffer
}

/** Delete a file from object storage or filesystem. */
export async function deleteFromObjectStorage(
  key: string,
  storage: 's3' | 'filesystem' = 's3'
): Promise<void> {
  if (storage === 's3' && getS3Client()) {
    await getS3Client()!.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }))
    return
  }
  try { await unlink(key) } catch {}
}

/** Check if object storage is configured. */
export function isObjectStorageEnabled(): boolean {
  return getS3Client() !== null
}
