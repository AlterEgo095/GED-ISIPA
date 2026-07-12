import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import { z } from 'zod'

const rejectSchema = z.object({ 
  reason: z.string().min(1, 'La raison du rejet est requise').max(500) 
})

/**
 * POST /api/documents/[id]/reject
 * Transition: PENDING_REVIEW/IN_REVIEW/PENDING_APPROVAL → REJECTED
 * Updated to use lifecycle state machine for validation.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    const { id } = await params
    const body = await request.json()
    const validation = rejectSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message || 'Données invalides' }, { status: 400 })

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Use lifecycle state machine for validation
    const lifecycleValidation = validateTransition(doc.status, 'reject', role as any, doc.isDeleted)
    if (!lifecycleValidation.valid) {
      return NextResponse.json({ error: lifecycleValidation.error }, { status: 400 })
    }

    const updated = await db.document.update({ 
      where: { id }, 
      data: { 
        status: 'REJECTED', 
        rejectedBy: userId, 
        rejectedAt: new Date(), 
        rejectionReason: validation.data.reason 
      } 
    })

    await db.auditLog.create({ 
      data: { 
        action: 'REJECT', 
        entityType: 'Document', 
        entityId: id, 
        details: `Document rejeté: ${doc.title}. Raison: ${validation.data.reason}`, 
        organizationId: orgId, 
        userId, 
        documentId: id, 
        ipAddress: request.headers.get('x-forwarded-for') || null, 
        userAgent: request.headers.get('user-agent') || null 
      } 
    })

    return NextResponse.json({ document: updated })
  } catch (error: any) { 
    console.error('Reject error:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors du rejet' }, { status: 500 }) 
  }
}
