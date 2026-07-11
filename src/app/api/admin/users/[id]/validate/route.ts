import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import type { AuditAction } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !(token.isPlatformAdmin || token.role === 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Acces non autorise - Super Admin uniquement' }, { status: 403 })
  }

  const { id } = await params
  const user = await db.user.findUnique({ where: { id }, include: { organization: true } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  // Determine action from the URL path
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const action = pathParts[pathParts.length - 1] // 'validate', 'reject', 'suspend', 'activate'

  let updateData: Record<string, unknown> = {}
  let auditAction: string = ''
  let auditDetails = ''

  switch (action) {
    case 'validate':
      updateData.accountStatus = 'ACTIVE'
      updateData.isActive = true
      updateData.emailVerified = true
      auditAction = 'USER_VALIDATED'
      auditDetails = 'Compte valide par ' + (token.email as string)
      break
    case 'reject':
      updateData.accountStatus = 'REJECTED'
      updateData.isActive = false
      const body = await request.json().catch(() => ({}))
      // rejectionReason not stored - logged in audit instead
      auditAction = 'USER_REJECTED'
      auditDetails = 'Compte rejete par ' + (token.email as string)
      break
    case 'suspend':
      updateData.accountStatus = 'SUSPENDED'
      updateData.isActive = false
      auditAction = 'USER_SUSPENDED'
      auditDetails = 'Compte suspendu par ' + (token.email as string)
      break
    case 'activate':
      updateData.accountStatus = 'ACTIVE'
      updateData.isActive = true
      auditAction = 'USER_ACTIVATED'
      auditDetails = 'Compte reactive par ' + (token.email as string)
      break
    default:
      return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  }

  await db.user.update({ where: { id }, data: updateData })

  await db.auditLog.create({
    data: {
      action: auditAction as AuditAction,
      entityType: 'User',
      entityId: id,
      details: auditDetails,
      organizationId: user.organizationId,
      userId: token.id as string,
    },
  })

  return NextResponse.json({ success: true, action, userId: id })
}
