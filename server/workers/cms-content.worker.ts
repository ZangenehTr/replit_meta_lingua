import { Worker } from 'bullmq';
import { redisConnection } from '../services/queue-service';
import { aiCmsContentService, AICmsGenerationRequest } from '../services/ai-cms-content-service';
import { db } from '../db';
import { cmsBlogPosts, cmsContentGenerationLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CmsContentGenerationJobData {
  type: 'cms_content_generation';
  jobId: string;
  logId: number;
  request: AICmsGenerationRequest;
}

export const cmsContentWorker = new Worker(
  'content-generation',
  async (job) => {
    if (job.data?.type !== 'cms_content_generation') {
      return;
    }

    const { jobId, logId, request } = job.data as CmsContentGenerationJobData;
    const startedAt = new Date();

    console.log(`[CMS Content Worker] Processing job ${jobId}, logId=${logId}`);

    await db.update(cmsContentGenerationLogs)
      .set({ status: 'processing', startedAt })
      .where(eq(cmsContentGenerationLogs.id, logId));

    try {
      // Resolve source and template to build the full auditable prompt before generation
      const { topic, keywords } = await aiCmsContentService.resolveSourceTopic(request);
      const contentType = request.overrides?.contentType || 'blog';
      const tone = request.overrides?.tone || 'professional';
      const length = request.overrides?.length || 'medium';
      const { promptBody, systemPrompt } = await aiCmsContentService.resolveTemplate(request.templateId, contentType);

      const resolvedPrompt = promptBody
        .replace(/\{topic\}/g, topic)
        .replace(/\{keywords\}/g, keywords.join(', ') || topic)
        .replace(/\{tone\}/g, tone)
        .replace(/\{length\}/g, length);

      const auditContext = JSON.stringify({
        sourceType: request.sourceType,
        sourceId: request.sourceId,
        templateId: request.templateId,
        overrides: request.overrides,
        topic,
        keywords,
      });

      // Update log with the full resolved prompt before generation starts
      await db.update(cmsContentGenerationLogs)
        .set({ promptUsed: resolvedPrompt })
        .where(eq(cmsContentGenerationLogs.id, logId));

      const generated = await aiCmsContentService.generateContent(request);
      const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
      const completedAt = new Date();
      const generationTimeMs = completedAt.getTime() - startedAt.getTime();

      const finalPrompt = resolvedPrompt;

      const [post] = await db.insert(cmsBlogPosts).values({
        title: generated.title,
        slug: await ensureUniqueSlug(generated.slug),
        excerpt: generated.excerpt,
        content: generated.content,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        metaKeywords: generated.metaKeywords,
        jsonLdBlock: generated.jsonLdBlock,
        status: 'draft',
        locale: 'en',
        aiGenerated: true,
        aiPrompt: finalPrompt,
        aiModel: model,
        aiSourceRef: auditContext,
        authorId: request.authorId,
      }).returning();

      await db.update(cmsContentGenerationLogs)
        .set({
          status: 'completed',
          postId: post.id,
          model,
          generationTimeMs,
          promptUsed: finalPrompt,
          completedAt,
        })
        .where(eq(cmsContentGenerationLogs.id, logId));

      console.log(`[CMS Content Worker] Job ${jobId} completed. Post ID: ${post.id}`);
      return { success: true, postId: post.id, jobId };

    } catch (error: unknown) {
      const completedAt = new Date();
      const generationTimeMs = completedAt.getTime() - startedAt.getTime();
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(`[CMS Content Worker] Job ${jobId} failed:`, errorMessage);

      await db.update(cmsContentGenerationLogs)
        .set({
          status: 'failed',
          generationTimeMs,
          errorMessage,
          completedAt,
        })
        .where(eq(cmsContentGenerationLogs.id, logId));

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 60000,
    },
  }
);

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.select({ id: cmsBlogPosts.id })
      .from(cmsBlogPosts)
      .where(eq(cmsBlogPosts.slug, slug))
      .limit(1);

    if (existing.length === 0) return slug;
    attempts++;
    slug = `${baseSlug}-${nanoid(4)}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

cmsContentWorker.on('completed', (job) => {
  console.log(`[CMS Content Worker] Job ${job.id} completed`);
});

cmsContentWorker.on('failed', (job, error) => {
  console.error(`[CMS Content Worker] Job ${job?.id} failed:`, error.message);
});

export default cmsContentWorker;
