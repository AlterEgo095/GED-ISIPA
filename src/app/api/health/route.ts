import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}
  let overallStatus = 'ok'

  // Check database connectivity
  try {
    await db.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    overallStatus = 'error'
  }

  // Storage check: for PostgreSQL, DB connectivity implies storage OK
  // For SQLite, check if the DB file directory is writable
  try {
    const dbUrl = process.env.DATABASE_URL || ''
    if (dbUrl.startsWith('file:')) {
      const fs = await import('fs/promises')
      const path = await import('path')
      const dbPath = dbUrl.replace('file:', '')
      if (dbPath) {
        await fs.access(path.dirname(dbPath), fs.constants.W_OK)
      }
      checks.storage = 'ok'
    } else {
      // PostgreSQL or other server-based DB: storage is managed by the DB server
      checks.storage = 'ok'
    }
  } catch {
    checks.storage = 'error'
    overallStatus = 'error'
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  })
}
