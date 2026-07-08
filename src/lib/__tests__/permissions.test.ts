import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  getAllowedActions,
  getRoleLevel,
  isSuperAdmin,
  isOrgAdmin,
  canManageUsers,
  canApproveDocuments,
} from '@/lib/permissions'
import type { Role, Resource, Action } from '@/lib/permissions'

// ===== hasPermission tests =====

describe('hasPermission', () => {
  it('SUPER_ADMIN can approve documents', () => {
    expect(hasPermission('SUPER_ADMIN', 'documents', 'approve')).toBe(true)
  })

  it('SUPER_ADMIN can manage all resources with applicable actions', () => {
    // Test a comprehensive set of actions across all resources
    // Some resources don't have all actions (e.g. billing has no 'create' or 'delete')
    const fullAccessResources: Resource[] = ['documents', 'users', 'departments', 'modules', 'workflows', 'organizations']
    const coreActions: Action[] = ['create', 'read', 'update', 'delete', 'manage']
    for (const resource of fullAccessResources) {
      for (const action of coreActions) {
        expect(hasPermission('SUPER_ADMIN', resource, action)).toBe(true)
      }
    }
    // Billing only has read and manage
    expect(hasPermission('SUPER_ADMIN', 'billing', 'read')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'billing', 'manage')).toBe(true)
    // Settings has read, update, manage
    expect(hasPermission('SUPER_ADMIN', 'settings', 'read')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'settings', 'update')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'settings', 'manage')).toBe(true)
    // Audit has read, export, manage
    expect(hasPermission('SUPER_ADMIN', 'audit', 'read')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'audit', 'export')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'audit', 'manage')).toBe(true)
  })

  it('VIEWER can only read documents and cannot create/update/delete', () => {
    expect(hasPermission('VIEWER', 'documents', 'read')).toBe(true)
    expect(hasPermission('VIEWER', 'documents', 'create')).toBe(false)
    expect(hasPermission('VIEWER', 'documents', 'update')).toBe(false)
    expect(hasPermission('VIEWER', 'documents', 'delete')).toBe(false)
  })

  it('USER can create, read, update, and share documents but not approve', () => {
    expect(hasPermission('USER', 'documents', 'create')).toBe(true)
    expect(hasPermission('USER', 'documents', 'read')).toBe(true)
    expect(hasPermission('USER', 'documents', 'update')).toBe(true)
    expect(hasPermission('USER', 'documents', 'share')).toBe(true)
    expect(hasPermission('USER', 'documents', 'approve')).toBe(false)
  })

  it('ORG_ADMIN cannot manage modules (only read/update)', () => {
    expect(hasPermission('ORG_ADMIN', 'modules', 'read')).toBe(true)
    expect(hasPermission('ORG_ADMIN', 'modules', 'update')).toBe(true)
    expect(hasPermission('ORG_ADMIN', 'modules', 'create')).toBe(false)
    expect(hasPermission('ORG_ADMIN', 'modules', 'delete')).toBe(false)
    expect(hasPermission('ORG_ADMIN', 'modules', 'manage')).toBe(false)
  })

  it('VIEWER has no billing permissions', () => {
    expect(hasPermission('VIEWER', 'billing', 'read')).toBe(false)
    expect(hasPermission('VIEWER', 'billing', 'manage')).toBe(false)
  })

  it('DEAN can approve and reject documents', () => {
    expect(hasPermission('DEAN', 'documents', 'approve')).toBe(true)
    expect(hasPermission('DEAN', 'documents', 'reject')).toBe(true)
  })

  it('DOCTOR can approve documents but cannot reject', () => {
    expect(hasPermission('DOCTOR', 'documents', 'approve')).toBe(true)
    expect(hasPermission('DOCTOR', 'documents', 'reject')).toBe(false)
  })

  it('LAWYER can publish and archive documents', () => {
    expect(hasPermission('LAWYER', 'documents', 'publish')).toBe(true)
    expect(hasPermission('LAWYER', 'documents', 'archive')).toBe(true)
  })

  it('CFO can manage billing', () => {
    expect(hasPermission('CFO', 'billing', 'manage')).toBe(true)
    expect(hasPermission('CFO', 'billing', 'read')).toBe(true)
  })

  it('HR_MANAGER can create and manage users', () => {
    expect(hasPermission('HR_MANAGER', 'users', 'create')).toBe(true)
    expect(hasPermission('HR_MANAGER', 'users', 'manage')).toBe(true)
  })
})

// ===== getRoleLevel tests =====

describe('getRoleLevel', () => {
  it('SUPER_ADMIN has the highest level', () => {
    expect(getRoleLevel('SUPER_ADMIN')).toBe(100)
  })

  it('ORG_ADMIN is below SUPER_ADMIN', () => {
    expect(getRoleLevel('ORG_ADMIN')).toBe(80)
    expect(getRoleLevel('ORG_ADMIN')).toBeLessThan(getRoleLevel('SUPER_ADMIN'))
  })

  it('VIEWER has the lowest level', () => {
    expect(getRoleLevel('VIEWER')).toBe(10)
  })

  it('role hierarchy is consistent: SUPER_ADMIN > ORG_ADMIN > DEAN > MANAGER > USER > VIEWER', () => {
    expect(getRoleLevel('SUPER_ADMIN')).toBeGreaterThan(getRoleLevel('ORG_ADMIN'))
    expect(getRoleLevel('ORG_ADMIN')).toBeGreaterThan(getRoleLevel('DEAN'))
    expect(getRoleLevel('DEAN')).toBeGreaterThan(getRoleLevel('MANAGER'))
    expect(getRoleLevel('MANAGER')).toBeGreaterThan(getRoleLevel('USER'))
    expect(getRoleLevel('USER')).toBeGreaterThan(getRoleLevel('VIEWER'))
  })

  it('DEAN, CFO, and HR_MANAGER have levels above MANAGER', () => {
    expect(getRoleLevel('DEAN')).toBeGreaterThan(getRoleLevel('MANAGER'))
    expect(getRoleLevel('CFO')).toBeGreaterThan(getRoleLevel('MANAGER'))
    expect(getRoleLevel('HR_MANAGER')).toBeGreaterThan(getRoleLevel('MANAGER'))
  })

  it('PROFESSOR has a higher level than PARALEGAL', () => {
    expect(getRoleLevel('PROFESSOR')).toBeGreaterThan(getRoleLevel('PARALEGAL'))
  })

  it('NURSE has a higher level than PARALEGAL', () => {
    expect(getRoleLevel('NURSE')).toBeGreaterThan(getRoleLevel('PARALEGAL'))
  })
})

// ===== isSuperAdmin tests =====

describe('isSuperAdmin', () => {
  it('returns true for SUPER_ADMIN', () => {
    expect(isSuperAdmin('SUPER_ADMIN')).toBe(true)
  })

  it('returns false for ORG_ADMIN', () => {
    expect(isSuperAdmin('ORG_ADMIN')).toBe(false)
  })

  it('returns false for all non-SUPER_ADMIN roles', () => {
    const roles: Role[] = ['ORG_ADMIN', 'MANAGER', 'USER', 'VIEWER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT']
    for (const role of roles) {
      expect(isSuperAdmin(role)).toBe(false)
    }
  })
})

// ===== isOrgAdmin tests =====

describe('isOrgAdmin', () => {
  it('returns true for ORG_ADMIN', () => {
    expect(isOrgAdmin('ORG_ADMIN')).toBe(true)
  })

  it('returns true for SUPER_ADMIN (inherits org admin)', () => {
    expect(isOrgAdmin('SUPER_ADMIN')).toBe(true)
  })

  it('returns false for MANAGER', () => {
    expect(isOrgAdmin('MANAGER')).toBe(false)
  })
})

// ===== canManageUsers tests =====

describe('canManageUsers', () => {
  it('SUPER_ADMIN can manage users', () => {
    expect(canManageUsers('SUPER_ADMIN')).toBe(true)
  })

  it('ORG_ADMIN can manage users', () => {
    expect(canManageUsers('ORG_ADMIN')).toBe(true)
  })

  it('DEAN can manage users', () => {
    expect(canManageUsers('DEAN')).toBe(true)
  })

  it('HR_MANAGER can manage users', () => {
    expect(canManageUsers('HR_MANAGER')).toBe(true)
  })

  it('VIEWER cannot manage users', () => {
    expect(canManageUsers('VIEWER')).toBe(false)
  })

  it('PROFESSOR cannot manage users', () => {
    expect(canManageUsers('PROFESSOR')).toBe(false)
  })
})

// ===== canApproveDocuments tests =====

describe('canApproveDocuments', () => {
  it('SUPER_ADMIN can approve documents', () => {
    expect(canApproveDocuments('SUPER_ADMIN')).toBe(true)
  })

  it('ORG_ADMIN can approve documents', () => {
    expect(canApproveDocuments('ORG_ADMIN')).toBe(true)
  })

  it('MANAGER can approve documents', () => {
    expect(canApproveDocuments('MANAGER')).toBe(true)
  })

  it('VIEWER cannot approve documents', () => {
    expect(canApproveDocuments('VIEWER')).toBe(false)
  })

  it('USER cannot approve documents', () => {
    expect(canApproveDocuments('USER')).toBe(false)
  })

  it('CIVIL_SERVANT can approve documents', () => {
    expect(canApproveDocuments('CIVIL_SERVANT')).toBe(true)
  })
})

// ===== getAllowedActions tests =====

describe('getAllowedActions', () => {
  it('returns all 12 actions for SUPER_ADMIN on documents', () => {
    const actions = getAllowedActions('SUPER_ADMIN', 'documents')
    expect(actions).toHaveLength(12)
    expect(actions).toContain('create')
    expect(actions).toContain('read')
    expect(actions).toContain('approve')
    expect(actions).toContain('share')
  })

  it('returns empty array for VIEWER on billing', () => {
    const actions = getAllowedActions('VIEWER', 'billing')
    expect(actions).toHaveLength(0)
    expect(actions).toEqual([])
  })

  it('returns read-only actions for VIEWER on documents', () => {
    const actions = getAllowedActions('VIEWER', 'documents')
    expect(actions).toEqual(['read'])
  })
})
