import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { executeWorkflowTransition } from '@/lib/workflow'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string
  const userId = token.id as string
  const role = token.role as string

  try {
    const body = await request.json()
    const { transitionId, documentId } = body

    if (!transitionId || !documentId) {
      return NextResponse.json({ error: 'transitionId et documentId requis' }, { status: 400 })
    }

    // Verify the transition's allowed roles include the user's role
    const transition = await db.workflowTransition.findUnique({
      where: { id: transitionId },
    })

    if (!transition) {
      return NextResponse.json({ error: 'Transition introuvable' }, { status: 404 })
    }

    const allowedRoles: string[] = JSON.parse(transition.allowedRoles || '[]')
    if (allowedRoles.length > 0 && !allowedRoles.includes(role) && role !== 'SUPER_ADMIN' && role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Rôle non autorisé pour cette transition' }, { status: 403 })
    }

    const result = await executeWorkflowTransition(transitionId, documentId, userId, orgId)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'exécution'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
