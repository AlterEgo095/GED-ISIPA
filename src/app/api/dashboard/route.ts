import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const orgType = token.organizationType as string

  try {
    const [
      totalDocs,
      draftDocs,
      pendingDocs,
      approvedDocs,
      publishedDocs,
      archivedDocs,
      totalUsers,
      totalDepts,
      recentDocs,
      docsByStatus,
      docsByType,
      recentActivities,
    ] = await Promise.all([
      db.document.count({ where: { organizationId: orgId, isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'DRAFT', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'PENDING_REVIEW', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'APPROVED', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'PUBLISHED', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, isArchived: true } }),
      db.user.count({ where: { organizationId: orgId, isActive: true } }),
      db.department.count({ where: { organizationId: orgId } }),
      db.document.findMany({
        where: { organizationId: orgId, isArchived: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      db.document.groupBy({
        by: ['status'],
        where: { organizationId: orgId, isArchived: false },
        _count: { status: true },
      }),
      db.document.groupBy({
        by: ['type'],
        where: { organizationId: orgId, isArchived: false },
        _count: { type: true },
      }),
      db.auditLog.findMany({
        where: { organizationId: orgId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
    ])

    // Type-specific stats
    const typeStats = getTypeSpecificStats(orgType, totalDocs, totalUsers)

    return NextResponse.json({
      stats: {
        totalDocs,
        draftDocs,
        pendingDocs,
        approvedDocs,
        publishedDocs,
        archivedDocs,
        totalUsers,
        totalDepts,
        ...typeStats,
      },
      recentDocs,
      docsByStatus: docsByStatus.map(d => ({ status: d.status, count: d._count.status })),
      docsByType: docsByType.map(d => ({ type: d.type, count: d._count.type })),
      recentActivities,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function getTypeSpecificStats(orgType: string, totalDocs: number, totalUsers: number) {
  switch (orgType) {
    case 'UNIVERSITY':
      return {
        labelEtudiants: totalUsers,
        labelCours: Math.floor(totalDocs * 0.3),
        labelRecherches: Math.floor(totalDocs * 0.2),
      }
    case 'HOSPITAL':
      return {
        labelPatients: totalUsers * 10,
        labelConsultations: Math.floor(totalDocs * 0.4),
        labelUrgences: Math.floor(totalDocs * 0.1),
      }
    case 'COMPANY':
      return {
        labelContrats: Math.floor(totalDocs * 0.3),
        labelFactures: Math.floor(totalDocs * 0.25),
        labelProjets: Math.floor(totalDocs * 0.15),
      }
    case 'GOVERNMENT':
      return {
        labelProcedures: Math.floor(totalDocs * 0.3),
        labelDecrets: Math.floor(totalDocs * 0.2),
        labelArretes: Math.floor(totalDocs * 0.15),
      }
    case 'LAW_FIRM':
      return {
        labelDossiers: Math.floor(totalDocs * 0.4),
        labelPlaidoiries: Math.floor(totalDocs * 0.2),
        labelClients: totalUsers * 5,
      }
    default:
      return {
        labelDocuments: totalDocs,
      }
  }
}
