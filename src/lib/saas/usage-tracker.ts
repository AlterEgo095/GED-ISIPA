import { db } from '@/lib/db'
import type { UsageType } from '@prisma/client'

export interface UsageSummary {
  apiCalls: number
  documentUploads: number
  aiOcrCalls: number
  aiEmbeddingCalls: number
  aiChatCalls: number
  aiClassificationCalls: number
  storageUsed: number
  userSeats: number
}

export async function trackUsage(
  organizationId: string,
  usageType: UsageType,
  quantity: number = 1,
  apiKeyId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  await db.usageRecord.create({
    data: {
      organizationId,
      apiKeyId,
      usageType,
      quantity,
      metadata: JSON.stringify(metadata || {}),
      periodStart,
      periodEnd,
    },
  })
}

export async function getUsageSummary(organizationId: string, periodStart?: Date, periodEnd?: Date): Promise<UsageSummary> {
  const now = new Date()
  const pStart = periodStart || new Date(now.getFullYear(), now.getMonth(), 1)
  const pEnd = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  const records = await db.usageRecord.findMany({
    where: {
      organizationId,
      periodStart: { gte: pStart },
      periodEnd: { lte: pEnd },
    },
  })
  
  const summary: UsageSummary = {
    apiCalls: 0,
    documentUploads: 0,
    aiOcrCalls: 0,
    aiEmbeddingCalls: 0,
    aiChatCalls: 0,
    aiClassificationCalls: 0,
    storageUsed: 0,
    userSeats: 0,
  }
  
  for (const record of records) {
    switch (record.usageType) {
      case 'API_CALL': summary.apiCalls += record.quantity; break
      case 'DOCUMENT_UPLOAD': summary.documentUploads += record.quantity; break
      case 'AI_OCR': summary.aiOcrCalls += record.quantity; break
      case 'AI_EMBEDDING': summary.aiEmbeddingCalls += record.quantity; break
      case 'AI_CHAT': summary.aiChatCalls += record.quantity; break
      case 'AI_CLASSIFICATION': summary.aiClassificationCalls += record.quantity; break
      case 'STORAGE': summary.storageUsed += record.quantity; break
      case 'USER_SEAT': summary.userSeats += record.quantity; break
    }
  }
  
  return summary
}

export async function checkQuota(organizationId: string, usageType: UsageType, quantity: number = 1): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Get organization plan
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, maxUsers: true, maxStorage: true },
  })
  
  if (!org) return { allowed: false, current: 0, limit: 0 }
  
  const summary = await getUsageSummary(organizationId)
  
  // Plan limits
  const planLimits: Record<string, Record<UsageType, number>> = {
    FREE: { API_CALL: 100, DOCUMENT_UPLOAD: 50, AI_OCR: 10, AI_EMBEDDING: 10, AI_CHAT: 20, AI_CLASSIFICATION: 10, STORAGE: 536870912, USER_SEAT: 5 },
    STARTER: { API_CALL: 1000, DOCUMENT_UPLOAD: 500, AI_OCR: 100, AI_EMBEDDING: 100, AI_CHAT: 200, AI_CLASSIFICATION: 100, STORAGE: 2147483648, USER_SEAT: 15 },
    PROFESSIONAL: { API_CALL: 10000, DOCUMENT_UPLOAD: 5000, AI_OCR: 1000, AI_EMBEDDING: 1000, AI_CHAT: 2000, AI_CLASSIFICATION: 1000, STORAGE: 10737418240, USER_SEAT: 50 },
    ENTERPRISE: { API_CALL: -1, DOCUMENT_UPLOAD: -1, AI_OCR: -1, AI_EMBEDDING: -1, AI_CHAT: -1, AI_CLASSIFICATION: -1, STORAGE: -1, USER_SEAT: -1 },
  }
  
  const limits = planLimits[org.plan] || planLimits.FREE
  const limit = limits[usageType]
  
  if (limit === -1) return { allowed: true, current: 0, limit: -1 } // unlimited
  
  const currentMap: Record<UsageType, number> = {
    API_CALL: summary.apiCalls,
    DOCUMENT_UPLOAD: summary.documentUploads,
    AI_OCR: summary.aiOcrCalls,
    AI_EMBEDDING: summary.aiEmbeddingCalls,
    AI_CHAT: summary.aiChatCalls,
    AI_CLASSIFICATION: summary.aiClassificationCalls,
    STORAGE: summary.storageUsed,
    USER_SEAT: summary.userSeats,
  }
  
  const current = currentMap[usageType]
  return { allowed: current + quantity <= limit, current, limit }
}
