import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@prisma/client'

/**
 * PHASE 13: DOCUMENT SECURITY
 * GET /api/documents/[id]/security - Get security settings
 * POST /api/documents/[id]/security - Update security settings
 * 
 * Features:
 *  - Watermark configuration
 *  - Fine-grained permissions per user
 *  - Download prohibition
 *  - Read-only mode
 *  - Access expiration
 *  - Access log tracking
 *  - IP restrictions
 *  - Organization/Department restrictions
 */

const securitySchema = z.object({
  watermark: z.object({
    enabled: z.boolean().default(false),
    text: z.string().max(200).optional(),
    opacity: z.number().min(0).max(100).default(30),
    position: z.enum(['diagonal', 'horizontal', 'vertical']).default('diagonal'),
  }).optional(),
  downloadProhibited: z.boolean().default(false),
  readOnly: z.boolean().default(false),
  accessExpiration: z.string().optional(), // ISO date
  ipRestrictions: z.object({
    mode: z.enum(['ALLOWLIST', 'BLOCKLIST']).default('ALLOWLIST'),
    ips: z.array(z.string()).default([]),
  }).optional(),
  departmentRestrictions: z.array(z.string()).optional(), // department IDs
  finePermissions: z.array(z.object({
    userId: z.string(),
    permissions: z.array(z.enum(['READ', 'DOWNLOAD', 'EDIT', 'COMMENT', 'ANNOTATE', 'SHARE', 'DELETE'])),
  })).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Get security settings from metadata
    const metadata = typeof doc.metadata === 'object' && doc.metadata !== null 
      ? doc.metadata as Record<string, unknown> 
      : {}

    const securitySettings = metadata.__security as Record<string, unknown> || {
      watermark: { enabled: false },
      downloadProhibited: false,
      readOnly: false,
      accessExpiration: null,
      ipRestrictions: { mode: 'ALLOWLIST', ips: [] },
      departmentRestrictions: [],
      finePermissions: [],
    }

    // Get access log count for this document
    const accessCount = await db.accessLog.count({ where: { documentId: id } })
    const recentAccess = await db.accessLog.findMany({
      where: { documentId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Check if current user has edit permissions
    const currentPermissions = {
      canEdit: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(token.role as string) || doc.authorId === (token.id as string),
      canDownload: !(securitySettings.downloadProhibited as boolean) || ['SUPER_ADMIN', 'ORG_ADMIN'].includes(token.role as string),
      canShare: hasPermission(token.role as any, 'documents', 'share'),
    }

    return NextResponse.json({
      security: securitySettings,
      classification: doc.classification,
      accessStats: {
        totalAccess: accessCount,
        recentAccess,
      },
      currentUserPermissions: currentPermissions,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Security GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    // Only admins and the document author can modify security settings
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.json({ error: 'Seuls les administrateurs et gestionnaires peuvent modifier les paramètres de sécurité' }, { status: 403 })
    }

    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const body = await request.json()
    const parsed = securitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }

    // Store security settings in document metadata
    const existingMeta = typeof doc.metadata === 'object' && doc.metadata !== null 
      ? doc.metadata as Record<string, unknown> 
      : {}
    
    const updatedMeta = {
      ...existingMeta,
      __security: parsed.data,
    }

    await db.document.update({
      where: { id },
      data: { metadata: updatedMeta as any },
    })

    // If download prohibition changed, also update the document's classification note
    const changes: string[] = []
    if (parsed.data?.downloadProhibited) changes.push('Téléchargement interdit')
    if (parsed.data?.readOnly) changes.push('Lecture seule')
    if (parsed.data?.watermark?.enabled) changes.push(`Filigrane: "${parsed.data.watermark.text || 'CONFIDENTIEL'}"`)
    if (parsed.data?.accessExpiration) changes.push(`Accès expire le: ${parsed.data.accessExpiration}`)
    if (parsed.data?.ipRestrictions?.ips?.length) changes.push(`Restriction IP: ${parsed.data.ipRestrictions.ips.length} IP(s)`)
    if (parsed.data?.departmentRestrictions?.length) changes.push(`Restriction départements: ${parsed.data.departmentRestrictions.length}`)
    if (parsed.data?.finePermissions?.length) changes.push(`Permissions fines: ${parsed.data.finePermissions.length} utilisateur(s)`)

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Paramètres de sécurité modifiés: ${changes.join(', ')}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({
      security: parsed.data,
      message: 'Paramètres de sécurité mis à jour',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des paramètres de sécurité'
    console.error('Security POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
