/**
 * Dedicated Roadmap Storage Service
 * Handles all roadmap-related persistence operations independently from core storage
 */

import { 
  learningRoadmaps, 
  roadmapMilestones, 
  roadmapSteps, 
  userRoadmapEnrollments, 
  userRoadmapProgress,
  type LearningRoadmap,
  type InsertLearningRoadmap,
  type RoadmapMilestone,
  type InsertRoadmapMilestone,
  type RoadmapStep,
  type InsertRoadmapStep,
  type UserRoadmapEnrollment,
  type InsertUserRoadmapEnrollment
} from '@shared/roadmap-schema';

export interface IRoadmapStorage {
  // Core roadmap operations
  createLearningRoadmap(data: InsertLearningRoadmap): Promise<LearningRoadmap>;
  getRoadmapTemplate(id: number): Promise<LearningRoadmap | undefined>;
  
  // Milestone operations
  createRoadmapMilestone(data: InsertRoadmapMilestone): Promise<RoadmapMilestone>;
  
  // Instance operations
  createRoadmapInstance(data: any): Promise<any>;
  getRoadmapInstance(id: number): Promise<any | undefined>;
  getRoadmapInstanceWithProgress(id: number): Promise<any | undefined>;
  getRoadmapInstances(filters: any): Promise<any[]>;
  
  // Progress and analytics
  enrichInstanceWithMetrics(instance: any): Promise<any>;
  adjustRoadmapPacing(instanceId: number, adjustmentDays: number, reason: string, userId: number): Promise<any>;
  updateRoadmapInstanceStatus(instanceId: number, status: string): Promise<any | undefined>;
  getRoadmapInstanceAnalytics(instanceId: number): Promise<any>;
  resetRoadmapInstance(instanceId: number, keepCompleted: boolean): Promise<any>;
  
  // Activity initialization
  initializeActivityInstances(instanceId: number): Promise<void>;
}

/**
 * In-memory implementation for development
 */
export class MemRoadmapStorage implements IRoadmapStorage {
  private roadmaps = new Map<number, LearningRoadmap>();
  private milestones = new Map<number, RoadmapMilestone>();
  private steps = new Map<number, RoadmapStep>();
  private instances = new Map<number, any>();
  private enrollments = new Map<number, UserRoadmapEnrollment>();
  private nextId = 1;

  async createLearningRoadmap(data: InsertLearningRoadmap): Promise<LearningRoadmap> {
    const roadmap: LearningRoadmap = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.roadmaps.set(roadmap.id, roadmap);
    return roadmap;
  }

  async getRoadmapTemplate(id: number): Promise<LearningRoadmap | undefined> {
    return this.roadmaps.get(id);
  }

  async createRoadmapMilestone(data: InsertRoadmapMilestone): Promise<RoadmapMilestone> {
    const milestone: RoadmapMilestone = {
      id: this.nextId++,
      ...data,
      createdAt: new Date()
    };
    this.milestones.set(milestone.id, milestone);
    return milestone;
  }

  async createRoadmapInstance(data: any): Promise<any> {
    const instance = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.instances.set(instance.id, instance);
    return instance;
  }

  async getRoadmapInstance(id: number): Promise<any | undefined> {
    return this.instances.get(id);
  }

  async getRoadmapInstanceWithProgress(id: number): Promise<any | undefined> {
    const instance = this.instances.get(id);
    if (!instance) return undefined;
    
    return {
      ...instance,
      progress: {
        completedSteps: 0,
        totalSteps: 10,
        progressPercentage: 0
      }
    };
  }

  async getRoadmapInstances(filters: any): Promise<any[]> {
    return Array.from(this.instances.values());
  }

  async enrichInstanceWithMetrics(instance: any): Promise<any> {
    return {
      ...instance,
      metrics: {
        readiness: 0.8,
        masteryLevel: 0.6,
        avgScore: 75
      }
    };
  }

  async adjustRoadmapPacing(instanceId: number, adjustmentDays: number, reason: string, userId: number): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error('Instance not found');
    
    instance.adjustmentDays = adjustmentDays;
    instance.adjustmentReason = reason;
    instance.adjustedBy = userId;
    instance.updatedAt = new Date();
    
    return instance;
  }

  async updateRoadmapInstanceStatus(instanceId: number, status: string): Promise<any | undefined> {
    const instance = this.instances.get(instanceId);
    if (!instance) return undefined;
    
    instance.status = status;
    instance.updatedAt = new Date();
    return instance;
  }

  async getRoadmapInstanceAnalytics(instanceId: number): Promise<any> {
    return {
      instanceId,
      totalSteps: 10,
      completedSteps: 3,
      averageScore: 78,
      timeSpent: 120,
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  async resetRoadmapInstance(instanceId: number, keepCompleted: boolean): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error('Instance not found');
    
    instance.progress = {
      completedSteps: keepCompleted ? instance.progress?.completedSteps || 0 : 0,
      totalSteps: instance.progress?.totalSteps || 10,
      progressPercentage: 0
    };
    instance.updatedAt = new Date();
    
    return instance;
  }

  async initializeActivityInstances(instanceId: number): Promise<void> {
    // Initialize activity instances for the roadmap
    console.log(`Initialized activity instances for roadmap instance ${instanceId}`);
  }
}

// Export singleton instance
export const roadmapStorage = new MemRoadmapStorage();