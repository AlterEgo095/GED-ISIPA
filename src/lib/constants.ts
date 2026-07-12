import type { DocumentStatus, Classification, DocumentType, Role, OrganizationType, AuditAction, ModuleStatus, OrganizationStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

// ============ DOCUMENT STATUS ============
export const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En attente de révision',
  IN_REVIEW: 'En cours de révision',
  PENDING_APPROVAL: 'En attente d\'approbation',
  PENDING_REVISION: 'En attente de révision',
  APPROVED: 'Approuvé',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
  DESTROYED: 'Détruit',
  EXPIRED: 'Expiré',
  REVOKED: 'Révoqué',
}

export const statusColors: Record<DocumentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  PENDING_APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  PENDING_REVISION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  PUBLISHED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  ARCHIVED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  DESTROYED: 'bg-gray-900 text-gray-100 dark:bg-gray-700 dark:text-gray-200',
  EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  REVOKED: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
}

export const statusDotColors: Record<DocumentStatus, string> = {
  DRAFT: 'bg-gray-400',
  PENDING_REVIEW: 'bg-amber-400',
  IN_REVIEW: 'bg-blue-400',
  PENDING_APPROVAL: 'bg-purple-400',
  PENDING_REVISION: 'bg-orange-400',
  APPROVED: 'bg-emerald-400',
  PUBLISHED: 'bg-teal-400',
  ARCHIVED: 'bg-slate-400',
  REJECTED: 'bg-red-400',
  DESTROYED: 'bg-gray-800',
  EXPIRED: 'bg-yellow-400',
  REVOKED: 'bg-pink-400',
}

// ============ CLASSIFICATION ============
export const classificationLabels: Record<Classification, string> = {
  PUBLIC: 'Public',
  INTERNAL: 'Interne',
  CONFIDENTIAL: 'Confidentiel',
  RESTRICTED: 'Restreint',
}

export const classificationColors: Record<Classification, string> = {
  PUBLIC: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INTERNAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  CONFIDENTIAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  RESTRICTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

// ============ DOCUMENT TYPES ============
export const typeLabels: Record<DocumentType, string> = {
  ACADEMIC_RECORD: 'Dossier Académique',
  ADMINISTRATIVE: 'Administratif',
  FINANCIAL: 'Financier',
  CORRESPONDENCE: 'Correspondance',
  REPORT: 'Rapport',
  CONTRACT: 'Contrat',
  CERTIFICATE: 'Certificat',
  MEMO: 'Note de Service',
  POLICY: 'Politique',
  MEDICAL_RECORD: 'Dossier Médical',
  LEGAL_BRIEF: 'Mémoire Juridique',
  INVOICE: 'Facture',
  PROPOSAL: 'Proposition',
  OTHER: 'Autre',
}

// ============ ROLES ============
export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ORG_ADMIN: 'Administrateur Organisation',
  MANAGER: 'Gestionnaire',
  USER: 'Utilisateur',
  VIEWER: 'Observateur',
  DEAN: 'Doyen',
  PROFESSOR: 'Professeur',
  DOCTOR: 'Médecin',
  NURSE: 'Infirmier(ère)',
  LAWYER: 'Avocat(e)',
  PARALEGAL: 'Assistant(e) Juridique',
  CFO: 'Directeur Financier',
  HR_MANAGER: 'Responsable RH',
  CIVIL_SERVANT: 'Fonctionnaire',
}

export const roleColors: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  ORG_ADMIN: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  USER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  VIEWER: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  DEAN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  PROFESSOR: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  DOCTOR: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  NURSE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LAWYER: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  PARALEGAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CFO: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  HR_MANAGER: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  CIVIL_SERVANT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

// ============ ORGANIZATION TYPES ============
export const organizationTypeLabels: Record<OrganizationType, string> = {
  UNIVERSITY: 'Université',
  HOSPITAL: 'Hôpital',
  COMPANY: 'Entreprise',
  GOVERNMENT: 'Gouvernement',
  SME: 'PME',
  INSTITUTION: 'Institution',
  NGO: 'ONG',
  LAW_FIRM: 'Cabinet Juridique',
}

export const organizationTypeColors: Record<OrganizationType, string> = {
  UNIVERSITY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  HOSPITAL: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  COMPANY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  GOVERNMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  SME: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  INSTITUTION: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  NGO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LAW_FIRM: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
}

// ============ ORGANIZATION STATUS ============
export const orgStatusLabels: Record<OrganizationStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  TRIAL: 'Essai',
  CHURNED: 'Résilié',
}

// ============ SUBSCRIPTION ============
export const planLabels: Record<SubscriptionPlan, string> = {
  FREE: 'Gratuit',
  STARTER: 'Débutant',
  PROFESSIONAL: 'Professionnel',
  ENTERPRISE: 'Entreprise',
}

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Actif',
  PAST_DUE: 'En retard',
  CANCELED: 'Annulé',
  TRIAL: 'Essai',
}

// ============ MODULE STATUS ============
export const moduleStatusLabels: Record<ModuleStatus, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  INACTIVE: 'Inactif',
}

export const moduleStatusColors: Record<ModuleStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  SUSPENDED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

// ============ AUDIT ACTIONS ============
export const actionLabels: Record<AuditAction, string> = {
  CREATE: 'Création', READ: 'Consultation', UPDATE: 'Modification', DELETE: 'Suppression',
  ARCHIVE: 'Archivage', RESTORE: 'Restauration', RESTORE_DELETED: 'Restauration corbeille',
  DOWNLOAD: 'Téléchargement', SHARE: 'Partage', SHARE_CREATE: 'Création partage',
  SHARE_ACCESS: 'Accès partage', APPROVE: 'Approbation', REJECT: 'Rejet',
  LOGIN: 'Connexion', LOGOUT: 'Déconnexion', MODULE_ACTIVATE: 'Activation Module',
  MODULE_SUSPEND: 'Suspension Module', WORKFLOW_EXECUTE: 'Exécution Workflow',
  ORGANIZATION_CREATE: 'Création Organisation', ORGANIZATION_SUSPEND: 'Suspension Organisation',
  API_KEY_CREATE: 'Création Clé API', API_KEY_REVOKE: 'Révocation Clé API',
  WEBHOOK_FIRE: 'Déclenchement Webhook', PLUGIN_INSTALL: 'Installation Plugin',
  PLUGIN_UNINSTALL: 'Désinstallation Plugin', CAMPUS_CREATE: 'Création Campus',
  SUBSCRIPTION_CHANGE: 'Changement Abonnement', COMMENT_ADD: 'Ajout Commentaire',
  COMMENT_RESOLVE: 'Résolution Commentaire', DESTROY: 'Destruction',
  PERMANENT_DELETE: 'Suppression Permanente', PREVIEW: 'Aperçu',
  REQUEST_REVISION: 'Demande Révision', METADATA_UPDATE: 'Mise à jour Métadonnées',
  TAG_ASSIGN: 'Assignation Tag', VERSION_UPLOAD: 'Upload Version',
  FOLDER_CREATE: 'Création Dossier', FOLDER_MOVE: 'Déplacement Dossier',
}

// ============ MODULE KEYS ============
export const moduleLabels: Record<string, string> = {
  RH: 'Ressources Humaines',
  ACADEMIC: 'Académique',
  LIBRARY: 'Bibliothèque',
  RESEARCH: 'Recherche',
  MEDICAL: 'Médical',
  PHARMACY: 'Pharmacie',
  LABORATORY: 'Laboratoire',
  FINANCE: 'Finance',
  CRM: 'CRM',
  PROJECT: 'Projets',
  PROCEDURE: 'Procédures',
  ARCHIVE: 'Archivage',
  COMPLIANCE: 'Conformité',
  LEGAL: 'Juridique',
  BILLING: 'Facturation',
}

// ============ PLAN PRICING ============
export const planPricing: Record<SubscriptionPlan, { price: number; maxUsers: number; maxStorage: number }> = {
  FREE: { price: 0, maxUsers: 5, maxStorage: 536870912 }, // 512MB
  STARTER: { price: 29, maxUsers: 15, maxStorage: 2147483648 }, // 2GB
  PROFESSIONAL: { price: 79, maxUsers: 50, maxStorage: 10737418240 }, // 10GB
  ENTERPRISE: { price: 199, maxUsers: -1, maxStorage: -1 }, // unlimited
}

// ============ MISSION 6.0 — SaaS LABELS ============
import type { ApiKeyStatus, WebhookEvent, WebhookStatus, IntegrationType, IntegrationStatus, UsageType } from '@prisma/client'

export const apiKeyStatusLabels: Record<ApiKeyStatus, string> = {
  ACTIVE: 'Actif',
  REVOKED: 'Révoqué',
  EXPIRED: 'Expiré',
}

export const webhookEventLabels: Record<WebhookEvent, string> = {
  DOCUMENT_CREATED: 'Document créé',
  DOCUMENT_UPDATED: 'Document modifié',
  DOCUMENT_APPROVED: 'Document approuvé',
  DOCUMENT_ARCHIVED: 'Document archivé',
  WORKFLOW_COMPLETED: 'Workflow terminé',
  USER_CREATED: 'Utilisateur créé',
  USER_DEACTIVATED: 'Utilisateur désactivé',
  SUBSCRIPTION_CHANGED: 'Abonnement modifié',
  AI_PROCESS_COMPLETED: 'Traitement IA terminé',
}

export const webhookStatusLabels: Record<WebhookStatus, string> = {
  ACTIVE: 'Actif',
  PAUSED: 'En pause',
  FAILED: 'En échec',
}

export const integrationTypeLabels: Record<IntegrationType, string> = {
  SLACK: 'Slack',
  EMAIL_SMTP: 'Email SMTP',
  S3_STORAGE: 'Amazon S3',
  GOOGLE_DRIVE: 'Google Drive',
  ONEDRIVE: 'OneDrive',
  WEBDAV: 'WebDAV',
  LDAP: 'LDAP / Active Directory',
  SAML_SSO: 'SAML SSO',
}

export const integrationStatusLabels: Record<IntegrationStatus, string> = {
  CONNECTED: 'Connecté',
  DISCONNECTED: 'Déconnecté',
  ERROR: 'Erreur',
  PENDING: 'En attente',
}

export const usageTypeLabels: Record<UsageType, string> = {
  API_CALL: 'Appels API',
  DOCUMENT_UPLOAD: 'Uploads documents',
  AI_OCR: 'OCR IA',
  AI_EMBEDDING: 'Embeddings IA',
  AI_CHAT: 'Chat IA',
  AI_CLASSIFICATION: 'Classification IA',
  STORAGE: 'Stockage',
  USER_SEAT: 'Sièges utilisateur',
}
