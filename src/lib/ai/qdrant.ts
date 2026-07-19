/**
 * Qdrant vector store client for semantic search.
 * Uses a local lightweight embedding (hashing trick) — no external API needed.
 * Can be upgraded to neural embeddings when an embedding API is available.
 */
import { db } from '@/lib/db'

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333'
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'ged_documents'
const VECTOR_SIZE = 1024

// Stop words (French + English)
const STOP_WORDS = new Set([
  'le','la','les','de','du','des','un','une','et','ou','mais','donc','or','ni','car','que','qui','quoi','dont',
  'où','à','au','aux','en','dans','sur','sous','pour','par','avec','sans','ce','cette','ces','son','sa','ses',
  'leur','leurs','notre','votre','the','a','an','and','or','but','is','are','was','were','be','been','have',
  'has','had','will','would','could','should','may','might','can','of','in','on','at','to','for','with','by',
  'from','as','it','its','this','that','these','those','not','no','nor','so','than','too','very','just',
])

// Simple hash function (djb2)
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Generate a lightweight embedding vector using the hashing trick.
 * Each word is hashed to a dimension, and the vector is L2-normalized.
 * This is suitable for keyword-based semantic search.
 */
export function generateEmbedding(text: string): number[] {
  if (!text || text.trim().length === 0) return new Array(VECTOR_SIZE).fill(0)

  const vector = new Array(VECTOR_SIZE).fill(0)
  const words = text.toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))

  for (const word of words) {
    const dim = hash(word) % VECTOR_SIZE
    // Use signed hashing to reduce collisions
    const sign = hash(word + '_sign') % 2 === 0 ? 1 : -1
    vector[dim] += sign * (1 + Math.log(word.length))
  }

  // L2 normalize
  let norm = 0
  for (const v of vector) norm += v * v
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < VECTOR_SIZE; i++) vector[i] /= norm
  }

  return vector
}

interface QdrantPoint {
  id: string
  vector: number[]
  payload: {
    documentId: string
    organizationId: string
    chunkIndex: number
    text: string
    title: string
    type: string
    departmentId?: string
    tags?: string
    createdAt: string
  }
}

/** Ensure the Qdrant collection exists with the right config. */
export async function ensureCollection(): Promise<void> {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}?timeout=10`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
        optimizers_config: { default_segment_number: 4 },
        replication_factor: 1,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      if (!text.includes('already exists')) {
        console.error('Qdrant collection creation failed:', text)
      }
    }
  } catch (e) {
    console.error('Qdrant ensureCollection error:', e)
  }
}

/** Index document chunks into Qdrant. */
export async function indexDocumentChunks(params: {
  documentId: string
  organizationId: string
  title: string
  type: string
  departmentId?: string
  tags?: string
  chunks: string[]
}): Promise<{ indexed: number; errors: number }> {
  await ensureCollection()
  let indexed = 0
  let errors = 0

  const points: QdrantPoint[] = []
  for (let i = 0; i < params.chunks.length; i++) {
    const chunk = params.chunks[i]
    if (!chunk || chunk.length < 10) continue
    const vector = generateEmbedding(chunk)
    // Check if vector is not all zeros
    const hasContent = vector.some(v => v !== 0)
    if (!hasContent) { errors++; continue }
    points.push({
      id: `${params.documentId}-chunk-${i}`,
      vector,
      payload: {
        documentId: params.documentId,
        organizationId: params.organizationId,
        chunkIndex: i,
        text: chunk.slice(0, 1000),
        title: params.title,
        type: params.type,
        departmentId: params.departmentId,
        tags: params.tags,
        createdAt: new Date().toISOString(),
      },
    })
    indexed++
  }

  if (points.length > 0) {
    try {
      for (let i = 0; i < points.length; i += 100) {
        const batch = points.slice(i, i + 100)
        await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: batch }),
        })
      }
    } catch (e) {
      console.error('Qdrant upsert error:', e)
      errors += points.length
      indexed -= points.length
    }
  }

  return { indexed, errors }
}

/** Semantic search across an organization's documents. */
export async function semanticSearch(params: {
  query: string
  organizationId: string
  limit?: number
  scoreThreshold?: number
}): Promise<Array<{
  documentId: string
  title: string
  type: string
  score: number
  text: string
  chunkIndex: number
}>> {
  const { query, organizationId, limit = 10, scoreThreshold = 0.1 } = params
  const queryVector = generateEmbedding(query)

  const hasContent = queryVector.some(v => v !== 0)
  if (!hasContent) return []

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: queryVector,
        limit,
        score_threshold: scoreThreshold,
        filter: {
          must: [{ key: 'organizationId', match: { value: organizationId } }],
        },
        with_payload: true,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const results = data.result || []
    const seen = new Map<string, any>()
    for (const r of results) {
      const docId = r.payload?.documentId
      if (!docId) continue
      if (!seen.has(docId) || seen.get(docId).score < r.score) {
        seen.set(docId, {
          documentId: docId,
          title: r.payload?.title || '',
          type: r.payload?.type || '',
          score: r.score,
          text: r.payload?.text || '',
          chunkIndex: r.payload?.chunkIndex || 0,
        })
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.score - a.score)
  } catch (e) {
    console.error('Semantic search error:', e)
    return []
  }
}

/** Remove a document's vectors from Qdrant. */
export async function removeDocumentVectors(documentId: string): Promise<void> {
  try {
    await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: { must: [{ key: 'documentId', match: { value: documentId } }] },
      }),
    })
  } catch (e) {
    console.error('Qdrant delete error:', e)
  }
}
