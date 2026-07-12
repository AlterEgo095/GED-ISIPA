import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'

const annotationSchema = z.object({
  page: z.number().int().positive().default(1),
  type: z.enum(['HIGHLIGHT', 'DRAWING', 'NOTE', 'STAMP', 'ARROW', 'RECTANGLE']).default('HIGHLIGHT'),
  position: z.record(z.string(), z.unknown()),
  content: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffff00'),
})

/**
 * GET /api/documents/[id]/annotations
 * List annotations for a document, optionally filtered by page.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { documentId: id }
    if (page) where.page = parseInt(page)
    if (type) where.type = type

    const annotations = await db.documentAnnotation.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // Group by page for easy navigation
    const grouped: Record<number, typeof annotations> = {}
    for (const ann of annotations) {
      const p = ann.page || 1
      if (!grouped[p]) grouped[p] = []
      grouped[p].push(ann)
    }

    return NextResponse.json({ 
      annotations,
      grouped,
      totalAnnotations: annotations.length,
      pages: Object.keys(grouped).map(Number).sort((a, b) => a - b),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Annotations GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/documents/[id]/annotations
 * Create an annotation on a document.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const { id } = await params

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const body = await request.json()
    const parsed = annotationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }

    const { page, type, position, content, color } = parsed.data

    const annotation = await db.documentAnnotation.create({
      data: { 
        documentId: id, 
        userId, 
        page, 
        type, 
        position: position as any, 
        content: content || null, 
        color,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await db.auditLog.create({
      data: {
        action: 'ANNOTATION_ADD',
        entityType: 'Document',
        entityId: id,
        details: `Annotation ajoutée (page ${page}, type ${type}) sur: ${doc.title}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ annotation }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'annotation'
    console.error('Annotation POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/documents/[id]/annotations
 * Delete an annotation. Body: { annotationId: string }
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const role = token.role as string
    const { id } = await params

    const body = await request.json()
    if (!body.annotationId) return NextResponse.json({ error: 'annotationId requis' }, { status: 400 })

    const annotation = await db.documentAnnotation.findFirst({
      where: { id: body.annotationId, documentId: id },
    })
    if (!annotation) return NextResponse.json({ error: 'Annotation introuvable' }, { status: 404 })

    // Only the annotation author or admin can delete
    if (annotation.userId !== userId && !['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.json({ error: 'Seul l\'auteur de l\'annotation ou un admin peut la supprimer' }, { status: 403 })
    }

    await db.documentAnnotation.delete({ where: { id: body.annotationId } })

    await db.auditLog.create({
      data: {
        action: 'ANNOTATION_ADD',
        entityType: 'Document',
        entityId: id,
        details: `Annotation supprimée (page ${annotation.page}, type ${annotation.type})`,
        organizationId: orgId,
        userId,
        documentId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Annotation DELETE error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
