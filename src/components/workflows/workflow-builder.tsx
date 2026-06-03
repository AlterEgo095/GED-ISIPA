'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ArrowRight, GripVertical, Settings } from 'lucide-react'
import type { Role } from '@prisma/client'
import { roleLabels } from '@/lib/constants'

interface WorkflowState {
  id?: string
  name: string
  isInitial: boolean
  isFinal: boolean
  color: string
  order: number
}

interface WorkflowTransition {
  id?: string
  from: string
  to: string
  name: string
  allowedRoles: Role[]
}

interface WorkflowBuilderProps {
  initialStates?: WorkflowState[]
  initialTransitions?: WorkflowTransition[]
  onSave?: (data: { states: WorkflowState[]; transitions: WorkflowTransition[] }) => void
  readOnly?: boolean
}

export function WorkflowBuilder({ initialStates = [], initialTransitions = [], onSave, readOnly = false }: WorkflowBuilderProps) {
  const [localStates, setLocalStates] = useState<WorkflowState[]>([])
  const [localTransitions, setLocalTransitions] = useState<WorkflowTransition[]>([])
  const [newStateName, setNewStateName] = useState('')
  const [newTransFrom, setNewTransFrom] = useState('')
  const [newTransTo, setNewTransTo] = useState('')
  const [newTransName, setNewTransName] = useState('')

  const states = useMemo(() => initialStates.length > 0 ? initialStates : localStates, [initialStates, localStates])
  const transitions = useMemo(() => initialTransitions.length > 0 ? initialTransitions : localTransitions, [initialTransitions, localTransitions])

  const addState = () => {
    if (!newStateName.trim()) return
    const state: WorkflowState = {
      name: newStateName.trim(),
      isInitial: states.length === 0,
      isFinal: false,
      color: '#6b7280',
      order: states.length,
    }
    setLocalStates([...states, state])
    setNewStateName('')
  }

  const removeState = (index: number) => {
    const name = states[index].name
    setLocalStates(states.filter((_, i) => i !== index))
    setLocalTransitions(transitions.filter(t => t.from !== name && t.to !== name))
  }

  const addTransition = () => {
    if (!newTransFrom || !newTransTo || !newTransName.trim()) return
    if (newTransFrom === newTransTo) return

    const transition: WorkflowTransition = {
      from: newTransFrom,
      to: newTransTo,
      name: newTransName.trim(),
      allowedRoles: [],
    }
    setLocalTransitions([...transitions, transition])
    setNewTransName('')
  }

  const removeTransition = (index: number) => {
    setLocalTransitions(transitions.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* States */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            États du Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {states.map((state, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: state.color }}
              />
              <div className="flex-1">
                <span className="font-medium">{state.name}</span>
                <div className="flex gap-1 mt-1">
                  {state.isInitial && <Badge variant="outline" className="text-xs">Initial</Badge>}
                  {state.isFinal && <Badge variant="outline" className="text-xs">Final</Badge>}
                </div>
              </div>
              {!readOnly && (
                <Button variant="ghost" size="icon" onClick={() => removeState(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}

          {!readOnly && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nom de l'état"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addState()}
              />
              <Button onClick={addState} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transitions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Transitions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transitions.map((trans, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
              <Badge>{trans.from}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge>{trans.to}</Badge>
              <span className="text-sm font-medium mx-2">— {trans.name}</span>
              {trans.allowedRoles.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {trans.allowedRoles.map(role => (
                    <span key={role} className={cn('text-xs px-1.5 py-0.5 rounded bg-accent')}>
                      {roleLabels[role]}
                    </span>
                  ))}
                </div>
              )}
              {!readOnly && (
                <Button variant="ghost" size="icon" onClick={() => removeTransition(index)} className="ml-auto">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}

          {!readOnly && states.length >= 2 && (
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">De</label>
                <select
                  value={newTransFrom}
                  onChange={(e) => setNewTransFrom(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Vers</label>
                <select
                  value={newTransTo}
                  onChange={(e) => setNewTransTo(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Nom</label>
                <input
                  type="text"
                  placeholder="Nom transition"
                  value={newTransName}
                  onChange={(e) => setNewTransName(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <Button onClick={addTransition} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!readOnly && onSave && (
        <Button onClick={() => onSave({ states, transitions })} className="w-full">
          Enregistrer le Workflow
        </Button>
      )}
    </div>
  )
}
