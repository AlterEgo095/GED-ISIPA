import { db } from './db'

export interface WorkflowConfig {
  name: string
  description: string
  states: { name: string; isInitial: boolean; isFinal: boolean; color: string }[]
  transitions: { from: string; to: string; name: string; allowedRoles: string[] }[]
}

export const DEFAULT_WORKFLOW: WorkflowConfig = {
  name: 'Workflow par défaut',
  description: 'Workflow standard de validation de documents',
  states: [
    { name: 'Brouillon', isInitial: true, isFinal: false, color: '#6b7280' },
    { name: 'En révision', isInitial: false, isFinal: false, color: '#f59e0b' },
    { name: 'Approuvé', isInitial: false, isFinal: false, color: '#10b981' },
    { name: 'Publié', isInitial: false, isFinal: true, color: '#14b8a6' },
    { name: 'Rejeté', isInitial: false, isFinal: true, color: '#ef4444' },
  ],
  transitions: [
    { from: 'Brouillon', to: 'En révision', name: 'Soumettre', allowedRoles: ['USER', 'PROFESSOR', 'NURSE', 'PARALEGAL'] },
    { from: 'En révision', to: 'Approuvé', name: 'Approuver', allowedRoles: ['ORG_ADMIN', 'MANAGER', 'DEAN', 'DOCTOR', 'LAWYER', 'CFO', 'CIVIL_SERVANT'] },
    { from: 'En révision', to: 'Rejeté', name: 'Rejeter', allowedRoles: ['ORG_ADMIN', 'MANAGER', 'DEAN', 'DOCTOR', 'LAWYER', 'CFO', 'CIVIL_SERVANT'] },
    { from: 'Approuvé', to: 'Publié', name: 'Publier', allowedRoles: ['ORG_ADMIN', 'DEAN', 'CFO', 'CIVIL_SERVANT'] },
    { from: 'Rejeté', to: 'Brouillon', name: 'Réviser', allowedRoles: ['USER', 'PROFESSOR', 'NURSE', 'PARALEGAL'] },
  ],
}

export async function createWorkflowFromConfig(
  orgId: string,
  config: WorkflowConfig
) {
  const workflow = await db.workflow.create({
    data: {
      name: config.name,
      description: config.description,
      organizationId: orgId,
    },
  })

  // Create states
  const stateRecords: Record<string, any>[] = []
  for (let i = 0; i < config.states.length; i++) {
    const stateConfig = config.states[i]
    const state = await db.workflowState.create({
      data: {
        workflowId: workflow.id,
        name: stateConfig.name,
        isInitial: stateConfig.isInitial,
        isFinal: stateConfig.isFinal,
        color: stateConfig.color,
        order: i,
      },
    })
    stateRecords.push(state)

    // Set initial state on workflow
    if (stateConfig.isInitial) {
      await db.workflow.update({
        where: { id: workflow.id },
        data: { initialStateId: state.id },
      })
    }
  }

  // Create transitions
  for (const transitionConfig of config.transitions) {
    const fromState = stateRecords.find(s => s.name === transitionConfig.from)
    const toState = stateRecords.find(s => s.name === transitionConfig.to)

    if (fromState && toState) {
      await db.workflowTransition.create({
        data: {
          workflowId: workflow.id,
          fromStateId: fromState.id,
          toStateId: toState.id,
          name: transitionConfig.name,
          allowedRoles: JSON.stringify(transitionConfig.allowedRoles),
        },
      })
    }
  }

  return workflow
}

export async function executeWorkflowTransition(
  transitionId: string,
  documentId: string,
  userId: string,
  orgId: string
) {
  const transition = await db.workflowTransition.findUnique({
    where: { id: transitionId },
    include: { fromState: true, toState: true, workflow: true },
  })

  if (!transition) {
    throw new Error('Transition introuvable')
  }

  // Update document workflow state
  const document = await db.document.update({
    where: { id: documentId },
    data: { workflowStateId: transition.toStateId },
  })

  // Update document status based on state
  const stateName = transition.toState.name
  let newStatus = document.status
  if (stateName === 'Approuvé') newStatus = 'APPROVED'
  else if (stateName === 'Publié') newStatus = 'PUBLISHED'
  else if (stateName === 'Rejeté') newStatus = 'REJECTED'
  else if (stateName === 'En révision') newStatus = 'PENDING_REVIEW'
  else if (stateName === 'Brouillon') newStatus = 'DRAFT'

  if (newStatus !== document.status) {
    await db.document.update({
      where: { id: documentId },
      data: { status: newStatus },
    })
  }

  // Create audit log
  await db.auditLog.create({
    data: {
      action: 'WORKFLOW_EXECUTE',
      entityType: 'Document',
      entityId: documentId,
      details: `Transition: ${transition.fromState.name} → ${transition.toState.name}`,
      organizationId: orgId,
      userId,
      documentId,
    },
  })

  return { document, transition }
}
