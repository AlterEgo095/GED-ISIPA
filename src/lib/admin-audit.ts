import { db } from './db'

/**
 * Log an admin action to the audit trail.
 * All admin routes MUST use this to maintain accountability.
 */
export async function logAdminAction(params: {
  action: string
  entityType: string
  entityId: string
  details: string
  organizationId: string
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: params.action as any,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
        organizationId: params.organizationId,
        userId: params.userId,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't fail the request if audit logging fails
  }
}

/** Extract client info from request headers */
export function getClientInfo(request: Request): { ipAddress: string | null; userAgent: string | null } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
    userAgent: request.headers.get('user-agent') || null,
  }
}
