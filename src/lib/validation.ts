import { z } from 'zod'
import { NextResponse } from 'next/server'

// ===== User Validation =====
export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum([
    'SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'VIEWER',
    'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL',
    'CFO', 'HR_MANAGER', 'CIVIL_SERVANT',
  ]).optional(),
  departmentId: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(8).optional(),
  role: z.enum([
    'SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'VIEWER',
    'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL',
    'CFO', 'HR_MANAGER', 'CIVIL_SERVANT',
  ]).optional(),
  departmentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

// ===== Document Validation =====
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(1000).optional(),
  type: z.enum([
    'ACADEMIC_RECORD', 'ADMINISTRATIVE', 'FINANCIAL', 'CORRESPONDENCE',
    'REPORT', 'CONTRACT', 'CERTIFICATE', 'MEMO', 'POLICY',
    'MEDICAL_RECORD', 'LEGAL_BRIEF', 'INVOICE', 'PROPOSAL', 'OTHER',
  ]),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional(),
  departmentId: z.string().min(1, 'Le département est requis'),
  tags: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ===== Workflow Validation =====
export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
})

// ===== Settings Validation =====
export const updateSettingsSchema = z.record(z.string(), z.unknown())

// ===== Notification Validation =====
export const updateNotificationSchema = z.object({
  markAllRead: z.boolean().optional(),
  notificationId: z.string().optional(),
})

// ===== Pagination Validation =====
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

/**
 * Validate request body against a Zod schema.
 * Returns parsed data or null with an error response.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.issues[0]
    const message = firstError?.message || 'Données invalides'
    return { data: null, error: NextResponse.json({ error: message, details: result.error.issues }, { status: 400 }) }
  }
  return { data: result.data, error: null }
}

// ===== Organization Validation =====
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/, 'Le code doit être en majuscules et chiffres uniquement'),
  type: z.enum(['UNIVERSITY', 'HOSPITAL', 'COMPANY', 'GOVERNMENT', 'SME', 'INSTITUTION', 'NGO', 'LAW_FIRM']),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hex invalide').optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  logo: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'CHURNED']).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxStorage: z.number().int().positive().optional(),
})

// ===== Department Validation =====
export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9-]+$/, 'Le code doit être en majuscules'),
  description: z.string().max(500).optional(),
})

// ===== Workflow Validation =====
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Le nom du workflow est requis').max(100),
  description: z.string().max(500).nullable().optional(),
  states: z.array(z.object({
    name: z.string().min(1).max(50),
    isInitial: z.boolean(),
    isFinal: z.boolean(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })).optional(),
  transitions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    name: z.string().min(1).max(50),
    allowedRoles: z.array(z.string()),
  })).optional(),
})

// ===== Workflow Execute Validation =====
export const executeWorkflowSchema = z.object({
  transitionId: z.string().min(1, 'transitionId requis'),
  documentId: z.string().min(1, 'documentId requis'),
})

// ===== Organization Module Action Validation =====
export const moduleActionSchema = z.object({
  moduleKey: z.string().min(1, 'moduleKey requis'),
  action: z.enum(['activate', 'suspend', 'deactivate'], { message: 'Action invalide' }),
})

// ===== Admin Account Action Validation =====
export const accountActionSchema = z.object({
  userId: z.string().min(1, 'userId requis'),
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND'], { message: 'Action invalide (APPROVE, REJECT, SUSPEND)' }),
})

// ===== User ID Param Validation =====
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID requis'),
})

// ===== Search Validation =====
export const searchSchema = z.object({
  q: z.string().min(2).max(200).optional(),
})
