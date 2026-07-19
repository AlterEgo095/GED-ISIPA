import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { analyzeDocumentText, compareToKnowledgeBase } from '@/lib/ai/analysis'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!hasPermission(token.role as any, 'documents', 'update')) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  const orgId = token.organizationId as string
  const { id } = await params

  const document = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!document) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  try {
    // Get extracted text
    const textMeta = await db.documentMetadata.findUnique({
      where: { documentId_key: { documentId: id, key: 'extracted_text' } },
    })

    if (!textMeta?.value || textMeta.value.length < 20) {
      return NextResponse.json({
        error: 'Aucun texte extrait. Lancez d\'abord l\'extraction de texte.',
        hint: 'POST /api/documents/' + id + '/extract',
      }, { status: 400 })
    }

    const text = textMeta.value

    // Run AI analysis
    const analysis = await analyzeDocumentText(text, document.title, document.type)

    // Compare with knowledge base
    const comparison = await compareToKnowledgeBase(id, orgId, text)

    // Store analysis results as metadata
    const analysisEntries = [
      { key: 'ai_summary', value: analysis.summary, type: 'TEXT' as const },
      { key: 'ai_keywords', value: JSON.stringify(analysis.keywords), type: 'JSON' as const },
      { key: 'ai_category', value: analysis.category, type: 'TEXT' as const },
      { key: 'ai_language', value: analysis.language, type: 'TEXT' as const },
      { key: 'ai_entities', value: JSON.stringify(analysis.entities), type: 'JSON' as const },
      { key: 'ai_suggested_tags', value: JSON.stringify(analysis.suggestedTags), type: 'JSON' as const },
      { key: 'ai_suggested_classification', value: analysis.suggestedClassification, type: 'TEXT' as const },
      { key: 'ai_sentiment', value: analysis.sentiment, type: 'TEXT' as const },
      { key: 'ai_quality_score', value: String(analysis.qualityScore), type: 'NUMBER' as const },
      { key: 'kb_similar_docs', value: JSON.stringify(comparison.similarDocuments), type: 'JSON' as const },
      { key: 'kb_insights', value: comparison.insights, type: 'TEXT' as const },
    ]

    for (const entry of analysisEntries) {
      await db.documentMetadata.upsert({
        where: { documentId_key: { documentId: id, key: entry.key } },
        update: { value: entry.value.slice(0, 50000), type: entry.type },
        create: { documentId: id, key: entry.key, value: entry.value.slice(0, 50000), type: entry.type },
      })
    }

    // Update document tags if suggested
    if (analysis.suggestedTags.length > 0 && !document.tags) {
      await db.document.update({
        where: { id },
        data: { tags: analysis.suggestedTags.join(',') },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: id,
        details: `Analyse IA: catégorie=${analysis.category}, qualité=${analysis.qualityScore}/100, similaires=${comparison.similarDocuments.length}`,
        organizationId: orgId,
        userId: token.id as string,
        documentId: id,
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
      comparison,
    })
  } catch (error: any) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'analyse' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!hasPermission(token.role as any, 'documents', 'read')) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  const orgId = token.organizationId as string
  const { id } = await params
  const document = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!document) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  const keys = ['ai_summary', 'ai_keywords', 'ai_category', 'ai_language', 'ai_entities', 'ai_suggested_tags', 'ai_suggested_classification', 'ai_sentiment', 'ai_quality_score', 'kb_similar_docs', 'kb_insights']
  const metadata = await db.documentMetadata.findMany({ where: { documentId: id, key: { in: keys } } })

  const map: Record<string, string> = {}
  for (const m of metadata) map[m.key] = m.value

  return NextResponse.json({
    summary: map.ai_summary || null,
    keywords: map.ai_keywords ? JSON.parse(map.ai_keywords) : [],
    category: map.ai_category || null,
    language: map.ai_language || null,
    entities: map.ai_entities ? JSON.parse(map.ai_entities) : [],
    suggestedTags: map.ai_suggested_tags ? JSON.parse(map.ai_suggested_tags) : [],
    suggestedClassification: map.ai_suggested_classification || null,
    sentiment: map.ai_sentiment || null,
    qualityScore: map.ai_quality_score ? parseInt(map.ai_quality_score) : null,
    similarDocuments: map.kb_similar_docs ? JSON.parse(map.kb_similar_docs) : [],
    insights: map.kb_insights || null,
  })
}
