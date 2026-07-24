'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NextAuthProvider } from '@/components/providers/next-auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { DashboardErrorBoundary } from '@/components/error-boundary'

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NextAuthProvider>
        <DashboardErrorBoundary>
          <DashboardLayout>{children}</DashboardLayout>
        </DashboardErrorBoundary>
      </NextAuthProvider>
    </ThemeProvider>
  )
}