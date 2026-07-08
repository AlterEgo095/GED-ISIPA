import { describe, it, expect } from 'vitest'
import { DEFAULT_WORKFLOW } from '@/lib/workflow'
import type { WorkflowConfig } from '@/lib/workflow'

describe('DEFAULT_WORKFLOW configuration', () => {
  it('has the correct name and description', () => {
    expect(DEFAULT_WORKFLOW.name).toBe('Workflow par défaut')
    expect(DEFAULT_WORKFLOW.description).toBe('Workflow standard de validation de documents')
  })

  it('has exactly one initial state', () => {
    const initialStates = DEFAULT_WORKFLOW.states.filter(s => s.isInitial)
    expect(initialStates).toHaveLength(1)
    expect(initialStates[0].name).toBe('Brouillon')
  })

  it('has at least one final state', () => {
    const finalStates = DEFAULT_WORKFLOW.states.filter(s => s.isFinal)
    expect(finalStates.length).toBeGreaterThanOrEqual(1)
  })

  it('has all transitions referencing valid state names', () => {
    const stateNames = new Set(DEFAULT_WORKFLOW.states.map(s => s.name))
    for (const transition of DEFAULT_WORKFLOW.transitions) {
      expect(stateNames.has(transition.from)).toBe(true)
      expect(stateNames.has(transition.to)).toBe(true)
    }
  })

  it('has "Brouillon" as the initial state and "Publié"/"Rejeté" as final states', () => {
    const initialState = DEFAULT_WORKFLOW.states.find(s => s.isInitial)
    expect(initialState?.name).toBe('Brouillon')

    const finalStateNames = DEFAULT_WORKFLOW.states.filter(s => s.isFinal).map(s => s.name)
    expect(finalStateNames).toContain('Publié')
    expect(finalStateNames).toContain('Rejeté')
  })

  it('has 5 states in the default workflow', () => {
    expect(DEFAULT_WORKFLOW.states).toHaveLength(5)
  })

  it('has 5 transitions in the default workflow', () => {
    expect(DEFAULT_WORKFLOW.transitions).toHaveLength(5)
  })

  it('each transition has a name and at least one allowed role', () => {
    for (const transition of DEFAULT_WORKFLOW.transitions) {
      expect(transition.name).toBeTruthy()
      expect(transition.allowedRoles.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('submit transition is allowed for USER, PROFESSOR, NURSE, and PARALEGAL', () => {
    const submitTransition = DEFAULT_WORKFLOW.transitions.find(t => t.name === 'Soumettre')
    expect(submitTransition).toBeDefined()
    expect(submitTransition!.allowedRoles).toEqual(['USER', 'PROFESSOR', 'NURSE', 'PARALEGAL'])
  })

  it('approve transition is allowed for reviewer roles', () => {
    const approveTransition = DEFAULT_WORKFLOW.transitions.find(t => t.name === 'Approuver')
    expect(approveTransition).toBeDefined()
    expect(approveTransition!.from).toBe('En révision')
    expect(approveTransition!.to).toBe('Approuvé')
  })

  it('reject transition goes from En révision to Rejeté', () => {
    const rejectTransition = DEFAULT_WORKFLOW.transitions.find(t => t.name === 'Rejeter')
    expect(rejectTransition).toBeDefined()
    expect(rejectTransition!.from).toBe('En révision')
    expect(rejectTransition!.to).toBe('Rejeté')
  })

  it('revise transition returns from Rejeté to Brouillon', () => {
    const reviseTransition = DEFAULT_WORKFLOW.transitions.find(t => t.name === 'Réviser')
    expect(reviseTransition).toBeDefined()
    expect(reviseTransition!.from).toBe('Rejeté')
    expect(reviseTransition!.to).toBe('Brouillon')
  })

  it('publish transition goes from Approuvé to Publié', () => {
    const publishTransition = DEFAULT_WORKFLOW.transitions.find(t => t.name === 'Publier')
    expect(publishTransition).toBeDefined()
    expect(publishTransition!.from).toBe('Approuvé')
    expect(publishTransition!.to).toBe('Publié')
  })

  it('each state has a valid color', () => {
    for (const state of DEFAULT_WORKFLOW.states) {
      expect(state.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('WorkflowConfig type structure', () => {
  it('DEFAULT_WORKFLOW satisfies the WorkflowConfig interface', () => {
    const config: WorkflowConfig = DEFAULT_WORKFLOW
    expect(config.name).toBeTypeOf('string')
    expect(config.description).toBeTypeOf('string')
    expect(Array.isArray(config.states)).toBe(true)
    expect(Array.isArray(config.transitions)).toBe(true)
  })

  it('each state has the required properties', () => {
    for (const state of DEFAULT_WORKFLOW.states) {
      expect(state).toHaveProperty('name')
      expect(state).toHaveProperty('isInitial')
      expect(state).toHaveProperty('isFinal')
      expect(state).toHaveProperty('color')
      expect(typeof state.name).toBe('string')
      expect(typeof state.isInitial).toBe('boolean')
      expect(typeof state.isFinal).toBe('boolean')
      expect(typeof state.color).toBe('string')
    }
  })

  it('each transition has the required properties', () => {
    for (const transition of DEFAULT_WORKFLOW.transitions) {
      expect(transition).toHaveProperty('from')
      expect(transition).toHaveProperty('to')
      expect(transition).toHaveProperty('name')
      expect(transition).toHaveProperty('allowedRoles')
      expect(typeof transition.from).toBe('string')
      expect(typeof transition.to).toBe('string')
      expect(typeof transition.name).toBe('string')
      expect(Array.isArray(transition.allowedRoles)).toBe(true)
    }
  })
})
