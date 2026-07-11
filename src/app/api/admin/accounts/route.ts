import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateBody, accountActionSchema } from '@/lib/validation'
import type { AuditAction } from '@prisma/client'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !(token.role === 'SUPER_ADMIN' || token.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING_VALIDATION'
  const where: Record<string, unknown> = { accountStatus: status }
  if (!(token.isPlatformAdmin) && token.role !== 'SUPER_ADMIN') {
    where.organizationId = token.organizationId as string
  }
  const users = await db.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, accountStatus: true, createdAt: true, department: { select: { id: true, name: true } }, organization: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ users })
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !(token.role === 'SUPER_ADMIN' || token.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const validation = validateBody(accountActionSchema, body)
    if (validation.error) return validation.error
    const { userId, action } = validation.data
    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    const newStatus = action === 'APPROVE' ? 'ACTIVE' : action === 'REJECT' ? 'REJECTED' : 'SUSPENDED'
    const updated = await db.user.update({ where: { id: userId }, data: { accountStatus: newStatus, isActive: action === 'APPROVE', emailVerified: action === 'APPROVE' } })
    await db.auditLog.create({ data: { action: ('ACCOUNT_' + action) as AuditAction, entityType: 'User', entityId: userId, details: 'Compte ' + action.toLowerCase() + ' par ' + (token.email as string), organizationId: updated.organizationId, userId: token.id as string } })
    if (action === 'APPROVE') {
      await db.notification.create({ data: { userId, title: 'Compte approuve', message: 'Votre compte a ete approuve. Vous pouvez maintenant vous connecter.', type: 'success' } })
    }
    return NextResponse.json({ user: updated, newStatus })
  } catch (error) {
    console.error('Account validation error:', error)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
