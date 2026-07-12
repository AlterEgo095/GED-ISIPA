import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const approveDestructionSchema = z.object({
  confirmation: z.string().min(1, 'La confirmation est requise'),
  reason: z.string().min(10, 'La raison de la destruction doit contenir au moins 10 caractères').max(500),
})

/**
 * POST /api/documents/[id]/approve-destruction
 * Approve destruction of an archived document.
 * Sets destructionApproved flag and destructionApprovedBy.
 * Document remains in ARCHIVED status until actual destroy is executed.
 * 
 * Security: Requires 'destroy' permission. Must be a different user than the one who archived.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const orgId = token.organizationId as string
    const userId = token.id as string
    const role = token.role as Role

    // Must have destroy permission
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'CFO'].includes(role)) {
      return NextResponse.json({ error: 'Seuls les administrateurs et le directeur financier peuvent approuver une destruction' }, { status: 403 })
    }

    const doc = await db.document.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Must be archived
    if (doc.status !== 'ARCHIVED') {
      return NextResponse.json({ error: 'Le document doit être archivé pour approuver sa destruction' }, { status: 400 })
    }

    // Must not already be approved
    if (doc.destructionApproved) {
      return NextResponse.json({ error: 'La destruction a déjà été approuvée' }, { status: 400 })
    }

    // Separation of duties: the person who archived cannot approve destruction
    if (doc.archivedBy === userId) {
      return NextResponse.json({ 
        error: 'Séparation des responsabilités: la personne qui a archivé le document ne peut pas approuver sa destruction' 
      }, { status: 403 })
    }

    const body = await request.json()
    const parsed = approveDestructionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message || 'Données invalides' 
      }, { status: 400 })
    }

    const updated = await db.document.update({
      where: { id },
      data: {
        destructionApproved: true,
        destructionApprovedBy: userId,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Destruction approuvée pour "${doc.title}" (${doc.reference}). Raison: ${parsed.data.reason}. Approuvé par: ${userId}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ 
      document: updated,
      message: 'Destruction approuvée. Le document peut maintenant être détruit via l\'action de destruction contrôlée.' 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'approbation de destruction'
    console.error('Approve destruction error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
