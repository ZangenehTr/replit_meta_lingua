import { Worker } from 'bullmq';
import { redisConnection, ContentGenerationJob } from '../services/queue-service';
import { AdaptiveContentGenerator } from '../services/adaptive-kit/content-generator';
import { storage } from '../storage';

const contentGenerator = new AdaptiveContentGenerator();

export const contentGenerationWorker = new Worker(
  'content-generation',
  async (job) => {
    const { sessionId, studentId, roadmapObjectiveId, sessionTranscript, sessionMetrics, irtScores, generationPolicy } = job.data as ContentGenerationJob;

    console.log(`[Content Worker] Processing kit generation for session ${sessionId}`);

    try {
      // Get roadmap objective details
      let roadmapObjective = 'General Practice';
      if (roadmapObjectiveId) {
        const step = await storage.getRoadmapStep(roadmapObjectiveId);
        if (step) {
          roadmapObjective = step.title || roadmapObjective;
        }
      }

      // Generate the content kit
      const kit = await contentGenerator.generateKit({
        sessionId,
        studentId,
        roadmapObjective,
        sessionTranscript,
        sessionMetrics,
        irtScores,
        generationPolicy,
      });

      // Save kit reference to database
      await storage.createCallernCallHistory({
        studentId,
        teacherId: job.data.teacherId,
        startTime: new Date(),
        endTime: new Date(),
        duration: sessionMetrics?.duration || 0,
        recordingUrl: '',
        transcriptUrl: '',
        status: 'completed',
        sessionType: 'callern',
        sessionObjective: roadmapObjective,
        contentKitId: kit.id,
        metadata: {
          kitGenerated: true,
          kitId: kit.id,
          generatedAt: kit.createdAt,
        },
      });

      console.log(`[Content Worker] Successfully generated kit ${kit.id} for session ${sessionId}`);
      
      return {
        success: true,
        kitId: kit.id,
        studentId,
        sessionId,
      };
    } catch (error) {
      console.error(`[Content Worker] Failed to generate kit:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10,
      duration: 60000, // Max 10 jobs per minute
    },
  }
);

// Event listeners for monitoring
contentGenerationWorker.on('completed', (job) => {
  console.log(`[Content Worker] Job ${job.id} completed successfully`);
});

contentGenerationWorker.on('failed', (job, error) => {
  console.error(`[Content Worker] Job ${job?.id} failed:`, error);
});

contentGenerationWorker.on('error', (error) => {
  console.error(`[Content Worker] Worker error:`, error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Content Worker] Shutting down...');
  await contentGenerationWorker.close();
});

export default contentGenerationWorker;