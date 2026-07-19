import { NextAuthProvider } from '@/components/providers/next-auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Shield, FileText, Lock, Sparkles, Cloud } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NextAuthProvider>
        <div className="min-h-screen-safe flex flex-col lg:flex-row bg-background safe-all">
          {/* Hero panel — desktop only */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white p-12 flex-col justify-between relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-teal-400/20 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm font-bold text-lg">
                  AEIP
                </div>
                <div>
                  <p className="font-semibold text-lg">GED-ISIPA</p>
                  <p className="text-teal-100 text-sm">Enterprise Platform</p>
                </div>
              </div>

              <h1 className="text-4xl font-bold leading-tight mb-4">
                Gestion Électronique<br />de Documents
              </h1>
              <p className="text-teal-100 text-lg mb-12 max-w-md">
                Plateforme multi-tenant SaaS pour la gestion, l'analyse et l'archivage
                intelligent de vos documents.
              </p>

              <div className="space-y-4">
                <FeatureItem icon={FileText} title="Gestion documentaire complète" desc="Versioning, classification, workflows, rétention" />
                <FeatureItem icon={Sparkles} title="IA intégrée" desc="OCR, extraction automatique, recherche sémantique" />
                <FeatureItem icon={Shield} title="Sécurité entreprise" desc="Chiffrement au repos, audit trail, multi-tenant" />
                <FeatureItem icon={Cloud} title="Accessibilité universelle" desc="PWA installable, hors ligne, multi-appareils" />
              </div>
            </div>

            <div className="relative z-10 text-teal-100 text-sm">
              <Lock className="inline h-4 w-4 mr-1" />
              Connexion sécurisée · Vos données sont chiffrées
            </div>
          </div>

          {/* Form panel */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12 safe-y">
            <div className="w-full max-w-lg">
              {/* Mobile header */}
              <div className="text-center mb-8 lg:hidden">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-xl mb-4">
                  AEIP
                </div>
                <h1 className="text-2xl font-bold">AEIP Enterprise Platform</h1>
                <p className="text-muted-foreground mt-1">Gestion Électronique de Documents</p>
              </div>

              {/* Desktop header */}
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold">Connexion</h2>
                <p className="text-muted-foreground mt-1">Connectez-vous à votre espace GED-ISIPA</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </NextAuthProvider>
    </ThemeProvider>
  )
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-teal-100 text-sm">{desc}</p>
      </div>
    </div>
  )
}
