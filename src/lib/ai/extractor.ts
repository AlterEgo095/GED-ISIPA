import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

export interface ExtractionResult {
  text: string
  method: 'pdf-text' | 'pdf-ocr' | 'docx' | 'text' | 'image-ocr' | 'none'
  pages?: number
  language?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

const MAX_TEXT_LENGTH = 500_000 // 500k chars cap for safety

function truncate(text: string, max = MAX_TEXT_LENGTH): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '\n\n[... contenu tronqué ...]'
}

/**
 * Extract text from a PDF using pdftotext (poppler-utils).
 * Fast and reliable for text-based PDFs.
 */
async function extractPdfText(filePath: string): Promise<{ text: string; pages: number }> {
  try {
    const { stdout } = await execFileAsync('pdftotext', [
      '-layout',
      '-enc', 'UTF-8',
      filePath,
      '-',
    ], { maxBuffer: 20 * 1024 * 1024, timeout: 60_000 })
    // Count pages roughly
    const { stdout: info } = await execFileAsync('pdfinfo', [filePath], { timeout: 10_000 }).catch(() => ({ stdout: '' }))
    const pagesMatch = info.match(/Pages:\s+(\d+)/)
    const pages = pagesMatch ? parseInt(pagesMatch[1], 10) : 1
    return { text: stdout.trim(), pages }
  } catch {
    return { text: '', pages: 0 }
  }
}

/**
 * Run OCR on a file (image or scanned PDF) using tesseract.
 */
async function runOcr(filePath: string, lang = 'fra+eng'): Promise<{ text: string; confidence: number }> {
  const tmpDir = await mkdir(path.join(os.tmpdir(), `ged-ocr-${Date.now()}`), { recursive: true }).then(() =>
    path.join(os.tmpdir(), `ged-ocr-${Date.now()}`)
  )
  const outputPath = path.join(tmpDir, 'output')

  try {
    // For PDFs, convert to images first using pdftoppm
    let inputImage = filePath
    const ext = path.extname(filePath).toLowerCase()
    if (ext === '.pdf') {
      const imgPrefix = path.join(tmpDir, 'page')
      await execFileAsync('pdftoppm', ['-png', '-r', '300', filePath, imgPrefix], {
        timeout: 120_000,
        maxBuffer: 50 * 1024 * 1024,
      })
      // OCR each page image
      const texts: string[] = []
      let totalConf = 0
      let pageFiles: string[] = []
      // List generated files
      const { stdout: ls } = await execFileAsync('ls', [tmpDir]).catch(() => ({ stdout: '' }))
      pageFiles = ls.split('\n').filter(f => f.startsWith('page-') && f.endsWith('.png')).map(f => path.join(tmpDir, f)).sort()
      for (const pf of pageFiles) {
        const pageOut = path.join(tmpDir, `ocr-${path.basename(pf)}`)
        await execFileAsync('tesseract', [pf, pageOut, '-l', lang, '--psm', '6'], {
          timeout: 120_000,
          maxBuffer: 20 * 1024 * 1024,
        })
        const txt = await readFile(pageOut + '.txt', 'utf-8').catch(() => '')
        texts.push(txt.trim())
      }
      return { text: truncate(texts.join('\n\n--- Page break ---\n\n')), confidence: 85 }
    }

    // Direct image OCR
    await execFileAsync('tesseract', [inputImage, outputPath, '-l', lang, '--psm', '6'], {
      timeout: 60_000,
      maxBuffer: 20 * 1024 * 1024,
    })
    const text = await readFile(outputPath + '.txt', 'utf-8').catch(() => '')
    return { text: truncate(text.trim()), confidence: 85 }
  } finally {
    // Cleanup temp
    try { await execFileAsync('rm', ['-rf', tmpDir]) } catch {}
  }
}

/**
 * Extract text from DOCX using mammoth.
 */
async function extractDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const buffer = await readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return truncate(result.value.trim())
  } catch {
    return ''
  }
}

/**
 * Extract text from a plain text file.
 */
async function extractTextFile(filePath: string): Promise<string> {
  try {
    const text = await readFile(filePath, 'utf-8')
    return truncate(text.trim())
  } catch {
    return ''
  }
}

/**
 * Main extraction entry point — dispatches by MIME type.
 * Tries fast text extraction first, falls back to OCR for scanned documents.
 */
export async function extractDocumentContent(
  filePath: string,
  mimeType: string,
  options?: { ocrLang?: string; forceOcr?: boolean }
): Promise<ExtractionResult> {
  const lang = options?.ocrLang || 'fra+eng'
  const ext = path.extname(filePath).toLowerCase()

  // PDF: try text extraction, fall back to OCR if empty
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    if (!options?.forceOcr) {
      const { text, pages } = await extractPdfText(filePath)
      if (text && text.length > 50) {
        return { text: truncate(text), method: 'pdf-text', pages, language: lang, confidence: 95 }
      }
    }
    // OCR fallback for scanned PDFs
    const { text, confidence } = await runOcr(filePath, lang)
    if (text) {
      return { text, method: 'pdf-ocr', language: lang, confidence }
    }
    return { text: '', method: 'none' }
  }

  // DOCX
  if (mimeType.includes('wordprocessing') || ext === '.docx') {
    const text = await extractDocx(filePath)
    return { text, method: 'docx', confidence: text ? 95 : 0 }
  }

  // Legacy DOC — try antiword or catdoc, fallback to OCR
  if (mimeType === 'application/msword' || ext === '.doc') {
    try {
      const { stdout } = await execFileAsync('antiword', [filePath], { timeout: 30_000 }).catch(async () => {
        return { stdout: '' }
      })
      if (stdout) return { text: truncate(stdout.trim()), method: 'docx', confidence: 85 }
    } catch {}
    const { text, confidence } = await runOcr(filePath, lang)
    return { text, method: 'image-ocr', confidence }
  }

  // Images — OCR
  if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'].includes(ext)) {
    const { text, confidence } = await runOcr(filePath, lang)
    return { text, method: 'image-ocr', language: lang, confidence }
  }

  // Plain text / CSV / Markdown / JSON
  if (mimeType.startsWith('text/') || ['.txt', '.csv', '.md', '.json'].includes(ext)) {
    const text = await extractTextFile(filePath)
    return { text, method: 'text', confidence: text ? 95 : 0 }
  }

  // PowerPoint / Excel — try basic extraction
  if (mimeType.includes('presentation') || ext === '.pptx') {
    // Basic: extract XML text from pptx (zip)
    try {
      const { stdout } = await execFileAsync('unzip', ['-p', filePath], { maxBuffer: 10 * 1024 * 1024, timeout: 30_000 }).catch(() => ({ stdout: '' }))
      const text = stdout.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      return { text: truncate(text), method: 'text', confidence: 70 }
    } catch {}
  }

  return { text: '', method: 'none' }
}

/**
 * Chunk text into segments for embedding/storage.
 */
export function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  if (!text) return []
  if (text.length <= chunkSize) return [text]

  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start += chunkSize - overlap
  }
  return chunks
}
