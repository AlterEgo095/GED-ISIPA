import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'

/**
 * PHASE 12: DOCUMENT AUDIT
 * GET /api/documents/[id]/audit
 * Complete document audit timeline with journal, comparison, and export capabilities.
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const role = token.role as string
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    // Filters
    const action = searchParams.get('action') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const userId_filter = searchParams.get('userId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const format = searchParams.get('format') || 'json' // json, csv

    // Check read access
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Build where clause
    const where: Record<string, unknown> = { 
      documentId: id, 
      organizationId: orgId,
    }
    if (action) where.action = action
    if (userId_filter) where.userId = userId_filter
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      }
    }

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    // Get access logs for this document
    const accessLogs = await db.accessLog.findMany({
      where: { documentId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Build document timeline summary
    const timeline = auditLogs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      action: log.action,
      details: log.details,
      user: log.user?.name || 'Système',
      userEmail: log.user?.email,
      userRole: log.user?.role,
      ipAddress: log.ipAddress,
    }))

    // Calculate summary statistics
    const actionCounts: Record<string, number> = {}
    for (const log of auditLogs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    }

    // Unique users who accessed/modified
    const uniqueUsers = new Set(auditLogs.map(l => l.userId))

    // CSV export
    if (format === 'csv') {
      const csvHeader = 'Date,Action,Utilisateur,Email,Détails,IP\n'
      const csvRows = auditLogs.map(log => 
        `"${new Date(log.createdAt).toISOString()}","${log.action}","${log.user?.name || 'Système'}","${log.user?.email || ''}","${(log.details || '').replace(/"/g, '""')}","${log.ipAddress || ''}"`
      ).join('\n')
      
      return new NextResponse(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-${doc.reference}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        title: doc.title,
        reference: doc.reference,
        status: doc.status,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      timeline,
      accessLogs,
      stats: {
        totalAuditEntries: total,
        totalAccessLogs: accessLogs.length,
        actionCounts,
        uniqueUsers: uniqueUsers.size,
        firstActivity: auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].createdAt : null,
        lastActivity: auditLogs.length > 0 ? auditLogs[0].createdAt : null,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      availableActions: Object.keys(actionCounts).sort(),
      exportFormats: ['json', 'csv'],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'audit'
    console.error('Document audit error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
