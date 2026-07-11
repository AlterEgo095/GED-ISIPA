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
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = body.action as string

  if (!action || !['validate', 'reject', 'suspend', 'activate'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id }, include: { organization: true } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  let updateData: Record<string, unknown> = {}
  let auditAction: AuditAction = 'USER_ACTIVATED'
  let auditDetails = ''
  let notificationTitle = ''
  let notificationMessage = ''
  let notificationType = 'info'

  switch (action) {
    case 'validate':
      updateData = { accountStatus: 'ACTIVE', isActive: true, emailVerified: true }
      auditAction = 'USER_VALIDATED'
      auditDetails = 'Compte valid\u00e9 par ' + (token.email as string)
      notificationTitle = 'Compte approuv\u00e9'
      notificationMessage = 'Votre compte a \u00e9t\u00e9 approuv\u00e9. Vous pouvez maintenant vous connecter.'
      notificationType = 'success'
      break
    case 'reject':
      updateData = { accountStatus: 'REJECTED', isActive: false }
      auditAction = 'USER_REJECTED'
      auditDetails = 'Compte rejet\u00e9 par ' + (token.email as string) + (body.reason ? '. Raison: ' + body.reason : '')
      notificationTitle = 'Compte rejet\u00e9'
      notificationMessage = 'Votre demande de compte a \u00e9t\u00e9 rejet\u00e9e. Contactez un administrateur.'
      notificationType = 'error'
      break
    case 'suspend':
      updateData = { accountStatus: 'SUSPENDED', isActive: false }
      auditAction = 'USER_SUSPENDED'
      auditDetails = 'Compte suspendu par ' + (token.email as string) + (body.reason ? '. Raison: ' + body.reason : '')
      notificationTitle = 'Compte suspendu'
      notificationMessage = 'Votre compte a \u00e9t\u00e9 suspendu. Contactez un administrateur.'
      notificationType = 'warning'
      break
    case 'activate':
      updateData = { accountStatus: 'ACTIVE', isActive: true }
      auditAction = 'USER_ACTIVATED'
      auditDetails = 'Compte r\u00e9activ\u00e9 par ' + (token.email as string)
      notificationTitle = 'Compte r\u00e9activ\u00e9'
      notificationMessage = 'Votre compte a \u00e9t\u00e9 r\u00e9activ\u00e9. Vous pouvez vous reconnecter.'
      notificationType = 'success'
      break
  }

  await db.user.update({ where: { id }, data: updateData })

  await db.auditLog.create({
    data: {
      action: auditAction,
      entityType: 'User',
      entityId: id,
      details: auditDetails,
      organizationId: user.organizationId,
      userId: token.id as string,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    },
  })

  await db.notification.create({
    data: { userId: id, title: notificationTitle, message: notificationMessage, type: notificationType },
  }).catch(() => {})

  return NextResponse.json({ success: true, action, userId: id })
}
