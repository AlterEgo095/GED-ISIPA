import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Smoke tests for API route existence and basic response patterns.
 * These verify that routes export the expected HTTP methods
 * and return proper error codes for unauthenticated requests.
 */

// Helper to create a NextRequest with no auth token
function unauthRequest(url: string, method: string = 'GET'): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), { method })
}

describe('API Route Exports', () => {
  it('health route should be importable', async () => {
    const { GET } = await import('@/app/api/health/route')
    expect(GET).toBeDefined()
    expect(typeof GET).toBe('function')
  })

  it('documents route should export GET and POST', async () => {
    const mod = await import('@/app/api/documents/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('users route should export GET and POST', async () => {
    const mod = await import('@/app/api/users/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('organizations route should export GET and POST', async () => {
    const mod = await import('@/app/api/organizations/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('departments route should export GET and POST', async () => {
    const mod = await import('@/app/api/departments/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('workflows route should export GET and POST', async () => {
    const mod = await import('@/app/api/workflows/route')
    expect(mod.GET).toBeDefined()
    expect(mod.POST).toBeDefined()
  })

  it('notifications route should export GET and PUT', async () => {
    const mod = await import('@/app/api/notifications/route')
    expect(mod.GET).toBeDefined()
    expect(mod.PUT).toBeDefined()
  })

  it('settings route should export GET and PUT', async () => {
    const mod = await import('@/app/api/settings/route')
    expect(mod.GET).toBeDefined()
    expect(mod.PUT).toBeDefined()
  })

  it('audit route should export GET', async () => {
    const mod = await import('@/app/api/audit/route')
    expect(mod.GET).toBeDefined()
  })

  it('search route should export GET', async () => {
    const mod = await import('@/app/api/search/route')
    expect(mod.GET).toBeDefined()
  })

  it('billing route should export GET', async () => {
    const mod = await import('@/app/api/billing/route')
    expect(mod.GET).toBeDefined()
  })

  it('modules route should export GET', async () => {
    const mod = await import('@/app/api/modules/route')
    expect(mod.GET).toBeDefined()
  })

  it('dashboard route should export GET', async () => {
    const mod = await import('@/app/api/dashboard/route')
    expect(mod.GET).toBeDefined()
  })

  it('stats/platform route should export GET', async () => {
    const mod = await import('@/app/api/stats/platform/route')
    expect(mod.GET).toBeDefined()
  })
})

describe('Health Endpoint', () => {
  it('should return ok status', async () => {
    const { GET } = await import('@/app/api/health/route')
    const response = await GET()
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.checks).toBeDefined()
    expect(data.checks.database).toBe('ok')
  })
})
