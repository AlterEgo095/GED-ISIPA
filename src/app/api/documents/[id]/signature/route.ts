import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@prisma/client'

/**
 * PHASE 11: SIGNATURE ARCHITECTURE
 * 
 * This module provides the ARCHITECTURE for electronic signatures, visas, 
 * approvals, and timestamping. The actual integration with e-signature providers
 * (DocuSign, Adobe Sign, etc.) will be implemented in a future mission.
 * 
 * Current capabilities:
 *  - Signature request creation and tracking
 *  - Multi-signature workflows (sequential/parallel)
 *  - Approval/visa tracking
 *  - Timestamping architecture
 *  - Signature status management
 */

const signatureRequestSchema = z.object({
  type: z.enum(['ELECTRONIC_SIGNATURE', 'VISA', 'APPROVAL', 'TIMESTAMP']),
  signers: z.array(z.object({
    userId: z.string(),
    role: z.enum(['SIGNER', 'APPROVER', 'WITNESS', 'CC']),
    order: z.number().int().positive().optional(),
    requireSignature: z.boolean().default(true),
  })).min(1, 'Au moins un signataire est requis'),
  mode: z.enum(['SEQUENTIAL', 'PARALLEL']).default('SEQUENTIAL'),
  message: z.string().max(1000).optional(),
  deadline: z.string().optional(),
})

/**
 * POST /api/documents/[id]/signature
 * Create a signature request for a document.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as Role
    const orgId = token.organizationId as string
    const userId = token.id as string

    // Only managers and above can request signatures
    const allowedRoles: Role[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'DEAN', 'DOCTOR', 'LAWYER', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes pour demander une signature' }, { status: 403 })
    }

    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Document must be in a signable state
    if (!['APPROVED', 'PUBLISHED'].includes(doc.status)) {
      return NextResponse.json({ 
        error: 'Le document doit être approuvé ou publié pour pouvoir être signé' 
      }, { status: 400 })
    }

    const body = await request.json()
    const parsed = signatureRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }

    const { type, signers, mode, message, deadline } = parsed.data

    // Validate all signers exist in the organization
    for (const signer of signers) {
      const user = await db.user.findFirst({
        where: { id: signer.userId, organizationId: orgId, isActive: true, isDeleted: false },
      })
      if (!user) {
        return NextResponse.json({ error: `Signataire ${signer.userId} introuvable dans votre organisation` }, { status: 404 })
      }
    }

    // Store signature request as metadata on the document
    // (In a full implementation, this would use a dedicated SignatureRequest model)
    const signatureRequestId = `sig-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
    
    const signatureData = {
      id: signatureRequestId,
      documentId: id,
      type,
      mode,
      status: 'PENDING',
      message: message || null,
      deadline: deadline || null,
      requestedBy: userId,
      requestedAt: new Date().toISOString(),
      signers: signers.map(s => ({
        ...s,
        status: 'PENDING',
        signedAt: null,
        signatureHash: null,
        ipAddress: null,
      })),
      completionPercentage: 0,
    }

    // Store in document metadata
    const existingMeta = typeof doc.metadata === 'object' && doc.metadata !== null 
      ? doc.metadata as Record<string, unknown> 
      : {}
    const signatureRequests = Array.isArray(existingMeta.__signatureRequests) 
      ? existingMeta.__signatureRequests 
      : []
    signatureRequests.push(signatureData)

    await db.document.update({
      where: { id },
      data: { metadata: { ...existingMeta, __signatureRequests: signatureRequests } as any },
    })

    // Create notifications for all signers
    for (const signer of signers) {
      if (signer.userId !== userId) {
        await db.notification.create({
          data: {
            userId: signer.userId,
            title: `Demande de ${type === 'ELECTRONIC_SIGNATURE' ? 'signature' : type === 'VISA' ? 'visa' : type === 'APPROVAL' ? 'approbation' : 'horodatage'}`,
            message: `Vous êtes invité(e) à ${type === 'ELECTRONIC_SIGNATURE' ? 'signer' : type === 'VISA' ? 'viser' : 'approuver'} le document "${doc.title}"`,
            type: 'signature',
            link: `/documents/${id}`,
          },
        })
      }
    }

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Demande de ${type} créée pour "${doc.title}". Mode: ${mode}. Signataires: ${signers.length}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({
      signatureRequest: signatureData,
      message: `Demande de ${type} créée avec ${signers.length} signataire(s)`,
      architecture: {
        note: 'Architecture en place. L\'intégration avec les fournisseurs de signature électronique (DocuSign, Adobe Sign, etc.) sera implémentée dans une mission future.',
        supportedTypes: ['ELECTRONIC_SIGNATURE', 'VISA', 'APPROVAL', 'TIMESTAMP'],
        modes: ['SEQUENTIAL', 'PARALLEL'],
        futureIntegration: ['DocuSign', 'Adobe Sign', 'HelloSign', 'Yousign'],
      },
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de la demande de signature'
    console.error('Signature request error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/documents/[id]/signature
 * Get signature status for a document.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const metadata = typeof doc.metadata === 'object' && doc.metadata !== null 
      ? doc.metadata as Record<string, unknown> 
      : {}
    const signatureRequests = Array.isArray(metadata.__signatureRequests) 
      ? metadata.__signatureRequests 
      : []

    return NextResponse.json({
      signatureRequests,
      totalRequests: signatureRequests.length,
      pendingRequests: signatureRequests.filter((r: any) => r.status === 'PENDING').length,
      completedRequests: signatureRequests.filter((r: any) => r.status === 'COMPLETED').length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Signature GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
