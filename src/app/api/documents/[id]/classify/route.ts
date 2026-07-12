import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const classifySchema = z.object({
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional(),
  folderId: z.string().nullable().optional(),
  type: z.enum([
    'ACADEMIC_RECORD', 'ADMINISTRATIVE', 'FINANCIAL', 'CORRESPONDENCE',
    'REPORT', 'CONTRACT', 'CERTIFICATE', 'MEMO', 'POLICY',
    'MEDICAL_RECORD', 'LEGAL_BRIEF', 'INVOICE', 'PROPOSAL', 'OTHER',
  ]).optional(),
  retentionPolicy: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'PERMANENT']).optional(),
})

/**
 * POST /api/documents/[id]/classify
 * Classement du document: affectation dossier, catégorie, classification de sécurité, politique de rétention.
 * Stays in DRAFT status — this is a metadata-only update.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const orgId = token.organizationId as string
    const userId = token.id as string
    const role = token.role as Role

    const doc = await db.document.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Validate transition (classify is a DRAFT → DRAFT transition)
    const validation = validateTransition(doc.status, 'classify', role, doc.isDeleted)
    if (!validation.valid) {
      // Also allow classification on PENDING_REVISION and REJECTED (documents being revised)
      if (!['DRAFT', 'PENDING_REVISION', 'REJECTED'].includes(doc.status)) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    const body = await request.json()
    const parsed = classifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message || 'Données invalides' 
      }, { status: 400 })
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    // Build update data from classification fields
    if (data.classification) updateData.classification = data.classification
    if (data.type) updateData.type = data.type
    if (data.folderId !== undefined) updateData.folderId = data.folderId || null
    if (data.retentionPolicy) {
      updateData.retentionPolicy = data.retentionPolicy
      // Calculate destruction date based on retention policy
      let destroyAt: Date | null = null
      if (data.retentionPolicy === 'SHORT_TERM') {
        destroyAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
      } else if (data.retentionPolicy === 'MEDIUM_TERM') {
        destroyAt = new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000)
      } else if (data.retentionPolicy === 'LONG_TERM') {
        destroyAt = new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000)
      }
      updateData.destroyAt = destroyAt
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée de classement fournie' }, { status: 400 })
    }

    const updated = await db.document.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        folder: { select: { id: true, name: true } },
      },
    })

    // Build audit detail string
    const changes: string[] = []
    if (data.classification) changes.push(`classification → ${data.classification}`)
    if (data.type) changes.push(`type → ${data.type}`)
    if (data.folderId !== undefined) changes.push(`dossier modifié`)
    if (data.retentionPolicy) changes.push(`rétention → ${data.retentionPolicy}`)

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Classement du document "${doc.title}": ${changes.join(', ')}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du classement'
    console.error('Classify error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
