'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, BarChart3, Users, FileText, Activity, TrendingUp, HardDrive, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { organizationTypeLabels, planLabels, statusLabels, classificationLabels, typeLabels } from '@/lib/constants'

const COLORS = ['#7c3aed', '#0d9488', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#f97316', '#6366f1']

export default function SuperAdminAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/platform').then(r => r.json()).then(d => setStats(d)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>

  const s = stats?.stats || {}
  const growth = stats?.growth || {}

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Analytique</h1><p className="text-muted-foreground">Statistiques et analyses de la plateforme</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-purple-600" /><div><p className="text-2xl font-bold">{s.totalUsers || 0}</p><p className="text-xs text-muted-foreground">Utilisateurs</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-teal-600" /><div><p className="text-2xl font-bold">{s.totalDocs || 0}</p><p className="text-xs text-muted-foreground">Documents</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-amber-600" /><div><p className="text-2xl font-bold">{s.activeWorkflows || 0}</p><p className="text-xs text-muted-foreground">Workflows actifs</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{s.activeOrgs || 0}</p><p className="text-xs text-muted-foreground">Orgs actives</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Croissance utilisateurs</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={250}><LineChart data={growth.usersPerMonth || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} name="Nouveaux" /></LineChart></ResponsiveContainer></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Croissance documents</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={growth.docsPerMonth || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Nouveaux" /></BarChart></ResponsiveContainer></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Documents par statut</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={250}><PieChart><Pie dataKey="value" data={(stats?.docsByStatus || []).map((d: any) => ({ name: statusLabels[d.status] || d.status, value: d.count }))} cx="50%" cy="50%" outerRadius={80} label fontSize={11}>{(stats?.docsByStatus || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend fontSize={11} /></PieChart></ResponsiveContainer></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Documents par classification</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={(stats?.docsByClassification || []).map((d: any) => ({ name: classificationLabels[d.classification] || d.classification, count: d.count }))} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="name" fontSize={12} width={100} /><Tooltip /><Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Organisations par type</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={(stats?.orgsByType || []).map((d: any) => ({ name: organizationTypeLabels[d.type] || d.type, count: d.count }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={60} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">Organisations par plan</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={250}><PieChart><Pie dataKey="value" data={(stats?.orgsByPlan || []).map((d: any) => ({ name: planLabels[d.plan] || d.plan, value: d.count }))} cx="50%" cy="50%" outerRadius={80} label fontSize={11}>{(stats?.orgsByPlan || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend fontSize={11} /></PieChart></ResponsiveContainer></CardContent></Card>
      </div>

      {/* Storage usage table */}
      <Card><CardHeader><CardTitle className="text-base">Consommation stockage</CardTitle></CardHeader>
      <CardContent><div className="space-y-2">{(stats?.storageUsage || []).slice(0, 10).map((s: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm w-40 truncate">{s.organizationName}</span>
          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden"><div className="bg-purple-600 h-full rounded-full" style={{ width: Math.min(s.usagePercent, 100) + '%' }} /></div>
          <span className="text-xs text-muted-foreground w-16">{(s.totalFileSize / 1048576).toFixed(1)} Mo</span>
          <span className="text-xs text-muted-foreground w-12">{s.usagePercent}%</span>
        </div>
      ))}{(stats?.storageUsage || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donn\u00e9e</p>}</div></CardContent></Card>
    </div>
  )
}
