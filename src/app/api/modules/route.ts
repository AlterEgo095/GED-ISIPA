import { NextResponse } from 'next/server'
import { AVAILABLE_MODULES, getModulesForOrgType } from '@/lib/module-engine'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const orgType = token.organizationType as string

  // Return all available modules with org-type filtering
  const orgModules = getModulesForOrgType(orgType as never)

  return NextResponse.json({
    allModules: AVAILABLE_MODULES,
    orgModules,
    orgType,
  })
}
