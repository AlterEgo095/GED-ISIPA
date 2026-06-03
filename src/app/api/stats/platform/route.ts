import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const [
    totalOrgs,
    activeOrgs,
    trialOrgs,
    totalUsers,
    totalDocs,
    totalWorkflows,
    orgsByType,
    orgsByPlan,
    recentOrgs,
  ] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { status: 'ACTIVE' } }),
    db.organization.count({ where: { status: 'TRIAL' } }),
    db.user.count(),
    db.document.count(),
    db.workflow.count(),
    db.organization.groupBy({
      by: ['type'],
      _count: { type: true },
    }),
    db.organization.groupBy({
      by: ['plan'],
      _count: { plan: true },
    }),
    db.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, documents: true } } },
    }),
  ])

  return NextResponse.json({
    stats: {
      totalOrgs,
      activeOrgs,
      trialOrgs,
      totalUsers,
      totalDocs,
      totalWorkflows,
    },
    orgsByType: orgsByType.map(o => ({ type: o.type, count: o._count.type })),
    orgsByPlan: orgsByPlan.map(o => ({ plan: o.plan, count: o._count.plan })),
    recentOrgs,
  })
}
