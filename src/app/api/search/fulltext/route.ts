import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * Full-text search using PostgreSQL pg_trgm (trigram similarity).
 * Faster and more relevant than LIKE for large document sets.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const page = parseInt(searchParams.get('page') || '1')

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Requête trop courte (min 2 caractères)' }, { status: 400 })
  }

  try {
    // Use raw SQL for trigram similarity search (Prisma doesn't support pg_trgm directly)
    const documents = await db.$queryRaw`
      SELECT
        d.id, d.title, d.reference, d.type, d.status, d.classification,
        d."createdAt", d.description, d.tags,
        SIMILARITY(d.title, ${q}) AS title_score,
        SIMILARITY(COALESCE(d.description, ''), ${q}) AS desc_score,
        GREATEST(SIMILARITY(d.title, ${q}), SIMILARITY(COALESCE(d.description, ''), ${q})) AS relevance
      FROM "Document" d
      WHERE d."organizationId" = ${orgId}
        AND d."isDeleted" = false
        AND d."isArchived" = false
        AND (
          d.title % ${q}
          OR COALESCE(d.description, '') % ${q}
          OR d.title ILIKE ${'%' + q + '%'}
        )
      ORDER BY relevance DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `

    const totalResult = await db.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Document" d
      WHERE d."organizationId" = ${orgId}
        AND d."isDeleted" = false
        AND d."isArchived" = false
        AND (
          d.title % ${q}
          OR COALESCE(d.description, '') % ${q}
          OR d.title ILIKE ${'%' + q + '%'}
        )
    `

    const total = (totalResult as any)[0]?.count || 0

    // Enrich with author/department
    const enriched = await Promise.all(
      (documents as any[]).map(async (doc) => {
        const fullDoc = await db.document.findUnique({
          where: { id: doc.id },
          select: {
            author: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        })
        return { ...doc, ...fullDoc }
      })
    )

    return NextResponse.json({
      query: q,
      results: enriched,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Full-text search error:', error)
    return NextResponse.json({ error: error.message || 'Erreur de recherche' }, { status: 500 })
  }
}
