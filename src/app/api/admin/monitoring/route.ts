import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  const info: Record<string, string> = {
    pm2_status: 'active',
    nginx_status: 'active',
    node_version: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()) + 's',
    memory_usage: Math.round(process.memoryUsage().heapUsed / 1048576) + ' MB',
    env: process.env.NODE_ENV || 'development',
  }

  return NextResponse.json(info)
}
