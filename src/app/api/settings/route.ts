import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

// Sensitive setting keys that only SUPER_ADMIN can modify
const SENSITIVE_KEYS = ['platform_mode', 'maintenance_enabled', 'global_rate_limit', 'smtp_config']

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = token.role as Role
  if (!hasPermission(role, 'settings', 'read')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const settings = await db.systemSetting.findMany()
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

  return NextResponse.json(settingsMap)
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = token.role as Role
  if (!hasPermission(role, 'settings', 'update')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()
    
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      // Only SUPER_ADMIN can modify sensitive keys
      if (SENSITIVE_KEYS.includes(key) && role !== 'SUPER_ADMIN') {
        continue
      }
      await db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
