import { describe, it, expect } from 'vitest'
import {
  generateAEIPToken,
  validateAEIPToken,
  getOrgTypePrefix,
  extractTokenPrefix,
} from '@/lib/token-engine'

const ORG_TYPES = ['UNIVERSITY', 'HOSPITAL', 'COMPANY', 'GOVERNMENT', 'SME', 'INSTITUTION', 'NGO', 'LAW_FIRM'] as const

describe('generateAEIPToken', () => {
  it('generates a token for each org type with correct prefix', () => {
    const expectedPrefixes: Record<string, string> = {
      UNIVERSITY: 'UNI',
      HOSPITAL: 'HOS',
      COMPANY: 'COR',
      GOVERNMENT: 'GOV',
      SME: 'PME',
      INSTITUTION: 'INS',
      NGO: 'ONG',
      LAW_FIRM: 'JUR',
    }

    for (const [orgType, prefix] of Object.entries(expectedPrefixes)) {
      const token = generateAEIPToken(orgType as any)
      expect(token).toBe(`AEIP-${prefix}-${token.split('-')[2]}`)
      expect(token.startsWith(`AEIP-${prefix}-`)).toBe(true)
    }
  })

  it('generates tokens matching the AEIP-{PREFIX}-{CODE} pattern', () => {
    for (const orgType of ORG_TYPES) {
      const token = generateAEIPToken(orgType as any)
      expect(token).toMatch(/^AEIP-[A-Z]{3}-[A-Z0-9]{6}$/)
    }
  })

  it('generates unique tokens on successive calls', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 100; i++) {
      tokens.add(generateAEIPToken('UNIVERSITY'))
    }
    // With 6-char random codes from 31 chars, collisions are very unlikely for 100 tokens
    expect(tokens.size).toBeGreaterThan(90)
  })

  it('generates codes using only valid characters (no I, O, 0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const token = generateAEIPToken('HOSPITAL')
      const code = token.split('-')[2]
      // Valid chars: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (excludes I, O, 0, 1)
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
    }
  })

  it('generates a 6-character random code', () => {
    const token = generateAEIPToken('GOVERNMENT')
    const parts = token.split('-')
    expect(parts[2]).toHaveLength(6)
  })
})

describe('validateAEIPToken', () => {
  it('validates a correctly generated token', () => {
    const token = generateAEIPToken('UNIVERSITY')
    const result = validateAEIPToken(token)
    expect(result.valid).toBe(true)
    expect(result.orgType).toBe('UNIVERSITY')
  })

  it('validates tokens for all org types', () => {
    const orgTypeMap: Record<string, string> = {
      UNIVERSITY: 'UNIVERSITY',
      HOSPITAL: 'HOSPITAL',
      COMPANY: 'COMPANY',
      GOVERNMENT: 'GOVERNMENT',
      SME: 'SME',
      INSTITUTION: 'INSTITUTION',
      NGO: 'NGO',
      LAW_FIRM: 'LAW_FIRM',
    }
    for (const [orgType, expected] of Object.entries(orgTypeMap)) {
      const token = generateAEIPToken(orgType as any)
      const result = validateAEIPToken(token)
      expect(result.valid).toBe(true)
      expect(result.orgType).toBe(expected)
    }
  })

  it('rejects an invalid token format', () => {
    const result = validateAEIPToken('INVALID-TOKEN')
    expect(result.valid).toBe(false)
    expect(result.orgType).toBeUndefined()
  })

  it('rejects a token with an unknown prefix', () => {
    const result = validateAEIPToken('AEIP-XXX-ABC123')
    expect(result.valid).toBe(false)
    expect(result.orgType).toBeUndefined()
  })

  it('rejects an empty string', () => {
    const result = validateAEIPToken('')
    expect(result.valid).toBe(false)
  })
})

describe('getOrgTypePrefix', () => {
  it('returns correct prefix for UNIVERSITY', () => {
    expect(getOrgTypePrefix('UNIVERSITY')).toBe('UNI')
  })

  it('returns correct prefix for LAW_FIRM', () => {
    expect(getOrgTypePrefix('LAW_FIRM')).toBe('JUR')
  })

  it('returns correct prefix for SME', () => {
    expect(getOrgTypePrefix('SME')).toBe('PME')
  })
})

describe('extractTokenPrefix', () => {
  it('extracts prefix from a valid token', () => {
    expect(extractTokenPrefix('AEIP-UNI-ABCDEF')).toBe('UNI')
  })

  it('returns null for invalid token format', () => {
    expect(extractTokenPrefix('INVALID')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractTokenPrefix('')).toBeNull()
  })
})
