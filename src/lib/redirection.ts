import type { OrganizationType, Role } from '@prisma/client'
import {
  LayoutDashboard,
  FileText,
  Archive,
  Shield,
  Settings,
  Bell,
  Workflow,
  Boxes,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  GraduationCap,
  Stethoscope,
  Building,
  Landmark,
  Scale,
  Eye,
  Activity,
  Monitor,
  KeyRound,
  Lock,
  HardDrive,
  Clock,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
  children?: NavItem[]
}

export function getDashboardRoute(orgType: OrganizationType): string {
  const routes: Record<OrganizationType, string> = {
    UNIVERSITY: '/dashboard/university',
    HOSPITAL: '/dashboard/hospital',
    COMPANY: '/dashboard/company',
    GOVERNMENT: '/dashboard/government',
    SME: '/dashboard/sme',
    LAW_FIRM: '/dashboard/law-firm',
    INSTITUTION: '/dashboard',
    NGO: '/dashboard',
  }
  return routes[orgType] || '/dashboard'
}

export function getNavigationItems(orgType: OrganizationType, role: Role): NavItem[] {
  const baseItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      href: getDashboardRoute(orgType),
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'VIEWER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'],
    },
    {
      label: 'Documents',
      href: '/documents',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'],
    },
    {
      label: 'Archives',
      href: '/archives',
      icon: Archive,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'LAWYER', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'],
    },
    {
      label: 'Workflows',
      href: '/workflows',
      icon: Workflow,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'DEAN', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'],
    },
    {
      label: 'Modules',
      href: '/modules',
      icon: Boxes,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN'],
    },
    {
      label: 'Audit',
      href: '/audit',
      icon: Shield,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'CIVIL_SERVANT'],
    },
    {
      label: 'Administration',
      href: '/administration',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN'],
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'VIEWER', 'DEAN', 'PROFESSOR', 'DOCTOR', 'NURSE', 'LAWYER', 'PARALEGAL', 'CFO', 'HR_MANAGER', 'CIVIL_SERVANT'],
    },
    {
      label: 'Param\u00e8tres',
      href: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN'],
    },
  ]

  const orgSpecificItems = getOrgSpecificNavItems(orgType)
  const allItems = [...orgSpecificItems, ...baseItems]
  return allItems.filter(item => item.roles.includes(role))
}

function getOrgSpecificNavItems(orgType: OrganizationType): NavItem[] {
  switch (orgType) {
    case 'UNIVERSITY': return [{ label: 'Acad\u00e9mique', href: '/modules?key=ACADEMIC', icon: GraduationCap, roles: ['ORG_ADMIN', 'DEAN', 'PROFESSOR'] }]
    case 'HOSPITAL': return [{ label: 'M\u00e9dical', href: '/modules?key=MEDICAL', icon: Stethoscope, roles: ['ORG_ADMIN', 'DOCTOR', 'NURSE'] }]
    case 'COMPANY': return [{ label: 'Entreprise', href: '/modules?key=FINANCE', icon: Building, roles: ['ORG_ADMIN', 'CFO', 'HR_MANAGER'] }]
    case 'GOVERNMENT': return [{ label: 'Proc\u00e9dures', href: '/modules?key=PROCEDURE', icon: Landmark, roles: ['ORG_ADMIN', 'CIVIL_SERVANT'] }]
    case 'LAW_FIRM': return [{ label: 'Juridique', href: '/modules?key=LEGAL', icon: Scale, roles: ['ORG_ADMIN', 'LAWYER', 'PARALEGAL'] }]
    default: return []
  }
}

export function getSuperAdminNavItems() {
  return [
    { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/organizations', label: 'Organisations', icon: Building2 },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/accounts', label: 'Validation comptes', icon: Users },
    { href: '/admin/supervision', label: 'Supervision', icon: Eye },
    { href: '/admin/analytics', label: 'Analytique', icon: BarChart3 },
    { href: '/admin/billing', label: 'Facturation', icon: CreditCard },
    { href: '/admin/modules', label: 'Modules', icon: Boxes },
    { href: '/admin/settings', label: 'Param\u00e8tres', icon: Settings },
    { href: '/admin/audit', label: 'Audit Logs', icon: Shield },
    { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
    { href: '/admin/sessions', label: 'Sessions', icon: Monitor },
    { href: '/admin/permissions', label: 'Permissions', icon: Lock },
    { href: '/admin/backups', label: 'Sauvegardes', icon: HardDrive },
  ]
}
