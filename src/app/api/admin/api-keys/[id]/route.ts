import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body
    
    if (action === 'revoke') {
      await db.apiKey.update({ where: { id }, data: { status: 'REVOKED' } })
      return NextResponse.json({ success: true, message: 'Clé API révoquée' })
    }
    
    if (action === 'activate') {
      await db.apiKey.update({ where: { id }, data: { status: 'ACTIVE' } })
      return NextResponse.json({ success: true, message: 'Clé API activée' })
    }
    
    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const { id } = await params
    await db.apiKey.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Clé API supprimée' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
