import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { createDocumentSchema, validateBody } from '@/lib/validation'
import type { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''
  const classification = searchParams.get('classification') || ''
  const departmentId = searchParams.get('departmentId') || ''

  const isArchived = searchParams.get('isArchived')
  const where: Record<string, unknown> = { organizationId: orgId }
  if (isArchived === 'true') {
    where.isArchived = true
    where.isDeleted = false
  } else if (isArchived === 'all') {
    // no isArchived filter
  } else {
    where.isArchived = false
    where.isDeleted = false
  }
  if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  if (status) where.status = status
  if (type) where.type = type
  if (classification) where.classification = classification
  if (departmentId) where.departmentId = departmentId

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        workflowState: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.document.count({ where }),
  ])

  return NextResponse.json({
    documents,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = token.role as Role
  if (!hasPermission(role, 'documents', 'create')) {
    return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validation = validateBody(createDocumentSchema, body)
    if (validation.error) return validation.error

    const { title, description, type, classification, departmentId, tags, metadata } = validation.data

    const orgId = token.organizationId as string
    const userId = token.id as string

    // Generate unique reference
    const reference = `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const document = await db.document.create({
      data: {
        title,
        reference,
        description: description || null,
        type,
        classification: classification || 'INTERNAL',
        status: 'DRAFT',
        filePath: `/uploads/${reference}`,
        fileName: title,
        fileSize: 0,
        mimeType: 'application/octet-stream',
        fileHash: '',
        version: 1,
        tags: tags || '',
        metadata: metadata ? JSON.stringify(metadata) : null,
        organizationId: orgId,
        authorId: userId,
        departmentId,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        details: `Document "${title}" créé`,
        organizationId: orgId,
        userId,
        documentId: document.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
