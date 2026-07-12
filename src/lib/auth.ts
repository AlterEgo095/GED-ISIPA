import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import type { Role, OrganizationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
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
    }
  }
  interface User {
    role: Role
    organizationId: string
    organizationName: string
    organizationSlug: string
    organizationType: OrganizationType
    organizationCode: string
    departmentId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    organizationId: string
    organizationName: string
    organizationSlug: string
    organizationType: OrganizationType
    organizationCode: string
    departmentId: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        orgCode: { label: 'Code organisation', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        })

        if (!user || !user.isActive) {
          throw new Error('Utilisateur introuvable ou inactif')
        }

        // Secure password comparison using bcrypt
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Mot de passe incorrect')
        }

        // SUPER_ADMIN bypasses org code requirement entirely — they are platform admin, not bound to one org
        if (user.role === 'SUPER_ADMIN') {
          // No org code needed for platform admin, skip validation
        } else {
          // Regular org users MUST provide org code for multi-tenant verification
          if (!credentials.orgCode) {
            throw new Error('Code organisation requis')
          }
          if (user.organization.code !== credentials.orgCode) {
            throw new Error('Code organisation invalide')
          }
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        // Create audit log
        await db.auditLog.create({
          data: {
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id,
            details: 'Connexion réussie',
            organizationId: user.organizationId,
            userId: user.id,
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          organizationSlug: user.organization.slug,
          organizationType: user.organization.type,
          organizationCode: user.organization.code,
          departmentId: user.departmentId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.organizationSlug = user.organizationSlug
        token.organizationType = user.organizationType
        token.organizationCode = user.organizationCode
        token.departmentId = user.departmentId
      }
      // Refresh role/org data from DB on session update to prevent stale permissions
      if (trigger === 'update' && token.id) {
        const freshUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: { organization: true },
        })
        if (freshUser) {
          token.role = freshUser.role
          token.organizationId = freshUser.organizationId
          token.organizationName = freshUser.organization.name
          token.organizationSlug = freshUser.organization.slug
          token.organizationType = freshUser.organization.type
          token.organizationCode = freshUser.organization.code
          token.departmentId = freshUser.departmentId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.organizationId = token.organizationId
        session.user.organizationName = token.organizationName
        session.user.organizationSlug = token.organizationSlug
        session.user.organizationType = token.organizationType
        session.user.organizationCode = token.organizationCode
        session.user.departmentId = token.departmentId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: '__Secure-next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: '__Host-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: '__Secure-next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
}
