import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateBody, moduleActionSchema } from '@/lib/validation'
import { activateModule, suspendModule, deactivateModule } from '@/lib/module-engine'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (token.role !== 'SUPER_ADMIN' && token.organizationId !== id) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const modules = await db.organizationModule.findMany({
    where: { organizationId: id },
    orderBy: { moduleKey: 'asc' },
  })

  return NextResponse.json(modules)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (token.role !== 'SUPER_ADMIN' && (token.role !== 'ORG_ADMIN' || token.organizationId !== id)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const validation = validateBody(moduleActionSchema, body)
    if (validation.error) return validation.error
    const { moduleKey, action } = validation.data

    switch (action) {
      case 'activate': {
        const success = await activateModule(id, moduleKey)
        if (!success) {
          return NextResponse.json({ error: 'Dépendances non satisfaites' }, { status: 400 })
        }
        break
      }
      case 'suspend':
        await suspendModule(id, moduleKey)
        break
      case 'deactivate':
        await deactivateModule(id, moduleKey)
        break
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    await db.auditLog.create({
      data: {
        action: action === 'activate' ? 'MODULE_ACTIVATE' : 'MODULE_SUSPEND',
        entityType: 'OrganizationModule',
        entityId: moduleKey,
        details: `Module ${moduleKey} ${action === 'activate' ? 'activé' : action === 'suspend' ? 'suspendu' : 'désactivé'}`,
        organizationId: id,
        userId: token.id as string,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'opération'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
