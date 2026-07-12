import { db } from '@/lib/db'
import type { SubscriptionPlan } from '@prisma/client'

export interface PlanFeatureDef {
  plan: SubscriptionPlan
  featureKey: string
  featureName: string
  featureType: 'boolean' | 'number' | 'string'
  value: string
  description?: string
}

export const PLAN_FEATURES: PlanFeatureDef[] = [
  // FREE Plan
  { plan: 'FREE', featureKey: 'max_users', featureName: 'Utilisateurs max', featureType: 'number', value: '5', description: 'Nombre maximum d\'utilisateurs' },
  { plan: 'FREE', featureKey: 'max_storage_gb', featureName: 'Stockage max (GB)', featureType: 'number', value: '0.5', description: 'Stockage maximum en GB' },
  { plan: 'FREE', featureKey: 'max_documents', featureName: 'Documents max', featureType: 'number', value: '100', description: 'Nombre maximum de documents' },
  { plan: 'FREE', featureKey: 'api_access', featureName: 'Accès API', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'max_api_keys', featureName: 'Clés API max', featureType: 'number', value: '0' },
  { plan: 'FREE', featureKey: 'ai_ocr', featureName: 'OCR IA', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'ai_chat', featureName: 'Chat IA', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'ai_classification', featureName: 'Classification IA', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'webhooks', featureName: 'Webhooks', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'plugins', featureName: 'Plugins', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'multi_campus', featureName: 'Multi-campus', featureType: 'boolean', value: 'false' },
  { plan: 'FREE', featureKey: 'priority_support', featureName: 'Support prioritaire', featureType: 'boolean', value: 'false' },
  
  // STARTER Plan
  { plan: 'STARTER', featureKey: 'max_users', featureName: 'Utilisateurs max', featureType: 'number', value: '15' },
  { plan: 'STARTER', featureKey: 'max_storage_gb', featureName: 'Stockage max (GB)', featureType: 'number', value: '2' },
  { plan: 'STARTER', featureKey: 'max_documents', featureName: 'Documents max', featureType: 'number', value: '1000' },
  { plan: 'STARTER', featureKey: 'api_access', featureName: 'Accès API', featureType: 'boolean', value: 'true' },
  { plan: 'STARTER', featureKey: 'max_api_keys', featureName: 'Clés API max', featureType: 'number', value: '2' },
  { plan: 'STARTER', featureKey: 'api_rate_limit', featureName: 'Limite API/min', featureType: 'number', value: '60' },
  { plan: 'STARTER', featureKey: 'ai_ocr', featureName: 'OCR IA', featureType: 'boolean', value: 'true' },
  { plan: 'STARTER', featureKey: 'ai_ocr_limit', featureName: 'OCR IA limite/mois', featureType: 'number', value: '100' },
  { plan: 'STARTER', featureKey: 'ai_chat', featureName: 'Chat IA', featureType: 'boolean', value: 'false' },
  { plan: 'STARTER', featureKey: 'ai_classification', featureName: 'Classification IA', featureType: 'boolean', value: 'true' },
  { plan: 'STARTER', featureKey: 'webhooks', featureName: 'Webhooks', featureType: 'boolean', value: 'true' },
  { plan: 'STARTER', featureKey: 'max_webhooks', featureName: 'Webhooks max', featureType: 'number', value: '3' },
  { plan: 'STARTER', featureKey: 'plugins', featureName: 'Plugins', featureType: 'boolean', value: 'true' },
  { plan: 'STARTER', featureKey: 'max_plugins', featureName: 'Plugins max', featureType: 'number', value: '3' },
  { plan: 'STARTER', featureKey: 'multi_campus', featureName: 'Multi-campus', featureType: 'boolean', value: 'false' },
  { plan: 'STARTER', featureKey: 'priority_support', featureName: 'Support prioritaire', featureType: 'boolean', value: 'false' },
  
  // PROFESSIONAL Plan
  { plan: 'PROFESSIONAL', featureKey: 'max_users', featureName: 'Utilisateurs max', featureType: 'number', value: '50' },
  { plan: 'PROFESSIONAL', featureKey: 'max_storage_gb', featureName: 'Stockage max (GB)', featureType: 'number', value: '10' },
  { plan: 'PROFESSIONAL', featureKey: 'max_documents', featureName: 'Documents max', featureType: 'number', value: '10000' },
  { plan: 'PROFESSIONAL', featureKey: 'api_access', featureName: 'Accès API', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'max_api_keys', featureName: 'Clés API max', featureType: 'number', value: '10' },
  { plan: 'PROFESSIONAL', featureKey: 'api_rate_limit', featureName: 'Limite API/min', featureType: 'number', value: '300' },
  { plan: 'PROFESSIONAL', featureKey: 'ai_ocr', featureName: 'OCR IA', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'ai_ocr_limit', featureName: 'OCR IA limite/mois', featureType: 'number', value: '1000' },
  { plan: 'PROFESSIONAL', featureKey: 'ai_chat', featureName: 'Chat IA', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'ai_chat_limit', featureName: 'Chat IA limite/mois', featureType: 'number', value: '2000' },
  { plan: 'PROFESSIONAL', featureKey: 'ai_classification', featureName: 'Classification IA', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'ai_search', featureName: 'Recherche sémantique', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'webhooks', featureName: 'Webhooks', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'max_webhooks', featureName: 'Webhooks max', featureType: 'number', value: '10' },
  { plan: 'PROFESSIONAL', featureKey: 'plugins', featureName: 'Plugins', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'max_plugins', featureName: 'Plugins max', featureType: 'number', value: '10' },
  { plan: 'PROFESSIONAL', featureKey: 'multi_campus', featureName: 'Multi-campus', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'max_campuses', featureName: 'Campus max', featureType: 'number', value: '5' },
  { plan: 'PROFESSIONAL', featureKey: 'priority_support', featureName: 'Support prioritaire', featureType: 'boolean', value: 'true' },
  { plan: 'PROFESSIONAL', featureKey: 'custom_branding', featureName: 'Branding personnalisé', featureType: 'boolean', value: 'true' },
  
  // ENTERPRISE Plan
  { plan: 'ENTERPRISE', featureKey: 'max_users', featureName: 'Utilisateurs max', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'max_storage_gb', featureName: 'Stockage max (GB)', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'max_documents', featureName: 'Documents max', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'api_access', featureName: 'Accès API', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'max_api_keys', featureName: 'Clés API max', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'api_rate_limit', featureName: 'Limite API/min', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'ai_ocr', featureName: 'OCR IA', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'ai_ocr_limit', featureName: 'OCR IA limite/mois', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'ai_chat', featureName: 'Chat IA', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'ai_chat_limit', featureName: 'Chat IA limite/mois', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'ai_classification', featureName: 'Classification IA', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'ai_search', featureName: 'Recherche sémantique', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'webhooks', featureName: 'Webhooks', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'max_webhooks', featureName: 'Webhooks max', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'plugins', featureName: 'Plugins', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'max_plugins', featureName: 'Plugins max', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'multi_campus', featureName: 'Multi-campus', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'max_campuses', featureName: 'Campus max', featureType: 'number', value: '-1', description: 'Illimité' },
  { plan: 'ENTERPRISE', featureKey: 'priority_support', featureName: 'Support prioritaire', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'custom_branding', featureName: 'Branding personnalisé', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'sso_saml', featureName: 'SSO/SAML', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'sla', featureName: 'SLA garanti', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'dedicated_support', featureName: 'Support dédié', featureType: 'boolean', value: 'true' },
  { plan: 'ENTERPRISE', featureKey: 'audit_export', featureName: 'Export audit complet', featureType: 'boolean', value: 'true' },
]

export async function seedPlanFeatures(): Promise<void> {
  for (const feature of PLAN_FEATURES) {
    await db.planFeature.upsert({
      where: { plan_featureKey: { plan: feature.plan, featureKey: feature.featureKey } },
      update: {
        featureName: feature.featureName,
        featureType: feature.featureType,
        value: feature.value,
        description: feature.description,
      },
      create: feature,
    })
  }
}

export async function getPlanFeatures(plan: SubscriptionPlan) {
  const features = await db.planFeature.findMany({
    where: { plan },
    orderBy: [{ featureKey: 'asc' }],
  })
  return features
}

export async function getFeatureValue(plan: SubscriptionPlan, featureKey: string): Promise<string | null> {
  const feature = await db.planFeature.findUnique({
    where: { plan_featureKey: { plan, featureKey } },
  })
  return feature?.value ?? null
}

export async function hasFeature(plan: SubscriptionPlan, featureKey: string): Promise<boolean> {
  const value = await getFeatureValue(plan, featureKey)
  return value === 'true' || value === '-1'
}
