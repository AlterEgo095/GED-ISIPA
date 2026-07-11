import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const BACKUP_DIR = path.join(process.cwd(), 'backups')

async function ensureBackupDir() {
  try { await fs.mkdir(BACKUP_DIR, { recursive: true }) } catch {}
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  await ensureBackupDir()
  try {
    const files = await fs.readdir(BACKUP_DIR)
    const backups: { id: string; filename: string; size: string; createdAt: string; status: string; type: string }[] = []
    for (const file of files) {
      if (!file.endsWith('.sql') && !file.endsWith('.dump')) continue
      const stat = await fs.stat(path.join(BACKUP_DIR, file))
      backups.push({
        id: file,
        filename: file,
        size: (stat.size / 1048576).toFixed(2) + ' Mo',
        createdAt: stat.mtime.toISOString(),
        status: 'completed',
        type: file.includes('auto') ? 'Automatique' : 'Manuel',
      })
    }
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ backups })
  } catch {
    return NextResponse.json({ backups: [] })
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  await ensureBackupDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `backup-manual-${timestamp}.sql`
  const filepath = path.join(BACKUP_DIR, filename)

  try {
    const databaseUrl = process.env.DATABASE_URL || ''
    // Parse connection from DATABASE_URL
    const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
    if (!match) throw new Error('DATABASE_URL invalide')

    const [, user, pass, host, port, dbname] = match
    const env = { ...process.env, PGPASSWORD: pass }

    await execAsync(`pg_dump -h ${host} -p ${port} -U ${user} -d ${dbname} --no-owner --no-acl -f ${filepath}`, { env, timeout: 120000 })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Backup',
        entityId: filename,
        details: 'Sauvegarde manuelle cr\u00e9\u00e9e par ' + (token.email as string),
        organizationId: (token.organizationId as string) || '',
        userId: token.id as string,
      },
    })

    return NextResponse.json({ success: true, filename })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  try {
    const { filename } = await request.json()
    const filepath = path.join(BACKUP_DIR, filename)
    await fs.unlink(filepath)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }
}
