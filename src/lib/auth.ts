import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import type { Role, OrganizationType } from '@prisma/client'

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

        // Simple password check (in production, use bcrypt)
        if (user.password !== credentials.password) {
          throw new Error('Mot de passe incorrect')
        }

        // Verify org code if provided
        if (credentials.orgCode && user.organization.code !== credentials.orgCode) {
          throw new Error("Code organisation invalide")
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
    async jwt({ token, user }) {
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
}
