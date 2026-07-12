import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import { deleteFile } from '@/lib/storage'
import { z } from 'zod'

const destroySchema = z.object({ 
  confirmation: z.string().min(1, 'La confirmation est requise') 
})

/**
 * POST /api/documents/[id]/destroy
 * Transition: ARCHIVED → DESTROYED
 * Controlled destruction after approval and confirmation.
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
    const validation = destroySchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message || 'Données invalides' }, { status: 400 })

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Use lifecycle state machine for validation
    const lifecycleValidation = validateTransition(doc.status, 'destroy', role as any, doc.isDeleted)
    if (!lifecycleValidation.valid) {
      return NextResponse.json({ error: lifecycleValidation.error }, { status: 400 })
    }

    // Additional destruction-specific validations
    if (!doc.destructionApproved) {
      return NextResponse.json({ error: 'La destruction doit être approuvée au préalable' }, { status: 400 })
    }
    if (validation.data.confirmation !== doc.reference) {
      return NextResponse.json({ error: 'La confirmation ne correspond pas à la référence du document' }, { status: 400 })
    }

    // Delete physical file
    try { await deleteFile(doc.filePath) } catch {}

    // Update document record
    const updated = await db.document.update({ 
      where: { id }, 
      data: { 
        status: 'DESTROYED', 
        destroyedAt: new Date(), 
        destroyedBy: userId, 
        filePath: '', 
        fileSize: 0 
      } 
    })

    await db.auditLog.create({ 
      data: { 
        action: 'DESTROY', 
        entityType: 'Document', 
        entityId: id, 
        details: `Document détruit de manière contrôlée: ${doc.title} (${doc.reference}). Approuvé par: ${doc.destructionApprovedBy}. Exécuté par: ${userId}`, 
        organizationId: orgId, 
        userId, 
        documentId: id, 
        ipAddress: request.headers.get('x-forwarded-for') || null, 
        userAgent: request.headers.get('user-agent') || null 
      } 
    })

    return NextResponse.json({ document: updated })
  } catch (error: any) { 
    console.error('Destroy error:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de la destruction' }, { status: 500 }) 
  }
}
