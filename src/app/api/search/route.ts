import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgId = token.organizationId as string
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const [documents, users, departments] = await Promise.all([
    db.document.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: q } },
          { reference: { contains: q } },
          { description: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      take: 10,
      include: {
        author: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
    db.user.findMany({
      where: {
        organizationId: orgId,
        OR: [{ name: { contains: q } }, { email: { contains: q } }],
      },
      take: 5,
      select: { id: true, name: true, email: true, role: true },
    }),
    db.department.findMany({
      where: {
        organizationId: orgId,
        OR: [{ name: { contains: q } }, { code: { contains: q } }],
      },
      take: 5,
    }),
  ])

  return NextResponse.json({
    results: {
      documents,
      users,
      departments,
    },
  })
}
