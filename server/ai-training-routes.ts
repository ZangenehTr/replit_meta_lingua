/**
 * AI Training Management Routes
 * Handles model training, dataset management, and training job orchestration
 */

import type { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  aiModels, 
  aiTrainingJobs, 
  aiTrainingDatasets, 
  aiDatasetItems, 
  aiTrainingData,
  insertAiModelSchema,
  insertAiTrainingJobSchema,
  insertAiTrainingDatasetSchema,
  insertAiDatasetItemSchema
} from "@shared/schema";
import { eq, desc, count, sum, and, inArray } from "drizzle-orm";
import { ollamaService } from "./ollama-service";
// Authentication middleware - inline implementation since auth-utils doesn't exist
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";

export function setupAiTrainingRoutes(app: Express) {
  
  // ===================
  // AI MODELS MANAGEMENT
  // ===================
  
  // Get all AI models
  app.get("/api/ai-models", authenticateToken, async (req: Request, res: Response) => {
    try {
      const models = await db.select().from(aiModels).orderBy(desc(aiModels.createdAt));
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ error: "Failed to fetch AI models" });
    }
  });
  
  // Get active/default AI model
  app.get("/api/ai-models/active", authenticateToken, async (req: Request, res: Response) => {
    try {
      const activeModel = await db.select()
        .from(aiModels)
        .where(eq(aiModels.isActive, true))
        .limit(1);
      
      res.json(activeModel[0] || null);
    } catch (error) {
      console.error("Error fetching active AI model:", error);
      res.status(500).json({ error: "Failed to fetch active AI model" });
    }
  });
  
  // Create new AI model
  app.post("/api/ai-models", authenticateToken, async (req: Request, res: Response) => {
    try {
      const modelData = insertAiModelSchema.parse(req.body);
      const userId = (req as any).user.id;
      
      const [newModel] = await db.insert(aiModels).values({
        ...modelData,
        createdBy: userId
      }).returning();
      
      res.status(201).json(newModel);
    } catch (error) {
      console.error("Error creating AI model:", error);
      res.status(500).json({ error: "Failed to create AI model" });
    }
  });
  
  // Update AI model
  app.put("/api/ai-models/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id);
      const updates = insertAiModelSchema.partial().parse(req.body);
      
      const [updatedModel] = await db.update(aiModels)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(aiModels.id, modelId))
        .returning();
      
      res.json(updatedModel);
    } catch (error) {
      console.error("Error updating AI model:", error);
      res.status(500).json({ error: "Failed to update AI model" });
    }
  });
  
  // Set model as active (deactivate others)
  app.post("/api/ai-models/:id/activate", authenticateToken, async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id);
      
      // Deactivate all models first
      await db.update(aiModels).set({ isActive: false, isDefault: false });
      
      // Activate the selected model
      const [activatedModel] = await db.update(aiModels)
        .set({ isActive: true, isDefault: true, updatedAt: new Date() })
        .where(eq(aiModels.id, modelId))
        .returning();
      
      res.json(activatedModel);
    } catch (error) {
      console.error("Error activating AI model:", error);
      res.status(500).json({ error: "Failed to activate AI model" });
    }
  });
  
  // Delete AI model
  app.delete("/api/ai-models/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id);
      
      // Check if model is currently active
      const model = await db.select().from(aiModels).where(eq(aiModels.id, modelId)).limit(1);
      if (model[0]?.isActive) {
        return res.status(400).json({ error: "Cannot delete active model" });
      }
      
      await db.delete(aiModels).where(eq(aiModels.id, modelId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting AI model:", error);
      res.status(500).json({ error: "Failed to delete AI model" });
    }
  });
  
  // ===================
  // TRAINING DATASETS
  // ===================
  
  // Get all training datasets
  app.get("/api/ai-datasets", authenticateToken, async (req: Request, res: Response) => {
    try {
      const datasets = await db.select({
        id: aiTrainingDatasets.id,
        name: aiTrainingDatasets.name,
        description: aiTrainingDatasets.description,
        dataType: aiTrainingDatasets.dataType,
        language: aiTrainingDatasets.language,
        sourceType: aiTrainingDatasets.sourceType,
        dataCount: aiTrainingDatasets.dataCount,
        totalSize: aiTrainingDatasets.totalSize,
        isActive: aiTrainingDatasets.isActive,
        qualityScore: aiTrainingDatasets.qualityScore,
        createdAt: aiTrainingDatasets.createdAt,
        updatedAt: aiTrainingDatasets.updatedAt
      })
      .from(aiTrainingDatasets)
      .orderBy(desc(aiTrainingDatasets.createdAt));
      
      res.json(datasets);
    } catch (error) {
      console.error("Error fetching training datasets:", error);
      res.status(500).json({ error: "Failed to fetch training datasets" });
    }
  });
  
  // Get dataset details with items
  app.get("/api/ai-datasets/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const datasetId = parseInt(req.params.id);
      
      // Get dataset info
      const dataset = await db.select()
        .from(aiTrainingDatasets)
        .where(eq(aiTrainingDatasets.id, datasetId))
        .limit(1);
      
      if (!dataset[0]) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      
      // Get dataset items with training data
      const items = await db.select({
        id: aiDatasetItems.id,
        itemType: aiDatasetItems.itemType,
        qualityScore: aiDatasetItems.qualityScore,
        isValidated: aiDatasetItems.isValidated,
        validatedAt: aiDatasetItems.validatedAt,
        trainingData: {
          id: aiTrainingData.id,
          fileName: aiTrainingData.fileName,
          fileType: aiTrainingData.fileType,
          content: aiTrainingData.content,
          tags: aiTrainingData.tags,
          createdAt: aiTrainingData.createdAt
        }
      })
      .from(aiDatasetItems)
      .leftJoin(aiTrainingData, eq(aiDatasetItems.trainingDataId, aiTrainingData.id))
      .where(eq(aiDatasetItems.datasetId, datasetId));
      
      res.json({
        ...dataset[0],
        items
      });
    } catch (error) {
      console.error("Error fetching dataset details:", error);
      res.status(500).json({ error: "Failed to fetch dataset details" });
    }
  });
  
  // Create new training dataset
  app.post("/api/ai-datasets", authenticateToken, async (req: Request, res: Response) => {
    try {
      const datasetData = insertAiTrainingDatasetSchema.parse(req.body);
      const userId = (req as any).user.id;
      
      const [newDataset] = await db.insert(aiTrainingDatasets).values({
        ...datasetData,
        createdBy: userId
      }).returning();
      
      res.status(201).json(newDataset);
    } catch (error) {
      console.error("Error creating training dataset:", error);
      res.status(500).json({ error: "Failed to create training dataset" });
    }
  });
  
  // Add training data to dataset
  app.post("/api/ai-datasets/:id/items", authenticateToken, async (req: Request, res: Response) => {
    try {
      const datasetId = parseInt(req.params.id);
      const { trainingDataIds, itemType } = req.body;
      
      if (!Array.isArray(trainingDataIds) || trainingDataIds.length === 0) {
        return res.status(400).json({ error: "Training data IDs required" });
      }
      
      const items = trainingDataIds.map(trainingDataId => ({
        datasetId,
        trainingDataId,
        itemType: itemType || 'text'
      }));
      
      const newItems = await db.insert(aiDatasetItems).values(items).returning();
      
      // Update dataset data count
      await db.update(aiTrainingDatasets)
        .set({ 
          dataCount: trainingDataIds.length,
          updatedAt: new Date()
        })
        .where(eq(aiTrainingDatasets.id, datasetId));
      
      res.status(201).json(newItems);
    } catch (error) {
      console.error("Error adding items to dataset:", error);
      res.status(500).json({ error: "Failed to add items to dataset" });
    }
  });
  
  // ===================
  // TRAINING JOBS
  // ===================
  
  // Get all training jobs
  app.get("/api/ai-training-jobs", authenticateToken, async (req: Request, res: Response) => {
    try {
      const jobs = await db.select()
        .from(aiTrainingJobs)
        .orderBy(desc(aiTrainingJobs.createdAt));
      
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching training jobs:", error);
      res.status(500).json({ error: "Failed to fetch training jobs" });
    }
  });
  
  // Get training job details
  app.get("/api/ai-training-jobs/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      
      const job = await db.select()
        .from(aiTrainingJobs)
        .where(eq(aiTrainingJobs.id, jobId))
        .limit(1);
      
      if (!job[0]) {
        return res.status(404).json({ error: "Training job not found" });
      }
      
      res.json(job[0]);
    } catch (error) {
      console.error("Error fetching training job:", error);
      res.status(500).json({ error: "Failed to fetch training job" });
    }
  });
  
  // Create new training job
  app.post("/api/ai-training-jobs", authenticateToken, async (req: Request, res: Response) => {
    try {
      const jobData = insertAiTrainingJobSchema.parse(req.body);
      const userId = (req as any).user.id;
      const jobId = crypto.randomUUID();
      
      const [newJob] = await db.insert(aiTrainingJobs).values({
        ...jobData,
        jobId,
        createdBy: userId,
        status: 'pending'
      }).returning();
      
      // Start training job asynchronously
      startTrainingJob(newJob.id, jobData);
      
      res.status(201).json(newJob);
    } catch (error) {
      console.error("Error creating training job:", error);
      res.status(500).json({ error: "Failed to create training job" });
    }
  });
  
  // Cancel training job
  app.post("/api/ai-training-jobs/:id/cancel", authenticateToken, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      
      const [cancelledJob] = await db.update(aiTrainingJobs)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(aiTrainingJobs.id, jobId))
        .returning();
      
      res.json(cancelledJob);
    } catch (error) {
      console.error("Error cancelling training job:", error);
      res.status(500).json({ error: "Failed to cancel training job" });
    }
  });
  
  // ===================
  // TRAINING DATA MANAGEMENT
  // ===================
  
  // Get training data with filtering
  app.get("/api/ai-training-data", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, modelName, tags, fileType } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      let query = db.select().from(aiTrainingData);
      
      if (modelName) {
        query = query.where(eq(aiTrainingData.modelName, modelName as string));
      }
      
      const trainingData = await query
        .orderBy(desc(aiTrainingData.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);
      
      // Get total count
      const totalCount = await db.select({ count: count() }).from(aiTrainingData);
      
      res.json({
        data: trainingData,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error("Error fetching training data:", error);
      res.status(500).json({ error: "Failed to fetch training data" });
    }
  });
  
  // Get training data statistics
  app.get("/api/ai-training-data/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const [totalData] = await db.select({ count: count() }).from(aiTrainingData);
      const [totalModels] = await db.select({ count: count() }).from(aiModels);
      const [totalDatasets] = await db.select({ count: count() }).from(aiTrainingDatasets);
      const [activeJobs] = await db.select({ count: count() })
        .from(aiTrainingJobs)
        .where(inArray(aiTrainingJobs.status, ['pending', 'running']));
      
      res.json({
        totalTrainingData: totalData.count,
        totalModels: totalModels.count,
        totalDatasets: totalDatasets.count,
        activeJobs: activeJobs.count
      });
    } catch (error) {
      console.error("Error fetching training data stats:", error);
      res.status(500).json({ error: "Failed to fetch training data stats" });
    }
  });
}

// ===================
// TRAINING JOB PROCESSOR
// ===================

async function startTrainingJob(jobId: number, jobData: any) {
  try {
    // Update job status to running
    await db.update(aiTrainingJobs)
      .set({ 
        status: 'running',
        startedAt: new Date(),
        progress: 0,
        updatedAt: new Date()
      })
      .where(eq(aiTrainingJobs.id, jobId));
    
    // Simulate training progress (replace with actual Ollama training)
    for (let progress = 10; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      await db.update(aiTrainingJobs)
        .set({ 
          progress,
          updatedAt: new Date(),
          trainingLogs: `Training progress: ${progress}%`
        })
        .where(eq(aiTrainingJobs.id, jobId));
    }
    
    // Create the trained model
    const [newModel] = await db.insert(aiModels).values({
      modelName: `${jobData.modelName}_trained_${Date.now()}`,
      baseModel: jobData.modelName,
      version: '1.0.0',
      description: `Fine-tuned model from job ${jobId}`,
      isActive: false,
      isDefault: false,
      createdBy: jobData.createdBy,
      performanceMetrics: {
        accuracy: 0.85 + Math.random() * 0.1, // Simulated metrics
        loss: Math.random() * 0.5,
        training_time: 3600
      }
    }).returning();
    
    // Update job as completed
    await db.update(aiTrainingJobs)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        resultModelId: newModel.id,
        updatedAt: new Date()
      })
      .where(eq(aiTrainingJobs.id, jobId));
    
    console.log(`Training job ${jobId} completed successfully`);
    
  } catch (error) {
    console.error(`Training job ${jobId} failed:`, error);
    
    // Update job as failed
    await db.update(aiTrainingJobs)
      .set({ 
        status: 'failed',
        errorMessage: error.message,
        updatedAt: new Date()
      })
      .where(eq(aiTrainingJobs.id, jobId));
  }
}