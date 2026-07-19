/**
 * Document analysis: classification, metadata extraction, knowledge-base comparison,
 * and report generation using z-ai-web-dev-sdk.
 */
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

let zaiInstance: ZAI | null = null
async function getZai(): Promise<ZAI> {
  if (!zaiInstance) zaiInstance = await ZAI.create()
  return zaiInstance
}

export interface DocumentAnalysis {
  summary: string
  keywords: string[]
  category: string
  language: string
  entities: Array<{ type: string; value: string }>
  suggestedTags: string[]
  suggestedClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
  sentiment: 'positive' | 'neutral' | 'negative'
  wordCount: number
  qualityScore: number
}

/** Analyze a document's text content using AI. */
export async function analyzeDocumentText(
  text: string,
  title: string,
  type: string
): Promise<DocumentAnalysis> {
  const wordCount = text.split(/\s+/).filter(Boolean).length

  // Default/fallback analysis
  const fallback: DocumentAnalysis = {
    summary: text.slice(0, 300) + (text.length > 300 ? '...' : ''),
    keywords: extractKeywords(text, 10),
    category: type,
    language: detectLanguage(text),
    entities: [],
    suggestedTags: extractKeywords(text, 5),
    suggestedClassification: 'INTERNAL',
    sentiment: 'neutral',
    wordCount,
    qualityScore: Math.min(100, Math.round((wordCount / 10))),
  }

  if (text.length < 20) return fallback

  try {
    const zai = await getZai()
    const prompt = `Analyse ce document et retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec cette structure exacte:
{
  "summary": "résumé en 2-3 phrases",
  "keywords": ["mot1", "mot2", ...],
  "category": "catégorie principale",
  "language": "fr|en|autre",
  "entities": [{"type": "PERSON|ORG|DATE|LOCATION|AMOUNT", "value": "..."}],
  "suggestedTags": ["tag1", "tag2"],
  "suggestedClassification": "PUBLIC|INTERNAL|CONFIDENTIAL|RESTRICTED",
  "sentiment": "positive|neutral|negative",
  "qualityScore": 0-100
}

Document titre: ${title}
Type: ${type}
Contenu (extrait): ${text.slice(0, 4000)}`

    const response = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices?.[0]?.message?.content || ''
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { ...fallback, ...parsed, wordCount }
    }
    return fallback
  } catch (e) {
    console.error('Document analysis failed:', e)
    return fallback
  }
}

/** Simple keyword extraction (frequency-based). */
function extractKeywords(text: string, count: number): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'mais', 'donc',
    'or', 'ni', 'car', 'que', 'qui', 'quoi', 'dont', 'où', 'à', 'au', 'aux', 'en',
    'dans', 'sur', 'sous', 'pour', 'par', 'avec', 'sans', 'ce', 'cette', 'ces', 'son',
    'sa', 'ses', 'leur', 'leurs', 'notre', 'votre', 'the', 'a', 'an', 'and', 'or',
    'but', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will',
    'would', 'could', 'should', 'may', 'might', 'can', 'of', 'in', 'on', 'at', 'to',
    'for', 'with', 'by', 'from', 'as', 'it', 'its', 'this', 'that', 'these', 'those',
  ])
  const words = text.toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
  const freq = new Map<string, number>()
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1)
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w)
}

/** Simple language detection. */
function detectLanguage(text: string): string {
  const fr = /\b(le|la|les|de|des|une|un|et|est|dans|pour|avec|sur|par|que|qui|ce|cette|son|sa|ses)\b/gi
  const en = /\b(the|and|is|are|was|were|in|on|at|for|with|by|that|this|his|her|its)\b/gi
  const frCount = (text.match(fr) || []).length
  const enCount = (text.match(en) || []).length
  if (frCount > enCount) return 'fr'
  if (enCount > frCount) return 'en'
  return 'unknown'
}

/** Compare a document against the knowledge base (other documents in the org). */
export async function compareToKnowledgeBase(
  documentId: string,
  organizationId: string,
  text: string
): Promise<{
  similarDocuments: Array<{ id: string; title: string; similarity: number }>
  insights: string
}> {
  try {
    const zai = await getZai()
    // Get similar docs via semantic search (Qdrant)
    const { semanticSearch } = await import('@/lib/ai/qdrant')
    const similar = await semanticSearch({
      query: text.slice(0, 2000),
      organizationId,
      limit: 5,
      scoreThreshold: 0.5,
    })

    const similarDocs = similar
      .filter(s => s.documentId !== documentId)
      .slice(0, 5)
      .map(s => ({ id: s.documentId, title: s.title, similarity: s.score }))

    // Generate insights
    let insights = 'Aucun document similaire significatif trouvé dans la base de connaissances.'
    if (similarDocs.length > 0) {
      try {
        const prompt = `Compare ce document avec ${similarDocs.length} documents similaires trouvés dans la base.
Retourne en 3-4 phrases les insights clés: points communs, différences, complémentarité.

Documents similaires:
${similarDocs.map((d, i) => `${i + 1}. "${d.title}" (similarité: ${(d.similarity * 100).toFixed(0)}%)`).join('\n')}`

        const response = await zai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 500,
        })
        insights = response.choices?.[0]?.message?.content || insights
      } catch {}
    }

    return { similarDocuments: similarDocs, insights }
  } catch (e) {
    console.error('Knowledge base comparison failed:', e)
    return { similarDocuments: [], insights: 'Comparaison indisponible.' }
  }
}

/** Generate a comprehensive analysis report as structured content. */
export async function generateAnalysisReport(params: {
  documentTitle: string
  documentType: string
  text: string
  analysis: DocumentAnalysis
  comparison: { similarDocuments: Array<{ id: string; title: string; similarity: number }>; insights: string }
}): Promise<{
  title: string
  generatedAt: string
  sections: Array<{ heading: string; content: string }>
}> {
  const { documentTitle, documentType, text, analysis, comparison } = params

  return {
    title: `Rapport d'analyse — ${documentTitle}`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        heading: 'Informations générales',
        content: `Titre: ${documentTitle}\nType: ${documentType}\nLangue: ${analysis.language}\nNombre de mots: ${analysis.wordCount}\nCatégorie: ${analysis.category}\nScore de qualité: ${analysis.qualityScore}/100`,
      },
      {
        heading: 'Résumé',
        content: analysis.summary,
      },
      {
        heading: 'Mots-clés',
        content: analysis.keywords.join(', '),
      },
      {
        heading: 'Entités identifiées',
        content: analysis.entities.length > 0
          ? analysis.entities.map(e => `- ${e.type}: ${e.value}`).join('\n')
          : 'Aucune entité significative identifiée.',
      },
      {
        heading: 'Classification suggérée',
        content: `Niveau: ${analysis.suggestedClassification}\nSentiment: ${analysis.sentiment}\nTags: ${analysis.suggestedTags.join(', ')}`,
      },
      {
        heading: 'Comparaison avec la base de connaissances',
        content: comparison.similarDocuments.length > 0
          ? `${comparison.insights}\n\nDocuments similaires:\n${comparison.similarDocuments.map(d => `- "${d.title}" (similarité: ${(d.similarity * 100).toFixed(0)}%)`).join('\n')}`
          : comparison.insights,
      },
      {
        heading: 'Extrait du contenu',
        content: text.slice(0, 2000) + (text.length > 2000 ? '\n\n[... contenu tronqué ...]' : ''),
      },
    ],
  }
}
