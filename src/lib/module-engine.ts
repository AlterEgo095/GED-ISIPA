import type { OrganizationType, ModuleStatus } from '@prisma/client'
import { db } from './db'

export interface ModuleDefinition {
  key: string
  name: string
  description: string
  icon: string
  orgTypes: OrganizationType[]
  dependencies?: string[]
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  // University modules
  { key: 'RH', name: 'Ressources Humaines', description: 'Gestion du personnel et des ressources humaines', icon: 'Users', orgTypes: ['UNIVERSITY', 'HOSPITAL', 'COMPANY', 'GOVERNMENT', 'SME', 'LAW_FIRM', 'INSTITUTION', 'NGO'] },
  { key: 'ACADEMIC', name: 'Académique', description: 'Gestion des programmes, cours et étudiants', icon: 'GraduationCap', orgTypes: ['UNIVERSITY'] },
  { key: 'LIBRARY', name: 'Bibliothèque', description: 'Gestion de la bibliothèque et des ressources', icon: 'BookOpen', orgTypes: ['UNIVERSITY'], dependencies: ['ACADEMIC'] },
  { key: 'RESEARCH', name: 'Recherche', description: 'Gestion de la recherche et publications', icon: 'Microscope', orgTypes: ['UNIVERSITY'], dependencies: ['ACADEMIC'] },

  // Hospital modules
  { key: 'MEDICAL', name: 'Médical', description: 'Gestion des dossiers médicaux et patients', icon: 'Stethoscope', orgTypes: ['HOSPITAL'] },
  { key: 'PHARMACY', name: 'Pharmacie', description: 'Gestion de la pharmacie et médicaments', icon: 'Pill', orgTypes: ['HOSPITAL'], dependencies: ['MEDICAL'] },
  { key: 'LABORATORY', name: 'Laboratoire', description: 'Gestion du laboratoire et analyses', icon: 'TestTube', orgTypes: ['HOSPITAL'], dependencies: ['MEDICAL'] },

  // Company modules
  { key: 'FINANCE', name: 'Finance', description: 'Gestion financière et comptabilité', icon: 'DollarSign', orgTypes: ['COMPANY', 'SME', 'GOVERNMENT'] },
  { key: 'CRM', name: 'CRM', description: 'Gestion de la relation client', icon: 'Handshake', orgTypes: ['COMPANY', 'SME', 'LAW_FIRM'] },
  { key: 'PROJECT', name: 'Projets', description: 'Gestion de projets et tâches', icon: 'FolderKanban', orgTypes: ['COMPANY'] },

  // Government modules
  { key: 'PROCEDURE', name: 'Procédures', description: 'Gestion des procédures administratives', icon: 'ScrollText', orgTypes: ['GOVERNMENT'] },
  { key: 'ARCHIVE', name: 'Archivage', description: 'Archivage et gestion documentaire avancée', icon: 'Archive', orgTypes: ['GOVERNMENT'] },
  { key: 'COMPLIANCE', name: 'Conformité', description: 'Suivi de la conformité réglementaire', icon: 'ShieldCheck', orgTypes: ['GOVERNMENT'] },

  // Law Firm modules
  { key: 'LEGAL', name: 'Juridique', description: 'Gestion des dossiers juridiques', icon: 'Scale', orgTypes: ['LAW_FIRM'] },
  { key: 'BILLING', name: 'Facturation', description: 'Facturation et suivi des honoraires', icon: 'Receipt', orgTypes: ['LAW_FIRM'], dependencies: ['LEGAL'] },
]

export function getModulesForOrgType(orgType: OrganizationType): ModuleDefinition[] {
  return AVAILABLE_MODULES.filter(m => m.orgTypes.includes(orgType))
}

export function checkDependencies(moduleKey: string, orgId: string): Promise<boolean> {
  const moduleDef = AVAILABLE_MODULES.find(m => m.key === moduleKey)
  if (!moduleDef?.dependencies?.length) return Promise.resolve(true)

  return db.organizationModule
    .findMany({
      where: {
        organizationId: orgId,
        moduleKey: { in: moduleDef.dependencies },
        status: 'ACTIVE',
      },
    })
    .then(active => moduleDef.dependencies!.every(dep => active.some(a => a.moduleKey === dep)))
}

export async function activateModule(orgId: string, moduleKey: string): Promise<boolean> {
  const depsMet = await checkDependencies(moduleKey, orgId)
  if (!depsMet) return false

  const moduleDef = AVAILABLE_MODULES.find(m => m.key === moduleKey)
  if (!moduleDef) return false

  await db.organizationModule.upsert({
    where: { organizationId_moduleKey: { organizationId: orgId, moduleKey } },
    update: { status: 'ACTIVE' as ModuleStatus, activatedAt: new Date() },
    create: {
      organizationId: orgId,
      moduleKey,
      name: moduleDef.name,
      description: moduleDef.description,
      status: 'ACTIVE' as ModuleStatus,
      activatedAt: new Date(),
    },
  })

  return true
}

export async function suspendModule(orgId: string, moduleKey: string): Promise<void> {
  await db.organizationModule.update({
    where: { organizationId_moduleKey: { organizationId: orgId, moduleKey } },
    data: { status: 'SUSPENDED' as ModuleStatus },
  })
}

export async function deactivateModule(orgId: string, moduleKey: string): Promise<void> {
  // Check if any active module depends on this one
  const dependents = AVAILABLE_MODULES.filter(
    m => m.dependencies?.includes(moduleKey)
  )
  
  for (const dep of dependents) {
    const active = await db.organizationModule.findFirst({
      where: { organizationId: orgId, moduleKey: dep.key, status: 'ACTIVE' },
    })
    if (active) {
      throw new Error(`Le module ${dep.name} dépend de ce module. Veuillez d'abord le désactiver.`)
    }
  }

  await db.organizationModule.update({
    where: { organizationId_moduleKey: { organizationId: orgId, moduleKey } },
    data: { status: 'INACTIVE' as ModuleStatus },
  })
}
