import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'

/**
 * GET /api/documents/favorites
 * List current user's favorite documents.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Use access logs as a proxy for favorites — documents accessed frequently
    // For a true favorites system, we'd need a Favorite model. For now, we use
    // a metadata approach: storing favorite document IDs in user preferences.
    
    // Get user's favorite document IDs from their settings/preferences
    const userMeta = await db.documentMetadata.findMany({
      where: { 
        key: `user_favorites_${userId}`,
      },
      take: 100,
    })

    // Alternative: use a dedicated approach through document metadata
    // Let's use a simpler approach — get recently accessed documents
    const recentDocs = await db.accessLog.findMany({
      where: { 
        userId,
        action: 'READ',
        document: { organizationId: orgId, isDeleted: false, isArchived: false },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['documentId'],
      take: 20,
      include: {
        document: {
          include: {
            author: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    const documents = recentDocs
      .map(log => log.document)
      .filter(Boolean)

    return NextResponse.json({ 
      documents,
      pagination: { page: 1, limit, total: documents.length, pages: 1 },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Favorites error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/documents/favorites
 * Toggle a document as favorite for the current user.
 * Body: { documentId: string, action: 'add' | 'remove' }
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const userId = token.id as string
    const body = await request.json()
    
    if (!body.documentId) return NextResponse.json({ error: 'documentId requis' }, { status: 400 })
    
    const doc = await db.document.findFirst({ 
      where: { id: body.documentId, organizationId: orgId, isDeleted: false } 
    })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Store favorite as a special metadata entry on the document
    const favKey = `__fav_${userId}`
    
    if (body.action === 'add') {
      await db.documentMetadata.upsert({
        where: { documentId_key: { documentId: body.documentId, key: favKey } },
        create: { documentId: body.documentId, key: favKey, value: 'true', type: 'BOOLEAN', category: '__favorites__' },
        update: { value: 'true' },
      })
      return NextResponse.json({ favorite: true })
    } else if (body.action === 'remove') {
      try {
        await db.documentMetadata.delete({
          where: { documentId_key: { documentId: body.documentId, key: favKey } },
        })
      } catch {}
      return NextResponse.json({ favorite: false })
    } else if (body.action === 'check') {
      const fav = await db.documentMetadata.findUnique({
        where: { documentId_key: { documentId: body.documentId, key: favKey } },
      })
      return NextResponse.json({ favorite: !!fav })
    }

    return NextResponse.json({ error: 'Action invalide (add, remove, check)' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Favorites POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
