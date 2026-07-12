import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

async function verifyOwnership(request: NextRequest, keyId: string) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return { error: 'Non autorisé', status: 401 }

  const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN']
  if (!allowedRoles.includes(token.role as string)) {
    return { error: 'Accès réservé aux administrateurs', status: 403 }
  }

  const orgId = token.organizationId as string
  const apiKey = await db.apiKey.findUnique({ where: { id: keyId } })

  if (!apiKey) {
    return { error: 'Clé API introuvable', status: 404 }
  }

  // SUPER_ADMIN can manage any key, ORG_ADMIN only their own org
  if (token.role !== 'SUPER_ADMIN' && apiKey.organizationId !== orgId) {
    return { error: 'Accès refusé : cette clé n\'appartient pas à votre organisation', status: 403 }
  }

  return { token, apiKey, orgId }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const verification = await verifyOwnership(request, id)
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'revoke') {
      await db.apiKey.update({ where: { id }, data: { status: 'REVOKED' } })

      await db.auditLog.create({
        data: {
          action: 'API_KEY_REVOKE',
          entityType: 'ApiKey',
          entityId: id,
          details: `Clé API "${verification.apiKey.name}" révoquée`,
          organizationId: verification.orgId,
          userId: verification.token.id as string,
        },
      })

      return NextResponse.json({ success: true, message: 'Clé API révoquée' })
    }

    if (action === 'activate') {
      await db.apiKey.update({ where: { id }, data: { status: 'ACTIVE' } })

      await db.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'ApiKey',
          entityId: id,
          details: `Clé API "${verification.apiKey.name}" activée`,
          organizationId: verification.orgId,
          userId: verification.token.id as string,
        },
      })

      return NextResponse.json({ success: true, message: 'Clé API activée' })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('API key update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const verification = await verifyOwnership(request, id)
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status })
  }

  try {
    await db.apiKey.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'ApiKey',
        entityId: id,
        details: `Clé API "${verification.apiKey.name}" supprimée`,
        organizationId: verification.orgId,
        userId: verification.token.id as string,
      },
    })

    return NextResponse.json({ success: true, message: 'Clé API supprimée' })
  } catch (error) {
    console.error('API key delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
