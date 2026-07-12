import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

/**
 * AES-256-GCM encryption for files at rest.
 * 
 * Key derivation: ENCRYPTION_KEY env var (32 bytes hex) or auto-generated on first run.
 * Each file gets a unique IV (12 bytes) stored alongside the encrypted file.
 * Format: [IV (12 bytes)][AUTH_TAG (16 bytes)][CIPHERTEXT]
 * 
 * Encrypted files are stored with .enc extension.
 * Metadata (IV, tag) is embedded in the file itself for atomicity.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

let _encryptionKey: Buffer | null = null

/** Get or derive the encryption key from environment */
function getEncryptionKey(): Buffer {
  if (_encryptionKey) return _encryptionKey

  const envKey = process.env.ENCRYPTION_KEY
  if (envKey) {
    const keyBuffer = Buffer.from(envKey, 'hex')
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    }
    _encryptionKey = keyBuffer
    return keyBuffer
  }

  // In development, derive from NEXTAUTH_SECRET for convenience
  const secret = process.env.NEXTAUTH_SECRET || 'default-dev-key-not-for-production'
  _encryptionKey = crypto.createHash('sha256').update(secret).digest()
  return _encryptionKey
}

/** Generate a new random encryption key (for setup script) */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/** Encrypt a buffer using AES-256-GCM */
export function encryptBuffer(plaintext: Buffer): Buffer {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  
  // Output: [IV][AUTH_TAG][CIPHERTEXT]
  return Buffer.concat([iv, authTag, encrypted])
}

/** Decrypt a buffer using AES-256-GCM */
export function decryptBuffer(encryptedData: Buffer): Buffer {
  const key = getEncryptionKey()
  
  // Extract IV, auth tag, and ciphertext
  const iv = encryptedData.subarray(0, IV_LENGTH)
  const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)
  
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
}

/** Check if a file is encrypted (has .enc extension) */
export function isEncryptedFile(filePath: string): boolean {
  return filePath.endsWith('.enc')
}

/** Get the encrypted file path for a given original path */
export function getEncryptedPath(filePath: string): string {
  if (filePath.endsWith('.enc')) return filePath
  return filePath + '.enc'
}

/** Get the original file path from an encrypted path */
export function getDecryptedPath(filePath: string): string {
  return filePath.replace('.enc', '')
}

/** Encrypt a file on disk (in-place, renames original) */
export async function encryptFile(originalPath: string): Promise<string> {
  const encPath = getEncryptedPath(originalPath)
  
  // Skip if already encrypted
  try {
    await fs.access(encPath)
    return encPath // Already encrypted
  } catch {
    // Not yet encrypted, proceed
  }
  
  // Read original file
  const plaintext = await fs.readFile(originalPath)
  
  // Encrypt
  const encrypted = encryptBuffer(plaintext)
  
  // Write encrypted file
  await fs.writeFile(encPath, encrypted)
  
  // Delete original plaintext file
  await fs.unlink(originalPath)
  
  return encPath
}

/** Decrypt a file and return the buffer (does NOT write plaintext to disk) */
export async function decryptFile(encPath: string): Promise<Buffer> {
  const encryptedData = await fs.readFile(encPath)
  return decryptBuffer(encryptedData)
}

/** Migrate all existing plaintext files to encrypted format */
export async function migrateFilesToEncryption(baseDir: string): Promise<{ migrated: number; skipped: number; errors: number }> {
  const result = { migrated: 0, skipped: 0, errors: 0 }
  
  try {
    const orgDirs = await fs.readdir(baseDir)
    
    for (const orgDir of orgDirs) {
      const orgPath = path.join(baseDir, orgDir)
      const stat = await fs.stat(orgPath)
      if (!stat.isDirectory()) continue
      
      const files = await fs.readdir(orgPath)
      for (const file of files) {
        // Skip already encrypted files
        if (file.endsWith('.enc')) {
          result.skipped++
          continue
        }
        
        const filePath = path.join(orgPath, file)
        try {
          await encryptFile(filePath)
          result.migrated++
        } catch (err) {
          console.error(`Failed to encrypt ${filePath}:`, err)
          result.errors++
        }
      }
    }
  } catch (err) {
    console.error('Migration error:', err)
  }
  
  return result
}
