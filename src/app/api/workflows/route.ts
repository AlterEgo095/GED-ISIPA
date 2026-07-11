import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { validateBody, createWorkflowSchema } from '@/lib/validation'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const role = token.role as Role

  if (!hasPermission(role, 'workflows', 'read')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const workflows = await db.workflow.findMany({
    where: { organizationId: orgId },
    include: {
      states: { orderBy: { order: 'asc' } },
      transitions: {
        include: {
          fromState: { select: { id: true, name: true, color: true } },
          toState: { select: { id: true, name: true, color: true } },
        },
      },
      _count: { select: { states: true, transitions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(workflows)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = token.role as Role
  if (!hasPermission(role, 'workflows', 'create')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const validation = validateBody(createWorkflowSchema, body)
    if (validation.error) return validation.error
    const { name, description, states, transitions } = validation.data

    const workflow = await db.workflow.create({
      data: {
        name,
        description: description || null,
        organizationId: token.organizationId as string,
      },
    })

    if (states && Array.isArray(states)) {
      const stateRecords: Record<string, any>[] = []
      for (let i = 0; i < states.length; i++) {
        const state = states[i]
        const created = await db.workflowState.create({
          data: {
            workflowId: workflow.id,
            name: state.name,
            isInitial: state.isInitial || false,
            isFinal: state.isFinal || false,
            color: state.color || '#6b7280',
            order: i,
          },
        })
        stateRecords.push(created)
        if (state.isInitial) {
          await db.workflow.update({
            where: { id: workflow.id },
            data: { initialStateId: created.id },
          })
        }
      }

      if (transitions && Array.isArray(transitions)) {
        for (const t of transitions) {
          const from = stateRecords.find(s => s.name === t.from)
          const to = stateRecords.find(s => s.name === t.to)
          if (from && to) {
            await db.workflowTransition.create({
              data: {
                workflowId: workflow.id,
                fromStateId: from.id,
                toStateId: to.id,
                name: t.name,
                allowedRoles: t.allowedRoles || [],
              },
            })
          }
        }
      }
    }

    const result = await db.workflow.findUnique({
      where: { id: workflow.id },
      include: { states: true, transitions: true },
    })

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
