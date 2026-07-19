/**
 * BullMQ job queue for async document processing (extraction, AI analysis, indexing).
 * Falls back to inline processing if Redis is unavailable.
 */
import { Queue, Worker, QueueEvents } from 'bullmq'
import { getRedis } from './redis'

const QUEUE_NAME = 'ged-document-processing'

let queue: Queue | null = null

export type JobType = 'extract' | 'analyze' | 'index' | 'report'

export interface DocumentJobData {
  type: JobType
  documentId: string
  organizationId: string
  filePath: string
  mimeType: string
  title: string
  docType: string
  departmentId?: string
  tags?: string
  options?: Record<string, unknown>
}

/** Get the shared queue (singleton). */
export function getQueue(): Queue | null {
  if (!process.env.REDIS_HOST) return null
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  }
  return queue
}

/** Add a document processing job to the queue. */
export async function addDocumentJob(data: DocumentJobData): Promise<string | null> {
  const q = getQueue()
  if (!q) {
    // No Redis → process inline (caller handles)
    return null
  }
  const job = await q.add(data.type, data, { jobId: `${data.documentId}-${data.type}` })
  return job.id ?? null
}

/** Start the document processing worker (call this in a separate process or on server start). */
export function startDocumentWorker(): Worker | null {
  if (!process.env.REDIS_HOST) return null

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const data = job.data as DocumentJobData
      console.log(`[Worker] Processing job ${job.id}: ${data.type} for doc ${data.documentId}`)

      if (data.type === 'extract' || data.type === 'index') {
        const { extractDocumentContent, chunkText } = await import('./ai/extractor')
        const { indexDocumentChunks } = await import('./ai/qdrant')
        const { readDecryptedFile } = await import('./storage')
        const { db } = await import('./db')
        const path = await import('path')
        const os = await import('os')
        const { writeFile, mkdir } = await import('fs/promises')

        let extractPath = path.isAbsolute(data.filePath) ? data.filePath : path.join(process.cwd(), data.filePath)
        if (extractPath.endsWith('.enc')) {
          const buffer = await readDecryptedFile(extractPath)
          const tmpDir = path.join(os.tmpdir(), 'ged-worker-extract')
          await mkdir(tmpDir, { recursive: true })
          extractPath = path.join(tmpDir, data.documentId)
          await writeFile(extractPath, buffer)
        }

        const result = await extractDocumentContent(extractPath, data.mimeType, { ocrLang: 'fra+eng' })

        await db.documentMetadata.upsert({
          where: { documentId_key: { documentId: data.documentId, key: 'extracted_text' } },
          update: { value: result.text.slice(0, 50000), type: 'TEXT' },
          create: { documentId: data.documentId, key: 'extracted_text', value: result.text.slice(0, 50000), type: 'TEXT' },
        })
        await db.documentMetadata.upsert({
          where: { documentId_key: { documentId: data.documentId, key: 'extraction_method' } },
          update: { value: result.method, type: 'TEXT' },
          create: { documentId: data.documentId, key: 'extraction_method', value: result.method, type: 'TEXT' },
        })

        if (result.text.length > 10) {
          const chunks = chunkText(result.text, 1500, 200)
          await indexDocumentChunks({
            documentId: data.documentId,
            organizationId: data.organizationId,
            title: data.title,
            type: data.docType,
            departmentId: data.departmentId,
            tags: data.tags,
            chunks,
          })
        }

        return { method: result.method, wordCount: result.text.split(/\s+/).filter(Boolean).length }
      }

      if (data.type === 'analyze') {
        const { analyzeDocumentText, compareToKnowledgeBase } = await import('./ai/analysis')
        const { db } = await import('./db')

        const textMeta = await db.documentMetadata.findUnique({
          where: { documentId_key: { documentId: data.documentId, key: 'extracted_text' } },
        })
        if (!textMeta?.value) throw new Error('No extracted text found')

        const analysis = await analyzeDocumentText(textMeta.value, data.title, data.docType)
        const comparison = await compareToKnowledgeBase(data.documentId, data.organizationId, textMeta.value)

        const entries = [
          { key: 'ai_summary', value: analysis.summary, type: 'TEXT' as const },
          { key: 'ai_keywords', value: JSON.stringify(analysis.keywords), type: 'JSON' as const },
          { key: 'ai_category', value: analysis.category, type: 'TEXT' as const },
          { key: 'ai_entities', value: JSON.stringify(analysis.entities), type: 'JSON' as const },
          { key: 'ai_suggested_tags', value: JSON.stringify(analysis.suggestedTags), type: 'JSON' as const },
          { key: 'ai_quality_score', value: String(analysis.qualityScore), type: 'NUMBER' as const },
          { key: 'kb_insights', value: comparison.insights, type: 'TEXT' as const },
        ]

        for (const entry of entries) {
          await db.documentMetadata.upsert({
            where: { documentId_key: { documentId: data.documentId, key: entry.key } },
            update: { value: entry.value.slice(0, 50000), type: entry.type },
            create: { documentId: data.documentId, key: entry.key, value: entry.value.slice(0, 50000), type: entry.type },
          })
        }

        return { qualityScore: analysis.qualityScore }
      }

      return { skipped: true }
    },
    {
      connection: getRedis(),
      concurrency: 2,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`)
  })
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message)
  })

  return worker
}