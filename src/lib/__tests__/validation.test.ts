import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  createDocumentSchema,
  paginationSchema,
  updateUserSchema,
  updateWorkflowSchema,
  updateNotificationSchema,
} from '@/lib/validation'

// ===== createUserSchema tests =====

describe('createUserSchema', () => {
  it('validates a valid user input with all required fields', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'John Doe',
      password: 'securePassword123',
    })
    expect(result.success).toBe(true)
  })

  it('validates with optional role and departmentId', () => {
    const result = createUserSchema.safeParse({
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'securePassword123',
      role: 'ORG_ADMIN',
      departmentId: 'dept-123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('ORG_ADMIN')
      expect(result.data.departmentId).toBe('dept-123')
    }
  })

  it('rejects an invalid email', () => {
    const result = createUserSchema.safeParse({
      email: 'not-an-email',
      name: 'John Doe',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a name shorter than 2 characters', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'J',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'John Doe',
      password: 'short1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid role value', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'John Doe',
      password: 'securePassword123',
      role: 'INVALID_ROLE',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = createUserSchema.safeParse({
      name: 'John Doe',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'John Doe',
    })
    expect(result.success).toBe(false)
  })
})

// ===== createDocumentSchema tests =====

describe('createDocumentSchema', () => {
  it('validates a valid document input', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Annual Report 2025',
      type: 'REPORT',
      departmentId: 'dept-001',
    })
    expect(result.success).toBe(true)
  })

  it('validates with all optional fields', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Annual Report 2025',
      description: 'Yearly financial report',
      type: 'FINANCIAL',
      classification: 'CONFIDENTIAL',
      departmentId: 'dept-001',
      tags: 'finance,report,2025',
      metadata: { source: 'accounting' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = createDocumentSchema.safeParse({
      type: 'REPORT',
      departmentId: 'dept-001',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createDocumentSchema.safeParse({
      title: '',
      type: 'REPORT',
      departmentId: 'dept-001',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid document type', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Some Document',
      type: 'INVALID_TYPE',
      departmentId: 'dept-001',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing departmentId', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Annual Report',
      type: 'REPORT',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty departmentId', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Annual Report',
      type: 'REPORT',
      departmentId: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = createDocumentSchema.safeParse({
      title: 'A'.repeat(201),
      type: 'REPORT',
      departmentId: 'dept-001',
    })
    expect(result.success).toBe(false)
  })
})

// ===== paginationSchema tests =====

describe('paginationSchema', () => {
  it('applies default values when no input is provided', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces string inputs to numbers', () => {
    const result = paginationSchema.safeParse({ page: '3', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(50)
    }
  })

  it('rejects a page of 0', () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects a negative page', () => {
    const result = paginationSchema.safeParse({ page: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects a limit greater than 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects a limit of 0', () => {
    const result = paginationSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts valid page and limit values', () => {
    const result = paginationSchema.safeParse({ page: 5, limit: 50 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(5)
      expect(result.data.limit).toBe(50)
    }
  })
})

// ===== updateUserSchema tests =====

describe('updateUserSchema', () => {
  it('validates partial update with just name', () => {
    const result = updateUserSchema.safeParse({ name: 'Updated Name' })
    expect(result.success).toBe(true)
  })

  it('validates setting isActive to false', () => {
    const result = updateUserSchema.safeParse({ isActive: false })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters in update', () => {
    const result = updateUserSchema.safeParse({ name: 'X' })
    expect(result.success).toBe(false)
  })
})

// ===== updateNotificationSchema tests =====

describe('updateNotificationSchema', () => {
  it('validates markAllRead flag', () => {
    const result = updateNotificationSchema.safeParse({ markAllRead: true })
    expect(result.success).toBe(true)
  })

  it('validates notificationId', () => {
    const result = updateNotificationSchema.safeParse({ notificationId: 'notif-123' })
    expect(result.success).toBe(true)
  })
})
