import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import net from 'net';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// ─── TCP probe: is Redis port open? ────────────────────────────────────────
function probeRedis(host: string, port: number, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port });
    const done = (ok: boolean) => { sock.destroy(); resolve(ok); };
    sock.setTimeout(timeoutMs);
    sock.on('connect', () => done(true));
    sock.on('timeout', () => done(false));
    sock.on('error', () => done(false));
  });
}

export const redisAvailable: boolean = await probeRedis(REDIS_HOST, REDIS_PORT);

if (!redisAvailable) {
  console.warn('[Queue] Redis not reachable — BullMQ queues and workers are disabled in this environment.');
}

// ─── Shared IORedis connection (only used when Redis is available) ──────────
const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times: number) => Math.min(times * 3000, 60_000),
  enableOfflineQueue: false,
};

let _realConnection: IORedis | null = null;

function getConnection(): IORedis {
  if (!_realConnection) {
    _realConnection = new IORedis(redisConfig as any);
    _realConnection.on('error', () => {});
  }
  return _realConnection;
}

export const redisConnection: IORedis = redisAvailable
  ? getConnection()
  : (new Proxy({}, { get: () => () => {} }) as any);

// ─── Stub queue: silently drops jobs when Redis is unavailable ─────────────
function makeStubQueue(name: string) {
  return {
    name,
    add: async () => { console.warn(`[Queue:${name}] Redis unavailable — job dropped`); return undefined; },
    addBulk: async () => [],
    getWaitingCount: async () => 0,
    getActiveCount: async () => 0,
    getCompletedCount: async () => 0,
    getFailedCount: async () => 0,
    close: async () => {},
    obliterate: async () => {},
  } as unknown as Queue;
}

// ─── Real queues (only when Redis is live) ─────────────────────────────────
const queueDefaults = {
  removeOnComplete: { count: 100, age: 24 * 3600 },
  removeOnFail:    { count: 500, age: 7 * 24 * 3600 },
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
};

export const contentGenerationQueue: Queue = redisAvailable
  ? new Queue('content-generation',          { connection: getConnection(), defaultJobOptions: queueDefaults })
  : makeStubQueue('content-generation');

export const irtProcessingQueue: Queue = redisAvailable
  ? new Queue('irt-processing',              { connection: getConnection(), defaultJobOptions: { removeOnComplete: true, removeOnFail: false, attempts: 3 } })
  : makeStubQueue('irt-processing');

export const notificationQueue: Queue = redisAvailable
  ? new Queue('notifications',               { connection: getConnection(), defaultJobOptions: { removeOnComplete: true, removeOnFail: false, attempts: 5, backoff: { type: 'exponential', delay: 1000 } } })
  : makeStubQueue('notifications');

export const adaptiveContentGenerationQueue: Queue = redisAvailable
  ? new Queue('adaptive-content-generation', { connection: getConnection(), defaultJobOptions: { ...queueDefaults, removeOnFail: { count: 200, age: 7 * 24 * 3600 } } })
  : makeStubQueue('adaptive-content-generation');

export const preClassSmsQueue: Queue = redisAvailable
  ? new Queue('pre-class-sms', { connection: getConnection(), defaultJobOptions: { removeOnComplete: true, removeOnFail: { count: 200, age: 7 * 24 * 3600 }, attempts: 3, backoff: { type: 'exponential', delay: 2000 } } })
  : makeStubQueue('pre-class-sms');

export const contentGenerationQueueEvents: QueueEvents | null = redisAvailable
  ? new QueueEvents('content-generation', { connection: getConnection() })
  : null;

export interface PreClassSmsJob {
  classSessionId: number;
  scheduledStart: string; // ISO string
}

// ─── Health check ──────────────────────────────────────────────────────────
export async function checkQueueHealth() {
  if (!redisAvailable) {
    return { healthy: false, error: 'Redis not available in this environment' };
  }
  try {
    await getConnection().ping();
    return {
      healthy: true,
      redis: 'connected',
      queues: {
        contentGeneration: {
          waiting:   await contentGenerationQueue.getWaitingCount(),
          active:    await contentGenerationQueue.getActiveCount(),
          completed: await contentGenerationQueue.getCompletedCount(),
          failed:    await contentGenerationQueue.getFailedCount(),
        },
      },
    };
  } catch (error: any) {
    return { healthy: false, error: error.message };
  }
}

// ─── Job type interfaces ───────────────────────────────────────────────────
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

// ─── Graceful shutdown ─────────────────────────────────────────────────────
export async function closeQueues() {
  if (!redisAvailable) return;
  await contentGenerationQueue.close();
  await adaptiveContentGenerationQueue.close();
  await irtProcessingQueue.close();
  await notificationQueue.close();
  await preClassSmsQueue.close();
  await getConnection().quit();
}
