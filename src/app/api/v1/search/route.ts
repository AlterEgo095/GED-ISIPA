import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticateApiKey, requireScope } from '@/lib/saas/api-auth'
import { trackUsage } from '@/lib/saas/usage-tracker'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  if (!requireScope(auth.scopes!, 'read')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type')
  const classification = searchParams.get('classification')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  if (!query) {
    return NextResponse.json({ error: 'Paramètre de recherche "q" requis' }, { status: 400 })
  }

  const { db } = await import('@/lib/db')

  const where: any = { organizationId: auth.organizationId, isArchived: false }
  if (type) where.type = type
  if (classification) where.classification = classification
  where.OR = [
    { title: { contains: query } },
    { reference: { contains: query } },
    { description: { contains: query } },
    { tags: { contains: query } },
  ]

  const [results, total] = await Promise.all([
    db.document.findMany({
      where,
      select: {
        id: true, title: true, reference: true, type: true, status: true,
        classification: true, createdAt: true,
        author: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.document.count({ where }),
  ])

  await trackUsage(auth.organizationId!, 'API_CALL', 1, auth.apiKeyId)

  return NextResponse.json({
    data: results,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    meta: { rateLimitRemaining: auth.rateLimitRemaining },
  })
}
