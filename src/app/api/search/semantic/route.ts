import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { semanticSearch } from '@/lib/ai/qdrant'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const threshold = parseFloat(searchParams.get('threshold') || '0.3')

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Requête trop courte (min 2 caractères)' }, { status: 400 })
  }

  try {
    const results = await semanticSearch({
      query: q,
      organizationId: orgId,
      limit,
      scoreThreshold: threshold,
    })

    // Enrich with document details
    const enriched = await Promise.all(
      results.map(async (r) => {
        const doc = await db.document.findFirst({
          where: { id: r.documentId, organizationId: orgId, isDeleted: false },
          select: {
            id: true, title: true, reference: true, type: true, status: true,
            classification: true, createdAt: true, author: { select: { name: true } },
            department: { select: { name: true } },
          },
        })
        return { ...r, document: doc }
      })
    )

    const filtered = enriched.filter((r) => r.document !== null)

    return NextResponse.json({
      query: q,
      results: filtered,
      total: filtered.length,
    })
  } catch (error: any) {
    console.error('Semantic search error:', error)
    return NextResponse.json({ error: error.message || 'Erreur de recherche' }, { status: 500 })
  }
}
