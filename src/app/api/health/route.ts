import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}
  let overallStatus = 'ok'

  // Check database connectivity (PostgreSQL)
  try {
    await db.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    overallStatus = 'error'
  }

  // Check if uploads directory is writable
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const uploadsDir = path.join(process.cwd(), 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    await fs.access(uploadsDir, fs.constants.W_OK)
    checks.storage = 'ok'
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
