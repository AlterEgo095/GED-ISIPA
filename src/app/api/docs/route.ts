import { NextRequest, NextResponse } from 'next/server'

/**
 * PHASE 15: REST API DOCUMENTATION
 * GET /api/docs
 * Auto-generated API documentation for all document endpoints.
 */

const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'GED-ISIPA Document Management API',
    version: '4.0.0',
    description: 'API professionnelle de gestion électronique de documents (GED). Couvre le cycle de vie complet: création, classement, indexation, validation, révision, approbation, publication, archivage, conservation, destruction contrôlée.',
    contact: { name: 'GED-ISIPA Support', url: 'https://ged.aenews.net' },
  },
  servers: [
    { url: 'https://ged.aenews.net/api', description: 'Production' },
    { url: 'http://localhost:3000/api', description: 'Development' },
  ],
  auth: {
    type: 'Bearer JWT',
    description: 'Toutes les routes nécessitent un token JWT NextAuth (Authorization: Bearer token ou cookie next-auth)',
  },
  endpoints: {
    documents: {
      'GET /documents': {
        description: 'Liste des documents avec filtres et pagination',
        params: { page: 'number', limit: 'number', search: 'string', status: 'DocumentStatus', type: 'DocumentType', classification: 'Classification', departmentId: 'string' },
        response: '{ documents: Document[], pagination: { page, limit, total, pages } }',
      },
      'POST /documents': { description: 'Créer un document (metadata only)', body: '{ title, description, type, classification, departmentId, tags, metadata }' },
      'POST /documents/upload': { description: 'Uploader un document avec fichier (FormData)', body: 'FormData: file, title, description, type, classification, departmentId, tags, retentionPolicy, folderId' },
      'GET /documents/[id]': { description: 'Détails d\'un document avec versions et workflowState' },
      'PUT /documents/[id]': { description: 'Mettre à jour un document' },
      'DELETE /documents/[id]': { description: 'Suppression logique (corbeille)' },
    },
    lifecycle: {
      'GET /documents/[id]/lifecycle': { description: 'Cycle de vie: étape actuelle, transitions disponibles, timeline audit' },
      'POST /documents/[id]/submit': { description: 'Soumettre pour validation (DRAFT/REJECTED → PENDING_REVIEW)' },
      'POST /documents/[id]/start-review': { description: 'Démarrer la révision (PENDING_REVIEW → IN_REVIEW)' },
      'POST /documents/[id]/complete-review': { description: 'Compléter la révision (IN_REVIEW → PENDING_APPROVAL)' },
      'POST /documents/[id]/approve': { description: 'Approuver (→ APPROVED)' },
      'POST /documents/[id]/reject': { description: 'Rejeter (→ REJECTED)', body: '{ reason: string }' },
      'POST /documents/[id]/request-revision': { description: 'Demander révision (→ PENDING_REVISION)', body: '{ comment: string }' },
      'POST /documents/[id]/resubmit': { description: 'Reprendre édition (PENDING_REVISION → DRAFT)' },
      'POST /documents/[id]/publish': { description: 'Publier (APPROVED → PUBLISHED)' },
      'POST /documents/[id]/unpublish': { description: 'Dépublier (PUBLISHED → APPROVED)' },
      'POST /documents/[id]/archive': { description: 'Archiver (→ ARCHIVED)' },
      'POST /documents/[id]/restore': { description: 'Restaurer depuis archive (→ previousStatus/PUBLISHED)' },
      'POST /documents/[id]/approve-destruction': { description: 'Approuver destruction (séparation des devoirs)', body: '{ confirmation, reason }' },
      'POST /documents/[id]/destroy': { description: 'Destruction contrôlée (→ DESTROYED)', body: '{ confirmation: reference }' },
      'POST /documents/[id]/classify': { description: 'Classifier le document', body: '{ classification, folderId, type, retentionPolicy }' },
      'POST /documents/[id]/index': { description: 'Indexer le document', body: '{ tags, metadata, description }' },
    },
    versions: {
      'GET /documents/[id]/versions': { description: 'Liste des versions avec diff metadata', params: { sort: 'asc|desc', version: 'number' } },
      'POST /documents/[id]/versions': { description: 'Uploader nouvelle version (FormData)', body: 'FormData: file, changeLog, changeType' },
      'GET /documents/[id]/versions/compare': { description: 'Comparer deux versions', params: { v1: 'number', v2: 'number' } },
      'POST /documents/[id]/versions/restore': { description: 'Restaurer une version précédente', body: '{ versionNumber, reason }' },
      'GET /documents/[id]/versions/download': { description: 'Télécharger une version spécifique', params: { version: 'number' } },
    },
    trash: {
      'GET /documents/trash': { description: 'Liste corbeille avec filtres avancés', params: { search: 'string', type: 'DocumentType', classification: 'Classification', deletedBy: 'string', dateFrom: 'date', dateTo: 'date', sort: 'string', order: 'asc|desc' } },
      'DELETE /documents/trash': { description: 'Purger la corbeille', body: '{ action: empty|purge-expired|purge-selected, confirmation: PURGE_CONFIRM, documentIds? }' },
      'POST /documents/[id]/restore-deleted': { description: 'Restaurer depuis corbeille' },
      'DELETE /documents/[id]/permanent': { description: 'Suppression définitive (admin only)' },
    },
    preview: {
      'GET /documents/[id]/preview': { description: 'Prévisualisation native (PDF inline, images, texte, Office)' },
    },
    metadata: {
      'GET /documents/[id]/metadata': { description: 'Métadonnées groupées par catégorie' },
      'POST /documents/[id]/metadata': { description: 'Créer/mettre à jour métadonnées (batch support)', body: '{ key, value, type, required, category, options? }' },
      'DELETE /documents/[id]/metadata': { description: 'Supprimer métadonnée', body: '{ key }' },
    },
    sharing: {
      'GET /documents/[id]/shares': { description: 'Liste des partages avec statistiques' },
      'POST /documents/[id]/shares': { description: 'Créer un partage', body: '{ shareType, sharedWith?, password?, expiresAt?, downloadLimit?, permissions }' },
      'DELETE /documents/[id]/shares': { description: 'Révoquer un partage', body: '{ shareId }' },
    },
    comments: {
      'GET /documents/[id]/comments': { description: 'Commentaires en threads avec stats' },
      'POST /documents/[id]/comments': { description: 'Ajouter commentaire avec @mentions', body: '{ content, parentId?, mentions? }' },
      'PATCH /documents/[id]/comments/[commentId]': { description: 'Résoudre/rouvrir commentaire', body: '{ isResolved }' },
    },
    annotations: {
      'GET /documents/[id]/annotations': { description: 'Annotations groupées par page', params: { page: 'number', type: 'string' } },
      'POST /documents/[id]/annotations': { description: 'Créer annotation', body: '{ page, type, position, content?, color? }' },
      'DELETE /documents/[id]/annotations': { description: 'Supprimer annotation', body: '{ annotationId }' },
    },
    signature: {
      'GET /documents/[id]/signature': { description: 'Statut des demandes de signature' },
      'POST /documents/[id]/signature': { description: 'Créer demande de signature', body: '{ type, signers[], mode, message?, deadline? }' },
    },
    audit: {
      'GET /documents/[id]/audit': { description: 'Timeline audit complète avec export CSV', params: { action: 'string', dateFrom: 'date', dateTo: 'date', userId: 'string', format: 'json|csv' } },
    },
    security: {
      'GET /documents/[id]/security': { description: 'Paramètres de sécurité du document' },
      'POST /documents/[id]/security': { description: 'Modifier paramètres sécurité', body: '{ watermark?, downloadProhibited?, readOnly?, accessExpiration?, ipRestrictions?, departmentRestrictions?, finePermissions? }' },
    },
    discovery: {
      'GET /documents/favorites': { description: 'Documents récemment consultés (favoris)' },
      'POST /documents/favorites': { description: 'Gérer favoris', body: '{ documentId, action: add|remove|check }' },
      'GET /documents/recent': { description: 'Documents récemment modifiés', params: { limit: 'number' } },
      'GET /documents/popular': { description: 'Documents les plus consultés', params: { limit: 'number', period: 'all|month|week' } },
    },
    search: {
      'GET /search': { description: 'Recherche globale (documents, utilisateurs, départements)', params: { q: 'string' } },
      'GET /search/advanced': { description: 'Recherche avancée multi-critères', params: { q: 'string', status: 'DocumentStatus[]', type: 'DocumentType[]', classification: 'Classification[]', authorId: 'string', departmentId: 'string', folderId: 'string', dateFrom: 'date', dateTo: 'date', tags: 'string[]', sort: 'string', order: 'asc|desc', page: 'number', limit: 'number' } },
    },
  },
  enums: {
    DocumentStatus: ['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'PENDING_REVISION', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'REJECTED', 'DESTROYED'],
    DocumentType: ['ACADEMIC_RECORD', 'ADMINISTRATIVE', 'FINANCIAL', 'CORRESPONDENCE', 'REPORT', 'CONTRACT', 'CERTIFICATE', 'MEMO', 'POLICY', 'MEDICAL_RECORD', 'LEGAL_BRIEF', 'INVOICE', 'PROPOSAL', 'OTHER'],
    Classification: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
    RetentionPolicy: ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'PERMANENT'],
    Role: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'VIEWER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'],
  },
}

export async function GET() {
  return NextResponse.json(apiDocumentation)
}
