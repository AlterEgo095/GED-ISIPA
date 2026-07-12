import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { generateApiKey, hashApiKey } from '@/lib/saas/api-auth'

// GET /api/api-keys - Get API keys for the current user's organization
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const orgId = token.organizationId as string
  if (!orgId) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 403 })
  }

  // Only ORG_ADMIN and above can manage API keys
  const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN']
  if (!allowedRoles.includes(token.role as string)) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  // Check if the org plan includes API access
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, name: true, code: true },
  })

  if (!org) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  const apiAccessFeature = await db.planFeature.findUnique({
    where: { plan_featureKey: { plan: org.plan, featureKey: 'api_access' } },
  })

  const hasApiAccess = apiAccessFeature?.value === 'true'

  const keys = await db.apiKey.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    apiKeys: keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: JSON.parse(k.scopes || '["read"]'),
      rateLimit: k.rateLimit,
      status: k.status,
      expiresAt: k.expiresAt,
      lastUsedAt: k.lastUsedAt,
      requestCount: k.requestCount,
      createdAt: k.createdAt,
    })),
    plan: org.plan,
    hasApiAccess,
    organization: { name: org.name, code: org.code },
  })
}

// POST /api/api-keys - Create a new API key for the current user's organization
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const orgId = token.organizationId as string
  if (!orgId) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 403 })
  }

  const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN']
  if (!allowedRoles.includes(token.role as string)) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  // Check API access
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  })

  if (!org) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  const apiAccessFeature = await db.planFeature.findUnique({
    where: { plan_featureKey: { plan: org.plan, featureKey: 'api_access' } },
  })

  if (apiAccessFeature?.value !== 'true') {
    return NextResponse.json({ error: 'Votre plan ne comprend pas l\'accès API. Veuillez mettre à niveau votre abonnement.' }, { status: 403 })
  }

  // Check max API keys
  const maxKeysFeature = await db.planFeature.findUnique({
    where: { plan_featureKey: { plan: org.plan, featureKey: 'max_api_keys' } },
  })
  const maxKeys = parseInt(maxKeysFeature?.value || '0')
  const currentKeyCount = await db.apiKey.count({
    where: { organizationId: orgId, status: 'ACTIVE' },
  })

  if (maxKeys !== -1 && currentKeyCount >= maxKeys) {
    return NextResponse.json({ error: `Limite atteinte : ${maxKeys} clés API maximum pour votre plan` }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, scopes, rateLimit, expiresInDays } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Le nom de la clé est requis' }, { status: 400 })
    }

    const { rawKey, keyHash, keyPrefix } = generateApiKey()

    // Use plan rate limit if not specified
    const rateLimitFeature = await db.planFeature.findUnique({
      where: { plan_featureKey: { plan: org.plan, featureKey: 'api_rate_limit' } },
    })
    const defaultRateLimit = parseInt(rateLimitFeature?.value || '60')

    const expiresAt = expiresInDays && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 86400000)
      : null

    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        keyHash,
        keyPrefix,
        organizationId: orgId,
        scopes: JSON.stringify(scopes || ['read']),
        rateLimit: rateLimit || defaultRateLimit,
        expiresAt,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'API_KEY_CREATE',
        entityType: 'ApiKey',
        entityId: apiKey.id,
        details: `Clé API "${name}" créée`,
        organizationId: orgId,
        userId: token.id as string,
      },
    })

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
      },
      rawKey,
      message: 'Clé API créée. Copiez-la maintenant, elle ne sera plus affichée.',
    })
  } catch (error) {
    console.error('API key creation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
