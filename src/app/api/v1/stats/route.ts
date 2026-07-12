import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authenticateApiKey, requireScope } from '@/lib/saas/api-auth'
import { getUsageSummary } from '@/lib/saas/usage-tracker'
import { trackUsage } from '@/lib/saas/usage-tracker'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  if (!requireScope(auth.scopes!, 'read')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  const { db } = await import('@/lib/db')

  const [docStats, userStats, usage] = await Promise.all([
    db.document.aggregate({
      where: { organizationId: auth.organizationId },
      _count: true,
      _sum: { fileSize: true },
    }),
    db.user.count({ where: { organizationId: auth.organizationId, isActive: true } }),
    getUsageSummary(auth.organizationId!),
  ])

  await trackUsage(auth.organizationId!, 'API_CALL', 1, auth.apiKeyId)

  return NextResponse.json({
    data: {
      documents: { total: docStats._count, totalSize: docStats._sum.fileSize || 0 },
      users: { active: userStats },
      usage,
    },
    meta: { rateLimitRemaining: auth.rateLimitRemaining },
  })
}
