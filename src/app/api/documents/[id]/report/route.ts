import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { analyzeDocumentText, compareToKnowledgeBase, generateAnalysisReport } from '@/lib/ai/analysis'
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'

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
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'

  const document = await db.document.findFirst({ where: { id, organizationId: orgId } })
  if (!document) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  try {
    // Fetch all metadata
    const keys = ['extracted_text', 'extraction_method', 'word_count', 'language',
      'ai_summary', 'ai_keywords', 'ai_category', 'ai_entities', 'ai_suggested_tags',
      'ai_suggested_classification', 'ai_sentiment', 'ai_quality_score',
      'kb_similar_docs', 'kb_insights']
    const metadata = await db.documentMetadata.findMany({ where: { documentId: id, key: { in: keys } } })
    const map: Record<string, string> = {}
    for (const m of metadata) map[m.key] = m.value

    const text = map.extracted_text || ''
    const analysis = {
      summary: map.ai_summary || 'Non analysé',
      keywords: map.ai_keywords ? JSON.parse(map.ai_keywords) : [],
      category: map.ai_category || 'Non classé',
      language: map.ai_language || 'inconnu',
      entities: map.ai_entities ? JSON.parse(map.ai_entities) : [],
      suggestedTags: map.ai_suggested_tags ? JSON.parse(map.ai_suggested_tags) : [],
      suggestedClassification: (map.ai_suggested_classification as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED') || 'INTERNAL',
      sentiment: (map.ai_sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
      wordCount: map.word_count ? parseInt(map.word_count) : 0,
      qualityScore: map.ai_quality_score ? parseInt(map.ai_quality_score) : 0,
    }
    const comparison = {
      similarDocuments: map.kb_similar_docs ? JSON.parse(map.kb_similar_docs) : [],
      insights: map.kb_insights || 'Aucune comparaison disponible.',
    }

    const report = await generateAnalysisReport({
      documentTitle: document.title,
      documentType: document.type,
      text,
      analysis,
      comparison,
    })

    if (format === 'docx') {
      // Generate DOCX
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: report.title,
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              children: [new TextRun({ text: `Généré le ${new Date(report.generatedAt).toLocaleString('fr-FR')}`, italics: true, color: '666666' })],
            }),
            new Paragraph({ text: '' }),
            ...report.sections.flatMap(section => [
              new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ children: [new TextRun(section.content)] }),
              new Paragraph({ text: '' }),
            ]),
          ],
        }],
      })

      const buffer = await Packer.toBuffer(doc)

      // Audit log
      await db.auditLog.create({
        data: {
          action: 'READ',
          entityType: 'Document',
          entityId: id,
          details: 'Rapport DOCX généré',
          organizationId: orgId,
          userId: token.id as string,
          documentId: id,
        },
      })

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="rapport-${document.reference}.docx"`,
        },
      })
    }

    // JSON format
    return NextResponse.json(report)
  } catch (error: any) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: error.message || 'Erreur génération rapport' }, { status: 500 })
  }
}