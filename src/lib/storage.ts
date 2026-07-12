import fs from 'fs/promises'
import { encryptBuffer, decryptBuffer, isEncryptedFile, getEncryptedPath } from './encryption'
import path from 'path'
import crypto from 'crypto'

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

/** Whitelist of allowed MIME types */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'application/zip': ['.zip'],
  'application/json': ['.json'],
}

/** Get the set of all allowed MIME type strings */
export function getAllowedMimeTypes(): string[] {
  return Object.keys(ALLOWED_MIME_TYPES)
}

/** Validate that a MIME type is in the whitelist */
export function isMimeTypeAllowed(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES
}

/** Validate file extension matches the MIME type */
export function isExtensionAllowedForMime(fileName: string, mimeType: string): boolean {
  const allowedExtensions = ALLOWED_MIME_TYPES[mimeType]
  if (!allowedExtensions) return false
  const ext = path.extname(fileName).toLowerCase()
  return allowedExtensions.includes(ext)
}

/** Ensure the upload directory for an organization exists */
export async function ensureUploadDir(orgId: string): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, orgId)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

/** Generate a unique stored file name to avoid collisions */
function generateStoredName(fileName: string): string {
  const ext = path.extname(fileName)
  const uniqueId = `${Date.now().toString(36)}-${crypto.randomUUID().substring(0, 8)}`
  return `${uniqueId}${ext}`
}

/** Compute SHA-256 hash of a Buffer */
function computeHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/** Detect MIME type from file extension as a fallback */
function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  for (const [mime, extensions] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (extensions.includes(ext)) return mime
  }
  return 'application/octet-stream'
}

export interface SaveFileResult {
  filePath: string
  fileSize: number
  fileHash: string
  mimeType: string
  storedName: string
}

/**
 * Save a file (Blob / File) to the org-specific uploads directory.
 * Computes SHA-256 hash and returns metadata.
 */
export async function saveFile(
  orgId: string,
  file: Blob | File,
  fileName: string,
): Promise<SaveFileResult> {
  // Validate file size
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux. Taille maximale : ${MAX_FILE_SIZE / (1024 * 1024)} Mo`)
  }
  if (buffer.length === 0) {
    throw new Error('Le fichier est vide')
  }

  // Determine MIME type
  const mimeType = file.type || guessMimeType(fileName)

  // Validate MIME type
  if (!isMimeTypeAllowed(mimeType)) {
    throw new Error(`Type de fichier non autorisé : ${mimeType}`)
  }

  // Validate extension matches MIME
  if (!isExtensionAllowedForMime(fileName, mimeType)) {
    throw new Error(`L'extension du fichier ne correspond pas au type MIME : ${mimeType}`)
  }

  // Ensure upload directory exists
  const dir = await ensureUploadDir(orgId)

  // Generate unique stored name
  const storedName = generateStoredName(fileName)
  const filePath = path.join(dir, storedName)

  // Compute hash before writing
  const fileHash = computeHash(buffer)

  // Encrypt file at rest (AES-256-GCM)
  const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED !== 'false'
  let finalFilePath = filePath
  let encryptedBuffer: Buffer | null = null

  if (isEncryptionEnabled) {
    encryptedBuffer = encryptBuffer(buffer)
    finalFilePath = getEncryptedPath(filePath)
    await fs.writeFile(finalFilePath, encryptedBuffer)
  } else {
    await fs.writeFile(filePath, buffer)
  }

  return {
    filePath: finalFilePath,
    fileSize: buffer.length,
    fileHash,
    mimeType,
    storedName,
  }
}

/** Get the absolute file path for a stored file */
export function getFilePath(orgId: string, storedName: string): string {
  return path.join(UPLOADS_ROOT, orgId, storedName)
}

/** Delete a file from disk (handles both encrypted and plain files) */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch {
    // File might already be deleted — silently ignore
  }
  // Also try deleting the encrypted variant if it exists
  if (!isEncryptedFile(filePath)) {
    try {
      await fs.unlink(getEncryptedPath(filePath))
    } catch {
      // Ignore
    }
  }
}

/** Check if a file exists on disk */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/** Read and decrypt a file, returning the plaintext Buffer */
export async function readDecryptedFile(filePath: string): Promise<Buffer> {
  if (isEncryptedFile(filePath)) {
    const encryptedData = await fs.readFile(filePath)
    return decryptBuffer(encryptedData)
  }
  return fs.readFile(filePath)
}
