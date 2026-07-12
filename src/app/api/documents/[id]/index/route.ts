import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { validateTransition } from '@/lib/document-lifecycle'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const indexSchema = z.object({
  tags: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  description: z.string().max(1000).optional(),
})

/**
 * POST /api/documents/[id]/index
 * Indexation du document: enrichissement des métadonnées, tags, description.
 * Stays in current status — this is a metadata-only update for search/indexing.
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

    // Validate transition (index is a DRAFT → DRAFT transition, but we allow it on more statuses)
    const allowedStatuses: string[] = ['DRAFT', 'PENDING_REVISION', 'REJECTED', 'APPROVED', 'PUBLISHED']
    if (!allowedStatuses.includes(doc.status)) {
      return NextResponse.json({ 
        error: `L'indexation n'est pas possible dans le statut actuel (${doc.status})` 
      }, { status: 400 })
    }

    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'LAWYER', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'].includes(role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = indexSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message || 'Données invalides' 
      }, { status: 400 })
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.metadata) updateData.metadata = data.metadata

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée d\'indexation fournie' }, { status: 400 })
    }

    const updated = await db.document.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    // Also create/update individual metadata entries for searchability
    if (data.metadata && typeof data.metadata === 'object') {
      for (const [key, value] of Object.entries(data.metadata)) {
        await db.documentMetadata.upsert({
          where: { documentId_key: { documentId: id, key } },
          create: {
            documentId: id,
            key,
            value: String(value),
            type: typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : 'TEXT',
            category: 'indexation',
          },
          update: {
            value: String(value),
            type: typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : 'TEXT',
          },
        })
      }
    }

    // Build audit detail string
    const changes: string[] = []
    if (data.tags !== undefined) changes.push('tags mis à jour')
    if (data.description !== undefined) changes.push('description mise à jour')
    if (data.metadata) changes.push(`${Object.keys(data.metadata).length} métadonnée(s) indexée(s)`)

    await db.auditLog.create({
      data: {
        action: 'METADATA_UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Indexation du document "${doc.title}": ${changes.join(', ')}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ document: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'indexation'
    console.error('Index error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
