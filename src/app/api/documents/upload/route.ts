import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { createDocumentSchema } from '@/lib/validation'
import { saveFile } from '@/lib/storage'
import type { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  // Authenticate user
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const role = token.role as Role
  if (!hasPermission(role, 'documents', 'create')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  const orgId = token.organizationId as string
  const userId = token.id as string

  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Extract text fields from form data
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const classification = formData.get('classification') as string
    const departmentId = formData.get('departmentId') as string
    const tags = formData.get('tags') as string

    // Validate fields using the existing Zod schema
    const validation = createDocumentSchema.safeParse({
      title,
      description: description || undefined,
      type,
      classification: classification || undefined,
      departmentId,
      tags: tags || undefined,
    })

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      const message = firstError?.message || 'Données invalides'
      return NextResponse.json(
        { error: message, details: validation.error.issues },
        { status: 400 },
      )
    }

    const validatedData = validation.data

    // Save file to disk using storage utility
    const fileResult = await saveFile(orgId, file, file.name)

    // Generate unique document reference
    const reference = `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create document record in Prisma with REAL file metadata
    const document = await db.document.create({
      data: {
        title: validatedData.title,
        reference,
        description: validatedData.description || null,
        type: validatedData.type,
        classification: validatedData.classification || 'INTERNAL',
        status: 'DRAFT',
        filePath: fileResult.filePath,
        fileName: file.name,
        fileSize: fileResult.fileSize,
        mimeType: fileResult.mimeType,
        fileHash: fileResult.fileHash,
        version: 1,
        tags: validatedData.tags || '',
        metadata: Prisma.JsonNull,
        organizationId: orgId,
        authorId: userId,
        departmentId: validatedData.departmentId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        workflowState: { select: { id: true, name: true, color: true } },
      },
    })

    // Create audit log entry for document creation
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        details: `Document "${validatedData.title}" importé (${fileResult.fileSize} octets, ${fileResult.mimeType})`,
        organizationId: orgId,
        userId,
        documentId: document.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'importation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
