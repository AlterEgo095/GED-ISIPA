import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import type { DocumentType } from '@prisma/client'

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
      typeSpecificDocs,
    ] = await Promise.all([
      db.document.count({ where: { organizationId: orgId, isArchived: false, isDeleted: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'DRAFT', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'PENDING_REVIEW', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'APPROVED', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, status: 'PUBLISHED', isArchived: false } }),
      db.document.count({ where: { organizationId: orgId, isArchived: true, isDeleted: false } }),
      db.user.count({ where: { organizationId: orgId, isActive: true } }),
      db.department.count({ where: { organizationId: orgId } }),
      db.document.findMany({
        where: { organizationId: orgId, isArchived: false, isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      db.document.groupBy({
        by: ['status'],
        where: { organizationId: orgId, isArchived: false, isDeleted: false },
        _count: { status: true },
      }),
      db.document.groupBy({
        by: ['type'],
        where: { organizationId: orgId, isArchived: false, isDeleted: false },
        _count: { type: true },
      }),
      db.auditLog.findMany({
        where: { organizationId: orgId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      // Real type-specific document counts from DB instead of fabricated multipliers
      getTypeSpecificDocCounts(orgId, orgType),
    ])

    // Real type-specific stats from actual DB data
    const typeStats = buildTypeStats(orgType, typeSpecificDocs, totalUsers)

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

/**
 * Query real document counts by type for the organization,
 * replacing fabricated multipliers with actual DB data.
 */
async function getTypeSpecificDocCounts(orgId: string, orgType: string): Promise<Record<string, number>> {
  const typeMapping = getTypeMapping(orgType)
  const docTypes = Object.keys(typeMapping) as DocumentType[]
  const results = await db.document.groupBy({
    by: ['type'],
    where: { organizationId: orgId, isArchived: false, type: { in: docTypes } },
    _count: { type: true },
  })
  const counts: Record<string, number> = {}
  for (const r of results) {
    const label = typeMapping[r.type]
    if (label) counts[label] = (counts[label] || 0) + r._count.type
  }
  return counts
}

function getTypeMapping(orgType: string): Record<string, string> {
  switch (orgType) {
    case 'UNIVERSITY':
      return { ACADEMIC_RECORD: 'labelEtudiants', REPORT: 'labelRecherches', CERTIFICATE: 'labelCours' }
    case 'HOSPITAL':
      return { MEDICAL_RECORD: 'labelPatients', ADMINISTRATIVE: 'labelConsultations', REPORT: 'labelUrgences' }
    case 'COMPANY':
      return { POLICY: 'labelContrats', MEMO: 'labelFactures', REPORT: 'labelProjets' }
    case 'GOVERNMENT':
      return { POLICY: 'labelProcedures', MEMO: 'labelDecrets', ADMINISTRATIVE: 'labelArretes' }
    case 'LAW_FIRM':
      return { POLICY: 'labelDossiers', REPORT: 'labelPlaidoiries', ADMINISTRATIVE: 'labelClients' }
    default:
      return {}
  }
}

function buildTypeStats(orgType: string, typeSpecificDocs: Record<string, number>, totalUsers: number): Record<string, number> {
  switch (orgType) {
    case 'UNIVERSITY':
      return {
        labelEtudiants: typeSpecificDocs.labelEtudiants || 0,
        labelCours: typeSpecificDocs.labelCours || 0,
        labelRecherches: typeSpecificDocs.labelRecherches || 0,
      }
    case 'HOSPITAL':
      return {
        labelPatients: typeSpecificDocs.labelPatients || 0,
        labelConsultations: typeSpecificDocs.labelConsultations || 0,
        labelUrgences: typeSpecificDocs.labelUrgences || 0,
      }
    case 'COMPANY':
      return {
        labelContrats: typeSpecificDocs.labelContrats || 0,
        labelFactures: typeSpecificDocs.labelFactures || 0,
        labelProjets: typeSpecificDocs.labelProjets || 0,
      }
    case 'GOVERNMENT':
      return {
        labelProcedures: typeSpecificDocs.labelProcedures || 0,
        labelDecrets: typeSpecificDocs.labelDecrets || 0,
        labelArretes: typeSpecificDocs.labelArretes || 0,
      }
    case 'LAW_FIRM':
      return {
        labelDossiers: typeSpecificDocs.labelDossiers || 0,
        labelPlaidoiries: typeSpecificDocs.labelPlaidoiries || 0,
        labelClients: typeSpecificDocs.labelClients || 0,
      }
    default:
      return { labelDocuments: 0 }
  }
}
