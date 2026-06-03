'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { WorkflowBuilder } from '@/components/workflows/workflow-builder'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Role } from '@prisma/client'

export default function WorkflowDetailPage() {
  const params = useParams()
  const [workflow, setWorkflow] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/workflows/${params.id}`)
        .then(res => res.json())
        .then(data => setWorkflow(data))
        .finally(() => setLoading(false))
    }
  }, [params.id])

  const handleSave = async (data: { states: unknown[]; transitions: unknown[] }) => {
    // Save workflow changes
    console.log('Save workflow:', data)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>
  }

  if (!workflow) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Workflow introuvable</p></div>
  }

  const states = (workflow.states as Record<string, unknown>[])?.map(s => ({
    id: s.id as string,
    name: s.name as string,
    isInitial: s.isInitial as boolean,
    isFinal: s.isFinal as boolean,
    color: s.color as string,
    order: s.order as number,
  })) || []

  const transitions = (workflow.transitions as Record<string, unknown>[])?.map(t => ({
    id: t.id as string,
    from: (t.fromState as Record<string, string>)?.name || '',
    to: (t.toState as Record<string, string>)?.name || '',
    name: t.name as string,
    allowedRoles: JSON.parse(t.allowedRoles as string || '[]') as Role[],
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workflows">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{workflow.name as string}</h1>
          <p className="text-muted-foreground">{workflow.description as string || 'Éditeur de workflow'}</p>
        </div>
      </div>

      <WorkflowBuilder
        initialStates={states}
        initialTransitions={transitions}
        onSave={handleSave}
      />
    </div>
  )
}
