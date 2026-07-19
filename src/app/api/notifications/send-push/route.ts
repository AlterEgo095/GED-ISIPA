import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()
    const { userId, title, body: messageBody, url, tag } = body

    if (!userId || !title || !messageBody) {
      return NextResponse.json({ error: 'userId, title et body requis' }, { status: 400 })
    }

    // Only allow admin or self-notification
    const isSelf = token.id === userId
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(token.role as string)
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const result = await sendPushToUser(userId, { title, body: messageBody, url, tag })

    // Also create an in-app notification
    await db.notification.create({
      data: {
        userId,
        title,
        message: messageBody,
        type: 'PUSH',
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Send push error:', error)
    return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 })
  }
}