import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  if (token.role !== 'SUPER_ADMIN' && token.organizationId !== id) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const departments = await db.department.findMany({
    where: { organizationId: id, isDeleted: false },
    include: { _count: { select: { users: true, documents: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ departments })
}
