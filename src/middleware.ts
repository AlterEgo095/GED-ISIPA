import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { corsHeaders, corsResponse } from '@/lib/cors'

// Rate limiting store with periodic cleanup to prevent memory leaks
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Clean every 5 minutes
const ENTRY_MAX_AGE = 60 * 60 * 1000 // Remove entries older than 1 hour
let lastCleanup = Date.now()

function cleanupRateLimitMap() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.lastReset > ENTRY_MAX_AGE) {
      rateLimitMap.delete(key)
    }
  }
}

function checkRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  cleanupRateLimitMap()
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now - entry.lastReset > windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

const protectedRoutes = ['/api-keys', '/webhooks', '/integrations', '/dashboard', '/documents', '/archives', '/audit', '/administration', '/modules', '/workflows', '/notifications', '/settings', '/admin', '/trash']
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return corsResponse(request)
  }

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const cHeaders = corsHeaders(request)
    for (const [key, value] of Object.entries(cHeaders)) {
      response.headers.set(key, value)
    }
  }

  // Rate limiting for auth endpoints
  if (pathname.startsWith('/api/auth')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`auth:${ip}`, 100, 60000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 })
    }
  }

  // Rate limiting for API
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`api:${ip}`, 300, 60000)) {
      return NextResponse.json({ error: 'Limite de requêtes dépassée.' }, { status: 429 })
    }
  }

  // Health check - allow through
  if (pathname === '/api/health') {
    return response
  }

  // Get token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Redirect authenticated users away from auth pages
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    const orgType = token.organizationType as string
    const role = token.role as string
    if (role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    const dashboardRoutes: Record<string, string> = {
      UNIVERSITY: '/dashboard/university',
      HOSPITAL: '/dashboard/hospital',
      COMPANY: '/dashboard/company',
      GOVERNMENT: '/dashboard/government',
      SME: '/dashboard/sme',
      LAW_FIRM: '/dashboard/law-firm',
    }
    const redirectPath = dashboardRoutes[orgType] || '/dashboard'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Check protected routes
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based protection for super admin routes
  if (token && pathname.startsWith('/admin/') && (token.role as string) !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect SUPER_ADMIN away from organization dashboard to admin panel
  if (token && (token.role as string) === 'SUPER_ADMIN' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // API route protection
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && pathname !== '/api/health' && pathname !== '/api/push/vapid') {
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/documents/:path*',
    '/archives/:path*',
    '/audit/:path*',
    '/administration/:path*',
    '/modules/:path*',
    '/workflows/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/trash/:path*',
    '/login',
    '/register',
    '/api/:path*',
  ],
}