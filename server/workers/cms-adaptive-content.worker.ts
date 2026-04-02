/**
 * BullMQ Worker: CMS Adaptive Content Generation
 * Processes adaptive content generation jobs asynchronously on the dedicated
 * 'adaptive-content-generation' queue, calling Ollama and storing results
 * in adaptive_session_content.
 */

import { Worker } from 'bullmq';
import { redisConnection } from '../services/queue-service';
import { OllamaService } from '../ollama-service';
import { DatabaseStorage } from '../database-storage';

const ollamaService = new OllamaService();
const dbStorage = new DatabaseStorage();

export const cmsAdaptiveContentWorker = new Worker(
  'adaptive-content-generation',
  async (job) => {
    const { sessionId, studentId, sessionType, targetSkills } = job.data;
    console.log(`[AdaptiveContentWorker] Processing job ${job.id} for session ${sessionId}`);

    try {
      const { SessionAdaptiveContentService } = await import('../services/session-adaptive-content');
      const service = new SessionAdaptiveContentService(ollamaService, dbStorage);

      const contents = await service.generateAndStoreContent(
        sessionId,
        studentId,
        sessionType,
        targetSkills
      );

      console.log(`[AdaptiveContentWorker] Job ${job.id} complete — ${contents.length} content items stored`);
      return { success: true, contentCount: contents.length };
    } catch (error) {
      console.error(`[AdaptiveContentWorker] Job ${job.id} failed:`, error);
      // Mark DB rows as failed
      try {
        const { pool } = await import('../db.js');
        await pool.query(
          `UPDATE adaptive_session_content SET status = 'failed' WHERE session_id = $1 AND status = 'pending'`,
          [sessionId]
        );
      } catch (_) {}
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60000,
    },
  }
);

cmsAdaptiveContentWorker.on('completed', (job) => {
  console.log(`[AdaptiveContentWorker] Job ${job.id} completed`);
});

cmsAdaptiveContentWorker.on('failed', (job, error) => {
  console.error(`[AdaptiveContentWorker] Job ${job?.id} failed:`, error);
});

process.on('SIGTERM', async () => {
  console.log('[AdaptiveContentWorker] Shutting down...');
  await cmsAdaptiveContentWorker.close();
});

export default cmsAdaptiveContentWorker;
