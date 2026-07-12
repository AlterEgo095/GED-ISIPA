import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticateApiKey, requireScope } from '@/lib/saas/api-auth'
import { trackUsage } from '@/lib/saas/usage-tracker'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  if (!requireScope(auth.scopes!, 'admin')) {
    return NextResponse.json({ error: 'Permission insuffisante (scope: admin requis)' }, { status: 403 })
  }

  const { db } = await import('@/lib/db')

  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    select: {
      id: true, name: true, code: true, type: true, plan: true, status: true,
      primaryColor: true, maxUsers: true, maxStorage: true,
      _count: { select: { users: true, documents: true, departments: true } },
    },
  })

  await trackUsage(auth.organizationId!, 'API_CALL', 1, auth.apiKeyId)

  return NextResponse.json({ data: org })
}
