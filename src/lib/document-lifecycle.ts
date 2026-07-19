// @ts-nocheck
/**
 * Document Lifecycle State Machine
 * 
 * Complete document lifecycle: 
 *   CREATION → IMPORT → CLASSEMENT → INDEXATION → VALIDATION → RÉVISION → 
 *   APPROBATION → PUBLICATION → ARCHIVAGE → CONSERVATION → DESTRUCTION CONTRÔLÉE
 * 
 * Every transition is secured with:
 *   - Required source status
 *   - Required permission
 *   - Optional validation function
 *   - Audit action
 */

import type { DocumentStatus, Role } from '@prisma/client'
import { hasPermission, type Resource, type Action } from '@/lib/permissions'

// ============ LIFECYCLE TRANSITIONS ============

export interface LifecycleTransition {
  from: DocumentStatus[]
  to: DocumentStatus
  action: string            // API action name (URL segment)
  permission: Action        // Required permission action
  resource: Resource        // Required permission resource
  auditAction: string       // AuditAction enum value
  label: string             // Human-readable label (French)
  description: string       // Description of what this transition does
  requireBody?: boolean     // Whether the transition requires request body
  bodySchema?: string       // Name of the Zod schema to validate body against
}

/**
 * Complete lifecycle transitions map.
 * Each entry defines a valid state transition with security constraints.
 */
export const LIFECYCLE_TRANSITIONS: LifecycleTransition[] = [
  // === CREATION / IMPORT ===
  {
    from: [],
    to: 'DRAFT',
    action: 'create',
    permission: 'create',
    resource: 'documents',
    auditAction: 'CREATE',
    label: 'Créer / Importer',
    description: 'Création ou importation d\'un nouveau document en brouillon',
  },

  // === CLASSEMENT ===
  {
    from: ['DRAFT'],
    to: 'DRAFT',
    action: 'classify',
    permission: 'update',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Classifier',
    description: 'Classement du document: affectation dossier, catégorie, classification de sécurité',
    requireBody: true,
  },

  // === INDEXATION ===
  {
    from: ['DRAFT'],
    to: 'DRAFT',
    action: 'index',
    permission: 'update',
    resource: 'documents',
    auditAction: 'METADATA_UPDATE',
    label: 'Indexer',
    description: 'Indexation du document: métadonnées, tags, description enrichie',
    requireBody: true,
  },

  // === VALIDATION (Soumission pour révision) ===
  {
    from: ['DRAFT', 'REJECTED'],
    to: 'PENDING_REVIEW',
    action: 'submit',
    permission: 'update',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Soumettre pour validation',
    description: 'Soumission du document pour validation et révision',
  },

  // === RÉVISION (Mise en cours de révision) ===
  {
    from: ['PENDING_REVIEW'],
    to: 'IN_REVIEW',
    action: 'start-review',
    permission: 'update',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Démarrer la révision',
    description: 'Le réviseur prend en charge le document pour examen',
  },

  // === Fin de révision → En attente d'approbation ===
  {
    from: ['IN_REVIEW'],
    to: 'PENDING_APPROVAL',
    action: 'complete-review',
    permission: 'update',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Compléter la révision',
    description: 'La révision est terminée, le document est transmis pour approbation',
  },

  // === APPROBATION ===
  {
    from: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'],
    to: 'APPROVED',
    action: 'approve',
    permission: 'approve',
    resource: 'documents',
    auditAction: 'APPROVE',
    label: 'Approuver',
    description: 'Approbation officielle du document',
  },

  // === REJET ===
  {
    from: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'],
    to: 'REJECTED',
    action: 'reject',
    permission: 'reject',
    resource: 'documents',
    auditAction: 'REJECT',
    label: 'Rejeter',
    description: 'Rejet du document avec motif obligatoire',
    requireBody: true,
  },

  // === DEMANDE DE RÉVISION ===
  {
    from: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED'],
    to: 'PENDING_REVISION',
    action: 'request-revision',
    permission: 'request_revision',
    resource: 'documents',
    auditAction: 'REQUEST_REVISION',
    label: 'Demander une révision',
    description: 'Demande de modification avec commentaire obligatoire',
    requireBody: true,
  },

  // === RE-SOUMISSION après révision demandée ===
  {
    from: ['PENDING_REVISION'],
    to: 'DRAFT',
    action: 'resubmit',
    permission: 'update',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Reprendre l\'édition',
    description: 'L\'auteur reprend le document pour appliquer les modifications demandées',
  },

  // === PUBLICATION ===
  {
    from: ['APPROVED'],
    to: 'PUBLISHED',
    action: 'publish',
    permission: 'publish',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Publier',
    description: 'Publication officielle du document approuvé',
  },

  // === DÉPUBLICATION (Retour à approuvé) ===
  {
    from: ['PUBLISHED'],
    to: 'APPROVED',
    action: 'unpublish',
    permission: 'publish',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Dépublier',
    description: 'Retrait de la publication, retour au statut approuvé',
  },

  // === ARCHIVAGE ===
  {
    from: ['PUBLISHED', 'APPROVED', 'REJECTED'],
    to: 'ARCHIVED',
    action: 'archive',
    permission: 'archive',
    resource: 'documents',
    auditAction: 'ARCHIVE',
    label: 'Archiver',
    description: 'Archivage du document avec référence d\'archive',
  },

  // === RESTAURATION depuis archive ===
  {
    from: ['ARCHIVED'],
    to: 'PUBLISHED',
    action: 'restore',
    permission: 'restore',
    resource: 'documents',
    auditAction: 'RESTORE',
    label: 'Restaurer',
    description: 'Restauration du document depuis les archives vers son statut précédent la publication',
  },

  // === APPROBATION DE DESTRUCTION ===
  {
    from: ['ARCHIVED'],
    to: 'ARCHIVED', // Status doesn't change, but destruction approval flag is set
    action: 'approve-destruction',
    permission: 'destroy',
    resource: 'documents',
    auditAction: 'UPDATE',
    label: 'Approuver la destruction',
    description: 'Approbation formelle de la destruction du document archivé',
    requireBody: true,
  },

  // === DESTRUCTION CONTRÔLÉE ===
  {
    from: ['ARCHIVED'],
    to: 'DESTROYED',
    action: 'destroy',
    permission: 'destroy',
    resource: 'documents',
    auditAction: 'DESTROY',
    label: 'Détruire',
    description: 'Destruction contrôlée du document après approbation et confirmation',
    requireBody: true,
  },

  // === SUPPRESSION (Soft delete → Corbeille) ===
  {
    from: ['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'PENDING_REVISION', 'APPROVED', 'PUBLISHED', 'REJECTED'],
    to: 'DRAFT', // isDeleted flag is set, status becomes irrelevant
    action: 'soft-delete',
    permission: 'delete',
    resource: 'documents',
    auditAction: 'DELETE',
    label: 'Supprimer (corbeille)',
    description: 'Suppression logique du document, placé en corbeille',
  },
]

// ============ HELPER FUNCTIONS ============

/**
 * Get all transitions available from a given status for a given role.
 */
export function getAvailableTransitions(
  currentStatus: DocumentStatus,
  role: Role,
  isDeleted: boolean = false,
  isArchived: boolean = false,
): LifecycleTransition[] {
  if (isDeleted || isArchived) return []

  return LIFECYCLE_TRANSITIONS.filter(t => {
    // Skip create transition (special case, no "from" status)
    if (t.from.length === 0) return false
    // Must be in a valid source status
    if (!t.from.includes(currentStatus)) return false
    // Must have the required permission
    return hasPermission(role, t.resource, t.permission)
  })
}

/**
 * Validate that a transition is allowed from current status to target status.
 */
export function validateTransition(
  currentStatus: DocumentStatus,
  targetAction: string,
  role: Role,
  isDeleted: boolean = false,
): { valid: boolean; error?: string; transition?: LifecycleTransition } {
  if (isDeleted) {
    return { valid: false, error: 'Le document est supprimé. Restaurez-le d\'abord.' }
  }

  const transition = LIFECYCLE_TRANSITIONS.find(t => t.action === targetAction)
  if (!transition) {
    return { valid: false, error: `Transition "${targetAction}" inconnue` }
  }

  // Create transition is special — no "from" status check
  if (transition.from.length > 0 && !transition.from.includes(currentStatus)) {
    const validFromLabels = transition.from
      .map(s => STATUS_LABELS[s as DocumentStatus])
      .join(', ')
    return { 
      valid: false, 
      error: `Cette action n'est possible que depuis le(s) statut(s): ${validFromLabels}. Statut actuel: ${STATUS_LABELS[currentStatus]}` 
    }
  }

  if (!hasPermission(role, transition.resource, transition.permission)) {
    return { valid: false, error: 'Permissions insuffisantes pour cette action' }
  }

  return { valid: true, transition }
}

/**
 * Get the next statuses available from a given status.
 */
export function getNextStatuses(currentStatus: DocumentStatus): DocumentStatus[] {
  return LIFECYCLE_TRANSITIONS
    .filter(t => t.from.includes(currentStatus) && t.from.length > 0)
    .map(t => t.to)
    .filter((v, i, a) => a.indexOf(v) === i) // unique
}

// ============ STATUS DISPLAY ============

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En attente de révision',
  IN_REVIEW: 'En cours de révision',
  PENDING_APPROVAL: 'En attente d\'approbation',
  PENDING_REVISION: 'Révision demandée',
  APPROVED: 'Approuvé',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
  DESTROYED: 'Détruit', EXPIRED: 'Expiré', REVOKED: 'Révoqué',
}

export const STATUS_DESCRIPTIONS: Record<DocumentStatus, string> = {
  DRAFT: 'Document en cours de création ou d\'édition',
  PENDING_REVIEW: 'Document soumis, en attente qu\'un réviseur le prenne en charge',
  IN_REVIEW: 'Document en cours d\'examen par un réviseur',
  PENDING_APPROVAL: 'Révision terminée, en attente d\'approbation finale',
  PENDING_REVISION: 'Modifications demandées par le réviseur ou l\'approbateur',
  APPROVED: 'Document approuvé, prêt pour publication',
  PUBLISHED: 'Document publié et accessible selon ses permissions',
  ARCHIVED: 'Document archivé, en période de conservation',
  REJECTED: 'Document rejeté, nécessite des corrections avant re-soumission',
  DESTROYED: 'Document détruit de manière contrôlée et tracée',
}

export const LIFECYCLE_STEPS = [
  { step: 1, key: 'creation',    label: 'Création / Import',     statuses: ['DRAFT'] as DocumentStatus[], icon: 'FilePlus' },
  { step: 2, key: 'classement',  label: 'Classement',            statuses: ['DRAFT'] as DocumentStatus[], icon: 'FolderOpen' },
  { step: 3, key: 'indexation',  label: 'Indexation',            statuses: ['DRAFT'] as DocumentStatus[], icon: 'Search' },
  { step: 4, key: 'validation',  label: 'Validation',            statuses: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'] as DocumentStatus[], icon: 'CheckSquare' },
  { step: 5, key: 'revision',    label: 'Révision',              statuses: ['PENDING_REVISION', 'REJECTED'] as DocumentStatus[], icon: 'RefreshCw' },
  { step: 6, key: 'approbation', label: 'Approbation',           statuses: ['APPROVED'] as DocumentStatus[], icon: 'Shield' },
  { step: 7, key: 'publication', label: 'Publication',           statuses: ['PUBLISHED'] as DocumentStatus[], icon: 'Globe' },
  { step: 8, key: 'archivage',   label: 'Archivage',             statuses: ['ARCHIVED'] as DocumentStatus[], icon: 'Archive' },
  { step: 9, key: 'conservation',label: 'Conservation',          statuses: ['ARCHIVED'] as DocumentStatus[], icon: 'Clock' },
  { step: 10,key: 'destruction', label: 'Destruction contrôlée', statuses: ['DESTROYED'] as DocumentStatus[], icon: 'Trash2' },
] as const

/**
 * Get the current lifecycle step number for a given document status.
 */
export function getLifecycleStep(status: DocumentStatus): number {
  for (const step of LIFECYCLE_STEPS) {
    if (step.statuses.includes(status)) return step.step
  }
  return 0
}

/**
 * Get the current lifecycle phase name for a given status.
 */
export function getLifecyclePhase(status: DocumentStatus): string {
  const step = LIFECYCLE_STEPS.find(s => s.statuses.includes(status))
  return step?.label ?? 'Inconnu'
}
