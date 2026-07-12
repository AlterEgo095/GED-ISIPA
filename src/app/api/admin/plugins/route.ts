import { logAdminAction, getClientInfo } from '@/lib/admin-audit'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { initializeBuiltinPlugins, getAvailablePlugins } from '@/lib/saas/plugins'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  // Ensure builtin plugins are registered
  await initializeBuiltinPlugins()
  
  // Get all plugins without org filter (superadmin sees all)
  const { db } = await import('@/lib/db')
  const plugins = await db.plugin.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { instances: true },
  })
  
  return NextResponse.json({ plugins: plugins.map(p => ({
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description,
    version: p.version,
    author: p.author,
    icon: p.icon,
    category: p.category,
    tags: JSON.parse(p.tags || '[]'),
    status: p.status,
    downloads: p.downloads,
    rating: p.rating,
    totalInstallations: p.instances.length,
    createdAt: p.createdAt,
  })) })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Admin' }, { status: 403 })
  }

  await initializeBuiltinPlugins()

  // Audit log for plugin initialization
  const clientInfo = getClientInfo(request)
  await logAdminAction({
    action: 'PLUGIN_INSTALL',
    entityType: 'Plugin',
    entityId: 'builtin-init',
    details: 'Plugins intégrés initialisés par le Super Admin',
    organizationId: token.organizationId as string,
    userId: token.id as string,
    ...clientInfo,
  })

  return NextResponse.json({ success: true, message: 'Plugins intégrés initialisés' })
}
