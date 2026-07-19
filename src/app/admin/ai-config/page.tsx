'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  Key,
  TestTube2,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Settings2,
  Cpu,
  ScanText,
  Sparkles,
  Sliders,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiConfigSetting {
  key: string
  value: string
  defaultValue: string
  isSecret: boolean
  description: string
}

interface AiConfigGroup {
  key: string
  label: string
  settings: AiConfigSetting[]
}

// ---------------------------------------------------------------------------
// Constant lookup tables
// ---------------------------------------------------------------------------

const GROUP_ICONS: Record<string, React.ReactNode> = {
  general: <Settings2 className="size-4" />,
  models: <Cpu className="size-4" />,
  ocr: <ScanText className="size-4" />,
  features: <Sparkles className="size-4" />,
  advanced: <Sliders className="size-4" />,
}

const GROUP_TAB_VALUES: Record<string, string> = {
  general: 'general',
  models: 'modeles',
  ocr: 'ocr',
  features: 'fonctionnalites',
  advanced: 'avance',
}

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  defaultModel: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium' },
    { value: 'mistral-small-latest', label: 'Mistral Small' },
  ],
  ocrModel: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  embeddingModel: [
    { value: 'text-embedding-3-large', label: 'Text Embedding 3 Large' },
    { value: 'text-embedding-3-small', label: 'Text Embedding 3 Small' },
    { value: 'text-embedding-ada-002', label: 'Ada 002' },
  ],
}

const OCR_LANG_OPTIONS = [
  { value: 'fra', label: 'Français' },
  { value: 'eng', label: 'Anglais' },
  { value: 'ara', label: 'Arabe' },
  { value: 'mul', label: 'Multilingue' },
]

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'ollama', label: 'Ollama (local)' },
]

// Keys that should render as a provider select
const PROVIDER_KEYS = new Set(['aiProvider', 'provider', 'ai_provider'])

// Keys that should render as a model select
const MODEL_SELECT_KEYS = new Set([
  'defaultModel',
  'ocrModel',
  'embeddingModel',
  'model',
  'ai_model',
])

// Keys that should render as an OCR language select
const OCR_LANG_KEYS = new Set(['ocrLanguage', 'ocr_language', 'ocrLang'])

// Keys that should render as a boolean switch
function isBooleanValue(value: string): boolean {
  return value === 'true' || value === 'false'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AiConfigPage() {
  const [groups, setGroups] = useState<AiConfigGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  // -----------------------------------------------------------------------
  // Fetch config
  // -----------------------------------------------------------------------
  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-config')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setGroups(data.groups || [])
      // Initialise edited values from loaded data
      const vals: Record<string, string> = {}
      for (const group of data.groups || []) {
        for (const s of group.settings) {
          vals[s.key] = s.value
        }
      }
      setEditedValues(vals)
      setTestResult('idle')
    } catch {
      toast.error('Impossible de charger la configuration IA')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // -----------------------------------------------------------------------
  // Derive AI enabled status from settings
  // -----------------------------------------------------------------------
  const aiEnabledKey = Object.keys(editedValues).find(
    (k) => k.toLowerCase().includes('enabled') || k.toLowerCase().includes('active')
  )
  const aiEnabled = aiEnabledKey ? editedValues[aiEnabledKey] === 'true' : false

  // -----------------------------------------------------------------------
  // Value change handler
  // -----------------------------------------------------------------------
  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSwitchChange = (key: string, checked: boolean) => {
    handleChange(key, checked ? 'true' : 'false')
  }

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: editedValues }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }
      toast.success('Configuration IA sauvegardée avec succès')
      fetchConfig()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------------------------------------------------
  // Test connection
  // -----------------------------------------------------------------------
  const handleTest = async () => {
    setTesting(true)
    setTestResult('idle')
    try {
      const res = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: editedValues }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Échec du test')
      setTestResult('success')
      toast.success('Connexion IA réussie !')
    } catch (err) {
      setTestResult('error')
      toast.error(err instanceof Error ? err.message : 'Échec du test de connexion')
    } finally {
      setTesting(false)
    }
  }

  // -----------------------------------------------------------------------
  // Secret visibility toggle
  // -----------------------------------------------------------------------
  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // -----------------------------------------------------------------------
  // Determine which dirty keys exist
  // -----------------------------------------------------------------------
  const getDirtyKeys = (): string[] => {
    const dirty: string[] = []
    for (const g of groups) {
      for (const s of g.settings) {
        if (editedValues[s.key] !== s.value) {
          dirty.push(s.key)
        }
      }
    }
    return dirty
  }
  const dirtyKeys = getDirtyKeys()
  const hasChanges = dirtyKeys.length > 0

  // -----------------------------------------------------------------------
  // Render a single setting row
  // -----------------------------------------------------------------------
  const renderSetting = (setting: AiConfigSetting) => {
    const currentValue = editedValues[setting.key] ?? setting.value
    const isDirty = editedValues[setting.key] !== setting.value
    const isBool = isBooleanValue(setting.value) || isBooleanValue(setting.defaultValue)
    const isProvider = PROVIDER_KEYS.has(setting.key)
    const isModelSelect = MODEL_SELECT_KEYS.has(setting.key)
    const isOcrLang = OCR_LANG_KEYS.has(setting.key)

    return (
      <div
        key={setting.key}
        className={`grid gap-2 rounded-lg border p-4 transition-colors ${
          isDirty ? 'border-primary/40 bg-primary/5' : 'border-border'
        }`}
      >
        {/* Label row */}
        <div className="flex items-center justify-between">
          <Label
            htmlFor={setting.key}
            className="text-sm font-medium flex items-center gap-2"
          >
            {setting.isSecret && <Key className="size-3.5 text-muted-foreground" />}
            {setting.key
              .replace(/([A-Z])/g, ' $1')
              .replace(/_/g, ' ')
              .replace(/^\w/, (c) => c.toUpperCase())
              .trim()}
            {isDirty && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                modifié
              </Badge>
            )}
          </Label>
        </div>

        {/* Description */}
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}

        {/* Input */}
        <div className="mt-1">
          {/* Boolean Switch */}
          {isBool && !isProvider && !isModelSelect && !isOcrLang && (
            <div className="flex items-center gap-3">
              <Switch
                id={setting.key}
                checked={currentValue === 'true'}
                onCheckedChange={(checked) => handleSwitchChange(setting.key, checked)}
              />
              <span className="text-sm text-muted-foreground">
                {currentValue === 'true' ? 'Activé' : 'Désactivé'}
              </span>
            </div>
          )}

          {/* Provider Select */}
          {!isBool && isProvider && (
            <Select
              value={currentValue}
              onValueChange={(val) => handleChange(setting.key, val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Model Select */}
          {!isBool && !isProvider && isModelSelect && (
            <Select
              value={currentValue}
              onValueChange={(val) => handleChange(setting.key, val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                {(MODEL_OPTIONS[setting.key] || MODEL_OPTIONS.defaultModel || []).map(
                  (opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          )}

          {/* OCR Language Select */}
          {!isBool && !isProvider && !isModelSelect && isOcrLang && (
            <Select
              value={currentValue}
              onValueChange={(val) => handleChange(setting.key, val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent>
                {OCR_LANG_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Text / Password Input (secrets and everything else) */}
          {!isBool && !isProvider && !isModelSelect && !isOcrLang && (
            <div className="relative">
              <Input
                id={setting.key}
                type={
                  setting.isSecret && !visibleSecrets[setting.key]
                    ? 'password'
                    : 'text'
                }
                value={currentValue}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                placeholder={setting.defaultValue || 'Valeur…'}
                className={setting.isSecret ? 'pr-10' : ''}
              />
              {setting.isSecret && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => toggleSecretVisibility(setting.key)}
                  aria-label={
                    visibleSecrets[setting.key]
                      ? 'Masquer la valeur'
                      : 'Afficher la valeur'
                  }
                >
                  {visibleSecrets[setting.key] ? (
                    <EyeOff className="size-4 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Loading skeleton
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Chargement de la configuration IA…
        </p>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Aucune configuration IA</h2>
          <p className="text-sm text-muted-foreground">
            Les paramètres de configuration IA ne sont pas encore disponibles.
          </p>
        </div>
        <Button variant="outline" onClick={fetchConfig}>
          Réessayer
        </Button>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuration IA</h1>
            <p className="text-sm text-muted-foreground">
              Configuration de l&apos;intelligence artificielle de la plateforme
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status badge */}
          <Badge
            variant={aiEnabled ? 'default' : 'secondary'}
            className="gap-1.5 px-3 py-1"
          >
            {aiEnabled ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <XCircle className="size-3.5" />
            )}
            {aiEnabled ? 'IA Activée' : 'IA Désactivée'}
          </Badge>

          {/* Test button */}
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="gap-2"
          >
            {testing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : testResult === 'success' ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : testResult === 'error' ? (
              <XCircle className="size-4 text-destructive" />
            ) : (
              <TestTube2 className="size-4" />
            )}
            Tester la connexion
          </Button>

          {/* Global save */}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Sauvegarder
            {hasChanges && (
              <Badge variant="secondary" className="ml-1 px-1.5 text-[10px]">
                {dirtyKeys.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Test result banner                                                 */}
      {/* ----------------------------------------------------------------- */}
      {testResult === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-300">
            La connexion à l&apos;API IA fonctionne correctement.
          </p>
        </div>
      )}
      {testResult === 'error' && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="size-5 text-destructive" />
          <p className="text-sm text-destructive">
            Impossible de se connecter à l&apos;API IA. Vérifiez vos paramètres.
          </p>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Tabs & Content                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue={GROUP_TAB_VALUES[groups[0]?.key] || groups[0]?.key || 'general'}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          {groups.map((group) => (
            <TabsTrigger
              key={group.key}
              value={GROUP_TAB_VALUES[group.key] || group.key}
              className="gap-2"
            >
              {GROUP_ICONS[group.key] || <Settings2 className="size-4" />}
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => {
          const tabValue = GROUP_TAB_VALUES[group.key] || group.key
          // Detect dirty count per group
          const groupDirtyCount = group.settings.filter(
            (s) => editedValues[s.key] !== s.value
          ).length

          return (
            <TabsContent key={group.key} value={tabValue} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {GROUP_ICONS[group.key] || <Settings2 className="size-5" />}
                    {group.label}
                    {groupDirtyCount > 0 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {groupDirtyCount} modification{groupDirtyCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configuration des paramètres {group.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {group.settings.map((setting) => renderSetting(setting))}
                  </div>

                  <Separator className="my-4" />

                  {/* Per-tab save */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Les modifications sont appliquées à l&apos;ensemble de la
                      configuration lors de la sauvegarde.
                    </p>
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      size="sm"
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
