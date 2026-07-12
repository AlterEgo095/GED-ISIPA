// @ts-nocheck
import { describe, it, expect } from 'vitest'
import {
  createOrganizationSchema,
  createDepartmentSchema,
  createWorkflowSchema,
  executeWorkflowSchema,
  moduleActionSchema,
  accountActionSchema,
} from '@/lib/validation'

describe('createOrganizationSchema', () => {
  it('validates a valid organization input', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Test University',
      slug: 'test-university',
      code: 'TESTUNI',
      type: 'UNIVERSITY',
    })
    expect(result.success).toBe(true)
  })

  it('validates with optional primaryColor', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Test Hospital',
      slug: 'test-hospital',
      code: 'TESTHOS',
      type: 'HOSPITAL',
      primaryColor: '#0d9488',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug format', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Test',
      slug: 'INVALID SLUG!',
      code: 'TEST',
      type: 'COMPANY',
    })
    expect(result.success).toBe(false)
  })

  it('rejects lowercase code', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Test',
      slug: 'test',
      code: 'lowercase',
      type: 'SME',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = createOrganizationSchema.safeParse({
      name: 'Test',
      slug: 'test',
      code: 'TEST',
      type: 'INVALID_TYPE',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = createOrganizationSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('createDepartmentSchema', () => {
  it('validates a valid department', () => {
    const result = createDepartmentSchema.safeParse({
      name: 'Computer Science',
      code: 'CS',
    })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = createDepartmentSchema.safeParse({
      name: 'X',
      code: 'CS',
    })
    expect(result.success).toBe(false)
  })
})

describe('createWorkflowSchema', () => {
  it('validates minimal workflow', () => {
    const result = createWorkflowSchema.safeParse({
      name: 'Review Workflow',
    })
    expect(result.success).toBe(true)
  })

  it('validates workflow with states and transitions', () => {
    const result = createWorkflowSchema.safeParse({
      name: 'Full Workflow',
      description: 'A complete workflow',
      states: [
        { name: 'Draft', isInitial: true, isFinal: false, color: '#6b7280' },
        { name: 'Published', isInitial: false, isFinal: true, color: '#14b8a6' },
      ],
      transitions: [
        { from: 'Draft', to: 'Published', name: 'Publish', allowedRoles: ['ORG_ADMIN'] },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('executeWorkflowSchema', () => {
  it('validates required fields', () => {
    const result = executeWorkflowSchema.safeParse({
      transitionId: 'trans-123',
      documentId: 'doc-456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const result = executeWorkflowSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('moduleActionSchema', () => {
  it('validates activate action', () => {
    const result = moduleActionSchema.safeParse({
      moduleKey: 'ACADEMIC',
      action: 'activate',
    })
    expect(result.success).toBe(true)
  })

  it('validates all actions', () => {
    for (const action of ['activate', 'suspend', 'deactivate']) {
      const result = moduleActionSchema.safeParse({ moduleKey: 'TEST', action })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid action', () => {
    const result = moduleActionSchema.safeParse({
      moduleKey: 'TEST',
      action: 'destroy',
    })
    expect(result.success).toBe(false)
  })
})

describe('accountActionSchema', () => {
  it('validates APPROVE action', () => {
    const result = accountActionSchema.safeParse({
      userId: 'user-123',
      action: 'APPROVE',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = accountActionSchema.safeParse({
      userId: 'user-123',
      action: 'DELETE',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing userId', () => {
    const result = accountActionSchema.safeParse({
      action: 'APPROVE',
    })
    expect(result.success).toBe(false)
  })
})
