import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { saveFile } from '@/lib/storage'
import { validateTransition } from '@/lib/document-lifecycle'
import type { Role } from '@prisma/client'

/**
 * GET /api/documents/[id]/versions
 * List all versions of a document with enhanced metadata.
 * Query params: ?includeCurrent=true&sort=asc|desc
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'desc'
    const versionNum = searchParams.get('version') // Get specific version

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    if (versionNum) {
      // Get specific version
      const version = await db.documentVersion.findFirst({
        where: { documentId: id, version: parseInt(versionNum) },
      })
      if (!version) return NextResponse.json({ error: 'Version introuvable' }, { status: 404 })
      
      // Get previous and next versions for navigation
      const prevVersion = await db.documentVersion.findFirst({
        where: { documentId: id, version: { lt: parseInt(versionNum) } },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      const nextVersion = await db.documentVersion.findFirst({
        where: { documentId: id, version: { gt: parseInt(versionNum) } },
        orderBy: { version: 'asc' },
        select: { version: true },
      })

      return NextResponse.json({ 
        version,
        navigation: {
          previous: prevVersion?.version || null,
          next: nextVersion?.version || null,
          current: doc.version,
        },
      })
    }

    // List all versions
    const versions = await db.documentVersion.findMany({ 
      where: { documentId: id }, 
      orderBy: { version: sort === 'asc' ? 'asc' : 'desc' },
    })

    // Calculate diffs between consecutive versions
    const versionsWithDiff = versions.map((v, idx) => {
      const prevIdx = sort === 'asc' ? idx - 1 : idx + 1
      const prev = versions[prevIdx]
      return {
        ...v,
        diff: prev ? {
          sizeChange: v.fileSize - prev.fileSize,
          hashChanged: v.fileHash !== prev.fileHash,
          mimeTypeChanged: v.mimeType !== prev.mimeType,
        } : null,
      }
    })

    return NextResponse.json({ 
      versions: versionsWithDiff,
      currentVersion: doc.version,
      totalVersions: versions.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des versions'
    console.error('Versions list error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/documents/[id]/versions
 * Upload a new version of a document.
 * Enhanced with: previousVersionId, changeType validation, lifecycle check.
 * Body (FormData): file, changeLog, changeType (UPDATE|MINOR_EDIT|MAJOR_REVISION)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const role = token.role as string
    const orgId = token.organizationId as string
    const userId = token.id as string

    if (!hasPermission(role as any, 'documents', 'update')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Only allow version upload when document is in an editable state
    const editableStatuses = ['DRAFT', 'PENDING_REVISION', 'REJECTED']
    if (!editableStatuses.includes(doc.status) && !['SUPER_ADMIN', 'ORG_ADMIN'].includes(role)) {
      return NextResponse.json({ 
        error: `Impossible d'ajouter une version: le document est en statut "${doc.status}". Seuls les brouillons ou documents en révision peuvent être modifiés.` 
      }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const changeLog = (formData.get('changeLog') as string) || ''
    const changeType = (formData.get('changeType') as string) || 'UPDATE'
    
    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

    // Validate changeType
    const validChangeTypes = ['CREATE', 'UPDATE', 'MINOR_EDIT', 'MAJOR_REVISION', 'RESTORE']
    if (!validChangeTypes.includes(changeType)) {
      return NextResponse.json({ error: `Type de changement invalide: ${changeType}` }, { status: 400 })
    }

    // Save the new file
    const saved = await saveFile(orgId, file, file.name)
    const newVersion = doc.version + 1

    // Find previous version for linking
    const previousVersion = await db.documentVersion.findFirst({
      where: { documentId: id, version: doc.version },
      select: { id: true },
    })

    // Create version record with previousVersionId
    await db.documentVersion.create({ 
      data: { 
        documentId: id, 
        version: newVersion, 
        filePath: saved.filePath, 
        fileName: file.name, 
        fileSize: saved.fileSize, 
        fileHash: saved.fileHash, 
        mimeType: saved.mimeType, 
        changeType: changeType as any, 
        changeLog: changeLog || `Version ${newVersion}`, 
        createdBy: userId,
        previousVersionId: previousVersion?.id || null,
      } 
    })

    // Update the main document with new file info
    const updated = await db.document.update({ 
      where: { id }, 
      data: { 
        version: newVersion, 
        filePath: saved.filePath, 
        fileName: file.name, 
        fileSize: saved.fileSize, 
        fileHash: saved.fileHash, 
        mimeType: saved.mimeType,
      }, 
      include: { 
        author: { select: { id: true, name: true, email: true } }, 
        department: { select: { id: true, name: true } }, 
        versions: { orderBy: { version: 'desc' } } 
      } 
    })

    await db.auditLog.create({ 
      data: { 
        action: 'VERSION_UPLOAD', 
        entityType: 'Document', 
        entityId: id, 
        details: `Nouvelle version ${newVersion} (${changeType}) uploadée: ${doc.title}. Fichier: ${file.name} (${saved.fileSize} octets). Hash: ${saved.fileHash.substring(0, 16)}...`, 
        organizationId: orgId, 
        userId, 
        documentId: id, 
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      } 
    })

    return NextResponse.json({ document: updated, version: newVersion }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'upload de version'
    console.error('Version upload error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
