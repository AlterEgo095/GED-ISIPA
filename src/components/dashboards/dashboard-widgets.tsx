'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; label: string }
  className?: string
  iconColor?: string
  loading?: boolean
}

export function StatCard({ title, value, icon: Icon, description, trend, className, iconColor = 'text-teal-600 dark:text-teal-400', loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('card-hover', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <div className="skeleton h-8 w-16 mb-2" />
          <div className="skeleton h-3 w-28" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('card-hover group cursor-default', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground tracking-tight">{title}</CardTitle>
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center transition-colors bg-teal-50 dark:bg-teal-950/50 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50",
          iconColor
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight animate-count-up">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1.5">{description}</p>}
        {trend && (
          <div className={cn(
            'inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full',
            trend.value >= 0 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50' : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/50'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function ChartCard({ title, description, children, className, action }: ChartCardProps) {
  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface RecentListProps {
  title: string
  items: { id: string; label: string; sublabel?: string; badge?: string; badgeColor?: string; href?: string }[]
  className?: string
  loading?: boolean
}

export function RecentList({ title, items, className, loading }: RecentListProps) {
  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="skeleton h-4 w-3/4 mb-2" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="empty-state-icon">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-sm text-muted-foreground">Aucun élément récent</p>
            <p className="text-xs text-muted-foreground mt-1">Les nouveaux documents apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, idx) => (
              <a
                key={item.id}
                href={item.href || '#'}
                className={cn(
                  "flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg transition-colors animate-fade-in-up stagger-" + (idx + 1),
                  item.href ? 'hover:bg-accent/80 cursor-pointer' : ''
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.sublabel && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.sublabel}</p>
                  )}
                </div>
                {item.badge && (
                  <span className={cn(
                    'ml-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap badge-premium',
                    item.badgeColor || 'bg-secondary text-secondary-foreground'
                  )}>
                    <span className={cn(
                      "status-dot",
                      item.badge === 'Brouillon' && 'bg-gray-400',
                      item.badge === 'En attente de révision' && 'bg-amber-400',
                      item.badge === 'Approuvé' && 'bg-emerald-400',
                      item.badge === 'Publié' && 'bg-teal-400',
                      item.badge === 'Rejeté' && 'bg-red-400',
                    )} />
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionsProps {
  actions: { label: string; icon: LucideIcon; onClick: () => void; variant?: 'default' | 'outline' }[]
  className?: string
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions.map((action, idx) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border border-border/50 p-3.5 text-sm font-medium hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 dark:hover:bg-teal-950/30 dark:hover:border-teal-800 dark:hover:text-teal-300 transition-all btn-premium animate-fade-in-up stagger-" + (idx + 1),
                action.variant === 'default' && 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:text-white dark:bg-teal-700 dark:border-teal-700 dark:hover:bg-teal-600'
              )}
            >
              <action.icon className={cn("h-4 w-4", action.variant !== 'default' && "text-teal-600 dark:text-teal-400")} />
              {action.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}