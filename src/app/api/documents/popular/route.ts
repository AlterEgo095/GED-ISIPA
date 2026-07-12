import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * GET /api/documents/popular
 * List most viewed/downloaded documents in the organization.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10')
    const period = new URL(request.url).searchParams.get('period') || 'all' // all, month, week

    const where: Record<string, unknown> = { 
      organizationId: orgId, 
      isDeleted: false, 
      isArchived: false,
    }

    if (period === 'week') {
      where.updatedAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    } else if (period === 'month') {
      where.updatedAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }

    const popularDocs = await db.document.findMany({
      where,
      orderBy: [
        { viewCount: 'desc' },
        { downloadCount: 'desc' },
      ],
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ documents: popularDocs })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Popular docs error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
