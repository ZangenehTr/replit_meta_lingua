import { Worker } from 'bullmq';
import { redisConnection, IRTProcessingJob } from '../services/queue-service';
import { IRTService } from '../services/irt-service';
import { storage } from '../storage';

const irtService = new IRTService();

export const irtProcessingWorker = new Worker(
  'irt-processing',
  async (job) => {
    const { studentId, sessionId, responses } = job.data as IRTProcessingJob;

    console.log(`[IRT Worker] Processing IRT scores for student ${studentId}, session ${sessionId}`);

    try {
      // Calculate new ability estimate
      const currentAbility = await storage.getStudentIRTAbility(studentId);
      const newAbility = await irtService.updateAbility({
        currentTheta: currentAbility?.theta || 0,
        currentSE: currentAbility?.standardError || 1,
        responses,
      });

      // Save updated ability
      await storage.updateStudentIRTAbility(studentId, {
        theta: newAbility.theta,
        standardError: newAbility.standardError,
        totalResponses: (currentAbility?.totalResponses || 0) + responses.length,
        lastUpdated: new Date(),
      });

      // Save response history
      for (const response of responses) {
        await storage.createIRTResponse({
          studentId,
          sessionId,
          itemId: response.itemId,
          correct: response.correct,
          responseTime: response.responseTime,
          theta: newAbility.theta,
        });
      }

      console.log(`[IRT Worker] Updated ability for student ${studentId}: θ=${newAbility.theta.toFixed(3)}, SE=${newAbility.standardError.toFixed(3)}`);
      
      return {
        success: true,
        studentId,
        sessionId,
        newAbility,
      };
    } catch (error) {
      console.error(`[IRT Worker] Failed to process IRT:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Can process more IRT jobs concurrently
    limiter: {
      max: 50,
      duration: 60000, // Max 50 jobs per minute
    },
  }
);

// Event listeners
irtProcessingWorker.on('completed', (job) => {
  console.log(`[IRT Worker] Job ${job.id} completed`);
});

irtProcessingWorker.on('failed', (job, error) => {
  console.error(`[IRT Worker] Job ${job?.id} failed:`, error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[IRT Worker] Shutting down...');
  await irtProcessingWorker.close();
});

export default irtProcessingWorker;