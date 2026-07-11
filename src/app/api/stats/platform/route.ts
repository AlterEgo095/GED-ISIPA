import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const sixMonthsAgo = monthsAgo(6)

  // Build month boundaries for last 6 months
  const monthBoundaries: { start: Date; end: Date; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = monthsAgo(i)
    const end = monthsAgo(i - 1)
    monthBoundaries.push({
      start,
      end,
      label: start.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    })
  }

  const [
    // === Core Stats ===
    totalOrgs,
    activeOrgs,
    totalUsers,
    activeUsers,
    totalDocs,
    archivedDocs,
    activeWorkflows,
    pendingAccounts,

    // === GroupBy queries ===
    orgsByType,
    orgsByPlan,
    docsByStatus,
    docsByClassification,

    // === Recent activity ===
    recentAuditLogs,

    // === Alerts ===
    suspendedOrgs,
    trialExpiringSoon,

    // === Growth data - total counts for monthly calculations ===
    usersLast6Months,
    docsLast6Months,
    orgsLast6Months,
    usersBefore6Months,
    docsBefore6Months,
    orgsBefore6Months,

    // === Storage usage ===
    storageByOrg,
  ] = await Promise.all([
    // Core Stats
    db.organization.count({ where: { isDeleted: false } }),
    db.organization.count({ where: { status: 'ACTIVE', isDeleted: false } }),
    db.user.count({ where: { isDeleted: false } }),
    db.user.count({ where: { isActive: true, isDeleted: false } }),
    db.document.count({ where: { isDeleted: false } }),
    db.document.count({ where: { isArchived: true, isDeleted: false } }),
    db.workflow.count({ where: { isActive: true, isDeleted: false } }),
    db.user.count({ where: { accountStatus: 'PENDING_VALIDATION', isDeleted: false } }),

    // GroupBy queries
    db.organization.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { isDeleted: false },
    }),
    db.organization.groupBy({
      by: ['plan'],
      _count: { plan: true },
      where: { isDeleted: false },
    }),
    db.document.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { isDeleted: false },
    }),
    db.document.groupBy({
      by: ['classification'],
      _count: { classification: true },
      where: { isDeleted: false },
    }),

    // Recent audit logs
    db.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    }),

    // Alerts
    db.organization.findMany({
      where: { status: 'SUSPENDED', isDeleted: false },
      select: { id: true, name: true, code: true, status: true },
    }),
    db.organization.findMany({
      where: {
        status: 'TRIAL',
        isDeleted: false,
        trialEndsAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, name: true, code: true, trialEndsAt: true },
    }),

    // Growth data - records created in last 6 months
    db.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, isDeleted: false },
      select: { createdAt: true },
    }),
    db.document.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, isDeleted: false },
      select: { createdAt: true },
    }),
    db.organization.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, isDeleted: false },
      select: { createdAt: true },
    }),

    // Counts before 6 months ago (for context)
    db.user.count({ where: { createdAt: { lt: sixMonthsAgo }, isDeleted: false } }),
    db.document.count({ where: { createdAt: { lt: sixMonthsAgo }, isDeleted: false } }),
    db.organization.count({ where: { createdAt: { lt: sixMonthsAgo }, isDeleted: false } }),

    // Storage usage per org
    db.document.groupBy({
      by: ['organizationId'],
      _sum: { fileSize: true },
      _count: { id: true },
      where: { isDeleted: false },
    }),
  ])

  // === Process growth data into monthly buckets ===
  function bucketByMonth<T extends { createdAt: Date }>(items: T[], beforeCount: number) {
    const monthlyCounts = monthBoundaries.map((mb, idx) => {
      const count = items.filter(
        (item) => item.createdAt >= mb.start && item.createdAt < mb.end
      ).length
      // Cumulative count: all before this period + counts from previous months in our window
      let cumulative = beforeCount
      for (let j = 0; j <= idx; j++) {
        cumulative += items.filter(
          (item) => item.createdAt >= monthBoundaries[j].start && item.createdAt < monthBoundaries[j].end
        ).length
      }
      return { month: mb.label, newCount: count, cumulative }
    })
    return monthlyCounts
  }

  // Simpler: just count new items per month
  function newPerMonth<T extends { createdAt: Date }>(items: T[]) {
    return monthBoundaries.map((mb) => {
      const count = items.filter(
        (item) => item.createdAt >= mb.start && item.createdAt < mb.end
      ).length
      return { month: mb.label, count }
    })
  }

  const usersPerMonth = newPerMonth(usersLast6Months)
  const docsPerMonth = newPerMonth(docsLast6Months)
  const orgsPerMonth = newPerMonth(orgsLast6Months)

  // === Process storage data ===
  const orgIds = [...new Set(storageByOrg.map((s) => s.organizationId))]
  const orgNames = await db.organization.findMany({
    where: { id: { in: orgIds }, isDeleted: false },
    select: { id: true, name: true, maxStorage: true },
  })
  const orgNameMap = Object.fromEntries(orgNames.map((o) => [o.id, o]))

  const storageUsage = storageByOrg
    .map((s) => ({
      organizationId: s.organizationId,
      organizationName: orgNameMap[s.organizationId]?.name || 'Inconnu',
      totalFileSize: s._sum.fileSize || 0,
      documentCount: s._count.id,
      maxStorage: orgNameMap[s.organizationId]?.maxStorage || 1073741824,
      usagePercent: orgNameMap[s.organizationId]?.maxStorage
        ? Math.round(((s._sum.fileSize || 0) / orgNameMap[s.organizationId].maxStorage) * 100)
        : 0,
    }))
    .sort((a, b) => b.totalFileSize - a.totalFileSize)
    .slice(0, 10)

  return NextResponse.json({
    stats: {
      totalOrgs,
      activeOrgs,
      totalUsers,
      activeUsers,
      totalDocs,
      archivedDocs,
      activeWorkflows,
      pendingAccounts,
    },
    orgsByType: orgsByType.map((o) => ({ type: o.type, count: o._count.type })),
    orgsByPlan: orgsByPlan.map((o) => ({ plan: o.plan, count: o._count.plan })),
    docsByStatus: docsByStatus.map((d) => ({ status: d.status, count: d._count.status })),
    docsByClassification: docsByClassification.map((d) => ({
      classification: d.classification,
      count: d._count.classification,
    })),
    growth: {
      usersPerMonth,
      docsPerMonth,
      orgsPerMonth,
    },
    recentAuditLogs: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      userName: log.user?.name || 'Inconnu',
      userEmail: log.user?.email || '',
      orgName: log.organization?.name || 'Inconnu',
      createdAt: log.createdAt,
    })),
    alerts: {
      suspendedOrgs,
      trialExpiringSoon,
      pendingAccounts,
    },
    storageUsage,
  })
}
