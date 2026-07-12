import { db } from '@/lib/db'

// Default AI settings with their metadata
const AI_SETTINGS_DEFAULTS: Record<string, { value: string; category: string; isSecret: boolean; description: string }> = {
  'ai_api_url': { value: 'https://api.openai.com/v1', category: 'ai', isSecret: false, description: 'URL de l\'API IA (compatible OpenAI)' },
  'ai_api_key': { value: '', category: 'ai', isSecret: true, description: 'Clé API pour le service IA' },
  'ai_chat_model': { value: 'gpt-4o-mini', category: 'ai', isSecret: false, description: 'Modèle de chat (ex: gpt-4o-mini, gpt-4o)' },
  'ai_embedding_model': { value: 'text-embedding-3-small', category: 'ai', isSecret: false, description: 'Modèle d\'embeddings' },
  'ai_classification_model': { value: 'gpt-4o-mini', category: 'ai', isSecret: false, description: 'Modèle de classification' },
  'ai_metadata_model': { value: 'gpt-4o-mini', category: 'ai', isSecret: false, description: 'Modèle d\'extraction de métadonnées' },
  'ai_ocr_language': { value: 'fra', category: 'ai_ocr', isSecret: false, description: 'Langue OCR par défaut (fra, eng, ara)' },
  'ai_ocr_dpi': { value: '300', category: 'ai_ocr', isSecret: false, description: 'DPI pour le traitement OCR' },
  'ai_ocr_engine': { value: 'tesseract', category: 'ai_ocr', isSecret: false, description: 'Moteur OCR (tesseract, pdftotext)' },
  'ai_ocr_auto_run': { value: 'false', category: 'ai_ocr', isSecret: false, description: 'OCR automatique à l\'upload' },
  'ai_embedding_auto_run': { value: 'false', category: 'ai', isSecret: false, description: 'Embeddings automatiques à l\'upload' },
  'ai_classification_auto_run': { value: 'false', category: 'ai', isSecret: false, description: 'Classification automatique à l\'upload' },
  'ai_enabled': { value: 'false', category: 'ai', isSecret: false, description: 'Activer les fonctionnalités IA' },
  'ai_chat_enabled': { value: 'false', category: 'ai', isSecret: false, description: 'Activer le chat IA' },
  'ai_search_enabled': { value: 'false', category: 'ai', isSecret: false, description: 'Activer la recherche sémantique' },
  'ai_ocr_enabled': { value: 'false', category: 'ai_ocr', isSecret: false, description: 'Activer l\'OCR' },
  'ai_classification_enabled': { value: 'false', category: 'ai', isSecret: false, description: 'Activer la classification IA' },
  'ai_chunk_size': { value: '1500', category: 'ai', isSecret: false, description: 'Taille des chunks (caractères)' },
  'ai_chunk_overlap': { value: '200', category: 'ai', isSecret: false, description: 'Chevauchement des chunks' },
  'ai_max_tokens_chat': { value: '4096', category: 'ai', isSecret: false, description: 'Max tokens réponse chat' },
}

export interface AiConfigGroup {
  key: string
  label: string
  settings: {
    key: string
    value: string
    defaultValue: string
    isSecret: boolean
    description: string
  }[]
}

export async function getAiConfig(key: string): Promise<string> {
  // Try DB first, fallback to env var, then default
  const setting = await db.systemSetting.findUnique({ where: { key } })
  if (setting?.value) return setting.value
  
  // Map to env var names
  const envMap: Record<string, string> = {
    'ai_api_url': 'AI_API_URL',
    'ai_api_key': 'AI_API_KEY',
    'ai_chat_model': 'AI_CHAT_MODEL',
    'ai_embedding_model': 'AI_EMBEDDING_MODEL',
    'ai_classification_model': 'AI_CLASSIFICATION_MODEL',
    'ai_metadata_model': 'AI_METADATA_MODEL',
    'ai_enabled': 'NEXT_PUBLIC_AI_ENABLED',
  }
  
  const envKey = envMap[key]
  if (envKey && process.env[envKey]) return process.env[envKey]
  
  return AI_SETTINGS_DEFAULTS[key]?.value ?? ''
}

export async function getAllAiConfig(): Promise<Record<string, string>> {
  const settings = await db.systemSetting.findMany({ where: { category: { startsWith: 'ai' } } })
  const configMap: Record<string, string> = {}
  
  for (const [key, meta] of Object.entries(AI_SETTINGS_DEFAULTS)) {
    const dbSetting = settings.find(s => s.key === key)
    configMap[key] = dbSetting?.value ?? meta.value
  }
  
  return configMap
}

export async function setAiConfig(key: string, value: string): Promise<void> {
  const meta = AI_SETTINGS_DEFAULTS[key]
  await db.systemSetting.upsert({
    where: { key },
    update: { value, category: meta?.category ?? 'ai', isSecret: meta?.isSecret ?? false },
    create: { key, value, category: meta?.category ?? 'ai', isSecret: meta?.isSecret ?? false },
  })
}

export async function setAiConfigBatch(settings: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await setAiConfig(key, value)
  }
}

export async function getAiConfigGroups(): Promise<AiConfigGroup[]> {
  const allConfig = await getAllAiConfig()
  
  const groups: AiConfigGroup[] = [
    {
      key: 'general',
      label: 'Configuration Générale IA',
      settings: ['ai_enabled', 'ai_api_url', 'ai_api_key'].map(k => ({
        key: k,
        value: allConfig[k] ?? '',
        defaultValue: AI_SETTINGS_DEFAULTS[k]?.value ?? '',
        isSecret: AI_SETTINGS_DEFAULTS[k]?.isSecret ?? false,
        description: AI_SETTINGS_DEFAULTS[k]?.description ?? '',
      })),
    },
    {
      key: 'models',
      label: 'Modèles IA',
      settings: ['ai_chat_model', 'ai_embedding_model', 'ai_classification_model', 'ai_metadata_model'].map(k => ({
        key: k,
        value: allConfig[k] ?? '',
        defaultValue: AI_SETTINGS_DEFAULTS[k]?.value ?? '',
        isSecret: AI_SETTINGS_DEFAULTS[k]?.isSecret ?? false,
        description: AI_SETTINGS_DEFAULTS[k]?.description ?? '',
      })),
    },
    {
      key: 'ocr',
      label: 'Configuration OCR',
      settings: ['ai_ocr_enabled', 'ai_ocr_language', 'ai_ocr_dpi', 'ai_ocr_engine', 'ai_ocr_auto_run'].map(k => ({
        key: k,
        value: allConfig[k] ?? '',
        defaultValue: AI_SETTINGS_DEFAULTS[k]?.value ?? '',
        isSecret: AI_SETTINGS_DEFAULTS[k]?.isSecret ?? false,
        description: AI_SETTINGS_DEFAULTS[k]?.description ?? '',
      })),
    },
    {
      key: 'features',
      label: 'Fonctionnalités IA',
      settings: ['ai_chat_enabled', 'ai_search_enabled', 'ai_classification_enabled', 'ai_embedding_auto_run', 'ai_classification_auto_run'].map(k => ({
        key: k,
        value: allConfig[k] ?? '',
        defaultValue: AI_SETTINGS_DEFAULTS[k]?.value ?? '',
        isSecret: AI_SETTINGS_DEFAULTS[k]?.isSecret ?? false,
        description: AI_SETTINGS_DEFAULTS[k]?.description ?? '',
      })),
    },
    {
      key: 'advanced',
      label: 'Paramètres Avancés',
      settings: ['ai_chunk_size', 'ai_chunk_overlap', 'ai_max_tokens_chat'].map(k => ({
        key: k,
        value: allConfig[k] ?? '',
        defaultValue: AI_SETTINGS_DEFAULTS[k]?.value ?? '',
        isSecret: AI_SETTINGS_DEFAULTS[k]?.isSecret ?? false,
        description: AI_SETTINGS_DEFAULTS[k]?.description ?? '',
      })),
    },
  ]
  
  return groups
}

export async function testAiConnection(): Promise<{ success: boolean; message: string; models?: string[] }> {
  const apiUrl = await getAiConfig('ai_api_url')
  const apiKey = await getAiConfig('ai_api_key')
  
  if (!apiKey) {
    return { success: false, message: 'Clé API non configurée' }
  }
  
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      return { success: false, message: `Erreur API: ${response.status} ${response.statusText}` }
    }
    
    const data = await response.json()
    const models = (data.data || []).map((m: any) => m.id).slice(0, 20)
    return { success: true, message: `Connexion réussie - ${models.length} modèles disponibles`, models }
  } catch (error: any) {
    return { success: false, message: `Échec de connexion: ${error.message}` }
  }
}
