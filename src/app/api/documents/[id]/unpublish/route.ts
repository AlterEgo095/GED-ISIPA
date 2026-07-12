import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * POST /api/documents/[id]/unpublish
 * Transition: PUBLISHED → APPROVED
 * Withdraw a published document back to approved status.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const orgId = token.organizationId as string
    const userId = token.id as string
    const role = token.role as Role

    // Must have publish permission
    const allowedRoles: Role[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'DEAN', 'LAWYER', 'CFO', 'CIVIL_SERVANT']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes pour dépublier' }, { status: 403 })
    }

    const doc = await db.document.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Validate transition
    const validation = validateTransition(doc.status, 'unpublish', role, doc.isDeleted)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    let reason: string | null = null
    try {
      const body = await request.json()
      reason = body.reason || null
    } catch {
      // No body is fine
    }

    const updated = await db.document.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Document "${doc.title}" dépublié${reason ? `. Raison: ${reason}` : ''}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la dépublication'
    console.error('Unpublish error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
