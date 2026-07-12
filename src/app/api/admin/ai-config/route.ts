import { logAdminAction, getClientInfo } from '@/lib/admin-audit'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { getAiConfigGroups, setAiConfigBatch, testAiConnection, getAllAiConfig } from '@/lib/saas/ai-config'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const groups = await getAiConfigGroups()
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('AI config fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }
    
    await setAiConfigBatch(settings)
    return NextResponse.json({ success: true, message: 'Configuration IA mise à jour' })
  } catch (error) {
    console.error('AI config update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
