import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role, DocumentType, DocumentStatus } from '@prisma/client'

/**
 * GET /api/documents/trash
 * Professional recycle bin: list soft-deleted documents with advanced filters.
 * 
 * Query params:
 *   page, limit, search, type, status, classification, departmentId,
 *   deletedBy, dateFrom, dateTo, sort (deletedAt|title|fileSize), order (asc|desc)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    
    // Users with 'delete' permission can view trash
    if (!hasPermission(role as any, 'documents', 'delete') && !hasPermission(role as any, 'documents', 'read')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const classification = searchParams.get('classification') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const deletedBy = searchParams.get('deletedBy') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const sort = searchParams.get('sort') || 'deletedAt'
    const sortOrder = searchParams.get('order') || 'desc'

    // Build where clause
    const where: Record<string, unknown> = { 
      organizationId: orgId, 
      isDeleted: true 
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type) where.type = type
    if (status) where.status = status
    if (classification) where.classification = classification
    if (departmentId) where.departmentId = departmentId
    if (deletedBy) where.deletedBy = deletedBy
    
    // Date range filter on deletion date
    if (dateFrom || dateTo) {
      where.deletedAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      }
    }

    // Build order by
    const allowedSortFields = ['deletedAt', 'title', 'fileSize', 'createdAt']
    const sortField = allowedSortFields.includes(sort) ? sort : 'deletedAt'
    const orderBy: Record<string, string> = { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          department: { select: { id: true, name: true, code: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.document.count({ where }),
    ])

    // Calculate trash statistics
    const stats = await db.document.aggregate({
      where: { organizationId: orgId, isDeleted: true },
      _count: { id: true },
      _sum: { fileSize: true },
    })

    // Count documents approaching auto-purge (30 days in trash)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const approachingPurge = await db.document.count({
      where: { 
        organizationId: orgId, 
        isDeleted: true,
        deletedAt: { lte: thirtyDaysAgo },
      },
    })

    // Get unique deleters for filter dropdown
    const deleters = await db.document.findMany({
      where: { organizationId: orgId, isDeleted: true, deletedBy: { not: null } },
      select: { deletedBy: true },
      distinct: ['deletedBy'],
    })

    // Resolve deleter names
    const deleterIds = deleters.map(d => d.deletedBy).filter(Boolean) as string[]
    const deleterUsers = deleterIds.length > 0 ? await db.user.findMany({
      where: { id: { in: deleterIds } },
      select: { id: true, name: true, email: true },
    }) : []

    return NextResponse.json({
      documents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        totalDocuments: stats._count.id || 0,
        totalSize: stats._sum.fileSize || 0,
        approachingPurge,
        retentionDays: 30, // Default trash retention period
      },
      deleters: deleterUsers,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement de la corbeille'
    console.error('Trash list error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/documents/trash
 * Bulk empty trash or purge documents older than retention period.
 * Body: { action: 'empty' | 'purge-expired', confirmation: string, documentIds?: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    // Only admins can purge
    if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Seuls les administrateurs peuvent purger la corbeille' }, { status: 403 })
    }

    const body = await request.json()
    const { action, confirmation, documentIds } = body

    if (!confirmation || confirmation !== 'PURGE_CONFIRM') {
      return NextResponse.json({ error: 'Confirmation requise: PURGE_CONFIRM' }, { status: 400 })
    }

    if (action === 'empty') {
      // Empty entire trash for this organization
      const docs = await db.document.findMany({
        where: { organizationId: orgId, isDeleted: true },
        include: { versions: true },
      })

      let purgedCount = 0
      for (const doc of docs) {
        try {
          // Delete physical files
          try { await (await import('@/lib/storage')).deleteFile(doc.filePath) } catch {}
          for (const v of doc.versions) {
            try { await (await import('@/lib/storage')).deleteFile(v.filePath) } catch {}
          }
          // Delete related records first
          await db.auditLog.create({
            data: {
              action: 'PERMANENT_DELETE',
              entityType: 'Document',
              entityId: doc.id,
              details: `Corbeille vidée: ${doc.title} (${doc.reference}) supprimé définitivement`,
              organizationId: orgId,
              userId,
              documentId: doc.id,
            },
          })
          // DocumentVersion cascades on delete
          await db.document.delete({ where: { id: doc.id } })
          purgedCount++
        } catch (err) {
          console.error(`Failed to purge document ${doc.id}:`, err)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Corbeille vidée: ${purgedCount} document(s) supprimé(s) définitivement`,
        purgedCount 
      })

    } else if (action === 'purge-expired') {
      // Purge only documents older than retention period (30 days)
      const retentionDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const docs = await db.document.findMany({
        where: { 
          organizationId: orgId, 
          isDeleted: true,
          deletedAt: { lte: retentionDate },
        },
        include: { versions: true },
      })

      let purgedCount = 0
      for (const doc of docs) {
        try {
          try { await (await import('@/lib/storage')).deleteFile(doc.filePath) } catch {}
          for (const v of doc.versions) {
            try { await (await import('@/lib/storage')).deleteFile(v.filePath) } catch {}
          }
          await db.auditLog.create({
            data: {
              action: 'PERMANENT_DELETE',
              entityType: 'Document',
              entityId: doc.id,
              details: `Purge automatique: ${doc.title} (${doc.reference}) - supprimé après 30 jours en corbeille`,
              organizationId: orgId,
              userId,
              documentId: doc.id,
            },
          })
          await db.document.delete({ where: { id: doc.id } })
          purgedCount++
        } catch (err) {
          console.error(`Failed to purge document ${doc.id}:`, err)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Purge expirée: ${purgedCount} document(s) de plus de 30 jours supprimé(s) définitivement`,
        purgedCount 
      })

    } else if (action === 'purge-selected' && Array.isArray(documentIds)) {
      // Purge selected documents
      const docs = await db.document.findMany({
        where: { 
          id: { in: documentIds },
          organizationId: orgId, 
          isDeleted: true,
        },
        include: { versions: true },
      })

      let purgedCount = 0
      for (const doc of docs) {
        try {
          try { await (await import('@/lib/storage')).deleteFile(doc.filePath) } catch {}
          for (const v of doc.versions) {
            try { await (await import('@/lib/storage')).deleteFile(v.filePath) } catch {}
          }
          await db.auditLog.create({
            data: {
              action: 'PERMANENT_DELETE',
              entityType: 'Document',
              entityId: doc.id,
              details: `Suppression définitive sélective: ${doc.title} (${doc.reference})`,
              organizationId: orgId,
              userId,
              documentId: doc.id,
            },
          })
          await db.document.delete({ where: { id: doc.id } })
          purgedCount++
        } catch (err) {
          console.error(`Failed to purge document ${doc.id}:`, err)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `${purgedCount} document(s) supprimé(s) définitivement`,
        purgedCount 
      })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la purge'
    console.error('Trash purge error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
