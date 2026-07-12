import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logAdminAction, getClientInfo } from '@/lib/admin-audit'
import { generateApiKey, hashApiKey } from '@/lib/saas/api-auth'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  const keys = await db.apiKey.findMany({
    include: { organization: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ apiKeys: keys.map(k => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    organization: k.organization,
    scopes: JSON.parse(k.scopes || '["read"]'),
    rateLimit: k.rateLimit,
    status: k.status,
    expiresAt: k.expiresAt,
    lastUsedAt: k.lastUsedAt,
    requestCount: k.requestCount,
    createdAt: k.createdAt,
  })) })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, organizationId, scopes, rateLimit, expiresInDays } = body
    
    if (!name || !organizationId) {
      return NextResponse.json({ error: 'Nom et organisation requis' }, { status: 400 })
    }
    
    const { rawKey, keyHash, keyPrefix } = generateApiKey()
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null
    
    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        organizationId,
        scopes: JSON.stringify(scopes || ['read']),
        rateLimit: rateLimit || 100,
        expiresAt,
      },
    })
    
    // Audit log
    const clientInfo = getClientInfo(request)
    await logAdminAction({
      action: 'API_KEY_CREATE',
      entityType: 'ApiKey',
      entityId: apiKey.id,
      details: `Clé API "${name}" créée pour l'organisation ${organizationId}`,
      organizationId,
      userId: token.id as string,
      ...clientInfo,
    })

    // Return the raw key only once - it cannot be retrieved again
    return NextResponse.json({ 
      success: true, 
      apiKey: { id: apiKey.id, name: apiKey.name, keyPrefix: apiKey.keyPrefix },
      rawKey, // Only shown once!
      message: 'Clé API créée. Copiez-la maintenant, elle ne sera plus affichée.'
    })
  } catch (error) {
    console.error('API key creation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
