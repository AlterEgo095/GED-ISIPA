import type { Role } from '@prisma/client'

export type Resource = 'documents' | 'users' | 'departments' | 'modules' | 'workflows' | 'billing' | 'settings' | 'audit' | 'organizations'
export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'archive' | 'restore' | 'publish' | 'manage' | 'export' | 'share' | 'destroy' | 'request_revision'

type PermissionMatrix = Record<Role, Record<Resource, Action[]>>

const PERMISSION_MATRIX: PermissionMatrix = {
  SUPER_ADMIN: {
    documents: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'archive', 'restore', 'publish', 'manage', 'export', 'share', 'destroy', 'request_revision'],
    users: ['create', 'read', 'update', 'delete', 'manage', 'export'],
    departments: ['create', 'read', 'update', 'delete', 'manage'],
    modules: ['create', 'read', 'update', 'delete', 'manage'],
    workflows: ['create', 'read', 'update', 'delete', 'manage'],
    billing: ['read', 'manage'],
    settings: ['read', 'update', 'manage'],
    audit: ['read', 'export', 'manage'],
    organizations: ['create', 'read', 'update', 'delete', 'manage'],
  },
  ORG_ADMIN: {
    documents: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'archive', 'restore', 'publish', 'export', 'share', 'destroy', 'request_revision'],
    users: ['create', 'read', 'update', 'delete', 'manage'],
    departments: ['create', 'read', 'update', 'delete', 'manage'],
    modules: ['read', 'update'],
    workflows: ['create', 'read', 'update', 'delete', 'manage'],
    billing: ['read'],
    settings: ['read', 'update'],
    audit: ['read', 'export'],
    organizations: ['read'],
  },
  MANAGER: {
    documents: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'archive', 'export', 'share', 'request_revision'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read', 'update'],
    billing: [],
    settings: ['read'],
    audit: ['read'],
    organizations: ['read'],
  },
  USER: {
    documents: ['create', 'read', 'update', 'share'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read'],
    billing: [],
    settings: [],
    audit: [],
    organizations: ['read'],
  },
  VIEWER: {
    documents: ['read'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read'],
    billing: [],
    settings: [],
    audit: [],
    organizations: ['read'],
  },
  DEAN: {
    documents: ['create', 'read', 'update', 'approve', 'reject', 'archive', 'publish', 'export', 'share', 'request_revision'],
    users: ['read', 'manage'],
    departments: ['read', 'update'],
    modules: ['read'],
    workflows: ['read', 'update', 'manage'],
    billing: ['read'],
    settings: ['read'],
    audit: ['read'],
    organizations: ['read'],
  },
  PROFESSOR: {
    documents: ['create', 'read', 'update', 'share'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read'],
    billing: [],
    settings: [],
    audit: [],
    organizations: ['read'],
  },
  DOCTOR: {
    documents: ['create', 'read', 'update', 'approve', 'archive', 'export', 'share', 'request_revision'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read', 'update'],
    billing: [],
    settings: ['read'],
    audit: ['read'],
    organizations: ['read'],
  },
  NURSE: {
    documents: ['create', 'read', 'update', 'share'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read'],
    billing: [],
    settings: [],
    audit: [],
    organizations: ['read'],
  },
  LAWYER: {
    documents: ['create', 'read', 'update', 'approve', 'archive', 'publish', 'export', 'share', 'request_revision'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read', 'update'],
    billing: ['read'],
    settings: ['read'],
    audit: ['read'],
    organizations: ['read'],
  },
  PARALEGAL: {
    documents: ['create', 'read', 'update', 'share'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read'],
    billing: [],
    settings: [],
    audit: [],
    organizations: ['read'],
  },
  CFO: {
    documents: ['create', 'read', 'update', 'approve', 'reject', 'archive', 'restore', 'publish', 'export', 'share', 'destroy', 'request_revision'],
    users: ['read'],
    departments: ['read'],
    modules: ['read', 'update'],
    workflows: ['read', 'update'],
    billing: ['read', 'manage'],
    settings: ['read', 'update'],
    audit: ['read', 'export'],
    organizations: ['read'],
  },
  HR_MANAGER: {
    documents: ['create', 'read', 'update', 'approve', 'archive', 'export', 'share', 'request_revision'],
    users: ['create', 'read', 'update', 'manage'],
    departments: ['read', 'update'],
    modules: ['read'],
    workflows: ['read', 'update'],
    billing: ['read'],
    settings: ['read', 'update'],
    audit: ['read'],
    organizations: ['read'],
  },
  CIVIL_SERVANT: {
    documents: ['create', 'read', 'update', 'approve', 'archive', 'publish', 'export', 'share', 'request_revision'],
    users: ['read'],
    departments: ['read'],
    modules: ['read'],
    workflows: ['read', 'update'],
    billing: [],
    settings: ['read'],
    audit: ['read', 'export'],
    organizations: ['read'],
  },
}

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const rolePermissions = PERMISSION_MATRIX[role]
  if (!rolePermissions) return false
  const resourcePermissions = rolePermissions[resource]
  if (!resourcePermissions) return false
  return resourcePermissions.includes(action)
}

export function getAllowedActions(role: Role, resource: Resource): Action[] {
  return PERMISSION_MATRIX[role]?.[resource] ?? []
}

export function isSuperAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}

export function isOrgAdmin(role: Role): boolean {
  return role === 'ORG_ADMIN' || role === 'SUPER_ADMIN'
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'users', 'manage')
}

export function canApproveDocuments(role: Role): boolean {
  return hasPermission(role, 'documents', 'approve')
}

export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    SUPER_ADMIN: 100,
    ORG_ADMIN: 80,
    DEAN: 70,
    CFO: 65,
    HR_MANAGER: 65,
    CIVIL_SERVANT: 60,
    DOCTOR: 60,
    LAWYER: 60,
    MANAGER: 50,
    PROFESSOR: 40,
    NURSE: 35,
    PARALEGAL: 30,
    USER: 20,
    VIEWER: 10,
  }
  return levels[role] ?? 0
}