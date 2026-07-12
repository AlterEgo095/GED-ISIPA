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
    return NextResponse.json({ error: 'Permission insuffisante (scope: read requis)' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const { db } = await import('@/lib/db')
  
  const where: any = { organizationId: auth.organizationId, isArchived: false }
  if (type) where.type = type
  if (status) where.status = status
  if (search) where.OR = [
    { title: { contains: search } },
    { reference: { contains: search } },
    { description: { contains: search } },
  ]

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      select: {
        id: true, title: true, reference: true, type: true, status: true,
        classification: true, fileName: true, fileSize: true, mimeType: true,
        version: true, tags: true, createdAt: true, updatedAt: true,
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.document.count({ where }),
  ])

  await trackUsage(auth.organizationId!, 'API_CALL', 1, auth.apiKeyId)

  return NextResponse.json({
    data: documents,
    pagination: {
      page, limit, total, pages: Math.ceil(total / limit),
    },
    meta: { organizationId: auth.organizationId, rateLimitRemaining: auth.rateLimitRemaining },
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  if (!requireScope(auth.scopes!, 'write')) {
    return NextResponse.json({ error: 'Permission insuffisante (scope: write requis)' }, { status: 403 })
  }

  return NextResponse.json({ 
    error: 'L\'upload de documents via API nécessite l\'endpoint multipart. Utilisez POST /api/v1/documents/upload',
    hint: 'Cette fonctionnalité sera disponible dans la prochaine version',
  }, { status: 501 })
}
