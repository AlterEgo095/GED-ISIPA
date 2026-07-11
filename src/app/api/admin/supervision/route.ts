import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !(token.role === 'SUPER_ADMIN' || token.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section') || 'overview'

  if (section === 'overview') {
    const [totalOrgs, activeOrgs, totalUsers, activeUsers, totalDocs, pendingAccounts, recentAuditLogs] = await Promise.all([
      db.organization.count(),
      db.organization.count({ where: { status: 'ACTIVE' } }),
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.document.count(),
      db.user.count({ where: { accountStatus: 'PENDING_VALIDATION' } }),
      db.auditLog.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true, role: true } }, organization: { select: { id: true, name: true, code: true } } } }),
    ])
    return NextResponse.json({ stats: { totalOrgs, activeOrgs, totalUsers, activeUsers, totalDocs, pendingAccounts }, recentAuditLogs })
  }

  if (section === 'all-documents') {
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const orgId = searchParams.get('organizationId') || ''
    const where: Record<string, unknown> = {}
    if (orgId) where.organizationId = orgId
    const [documents, total] = await Promise.all([
      db.document.findMany({ where, skip: (page - 1) * limit, take: limit, include: { author: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true, code: true } }, workflowState: { select: { id: true, name: true, color: true } }, organization: { select: { id: true, name: true, code: true } } }, orderBy: { createdAt: 'desc' } }),
      db.document.count({ where }),
    ])
    return NextResponse.json({ documents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  }

  if (section === 'all-users') {
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const orgId = searchParams.get('organizationId') || ''
    const where: Record<string, unknown> = {}
    if (orgId) where.organizationId = orgId
    const [users, total] = await Promise.all([
      db.user.findMany({ where, skip: (page - 1) * limit, take: limit, select: { id: true, email: true, name: true, role: true, isActive: true, isPlatformAdmin: true, accountStatus: true, emailVerified: true, lastLogin: true, createdAt: true, department: { select: { id: true, name: true } }, organization: { select: { id: true, name: true, code: true, type: true } } }, orderBy: { createdAt: 'desc' } }),
      db.user.count({ where }),
    ])
    return NextResponse.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  }

  if (section === 'audit-logs') {
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({ skip: (page - 1) * limit, take: limit, include: { user: { select: { id: true, name: true, email: true, role: true } }, organization: { select: { id: true, name: true, code: true } } }, orderBy: { createdAt: 'desc' } }),
      db.auditLog.count(),
    ])
    return NextResponse.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  }

  return NextResponse.json({ error: 'Section inconnue' }, { status: 400 })
}
