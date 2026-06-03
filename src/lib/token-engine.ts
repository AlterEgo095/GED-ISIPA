import type { OrganizationType } from '@prisma/client'

const TYPE_PREFIXES: Record<OrganizationType, string> = {
  UNIVERSITY: 'UNI',
  HOSPITAL: 'HOS',
  COMPANY: 'COR',
  GOVERNMENT: 'GOV',
  SME: 'PME',
  INSTITUTION: 'INS',
  NGO: 'ONG',
  LAW_FIRM: 'JUR',
}

function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateAEIPToken(orgType: OrganizationType): string {
  const prefix = TYPE_PREFIXES[orgType]
  const code = generateRandomCode(6)
  return `AEIP-${prefix}-${code}`
}

export function validateAEIPToken(token: string): { valid: boolean; orgType?: OrganizationType } {
  const pattern = /^AEIP-([A-Z]{3})-([A-Z0-9]{6})$/
  const match = token.match(pattern)
  
  if (!match) return { valid: false }

  const prefix = match[1]
  const orgType = Object.entries(TYPE_PREFIXES).find(
    ([, p]) => p === prefix
  )?.[0] as OrganizationType | undefined

  if (!orgType) return { valid: false }

  return { valid: true, orgType }
}

export function getOrgTypePrefix(orgType: OrganizationType): string {
  return TYPE_PREFIXES[orgType]
}

export function extractTokenPrefix(token: string): string | null {
  const match = token.match(/^AEIP-([A-Z]{3})/)
  return match ? match[1] : null
}
