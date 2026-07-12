import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'

/**
 * GET /api/documents/[id]/versions/compare?v1=X&v2=Y
 * Compare two versions of a document.
 * Returns metadata comparison: size, hash, dates, author, changeType, changeLog.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const v1 = parseInt(searchParams.get('v1') || '0')
    const v2 = parseInt(searchParams.get('v2') || '0')

    if (!v1 || !v2) {
      return NextResponse.json({ error: 'Paramètres v1 et v2 requis (numéros de version)' }, { status: 400 })
    }

    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const [version1, version2] = await Promise.all([
      db.documentVersion.findFirst({ where: { documentId: id, version: v1 } }),
      db.documentVersion.findFirst({ where: { documentId: id, version: v2 } }),
    ])

    if (!version1) return NextResponse.json({ error: `Version ${v1} introuvable` }, { status: 404 })
    if (!version2) return NextResponse.json({ error: `Version ${v2} introuvable` }, { status: 404 })

    // Get user names for createdBy
    const [user1, user2] = await Promise.all([
      db.user.findUnique({ where: { id: version1.createdBy }, select: { id: true, name: true, email: true } }),
      db.user.findUnique({ where: { id: version2.createdBy }, select: { id: true, name: true, email: true } }),
    ])

    // Build comparison
    const comparison = {
      version1: {
        ...version1,
        createdByUser: user1,
      },
      version2: {
        ...version2,
        createdByUser: user2,
      },
      diff: {
        fileSize: {
          v1: version1.fileSize,
          v2: version2.fileSize,
          change: version2.fileSize - version1.fileSize,
          changePercent: version1.fileSize > 0 
            ? ((version2.fileSize - version1.fileSize) / version1.fileSize * 100).toFixed(1) 
            : 'N/A',
        },
        fileHash: {
          v1: version1.fileHash,
          v2: version2.fileHash,
          changed: version1.fileHash !== version2.fileHash,
        },
        mimeType: {
          v1: version1.mimeType,
          v2: version2.mimeType,
          changed: version1.mimeType !== version2.mimeType,
        },
        fileName: {
          v1: version1.fileName,
          v2: version2.fileName,
          changed: version1.fileName !== version2.fileName,
        },
        timeDifference: {
          ms: new Date(version2.createdAt).getTime() - new Date(version1.createdAt).getTime(),
          days: Math.floor((new Date(version2.createdAt).getTime() - new Date(version1.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        },
        contentChanged: version1.fileHash !== version2.fileHash,
      },
      versionsBetween: Math.abs(v2 - v1) - 1,
    }

    // Get intermediate versions if any
    const minV = Math.min(v1, v2)
    const maxV = Math.max(v1, v2)
    const intermediateVersions = maxV - minV > 1 
      ? await db.documentVersion.findMany({
          where: { documentId: id, version: { gt: minV, lt: maxV } },
          orderBy: { version: 'asc' },
          select: { version: true, changeType: true, changeLog: true, createdAt: true, createdBy: true },
        })
      : []

    return NextResponse.json({
      ...comparison,
      intermediateVersions,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la comparaison'
    console.error('Version compare error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
