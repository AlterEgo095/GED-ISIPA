import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AEIP Enterprise Platform',
    version: '2.0.0',
  })
}
