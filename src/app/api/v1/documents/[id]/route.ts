import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticateApiKey, requireScope } from '@/lib/saas/api-auth'
import { trackUsage } from '@/lib/saas/usage-tracker'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  if (!requireScope(auth.scopes!, 'read')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  const { id } = await params
  const { db } = await import('@/lib/db')

  const document = await db.document.findFirst({
    where: { id, organizationId: auth.organizationId, isArchived: false },
    include: {
      author: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
      versions: { orderBy: { version: 'desc' }, take: 5 },
    },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
  }

  await trackUsage(auth.organizationId!, 'API_CALL', 1, auth.apiKeyId)

  return NextResponse.json({
    data: document,
    meta: { rateLimitRemaining: auth.rateLimitRemaining },
  })
}
