import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import crypto from 'crypto'
import { z } from 'zod'

/**
 * GET /api/documents/[id]/shares
 * List all shares for a document with access statistics.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const orgId = token.organizationId as string
    const { id } = await params

    const shares = await db.documentShare.findMany({ 
      where: { documentId: id }, 
      orderBy: { createdAt: 'desc' },
      include: {
        // We don't have a share-access model, so we show the share as-is
      },
    })

    // Count access logs for this document's shares
    const shareStats = shares.map(share => ({
      ...share,
      isExpired: share.expiresAt ? new Date(share.expiresAt) < new Date() : false,
      isExhausted: share.downloadLimit ? share.downloadCount >= share.downloadLimit : false,
      isAccessible: share.isActive && 
        (!share.expiresAt || new Date(share.expiresAt) > new Date()) &&
        (!share.downloadLimit || share.downloadCount < share.downloadLimit),
    }))

    return NextResponse.json({ shares: shareStats })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const shareSchema = z.object({
  shareType: z.enum(['LINK', 'INTERNAL']).default('LINK'),
  sharedWith: z.string().optional(), // userId for internal share
  password: z.string().min(4).optional(),
  expiresAt: z.string().optional(), // ISO date
  downloadLimit: z.number().int().positive().optional(),
  permissions: z.array(z.enum(['READ', 'DOWNLOAD', 'COMMENT', 'ANNOTATE'])).default(['READ']),
})

/**
 * POST /api/documents/[id]/shares
 * Create a new share for a document.
 * Enhanced with: internal sharing, granular permissions, validation.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    if (!hasPermission(role as any, 'documents', 'share')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const body = await request.json()
    const parsed = shareSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }

    const { shareType, sharedWith, password, expiresAt, downloadLimit, permissions } = parsed.data

    // For internal shares, validate the target user
    if (shareType === 'INTERNAL' && sharedWith) {
      const targetUser = await db.user.findFirst({
        where: { id: sharedWith, organizationId: orgId, isActive: true, isDeleted: false },
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'Utilisateur cible introuvable dans votre organisation' }, { status: 404 })
      }
    }

    // Generate share link
    const link = shareType === 'LINK' ? crypto.randomBytes(16).toString('hex') : null

    // Hash the password if provided
    const hashedPassword = password 
      ? crypto.createHash('sha256').update(password).digest('hex')
      : null

    const share = await db.documentShare.create({ 
      data: { 
        documentId: id, 
        sharedBy: userId, 
        sharedWith: sharedWith || null, 
        shareType, 
        link, 
        password: hashedPassword, 
        expiresAt: expiresAt ? new Date(expiresAt) : null, 
        downloadLimit, 
        permissions,
      } 
    })

    // Log share creation
    await db.auditLog.create({ 
      data: { 
        action: 'SHARE_CREATE', 
        entityType: 'Document', 
        entityId: id, 
        details: `Document partagé: ${doc.title}. Type: ${shareType}. Permissions: ${permissions.join(', ')}. Expiration: ${expiresAt || 'Aucune'}`, 
        organizationId: orgId, 
        userId, 
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      } 
    })

    // Build the share URL
    const shareUrl = link ? `${process.env.NEXTAUTH_URL}/share/${link}` : null

    return NextResponse.json({ 
      share,
      shareUrl,
      message: shareType === 'LINK' 
        ? `Lien de partage créé. URL: ${shareUrl}` 
        : `Document partagé en interne`,
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du partage'
    console.error('Share create error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/documents/[id]/shares
 * Revoke a share. Body: { shareId: string }
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    if (!hasPermission(role as any, 'documents', 'share')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    if (!body.shareId) return NextResponse.json({ error: 'shareId requis' }, { status: 400 })

    const share = await db.documentShare.findFirst({
      where: { id: body.shareId, documentId: id },
    })
    if (!share) return NextResponse.json({ error: 'Partage introuvable' }, { status: 404 })

    // Only the sharer or admin can revoke
    if (share.sharedBy !== userId && !['SUPER_ADMIN', 'ORG_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Seul le créateur du partage ou un admin peut le révoquer' }, { status: 403 })
    }

    await db.documentShare.update({
      where: { id: body.shareId },
      data: { isActive: false },
    })

    await db.auditLog.create({
      data: {
        action: 'SHARE_ACCESS',
        entityType: 'Document',
        entityId: id,
        details: `Partage révoqué: ${share.shareType} par ${userId}`,
        organizationId: orgId,
        userId,
        documentId: id,
      },
    })

    return NextResponse.json({ success: true, message: 'Partage révoqué' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Share revoke error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
