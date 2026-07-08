import { PrismaClient } from '@prisma/client'
import { generateAEIPToken } from '../src/lib/token-engine'
import { createWorkflowFromConfig, DEFAULT_WORKFLOW } from '../src/lib/workflow'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function main() {
  console.log('🌱 Début du seed...')

  const defaultPassword = 'Admin@2024!'

  // First: create system organization (required by foreign key)
  const systemOrg = await prisma.organization.upsert({
    where: { code: 'AEIP-SYS-PLATFORM' },
    update: {},
    create: {
      name: 'AEIP Platform',
      slug: 'aeip-platform',
      code: 'AEIP-SYS-PLATFORM',
      type: 'INSTITUTION',
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      primaryColor: '#7c3aed',
      maxUsers: -1,
      maxStorage: -1,
    },
  })

  // Then: create SUPER_ADMIN user linked to system org (hashed password)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@aeip.cd' },
    update: {},
    create: {
      email: 'superadmin@aeip.cd',
      name: 'Super Administrateur',
      password: await hashPassword(defaultPassword),
      role: 'SUPER_ADMIN',
      organizationId: systemOrg.id,
    },
  })

  // ============ ISIPA (UNIVERSITY) ============
  const uniToken = generateAEIPToken('UNIVERSITY')
  const isipa = await prisma.organization.upsert({
    where: { code: uniToken },
    update: {},
    create: {
      name: 'ISIPA',
      slug: 'isipa',
      code: uniToken,
      type: 'UNIVERSITY',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      primaryColor: '#4f46e5',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // University departments
  const deptSciences = await prisma.department.create({
    data: { name: 'Sciences', code: 'SCI', description: 'Faculté des Sciences', organizationId: isipa.id },
  })
  const deptDroit = await prisma.department.create({
    data: { name: 'Droit', code: 'DRT', description: 'Faculté de Droit', organizationId: isipa.id },
  })
  const deptEco = await prisma.department.create({
    data: { name: 'Économie', code: 'ECO', description: 'Faculté d\'Économie', organizationId: isipa.id },
  })

  // University users (hashed passwords)
  const uniAdmin = await prisma.user.create({
    data: { email: 'admin@isipa.cd', name: 'Prof. Mukendi', password: await hashPassword(defaultPassword), role: 'ORG_ADMIN', organizationId: isipa.id, departmentId: deptSciences.id },
  })
  const dean = await prisma.user.create({
    data: { email: 'dean@isipa.cd', name: 'Prof. Kabongo', password: await hashPassword(defaultPassword), role: 'DEAN', organizationId: isipa.id, departmentId: deptSciences.id },
  })
  const professor = await prisma.user.create({
    data: { email: 'prof@isipa.cd', name: 'Dr. Tshimanga', password: await hashPassword(defaultPassword), role: 'PROFESSOR', organizationId: isipa.id, departmentId: deptDroit.id },
  })

  // University documents
  const docTypes = ['ACADEMIC_RECORD', 'ADMINISTRATIVE', 'REPORT', 'CERTIFICATE', 'MEMO', 'POLICY']
  const docTitles = [
    'Mémoire de fin d\'études - Sciences Informatiques',
    'Rapport annuel 2024',
    'Certificat de réussite - Promotion 2024',
    'Note de service - Calendrier examens',
    'Politique de recherche',
    'Dossier académique - Étudiant Mbuyi',
    'Rapport de soutenance',
    'Procès-verval - Conseil facultaire',
  ]
  const statuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED']

  for (let i = 0; i < docTitles.length; i++) {
    const ref = `DOC-UNI-${Date.now().toString(36).toUpperCase()}-${i}`
    await prisma.document.create({
      data: {
        title: docTitles[i],
        reference: ref,
        description: `Description du document: ${docTitles[i]}`,
        type: docTypes[i % docTypes.length] as never,
        status: statuses[i] as never,
        classification: i % 3 === 0 ? 'PUBLIC' : i % 3 === 1 ? 'INTERNAL' : 'CONFIDENTIAL',
        filePath: `/uploads/${ref}`,
        fileName: docTitles[i],
        fileSize: Math.floor(Math.random() * 1000000),
        mimeType: 'application/pdf',
        fileHash: `hash-${i}`,
        version: 1,
        tags: i % 2 === 0 ? 'académique,université' : 'administration',
        organizationId: isipa.id,
        authorId: i % 2 === 0 ? professor.id : uniAdmin.id,
        departmentId: i % 3 === 0 ? deptSciences.id : i % 3 === 1 ? deptDroit.id : deptEco.id,
        isArchived: statuses[i] === 'ARCHIVED',
        ...(statuses[i] === 'ARCHIVED' ? { archivedAt: new Date(), archivedBy: uniAdmin.id, archiveRef: `ARCH-2024-${i}` } : {}),
      },
    })
  }

  // University modules
  for (const key of ['RH', 'ACADEMIC']) {
    await prisma.organizationModule.create({
      data: {
        organizationId: isipa.id,
        moduleKey: key,
        name: key === 'RH' ? 'Ressources Humaines' : 'Académique',
        description: key === 'RH' ? 'Gestion du personnel' : 'Gestion académique',
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    })
  }

  // University workflow
  await createWorkflowFromConfig(isipa.id, DEFAULT_WORKFLOW)

  // ============ HÔPITAL CENTRAL (HOSPITAL) ============
  const hosToken = generateAEIPToken('HOSPITAL')
  const hospital = await prisma.organization.upsert({
    where: { code: hosToken },
    update: {},
    create: {
      name: 'Hôpital Central',
      slug: 'hopital-central',
      code: hosToken,
      type: 'HOSPITAL',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      primaryColor: '#059669',
    },
  })

  // Hospital departments
  const deptUrgence = await prisma.department.create({
    data: { name: 'Urgences', code: 'URG', description: 'Service des urgences', organizationId: hospital.id },
  })
  const deptChirurgie = await prisma.department.create({
    data: { name: 'Chirurgie', code: 'CHI', description: 'Service de chirurgie', organizationId: hospital.id },
  })
  const deptMedicine = await prisma.department.create({
    data: { name: 'Médecine Interne', code: 'MIN', description: 'Service de médecine interne', organizationId: hospital.id },
  })

  // Hospital users (hashed passwords)
  const hosAdmin = await prisma.user.create({
    data: { email: 'admin@hopital.cd', name: 'Dr. Kalala', password: await hashPassword(defaultPassword), role: 'ORG_ADMIN', organizationId: hospital.id, departmentId: deptUrgence.id },
  })
  const doctor = await prisma.user.create({
    data: { email: 'doctor@hopital.cd', name: 'Dr. Ngoie', password: await hashPassword(defaultPassword), role: 'DOCTOR', organizationId: hospital.id, departmentId: deptChirurgie.id },
  })
  const nurse = await prisma.user.create({
    data: { email: 'nurse@hopital.cd', name: 'Mme. Ilunga', password: await hashPassword(defaultPassword), role: 'NURSE', organizationId: hospital.id, departmentId: deptUrgence.id },
  })

  // Hospital documents
  const hosDocTitles = [
    'Dossier médical - Patient KABANGU',
    'Rapport de consultation',
    'Ordonnance médicale',
    'Rapport d\'opération',
    'Fiche de suivi patient',
    'Certificat médical',
    'Rapport de laboratoire',
  ]
  const hosTypes = ['MEDICAL_RECORD', 'MEDICAL_RECORD', 'ADMINISTRATIVE', 'MEDICAL_RECORD', 'MEDICAL_RECORD', 'CERTIFICATE', 'REPORT']

  for (let i = 0; i < hosDocTitles.length; i++) {
    const ref = `DOC-HOS-${Date.now().toString(36).toUpperCase()}-${i}`
    await prisma.document.create({
      data: {
        title: hosDocTitles[i],
        reference: ref,
        type: hosTypes[i] as never,
        status: (i < 4 ? 'PUBLISHED' : i < 6 ? 'APPROVED' : 'DRAFT') as never,
        classification: i < 3 ? 'CONFIDENTIAL' : 'INTERNAL',
        filePath: `/uploads/${ref}`,
        fileName: hosDocTitles[i],
        fileSize: Math.floor(Math.random() * 500000),
        mimeType: 'application/pdf',
        fileHash: `hash-hos-${i}`,
        version: 1,
        tags: 'médical,hôpital',
        organizationId: hospital.id,
        authorId: i % 2 === 0 ? doctor.id : hosAdmin.id,
        departmentId: [deptUrgence.id, deptChirurgie.id, deptMedicine.id][i % 3],
      },
    })
  }

  // Hospital modules
  for (const key of ['RH', 'MEDICAL']) {
    await prisma.organizationModule.create({
      data: {
        organizationId: hospital.id,
        moduleKey: key,
        name: key === 'RH' ? 'Ressources Humaines' : 'Médical',
        description: key === 'RH' ? 'Gestion du personnel' : 'Gestion médicale',
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    })
  }

  await createWorkflowFromConfig(hospital.id, { ...DEFAULT_WORKFLOW, name: 'Workflow Médical', description: 'Workflow de validation des dossiers médicaux' })

  // ============ MINISTÈRE DU PLAN (GOVERNMENT) ============
  const govToken = generateAEIPToken('GOVERNMENT')
  const government = await prisma.organization.upsert({
    where: { code: govToken },
    update: {},
    create: {
      name: 'Ministère du Plan',
      slug: 'ministere-plan',
      code: govToken,
      type: 'GOVERNMENT',
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      primaryColor: '#d97706',
    },
  })

  // Government departments
  const deptPlanification = await prisma.department.create({
    data: { name: 'Planification', code: 'PLN', description: 'Direction de la planification', organizationId: government.id },
  })
  const deptBudget = await prisma.department.create({
    data: { name: 'Budget', code: 'BDG', description: 'Direction du budget', organizationId: government.id },
  })

  // Government users (hashed passwords)
  const govAdmin = await prisma.user.create({
    data: { email: 'admin@minplan.cd', name: 'M. Lomami', password: await hashPassword(defaultPassword), role: 'ORG_ADMIN', organizationId: government.id, departmentId: deptPlanification.id },
  })
  const civilServant = await prisma.user.create({
    data: { email: 'agent@minplan.cd', name: 'Mme. Kashala', password: await hashPassword(defaultPassword), role: 'CIVIL_SERVANT', organizationId: government.id, departmentId: deptBudget.id },
  })

  // Government documents
  const govDocTitles = [
    'Décret ministériel N°2024/001',
    'Procédure d\'appel d\'offres',
    'Arrêté ministériel - Budget 2024',
    'Note de service - Réorganisation',
    'Rapport d\'activité trimestriel',
    'Projet de développement rural',
  ]

  for (let i = 0; i < govDocTitles.length; i++) {
    const ref = `DOC-GOV-${Date.now().toString(36).toUpperCase()}-${i}`
    await prisma.document.create({
      data: {
        title: govDocTitles[i],
        reference: ref,
        type: (i % 2 === 0 ? 'POLICY' : i % 3 === 0 ? 'MEMO' : 'ADMINISTRATIVE') as never,
        status: (i < 2 ? 'PUBLISHED' : i < 4 ? 'APPROVED' : 'PENDING_REVIEW') as never,
        classification: i < 2 ? 'PUBLIC' : i < 4 ? 'INTERNAL' : 'RESTRICTED',
        filePath: `/uploads/${ref}`,
        fileName: govDocTitles[i],
        fileSize: Math.floor(Math.random() * 800000),
        mimeType: 'application/pdf',
        fileHash: `hash-gov-${i}`,
        version: 1,
        tags: 'gouvernement,procédure',
        organizationId: government.id,
        authorId: i % 2 === 0 ? govAdmin.id : civilServant.id,
        departmentId: i % 2 === 0 ? deptPlanification.id : deptBudget.id,
      },
    })
  }

  // Government modules
  for (const key of ['RH', 'PROCEDURE', 'ARCHIVE']) {
    await prisma.organizationModule.create({
      data: {
        organizationId: government.id,
        moduleKey: key,
        name: key === 'RH' ? 'Ressources Humaines' : key === 'PROCEDURE' ? 'Procédures' : 'Archivage',
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    })
  }

  await createWorkflowFromConfig(government.id, { ...DEFAULT_WORKFLOW, name: 'Workflow Gouvernemental', description: 'Workflow de validation des actes administratifs' })

  // Create subscriptions for all orgs
  for (const org of [isipa, hospital, government]) {
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        plan: org.plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        amount: org.plan === 'ENTERPRISE' ? 199 : org.plan === 'PROFESSIONAL' ? 79 : 0,
      },
    })
  }

  console.log('✅ Seed terminé avec succès!')
  console.log(`\n📋 Comptes de test (mot de passe: ${defaultPassword}):`)
  console.log(`  Super Admin: superadmin@aeip.cd`)
  console.log(`  ISIPA Admin: admin@isipa.cd`)
  console.log(`  ISIPA Doyen: dean@isipa.cd`)
  console.log(`  ISIPA Prof:  prof@isipa.cd`)
  console.log(`  Hôpital Admin: admin@hopital.cd`)
  console.log(`  Hôpital Dr:   doctor@hopital.cd`)
  console.log(`  Hôpital Inf:  nurse@hopital.cd`)
  console.log(`  MinPlan Admin: admin@minplan.cd`)
  console.log(`  MinPlan Agent: agent@minplan.cd`)
  console.log(`\n🔑 Codes organisation:`)
  console.log(`  ISIPA: ${uniToken}`)
  console.log(`  Hôpital: ${hosToken}`)
  console.log(`  MinPlan: ${govToken}`)
  console.log(`\n⚠️  IMPORTANT: Change default passwords before production deployment!`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
