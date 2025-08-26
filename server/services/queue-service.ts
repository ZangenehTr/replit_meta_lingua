import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

// Create Redis connection
export const redisConnection = new IORedis(redisConfig);

// Queue definitions
export const contentGenerationQueue = new Queue('content-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const irtProcessingQueue = new Queue('irt-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
});

export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Queue event monitoring
export const contentGenerationQueueEvents = new QueueEvents('content-generation', {
  connection: redisConnection,
});

// Health check for Redis and queues
export async function checkQueueHealth() {
  try {
    await redisConnection.ping();
    const waiting = await contentGenerationQueue.getWaitingCount();
    const active = await contentGenerationQueue.getActiveCount();
    const completed = await contentGenerationQueue.getCompletedCount();
    const failed = await contentGenerationQueue.getFailedCount();
    
    return {
      healthy: true,
      redis: 'connected',
      queues: {
        contentGeneration: {
          waiting,
          active,
          completed,
          failed,
        },
      },
    };
  } catch (error) {
    console.error('Queue health check failed:', error);
    return {
      healthy: false,
      error: error.message,
    };
  }
}

// Job types
export interface ContentGenerationJob {
  sessionId: number;
  studentId: number;
  teacherId?: number;
  roadmapObjectiveId?: number;
  sessionTranscript?: string;
  sessionMetrics?: {
    duration: number;
    tttRatio?: number;
    errorCount?: number;
    vocabularyUsed?: string[];
  };
  irtScores?: {
    theta: number;
    standardError: number;
  };
  generationPolicy?: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    skills: string[];
    contentTypes: string[];
    targetCEFR?: string;
  };
}

export interface IRTProcessingJob {
  studentId: number;
  sessionId: number;
  responses: {
    itemId: string;
    correct: boolean;
    responseTime: number;
  }[];
}

export interface NotificationJob {
  type: 'sms' | 'email' | 'push';
  recipient: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

// Graceful shutdown
export async function closeQueues() {
  await contentGenerationQueue.close();
  await irtProcessingQueue.close();
  await notificationQueue.close();
  await redisConnection.quit();
}