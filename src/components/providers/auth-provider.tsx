'use client'

import { useSession } from 'next-auth/react'
import type { Role, OrganizationType } from '@prisma/client'

interface AuthContextType {
  user: {
    id: string
    email: string
    name: string
    role: Role
    organizationId: string
    organizationName: string
    organizationSlug: string
    organizationType: OrganizationType
    organizationCode: string
    departmentId: string | null
  } | null
  isLoading: boolean
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isOrgAdmin: boolean
}

export function useAuth(): AuthContextType {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        organizationId: session.user.organizationId,
        organizationName: session.user.organizationName,
        organizationSlug: session.user.organizationSlug,
        organizationType: session.user.organizationType,
        organizationCode: session.user.organizationCode,
        departmentId: session.user.departmentId,
      }
    : null

  return {
    user,
    isLoading,
    isAuthenticated,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isOrgAdmin: user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN',
  }
}
