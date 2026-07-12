import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'

/**
 * GET /api/documents/[id]/comments
 * List all comments for a document, organized in threads.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Get top-level comments (no parent) with their replies
    const comments = await db.documentComment.findMany({
      where: { documentId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get stats
    const totalComments = await db.documentComment.count({ where: { documentId: id } })
    const resolvedComments = await db.documentComment.count({ where: { documentId: id, isResolved: true } })
    const unresolvedComments = totalComments - resolvedComments

    return NextResponse.json({ 
      comments,
      stats: { total: totalComments, resolved: resolvedComments, unresolved: unresolvedComments },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Comments GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const commentSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis').max(5000),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
})

/**
 * POST /api/documents/[id]/comments
 * Add a comment to a document.
 * Enhanced with: mentions notification, threading, resolution.
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
    const parsed = commentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }

    const { content, parentId, mentions } = parsed.data

    // Validate parent comment if replying
    if (parentId) {
      const parent = await db.documentComment.findFirst({
        where: { id: parentId, documentId: id },
      })
      if (!parent) return NextResponse.json({ error: 'Commentaire parent introuvable' }, { status: 404 })
    }

    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g
    const extractedMentions = content.match(mentionRegex)?.map(m => m.slice(1)) || []
    const allMentions = [...new Set([...(mentions || []), ...extractedMentions])]

    const comment = await db.documentComment.create({ 
      data: { 
        documentId: id, 
        userId, 
        content, 
        parentId: parentId || null, 
        mentions: JSON.stringify(allMentions),
        organizationId: orgId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Create notifications for mentioned users
    for (const mention of allMentions) {
      const mentionedUser = await db.user.findFirst({
        where: { 
          organizationId: orgId, 
          name: { contains: mention, mode: 'insensitive' },
          isDeleted: false,
          isActive: true,
        },
      })
      if (mentionedUser && mentionedUser.id !== userId) {
        await db.notification.create({
          data: {
            userId: mentionedUser.id,
            title: 'Mention dans un commentaire',
            message: `${comment.user?.name || 'Un utilisateur'} vous a mentionné dans un commentaire sur "${doc.title}"`,
            type: 'mention',
            link: `/documents/${id}`,
          },
        })
      }
    }

    await db.auditLog.create({ 
      data: { 
        action: 'COMMENT_ADD', 
        entityType: 'Document', 
        entityId: id, 
        details: `Commentaire ajouté sur: ${doc.title}${parentId ? ' (réponse)' : ''}${allMentions.length ? `. Mentions: @${allMentions.join(', @')}` : ''}`, 
        organizationId: orgId, 
        userId, 
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      } 
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du commentaire'
    console.error('Comment POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
