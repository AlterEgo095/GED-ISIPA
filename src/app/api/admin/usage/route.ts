import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logAdminAction, getClientInfo } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (organizationId) {
    const { getUsageSummary } = await import('@/lib/saas/usage-tracker')
    const summary = await getUsageSummary(organizationId)
    return NextResponse.json({ usage: summary })
  }

  // Platform-wide usage overview
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const totalApiCalls = await db.usageRecord.aggregate({
    _sum: { quantity: true },
    where: { usageType: 'API_CALL', periodStart: { gte: monthStart } },
  })
  
  const totalAiCalls = await db.usageRecord.aggregate({
    _sum: { quantity: true },
    where: { usageType: { in: ['AI_OCR', 'AI_CHAT', 'AI_CLASSIFICATION', 'AI_EMBEDDING'] }, periodStart: { gte: monthStart } },
  })
  
  const totalUploads = await db.usageRecord.aggregate({
    _sum: { quantity: true },
    where: { usageType: 'DOCUMENT_UPLOAD', periodStart: { gte: monthStart } },
  })
  
  // Per-organization usage
  const orgUsage = await db.usageRecord.groupBy({
    by: ['organizationId'],
    _sum: { quantity: true },
    where: { periodStart: { gte: monthStart } },
  })
  
  const orgIds = orgUsage.map(o => o.organizationId)
  const orgs = await db.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true, code: true, plan: true },
  })
  
  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o]))

  return NextResponse.json({
    period: { start: monthStart, end: now },
    totals: {
      apiCalls: totalApiCalls._sum.quantity || 0,
      aiCalls: totalAiCalls._sum.quantity || 0,
      uploads: totalUploads._sum.quantity || 0,
    },
    byOrganization: orgUsage.map(o => ({
      organization: orgMap[o.organizationId],
      totalQuantity: o._sum.quantity || 0,
    })),
  })
}
