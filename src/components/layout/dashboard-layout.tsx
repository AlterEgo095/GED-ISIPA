'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Settings,
  User,
  ChevronLeft,
  Moon,
  Sun,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { getNavigationItems } from '@/lib/redirection'
import { roleLabels, organizationTypeLabels } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Redirect SUPER_ADMIN to admin layout
  useEffect(() => {
    if (status === 'loading') return
    if (session?.user?.role === 'SUPER_ADMIN' && !pathname.startsWith('/admin')) {
      router.replace('/admin/dashboard')
    }
  }, [session, status, pathname, router])

  const orgType = session?.user?.organizationType as never
  const role = session?.user?.role as never
  const navItems = orgType && role ? getNavigationItems(orgType, role) : []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/documents?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const orgInitials = session?.user?.organizationName?.substring(0, 2).toUpperCase() || 'AE'
  const orgColor = session?.user?.organizationType ? 'bg-gradient-to-br from-teal-500 to-teal-700' : 'bg-gradient-to-br from-gray-500 to-gray-700'

  // Group nav items into sections
  const mainNavItems = navItems.filter(item => 
    ['Documents', 'Archives', 'Corbeille', 'Workflows', 'Modules'].includes(item.label)
  )
  const systemNavItems = navItems.filter(item => 
    ['Audit', 'Administration', 'Notifications', 'Paramètres'].includes(item.label)
  )
  const dashboardItem = navItems.find(item => item.label === 'Tableau de bord')
  const orgTypeLabel = navItems.find(item => ['Académique', 'Médical', 'Entreprise', 'Gouvernemental', 'Juridique', 'Institutionnel', 'ONG', 'PME'].includes(item.label))

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Org Header - Premium */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
        <div className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold text-sm shadow-md transition-transform hover:scale-105",
          orgColor
        )}>
          {orgInitials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-sm font-semibold truncate tracking-tight">{session?.user?.organizationName || 'Organisation'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="h-3 w-3 text-teal-500" />
              <p className="text-xs text-muted-foreground truncate">{session?.user?.organizationCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav Items - Grouped */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {/* Dashboard */}
          {dashboardItem && (
            <Link
              href={dashboardItem.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                pathname === dashboardItem.href || pathname?.startsWith(dashboardItem.href + '/')
                  ? 'active bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                  : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
              )}
            >
              <dashboardItem.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{dashboardItem.label}</span>}
            </Link>
          )}

          {/* Org Type */}
          {orgTypeLabel && (
            <Link
              href={orgTypeLabel.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                pathname === orgTypeLabel.href || pathname?.startsWith(orgTypeLabel.href + '/')
                  ? 'active bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                  : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
              )}
            >
              <orgTypeLabel.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{orgTypeLabel.label}</span>}
            </Link>
          )}

          {/* Separator */}
          <div className="my-2 mx-2 border-t border-border/50" />

          {/* Main Navigation */}
          {!collapsed && <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Gestion</p>}
          {mainNavItems.map((item, idx) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all stagger-' + (idx + 1),
                  isActive
                    ? 'active bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive && "text-teal-600 dark:text-teal-400")} />
                {!collapsed && <span className={cn(isActive && "font-medium")}>{item.label}</span>}
                {item.label === 'Corbeille' && !collapsed && (
                  <span className="ml-auto text-[10px] bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">0</span>
                )}
              </Link>
            )
          })}

          {/* Separator */}
          <div className="my-2 mx-2 border-t border-border/50" />

          {/* System Navigation */}
          {!collapsed && <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Système</p>}
          {systemNavItems.map((item, idx) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'active bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive && "text-teal-600 dark:text-teal-400")} />
                {!collapsed && <span className={cn(isActive && "font-medium")}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Section - Premium */}
      <div className="border-t border-border/50 px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
            <AvatarFallback className="text-xs bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 dark:from-teal-900 dark:to-teal-800 dark:text-teal-300 font-semibold">
              {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {role ? roleLabels[role] : 'Utilisateur'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      <Toaster position="bottom-right" richColors closeButton />

      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-border/50 bg-background transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-64'
      )}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-2.5 border-t border-border/50 hover:bg-accent/80 transition-all group"
          aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          <ChevronLeft className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Premium */}
        <header className="flex items-center gap-4 border-b border-border/50 px-4 md:px-6 py-3 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden hover:bg-accent">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
                searchFocused ? "text-teal-500" : "text-muted-foreground"
              )} />
              <Input
                placeholder="Rechercher un document, référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "pl-9 input-premium h-9",
                  searchFocused && "border-teal-300 dark:border-teal-700"
                )}
              />
              {searchFocused && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border hidden sm:inline-flex">
                  Entrée
                </kbd>
              )}
            </div>
          </form>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-premium hover:bg-accent"
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => router.push('/notifications')} className="btn-premium hover:bg-accent relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500 animate-pulse-soft" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full btn-premium hover:ring-2 hover:ring-teal-200 dark:hover:ring-teal-800 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 dark:from-teal-900 dark:to-teal-800 dark:text-teal-300 font-semibold text-xs">
                      {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10 ring-2 ring-background">
                    <AvatarFallback className="bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 dark:from-teal-900 dark:to-teal-800 dark:text-teal-300 font-semibold text-sm">
                      {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}