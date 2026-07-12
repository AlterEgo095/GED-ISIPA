import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

export interface ApiAuthResult {
  authenticated: boolean
  organizationId?: string
  apiKeyId?: string
  scopes?: string[]
  error?: string
  rateLimitRemaining?: number
}

export async function authenticateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'En-tête Authorization manquant. Utilisez: Bearer ged_xxxxxxxx' }
  }
  
  const rawKey = authHeader.substring(7)
  
  if (!rawKey.startsWith('ged_')) {
    return { authenticated: false, error: 'Format de clé API invalide. Les clés doivent commencer par ged_' }
  }
  
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.substring(0, 8)
  
  const apiKey = await db.apiKey.findFirst({
    where: { keyPrefix, status: 'ACTIVE' },
    include: { organization: true },
  })
  
  if (!apiKey) {
    return { authenticated: false, error: 'Clé API introuvable ou révoquée' }
  }
  
  // Verify hash
  if (!timingSafeEqual(Buffer.from(apiKey.keyHash), Buffer.from(keyHash))) {
    return { authenticated: false, error: 'Clé API invalide' }
  }
  
  // Check expiry
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    await db.apiKey.update({ where: { id: apiKey.id }, data: { status: 'EXPIRED' } })
    return { authenticated: false, error: 'Clé API expirée' }
  }
  
  // Check IP whitelist
  const allowedIps = JSON.parse(apiKey.allowedIps || '[]') as string[]
  if (allowedIps.length > 0) {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!allowedIps.some(cidr => matchCidr(clientIp, cidr))) {
      return { authenticated: false, error: 'Adresse IP non autorisée' }
    }
  }
  
  // Check rate limit
  const rateLimitOk = await checkRateLimit(apiKey.id, apiKey.rateLimit)
  if (!rateLimitOk.allowed) {
    return { 
      authenticated: false, 
      error: `Limite de requêtes atteinte (${apiKey.rateLimit}/min). Réessayez dans ${rateLimitOk.retryAfter}s`,
      rateLimitRemaining: 0,
    }
  }
  
  // Update usage
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date(), requestCount: { increment: 1 } },
  })
  
  const scopes = JSON.parse(apiKey.scopes || '["read"]') as string[]
  
  return {
    authenticated: true,
    organizationId: apiKey.organizationId,
    apiKeyId: apiKey.id,
    scopes,
    rateLimitRemaining: rateLimitOk.remaining,
  }
}

export function hashApiKey(key: string): string {
  return createHmac('sha256', process.env.NEXTAUTH_SECRET || 'ged-secret').update(key).digest('hex')
}

export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const prefix = 'ged_'
  const random = require('crypto').randomBytes(32).toString('hex')
  const rawKey = prefix + random
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.substring(0, 8)
  return { rawKey, keyHash, keyPrefix }
}

// Simple in-memory rate limiter (per-minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

async function checkRateLimit(apiKeyId: string, limit: number): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = Date.now()
  const minute = 60000
  const entry = rateLimitMap.get(apiKeyId)
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(apiKeyId, { count: 1, resetAt: now + minute })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }
  
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }
  
  entry.count++
  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 }
}

function matchCidr(ip: string, cidr: string): boolean {
  // Simple CIDR matching - for production use a proper library
  if (!cidr.includes('/')) return ip === cidr
  const [network, bits] = cidr.split('/')
  const mask = ~((1 << (32 - parseInt(bits))) - 1)
  const ipInt = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0)
  const networkInt = network.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0)
  return (ipInt & mask) === (networkInt & mask)
}

export function requireScope(scopes: string[], required: string | string[]): boolean {
  if (scopes.includes('admin')) return true
  const requiredArray = Array.isArray(required) ? required : [required]
  return requiredArray.some(s => scopes.includes(s))
}
