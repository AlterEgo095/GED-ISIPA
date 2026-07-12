import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const orgId = token.organizationId as string

  const doc = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  const versions = await db.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { version: 'desc' },
  })

  return NextResponse.json(versions)
}
