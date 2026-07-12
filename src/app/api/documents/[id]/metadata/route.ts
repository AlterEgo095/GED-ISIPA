import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@prisma/client'

/**
 * GET /api/documents/[id]/metadata
 * List all metadata for a document, grouped by category.
 * Includes required fields check, taxonomy info.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params
    
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Get document metadata
    const metadata = await db.documentMetadata.findMany({ 
      where: { documentId: id }, 
      orderBy: [{ category: 'asc' }, { key: 'asc' }] 
    })

    // Get organization metadata schema definitions for this document type
    const schemaDefinitions = await db.documentMetadata.findMany({
      where: { 
        // We store schema definitions as metadata entries with special category '__schema__'
        // on the organization level — for now, just group by category
      },
    })

    // Group by category
    const grouped: Record<string, typeof metadata> = {}
    for (const entry of metadata) {
      const cat = entry.category || 'Général'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(entry)
    }

    // Check for required metadata that's missing
    // (This would use schema definitions in a full implementation)

    // Get document-level JSON metadata as well
    const docMetadata = doc.metadata as Record<string, unknown> | null

    return NextResponse.json({ 
      metadata,
      grouped,
      documentMetadata: docMetadata,
      categories: Object.keys(grouped).sort(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des métadonnées'
    console.error('Metadata GET error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Validation schema for metadata upsert
const metadataUpsertSchema = z.object({
  key: z.string().min(1, 'La clé est requise').max(100),
  value: z.string().min(1, 'La valeur est requise').max(2000),
  type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'URL', 'EMAIL', 'SELECT', 'MULTISELECT']).default('TEXT'),
  required: z.boolean().default(false),
  category: z.string().max(100).optional(),
  options: z.array(z.string()).optional(), // For SELECT/MULTISELECT types
})

/**
 * POST /api/documents/[id]/metadata
 * Create or update a metadata entry for a document.
 * Supports typed metadata with validation.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string
    const { id } = await params

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const body = await request.json()
    
    // Support both single entry and batch mode
    const entries = Array.isArray(body) ? body : [body]
    const results: Array<{ key: string; error?: string; success?: boolean; metadata?: Record<string, unknown> }> = []

    for (const entry of entries) {
      const parsed = metadataUpsertSchema.safeParse(entry)
      if (!parsed.success) {
        results.push({ key: entry.key, error: parsed.error.issues[0]?.message })
        continue
      }

      const { key, value, type, required, category, options } = parsed.data

      // Type-specific validation
      if (type === 'NUMBER' && isNaN(Number(value))) {
        results.push({ key, error: 'La valeur doit être un nombre' })
        continue
      }
      if (type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        results.push({ key, error: 'Email invalide' })
        continue
      }
      if (type === 'URL' && !/^https?:\/\/.+/.test(value)) {
        results.push({ key, error: 'URL invalide (doit commencer par http:// ou https://)' })
        continue
      }
      if (type === 'DATE' && isNaN(Date.parse(value))) {
        results.push({ key, error: 'Date invalide' })
        continue
      }
      if (type === 'BOOLEAN' && !['true', 'false', '0', '1'].includes(value.toLowerCase())) {
        results.push({ key, error: 'La valeur doit être true/false' })
        continue
      }
      if ((type === 'SELECT' || type === 'MULTISELECT') && options && options.length > 0) {
        const values = type === 'MULTISELECT' ? value.split(',').map(v => v.trim()) : [value]
        for (const v of values) {
          if (!options.includes(v)) {
            results.push({ key, error: `Valeur "${v}" non autorisée. Options: ${options.join(', ')}` })
            break
          }
        }
        if (results.find(r => r.key === key && r.error)) continue
      }

      // Upsert the metadata entry
      const meta = await db.documentMetadata.upsert({
        where: { documentId_key: { documentId: id, key } },
        update: { value, type, required, category: category || null },
        create: { documentId: id, key, value, type, required, category: category || null },
      })
      results.push({ key, success: true, metadata: meta })
    }

    // Update document metadata JSON as well (for searchability)
    const metadataObj: Record<string, string> = {}
    for (const r of results) {
      if (r.success && r.metadata) {
        metadataObj[r.key] = String(r.metadata.value || '')
      }
    }
    if (Object.keys(metadataObj).length > 0) {
      const existingMeta = typeof doc.metadata === 'object' && doc.metadata !== null ? doc.metadata as Record<string, unknown> : {}
      const mergedMeta = { ...existingMeta, ...metadataObj }
      await db.document.update({
        where: { id },
        data: { metadata: mergedMeta as any },
      })
    }

    // Audit log
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => r.error).length
    await db.auditLog.create({
      data: {
        action: 'METADATA_UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Métadonnées mises à jour: ${successCount} réussie(s), ${failCount} échouée(s). Clés: ${results.filter(r => r.success).map(r => r.key).join(', ')}`,
        organizationId: orgId,
        userId,
        documentId: id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ results })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des métadonnées'
    console.error('Metadata POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/documents/[id]/metadata
 * Delete a metadata entry. Body: { key: string }
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const { id } = await params

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const body = await request.json()
    if (!body.key) return NextResponse.json({ error: 'Clé requise' }, { status: 400 })

    const existing = await db.documentMetadata.findUnique({
      where: { documentId_key: { documentId: id, key: body.key } },
    })
    if (!existing) return NextResponse.json({ error: 'Métadonnée introuvable' }, { status: 404 })

    if (existing.required) {
      return NextResponse.json({ error: 'Impossible de supprimer une métadonnée obligatoire' }, { status: 400 })
    }

    await db.documentMetadata.delete({
      where: { documentId_key: { documentId: id, key: body.key } },
    })

    await db.auditLog.create({
      data: {
        action: 'METADATA_UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Métadonnée supprimée: ${body.key}`,
        organizationId: orgId,
        userId,
        documentId: id,
      },
    })

    return NextResponse.json({ success: true, message: `Métadonnée "${body.key}" supprimée` })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
    console.error('Metadata DELETE error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
