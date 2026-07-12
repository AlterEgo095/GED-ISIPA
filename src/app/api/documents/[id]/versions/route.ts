import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { saveFile } from '@/lib/storage'
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const orgId = token.organizationId as string, { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    const versions = await db.documentVersion.findMany({ where: { documentId: id }, orderBy: { version: 'desc' } })
    return NextResponse.json({ versions })
  } catch (error: any) { console.error('Versions list error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const role = token.role as string, orgId = token.organizationId as string, userId = token.id as string
    if (!hasPermission(role as any, 'documents', 'update')) return NextResponse.json({ error: 'Permission refusee' }, { status: 403 })
    const { id } = await params
    const doc = await db.document.findFirst({ where: { id, organizationId: orgId, isDeleted: false } })
    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const changeLog = (formData.get('changeLog') as string) || ''
    const changeType = (formData.get('changeType') as string) || 'UPDATE'
    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    const saved = await saveFile(orgId, file, file.name)
    const newVersion = doc.version + 1
    await db.documentVersion.create({ data: { documentId: id, version: newVersion, filePath: saved.filePath, fileName: file.name, fileSize: saved.fileSize, fileHash: saved.fileHash, mimeType: saved.mimeType, changeType: changeType as any, changeLog: changeLog || `Version ${newVersion}`, createdBy: userId } })
    const updated = await db.document.update({ where: { id }, data: { version: newVersion, filePath: saved.filePath, fileName: file.name, fileSize: saved.fileSize, fileHash: saved.fileHash, mimeType: saved.mimeType }, include: { author: { select: { id: true, name: true, email: true } }, department: { select: { id: true, name: true } }, versions: { orderBy: { version: 'desc' } } } })
    await db.auditLog.create({ data: { action: 'VERSION_UPLOAD', entityType: 'Document', entityId: id, details: `Nouvelle version ${newVersion} uploadee: ${doc.title}`, organizationId: orgId, userId, documentId: id, ipAddress: request.headers.get('x-forwarded-for') || null, userAgent: request.headers.get('user-agent') || null } })
    return NextResponse.json({ document: updated, version: newVersion }, { status: 201 })
  } catch (error: any) { console.error('Version upload error:', error); return NextResponse.json({ error: error.message || 'Erreur' }, { status: 500 }) }
}
