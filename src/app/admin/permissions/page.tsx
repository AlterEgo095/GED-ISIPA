'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Shield, Users, FileText, Boxes, Workflow, CreditCard, Settings, Eye, Building2 } from 'lucide-react'
import { roleLabels, roleColors } from '@/lib/constants'
import type { Role, Resource, Action } from '@/lib/permissions'
import { PERMISSION_MATRIX, hasPermission, getRoleLevel } from '@/lib/permissions'

const RESOURCES: { key: Resource; label: string; icon: any }[] = [
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'departments', label: 'D\u00e9partements', icon: Building2 },
  { key: 'modules', label: 'Modules', icon: Boxes },
  { key: 'workflows', label: 'Workflows', icon: Workflow },
  { key: 'billing', label: 'Facturation', icon: CreditCard },
  { key: 'settings', label: 'Param\u00e8tres', icon: Settings },
  { key: 'audit', label: 'Audit', icon: Eye },
  { key: 'organizations', label: 'Organisations', icon: Building2 },
]

const ACTIONS: Action[] = ['create', 'read', 'update', 'delete', 'manage', 'approve', 'reject', 'archive', 'restore', 'publish', 'export', 'share']

const ACTION_LABELS: Record<string, string> = {
  create: 'Cr\u00e9er', read: 'Lire', update: 'Modifier', delete: 'Supprimer', manage: 'G\u00e9rer',
  approve: 'Approuver', reject: 'Rejeter', archive: 'Archiver', restore: 'Restaurer',
  publish: 'Publier', export: 'Exporter', share: 'Partager',
}

const ROLES: Role[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'DEAN', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT', 'DOCTOR', 'LAWYER', 'PROFESSOR', 'NURSE', 'PARALEGAL', 'USER', 'VIEWER']

export default function AdminPermissionsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Permissions RBAC</h1><p className="text-muted-foreground">Matrice des r\u00f4les et permissions</p></div>

      {/* Role Hierarchy */}
      <Card><CardHeader><CardTitle className="text-base">Hi\u00e9rarchie des r\u00f4les</CardTitle></CardHeader>
      <CardContent><div className="flex flex-wrap gap-2">
        {ROLES.map(role => (
          <div key={role} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 ${roleColors[role] || 'bg-gray-100'}`}>
            <span className="font-medium text-sm">{roleLabels[role]}</span>
            <Badge variant="outline" className="text-xs">Niveau {getRoleLevel(role)}</Badge>
          </div>
        ))}
      </div></CardContent></Card>

      {/* Permission Matrix */}
      <Card><CardHeader><CardTitle className="text-base">Matrice de permissions</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead className="sticky left-0 bg-background">Ressource / Action</TableHead>
          {ROLES.slice(0, 6).map(role => <TableHead key={role} className="text-xs text-center min-w-[80px]"><span className="writing-mode-vertical transform rotate-0">{roleLabels[role]}</span></TableHead>)}
        </TableRow></TableHeader>
        <TableBody>{RESOURCES.map(resource => {
          const allActions = [...new Set(ACTIONS.filter(a => PERMISSION_MATRIX.SUPER_ADMIN[resource.key]?.includes(a) || PERMISSION_MATRIX.ORG_ADMIN[resource.key]?.includes(a)))]
          return allActions.map(action => (
            <TableRow key={`${resource.key}-${action}`}>
              <TableCell className="sticky left-0 bg-background font-medium text-sm">
                <span className="flex items-center gap-2">{<resource.icon className="h-3 w-3" />}{resource.label} - {ACTION_LABELS[action]}</span>
              </TableCell>
              {ROLES.slice(0, 6).map(role => (
                <TableCell key={role} className="text-center">
                  {hasPermission(role, resource.key, action) ? <Badge className="bg-green-100 text-green-800 text-xs">Oui</Badge> : <Badge variant="secondary" className="text-xs">-</Badge>}
                </TableCell>
              ))}
            </TableRow>
          ))
        })}</TableBody></Table>
      </CardContent></Card>

      {/* Inheritance explanation */}
      <Card><CardHeader><CardTitle className="text-base">H\u00e9ritage</CardTitle></CardHeader>
      <CardContent className="text-sm space-y-2">
        <p>Les r\u00f4les suivent une hi\u00e9rarchie stricte : SUPER_ADMIN &gt; ORG_ADMIN &gt; Manager &gt; User &gt; Viewer</p>
        <p>Les r\u00f4les sp\u00e9cialis\u00e9s (DEAN, DOCTOR, LAWYER, etc.) h\u00e9ritent des permissions selon leur niveau dans la hi\u00e9rarchie.</p>
        <p>Aucun utilisateur ne peut assigner un r\u00f4le sup\u00e9rieur ou \u00e9gal au sien (protection contre l&apos;escalade).</p>
      </CardContent></Card>
    </div>
  )
}
