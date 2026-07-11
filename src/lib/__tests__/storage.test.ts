import { describe, it, expect } from 'vitest'
import { isMimeTypeAllowed, getAllowedMimeTypes, isExtensionAllowedForMime } from '@/lib/storage'

describe('isMimeTypeAllowed', () => {
  it('allows common document types', () => {
    expect(isMimeTypeAllowed('application/pdf')).toBe(true)
    expect(isMimeTypeAllowed('application/msword')).toBe(true)
    expect(isMimeTypeAllowed('text/plain')).toBe(true)
  })

  it('allows image types', () => {
    expect(isMimeTypeAllowed('image/jpeg')).toBe(true)
    expect(isMimeTypeAllowed('image/png')).toBe(true)
  })

  it('rejects dangerous types', () => {
    expect(isMimeTypeAllowed('application/x-executable')).toBe(false)
    expect(isMimeTypeAllowed('application/x-sh')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isMimeTypeAllowed('')).toBe(false)
  })
})

describe('getAllowedMimeTypes', () => {
  it('returns a non-empty array', () => {
    const types = getAllowedMimeTypes()
    expect(Array.isArray(types)).toBe(true)
    expect(types.length).toBeGreaterThan(0)
  })

  it('includes PDF', () => {
    const types = getAllowedMimeTypes()
    expect(types).toContain('application/pdf')
  })
})

describe('isExtensionAllowedForMime', () => {
  it('allows .pdf for application/pdf', () => {
    expect(isExtensionAllowedForMime('document.pdf', 'application/pdf')).toBe(true)
  })

  it('rejects .exe for application/pdf', () => {
    expect(isExtensionAllowedForMime('malware.exe', 'application/pdf')).toBe(false)
  })

  it('rejects mismatched extension', () => {
    expect(isExtensionAllowedForMime('document.docx', 'application/pdf')).toBe(false)
  })
})
