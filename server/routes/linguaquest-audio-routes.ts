import { Router } from 'express';
import { db } from '../db.js';
import { linguaquestAudioJobs } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { linguaquestAudioService } from '../services/linguaquest-audio-service.js';
import { authenticate, authorizePermission } from '../auth.js';

const router = Router();

// All audio generation endpoints require authentication and admin permissions
router.use(authenticate);
router.use(authorizePermission('linguaquest_audio', 'manage'));

/**
 * Trigger batch audio generation
 * POST /api/linguaquest/audio/batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { contentIds, regenerateAll } = req.body;
    const userId = (req.user as any)?.id; // Admin/teacher who triggered

    // Validate contentIds if provided
    let processedContentIds: number[] | undefined;
    if (contentIds) {
      if (!Array.isArray(contentIds)) {
        return res.status(400).json({
          success: false,
          error: 'contentIds must be an array of numbers'
        });
      }
      processedContentIds = contentIds.map((id: any) => {
        const parsed = parseInt(id, 10);
        if (isNaN(parsed)) {
          throw new Error(`Invalid content ID: ${id}`);
        }
        return parsed;
      });
    }

    // Create job record
    const [job] = await db
      .insert(linguaquestAudioJobs)
      .values({
        status: 'pending',
        contentIds: processedContentIds?.map(String),
        regenerateAll: regenerateAll || false,
        triggeredBy: userId
      })
      .returning();

    console.log(`🎵 Audio generation job ${job.id} created`);

    // Start batch generation in background (non-blocking)
    // Note: In production, use a proper job queue like BullMQ
    setImmediate(async () => {
      try {
        // Update job status to running
        await db
          .update(linguaquestAudioJobs)
          .set({
            status: 'running',
            startedAt: new Date()
          })
          .where(eq(linguaquestAudioJobs.id, job.id));

        const startTime = Date.now();

        // Run batch generation with job tracking
        const stats = await linguaquestAudioService.batchGenerateAudio(
          processedContentIds,
          500, // 500ms delay between items
          job.id // Pass job ID for real-time progress updates
        );

        const endTime = Date.now();
        const durationMs = endTime - startTime;

        // Update job with results
        await db
          .update(linguaquestAudioJobs)
          .set({
            status: stats.failed > 0 ? 'failed' : 'completed',
            totalItems: stats.totalItems,
            processedItems: stats.totalItems,
            generatedItems: stats.generated,
            cachedItems: stats.cached,
            failedItems: stats.failed,
            errors: stats.errors.length > 0 ? stats.errors : null,
            completedAt: new Date(),
            durationMs: durationMs
          })
          .where(eq(linguaquestAudioJobs.id, job.id));

        console.log(`✅ Audio generation job ${job.id} completed in ${durationMs}ms`);

      } catch (error) {
        console.error(`❌ Audio generation job ${job.id} failed:`, error);

        // Update job with error
        await db
          .update(linguaquestAudioJobs)
          .set({
            status: 'failed',
            errors: [{
              contentId: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            }],
            completedAt: new Date(),
            durationMs: Date.now() - job.createdAt.getTime()
          })
          .where(eq(linguaquestAudioJobs.id, job.id));
      }
    });

    // Return job ID immediately
    res.json({
      success: true,
      jobId: job.id,
      message: 'Audio generation job started. Use GET /api/linguaquest/audio/jobs/:id to check status.'
    });

  } catch (error) {
    console.error('Error starting audio generation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start audio generation'
    });
  }
});

/**
 * Get audio generation job status
 * GET /api/linguaquest/audio/jobs/:id
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID'
      });
    }

    const [job] = await db
      .select()
      .from(linguaquestAudioJobs)
      .where(eq(linguaquestAudioJobs.id, jobId))
      .limit(1);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Calculate progress percentage
    const progress = job.totalItems > 0
      ? Math.round((job.processedItems / job.totalItems) * 100)
      : 0;

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress,
        totalItems: job.totalItems,
        processedItems: job.processedItems,
        generatedItems: job.generatedItems,
        cachedItems: job.cachedItems,
        failedItems: job.failedItems,
        errors: job.errors,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        durationMs: job.durationMs,
        createdAt: job.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job status'
    });
  }
});

/**
 * Get all audio generation jobs
 * GET /api/linguaquest/audio/jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await db
      .select()
      .from(linguaquestAudioJobs)
      .orderBy(linguaquestAudioJobs.createdAt);

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        totalItems: job.totalItems,
        processedItems: job.processedItems,
        generatedItems: job.generatedItems,
        cachedItems: job.cachedItems,
        failedItems: job.failedItems,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        durationMs: job.durationMs,
        createdAt: job.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    });
  }
});

/**
 * Get audio generation statistics
 * GET /api/linguaquest/audio/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await linguaquestAudioService.getGenerationStats();

    res.json({
      success: true,
      stats: {
        totalContent: stats.totalContent,
        withAudio: stats.withAudio,
        withoutAudio: stats.withoutAudio,
        audioAssets: stats.totalAudioAssets,
        totalFileSize: stats.totalFileSize,
        totalFileSizeMB: (stats.totalFileSize / 1024 / 1024).toFixed(2),
        totalDuration: stats.totalDuration,
        totalDurationMinutes: (stats.totalDuration / 1000 / 60).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
