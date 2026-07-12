import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * GET /api/documents/recent
 * List recently accessed/modified documents for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const orgId = token.organizationId as string
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10')

    // Get recently modified documents in the organization
    const recentDocs = await db.document.findMany({
      where: { organizationId: orgId, isDeleted: false, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ documents: recentDocs })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur'
    console.error('Recent docs error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
