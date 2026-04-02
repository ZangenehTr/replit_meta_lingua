import { db } from '../db';
import { marketTrends, competitorPrices, cmsContentPromptTemplates, cmsContentGenerationLogs, type MarketTrend, type CompetitorPrice } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { OllamaService } from './ollama-service';
import { contentGenerationQueue } from './queue-service';
import { nanoid } from 'nanoid';

export interface AICmsGenerationRequest {
  sourceType: 'market_trend' | 'competitor_price' | 'faq_keyword' | 'manual';
  sourceId?: number;
  templateId?: number;
  overrides?: {
    topic?: string;
    keywords?: string[];
    tone?: string;
    length?: string;
    contentType?: 'blog' | 'landing' | 'qa';
  };
  triggeredBy: number;
  authorId: number;
}

export interface GeneratedCmsContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  jsonLdBlock?: string;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  blog: `You are a professional content writer and SEO expert. Write a comprehensive blog article about "{topic}".

Requirements:
- Tone: {tone}
- Length: {length} (short=400-600 words, medium=800-1200 words, long=1500-2500 words)
- Keywords to include naturally: {keywords}
- Structure with H1, H2, H3 headings
- Include introduction and conclusion

Return JSON with EXACTLY these fields:
{
  "title": "Compelling article title",
  "slug": "url-friendly-slug",
  "excerpt": "2-3 sentence summary (max 160 chars)",
  "content": "Full HTML content with <h1>, <h2>, <h3>, <p> tags",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "metaKeywords": "keyword1, keyword2, keyword3",
  "jsonLdBlock": "{\"@context\":\"https://schema.org\",\"@type\":\"Article\",...}"
}`,

  landing: `You are a conversion-focused copywriter. Write a landing page for "{topic}".

Requirements:
- Tone: {tone}
- Length: {length}
- Keywords: {keywords}
- Include headline, benefits, CTA sections

Return JSON with EXACTLY these fields:
{
  "title": "Landing page headline",
  "slug": "landing-page-slug",
  "excerpt": "Value proposition (max 160 chars)",
  "content": "Full HTML landing page content",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "metaKeywords": "keyword1, keyword2, keyword3",
  "jsonLdBlock": null
}`,

  qa: `You are an expert FAQ content creator. Write a comprehensive Q&A article about "{topic}".

Requirements:
- Tone: {tone}
- Length: {length}
- Keywords: {keywords}
- Structure as question-answer pairs with clear headings

Return JSON with EXACTLY these fields:
{
  "title": "FAQ: Everything About [topic]",
  "slug": "faq-topic-slug",
  "excerpt": "FAQ overview (max 160 chars)",
  "content": "Full HTML Q&A content with <h2> for each question, <p> for answers",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "metaKeywords": "keyword1, keyword2, keyword3",
  "jsonLdBlock": "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",...}"
}`
};

export class AICmsContentService {
  private ollama: OllamaService;

  constructor() {
    this.ollama = new OllamaService();
  }

  async enqueueGeneration(request: AICmsGenerationRequest): Promise<{ jobId: string; logId: number }> {
    const jobId = nanoid();

    const [log] = await db.insert(cmsContentGenerationLogs).values({
      jobId,
      templateId: request.templateId,
      sourceType: request.sourceType,
      sourceId: request.sourceId,
      status: 'queued',
      triggeredBy: request.triggeredBy,
    }).returning();

    await contentGenerationQueue.add('cms_content_generation', {
      type: 'cms_content_generation',
      jobId,
      logId: log.id,
      request,
    }, {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    console.log(`[AICmsContent] Enqueued generation job ${jobId}, logId=${log.id}`);
    return { jobId, logId: log.id };
  }

  async resolveSourceTopic(request: AICmsGenerationRequest): Promise<{ topic: string; keywords: string[] }> {
    let topic = request.overrides?.topic || '';
    let keywords = request.overrides?.keywords || [];

    if (!topic && request.sourceId) {
      if (request.sourceType === 'market_trend') {
        const [trend] = await db.select().from(marketTrends).where(eq(marketTrends.id, request.sourceId));
        if (trend) {
          topic = trend.trendName;
          keywords = trend.keywords || [];
        }
      } else if (request.sourceType === 'competitor_price') {
        const [price] = await db.select().from(competitorPrices).where(eq(competitorPrices.id, request.sourceId));
        if (price) {
          topic = price.courseName;
          keywords = [price.competitorName, price.courseName];
        }
      }
    }

    if (!topic) {
      topic = 'Language Learning Tips and Best Practices';
    }

    return { topic, keywords };
  }

  async resolveTemplate(templateId?: number, contentType: string = 'blog'): Promise<{ promptBody: string; systemPrompt?: string }> {
    if (templateId) {
      const [tmpl] = await db.select().from(cmsContentPromptTemplates).where(eq(cmsContentPromptTemplates.id, templateId));
      if (tmpl) {
        return { promptBody: tmpl.promptBody, systemPrompt: tmpl.systemPrompt || undefined };
      }
    }

    const type = (['blog', 'landing', 'qa'].includes(contentType) ? contentType : 'blog') as 'blog' | 'landing' | 'qa';
    return { promptBody: DEFAULT_TEMPLATES[type] };
  }

  async generateContent(request: AICmsGenerationRequest): Promise<GeneratedCmsContent> {
    const { topic, keywords } = await this.resolveSourceTopic(request);
    const contentType = request.overrides?.contentType || 'blog';
    const tone = request.overrides?.tone || 'professional';
    const length = request.overrides?.length || 'medium';

    const { promptBody, systemPrompt } = await this.resolveTemplate(request.templateId, contentType);

    const finalPrompt = promptBody
      .replace(/\{topic\}/g, topic)
      .replace(/\{keywords\}/g, keywords.join(', ') || topic)
      .replace(/\{tone\}/g, tone)
      .replace(/\{length\}/g, length);

    const response = await this.ollama.generateJSON(finalPrompt, systemPrompt || 'You are a professional SEO content writer. Always respond with valid JSON only.');

    const content: GeneratedCmsContent = {
      title: response.title || topic,
      slug: response.slug || this.toSlug(topic),
      excerpt: response.excerpt || '',
      content: response.content || `<p>${topic}</p>`,
      metaTitle: response.metaTitle || response.title || topic,
      metaDescription: response.metaDescription || response.excerpt || '',
      metaKeywords: response.metaKeywords || keywords.join(', '),
      jsonLdBlock: response.jsonLdBlock || undefined,
    };

    return content;
  }

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  async getRecentSources(): Promise<{ trends: MarketTrend[]; competitorPriceItems: CompetitorPrice[] }> {
    const trends = await db.select().from(marketTrends).orderBy(desc(marketTrends.createdAt)).limit(20);
    const competitorPriceItems = await db.select().from(competitorPrices).orderBy(desc(competitorPrices.createdAt)).limit(20);
    return { trends, competitorPriceItems };
  }
}

export const aiCmsContentService = new AICmsContentService();
