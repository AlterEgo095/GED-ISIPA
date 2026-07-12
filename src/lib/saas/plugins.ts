import { db } from '@/lib/db'
import type { PluginStatus } from '@prisma/client'

export interface PluginDefinition {
  key: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  category: string
  tags: string[]
  permissions: string[]
  config: Record<string, unknown>
  settingsSchema?: Record<string, unknown>
}

export const BUILTIN_PLUGINS: PluginDefinition[] = [
  {
    key: 'ai-document',
    name: 'IA Documentaire',
    description: 'OCR, classification intelligente, recherche sémantique et chat sur les documents',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'Brain',
    category: 'ai',
    tags: ['ocr', 'classification', 'chat', 'semantic-search'],
    permissions: ['documents:read', 'ai:access'],
    config: { autoOcr: false, autoClassify: false },
  },
  {
    key: 'email-notifications',
    name: 'Notifications Email',
    description: 'Envoi automatique d\'emails pour les événements importants (approbation, rejet, rappels)',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'Mail',
    category: 'integration',
    tags: ['email', 'notifications'],
    permissions: ['notifications:manage'],
    config: { smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '' },
    settingsSchema: {
      type: 'object',
      properties: {
        smtpHost: { type: 'string', title: 'Hôte SMTP' },
        smtpPort: { type: 'string', title: 'Port SMTP' },
        smtpUser: { type: 'string', title: 'Utilisateur SMTP' },
        smtpPass: { type: 'string', title: 'Mot de passe SMTP', format: 'password' },
        fromEmail: { type: 'string', title: 'Email expéditeur' },
        fromName: { type: 'string', title: 'Nom expéditeur' },
      },
    },
  },
  {
    key: 'slack-integration',
    name: 'Intégration Slack',
    description: 'Recevez des notifications et commandes via Slack',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'MessageSquare',
    category: 'integration',
    tags: ['slack', 'notifications', 'chat'],
    permissions: ['webhooks:manage'],
    config: { webhookUrl: '', channel: '#ged-notifications' },
    settingsSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', title: 'URL Webhook Slack' },
        channel: { type: 'string', title: 'Canal par défaut' },
        notifyOnApprove: { type: 'boolean', title: 'Notifier lors d\'une approbation' },
        notifyOnReject: { type: 'boolean', title: 'Notifier lors d\'un rejet' },
      },
    },
  },
  {
    key: 'cloud-storage',
    name: 'Stockage Cloud',
    description: 'Synchronisez vos documents avec S3, Google Drive ou OneDrive',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'Cloud',
    category: 'integration',
    tags: ['storage', 's3', 'google-drive', 'onedrive'],
    permissions: ['documents:read', 'documents:write'],
    config: { provider: 's3', bucket: '', region: '' },
    settingsSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', title: 'Fournisseur', enum: ['s3', 'google-drive', 'onedrive'] },
        bucket: { type: 'string', title: 'Bucket / Dossier' },
        region: { type: 'string', title: 'Région' },
        accessKey: { type: 'string', title: 'Clé d\'accès' },
        secretKey: { type: 'string', title: 'Clé secrète', format: 'password' },
      },
    },
  },
  {
    key: 'retention-policy',
    name: 'Politique de Rétention',
    description: 'Gestion automatique de la rétention et de l\'archivage des documents selon les règles',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'Clock',
    category: 'utility',
    tags: ['retention', 'archive', 'compliance'],
    permissions: ['documents:read', 'documents:archive'],
    config: { defaultRetention: 365, autoArchive: true },
  },
  {
    key: 'bulk-operations',
    name: 'Opérations en Masse',
    description: 'Import/export en masse, traitement par lots et opérations automatisées',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'Layers',
    category: 'utility',
    tags: ['import', 'export', 'batch'],
    permissions: ['documents:read', 'documents:write'],
    config: { batchSize: 100 },
  },
  {
    key: 'sso-ldap',
    name: 'SSO / LDAP',
    description: 'Authentification unique via LDAP, Active Directory ou SAML',
    version: '1.0.0',
    author: 'GED-ISIPA',
    icon: 'KeyRound',
    category: 'integration',
    tags: ['sso', 'ldap', 'saml', 'authentication'],
    permissions: ['users:manage'],
    config: { provider: 'ldap', serverUrl: '', baseDn: '' },
    settingsSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', title: 'Fournisseur', enum: ['ldap', 'saml'] },
        serverUrl: { type: 'string', title: 'URL du serveur' },
        baseDn: { type: 'string', title: 'Base DN' },
        bindDn: { type: 'string', title: 'Bind DN' },
        bindPassword: { type: 'string', title: 'Mot de passe', format: 'password' },
      },
    },
  },
]

export async function initializeBuiltinPlugins(): Promise<void> {
  for (const plugin of BUILTIN_PLUGINS) {
    await db.plugin.upsert({
      where: { key: plugin.key },
      update: {
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        author: plugin.author,
        icon: plugin.icon,
        category: plugin.category,
        tags: JSON.stringify(plugin.tags),
        permissions: JSON.stringify(plugin.permissions),
        config: JSON.stringify(plugin.config),
        settingsSchema: plugin.settingsSchema ? JSON.stringify(plugin.settingsSchema) : null,
        status: 'PUBLISHED',
      },
      create: {
        key: plugin.key,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        author: plugin.author,
        icon: plugin.icon,
        category: plugin.category,
        tags: JSON.stringify(plugin.tags),
        permissions: JSON.stringify(plugin.permissions),
        config: JSON.stringify(plugin.config),
        settingsSchema: plugin.settingsSchema ? JSON.stringify(plugin.settingsSchema) : null,
        status: 'PUBLISHED',
      },
    })
  }
}

export async function installPlugin(organizationId: string, pluginKey: string): Promise<boolean> {
  const plugin = await db.plugin.findUnique({ where: { key: pluginKey } })
  if (!plugin) throw new Error('Plugin introuvable')
  
  // Check if already installed
  const existing = await db.pluginInstance.findUnique({
    where: { organizationId_pluginId: { organizationId, pluginId: plugin.id } },
  })
  
  if (existing) {
    // Reactivate
    await db.pluginInstance.update({
      where: { id: existing.id },
      data: { isActive: true, settings: plugin.config },
    })
    return true
  }
  
  await db.pluginInstance.create({
    data: {
      organizationId,
      pluginId: plugin.id,
      settings: plugin.config,
      isActive: true,
    },
  })
  
  // Increment downloads
  await db.plugin.update({
    where: { id: plugin.id },
    data: { downloads: { increment: 1 } },
  })
  
  return true
}

export async function uninstallPlugin(organizationId: string, pluginKey: string): Promise<void> {
  const plugin = await db.plugin.findUnique({ where: { key: pluginKey } })
  if (!plugin) throw new Error('Plugin introuvable')
  
  await db.pluginInstance.updateMany({
    where: { organizationId, pluginId: plugin.id },
    data: { isActive: false },
  })
}

export async function getInstalledPlugins(organizationId: string) {
  const instances = await db.pluginInstance.findMany({
    where: { organizationId },
    include: { plugin: true },
  })
  
  return instances.map(i => ({
    id: i.id,
    pluginKey: i.plugin.key,
    name: i.plugin.name,
    description: i.plugin.description,
    version: i.plugin.version,
    icon: i.plugin.icon,
    category: i.plugin.category,
    isActive: i.isActive,
    settings: JSON.parse(i.settings || '{}'),
    installedAt: i.installedAt,
  }))
}

export async function getAvailablePlugins(organizationId: string) {
  const allPlugins = await db.plugin.findMany({
    where: { status: 'PUBLISHED' },
  })
  
  const installed = await db.pluginInstance.findMany({
    where: { organizationId },
    select: { pluginId: true, isActive: true },
  })
  
  const installedMap = new Map(installed.map(i => [i.pluginId, i.isActive]))
  
  return allPlugins.map(p => ({
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description || '',
    version: p.version,
    author: p.author,
    icon: p.icon,
    category: p.category,
    tags: JSON.parse(p.tags || '[]'),
    downloads: p.downloads,
    rating: p.rating,
    isInstalled: installedMap.has(p.id),
    isActive: installedMap.get(p.id) ?? false,
  }))
}
