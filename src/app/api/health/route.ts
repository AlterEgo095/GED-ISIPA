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

  // Check if data directory is writable (for SQLite)
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || ''
    if (dbPath) {
      await fs.access(path.dirname(dbPath), fs.constants.W_OK)
      checks.storage = 'ok'
    } else {
      checks.storage = 'ok' // No file-based storage to check
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
