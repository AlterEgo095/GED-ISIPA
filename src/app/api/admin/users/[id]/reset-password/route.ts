import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !(token.isPlatformAdmin || token.role === 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const tempPassword = generateTempPassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 12)

  await db.user.update({
    where: { id },
    data: { password: hashedPassword },
  })

  await db.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      details: 'Mot de passe r\u00e9initialis\u00e9 par ' + (token.email as string),
      organizationId: user.organizationId,
      userId: token.id as string,
    },
  })

  await db.notification.create({
    data: {
      userId: id,
      title: 'Mot de passe r\u00e9initialis\u00e9',
      message: 'Votre mot de passe a \u00e9t\u00e9 r\u00e9initialis\u00e9 par un administrateur. Veuillez le changer \u00e0 votre prochaine connexion.',
      type: 'warning',
    },
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    temporaryPassword: tempPassword,
    message: 'Mot de passe r\u00e9initialis\u00e9. Communiquez le mot de passe temporaire \u00e0 l\'utilisateur.',
  })
}
