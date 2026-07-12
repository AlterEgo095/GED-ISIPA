import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { logAdminAction, getClientInfo } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  const campuses = await db.campus.findMany({
    include: { organization: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ campuses })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { organizationId, name, code, address, city, country, timezone, primaryColor } = body
    
    if (!organizationId || !name || !code) {
      return NextResponse.json({ error: 'Organisation, nom et code requis' }, { status: 400 })
    }
    
    const campus = await db.campus.create({
      data: {
        organizationId,
        name,
        code,
        address,
        city,
        country,
        timezone: timezone || 'Africa/Casablanca',
        primaryColor,
        settings: '{}',
      },
    })
    
    const clientInfo = getClientInfo(request)
    await logAdminAction({
      action: 'CAMPUS_CREATE',
      entityType: 'Campus',
      entityId: campus.id,
      details: `Campus "${campus.name}" créé pour l'organisation ${campus.organizationId}`,
      organizationId: campus.organizationId,
      userId: token.id as string,
      ...clientInfo,
    })

    return NextResponse.json({ success: true, campus })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Code campus déjà existant pour cette organisation' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
