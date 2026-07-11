import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acc\u00e8s non autoris\u00e9' }, { status: 403 })
  }

  try {
    const { filename } = await request.json()
    const filepath = path.join(process.cwd(), 'backups', filename)

    const databaseUrl = process.env.DATABASE_URL || ''
    const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
    if (!match) throw new Error('DATABASE_URL invalide')

    const [, user, pass, host, port, dbname] = match
    const env = { ...process.env, PGPASSWORD: pass }

    await execAsync(`psql -h ${host} -p ${port} -U ${user} -d ${dbname} -f ${filepath}`, { env, timeout: 300000 })

    await db.auditLog.create({
      data: {
        action: 'RESTORE',
        entityType: 'Backup',
        entityId: filename,
        details: 'Restauration par ' + (token.email as string),
        organizationId: (token.organizationId as string) || '',
        userId: token.id as string,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Erreur lors de la restauration' }, { status: 500 })
  }
}
