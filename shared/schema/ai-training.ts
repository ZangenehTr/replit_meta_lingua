import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const aiTrainingJobs = pgTable("ai_training_jobs", {
  id: serial("id").primaryKey(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  modelId: integer("model_id").references(() => aiModels.id),
  datasetId: integer("dataset_id").references(() => aiTrainingDatasets.id),
  jobType: varchar("job_type", { length: 100 }).notNull(), // training, fine_tuning, evaluation, inference
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 50 }).default("queued"), // queued, running, completed, failed, cancelled, paused
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0.00"), // 0.00 to 100.00
  currentEpoch: integer("current_epoch").default(0),
  totalEpochs: integer("total_epochs").notNull(),
  batchSize: integer("batch_size").default(32),
  learningRate: decimal("learning_rate", { precision: 10, scale: 8 }),
  hyperparameters: jsonb("hyperparameters"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // in seconds
  actualDuration: integer("actual_duration"), // in seconds
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }), // percentage
  memoryUsage: integer("memory_usage"), // in MB
  gpuUsage: decimal("gpu_usage", { precision: 5, scale: 2 }), // percentage
  diskUsage: integer("disk_usage"), // in MB
  networkUsage: integer("network_usage"), // in MB
  trainingLoss: decimal("training_loss", { precision: 10, scale: 6 }),
  validationLoss: decimal("validation_loss", { precision: 10, scale: 6 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  metrics: jsonb("metrics"),
  logs: text("logs"),
  errorMessage: text("error_message"),
  outputPath: varchar("output_path", { length: 500 }),
  checkpointPath: varchar("checkpoint_path", { length: 500 }),
  configPath: varchar("config_path", { length: 500 }),
  environmentConfig: jsonb("environment_config"),
  nodeId: varchar("node_id", { length: 100 }), // which compute node is running the job
  resourceAllocation: jsonb("resource_allocation"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  parentJobId: integer("parent_job_id"), // for job dependencies
  childJobs: text("child_jobs").array().default([]),
  dependencies: text("dependencies").array().default([]),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Training Datasets table for managing training dataset configurations
export const aiTrainingDatasets = pgTable("ai_training_datasets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  datasetType: varchar("dataset_type", { length: 100 }).notNull(), // text, conversation, audio, video, mixed
  language: varchar("language", { length: 20 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }), // A1, A2, B1, B2, C1, C2, all
  category: varchar("category", { length: 100 }), // grammar, vocabulary, pronunciation, conversation
  version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
  totalSamples: integer("total_samples").default(0),
  trainingSamples: integer("training_samples").default(0),
  validationSamples: integer("validation_samples").default(0),
  testSamples: integer("test_samples").default(0),
  splitRatio: varchar("split_ratio", { length: 50 }).default("80:10:10"), // train:validation:test
  dataPath: varchar("data_path", { length: 500 }),
  configPath: varchar("config_path", { length: 500 }),
  metadataPath: varchar("metadata_path", { length: 500 }),
  preprocessingRules: jsonb("preprocessing_rules"),
  augmentationRules: jsonb("augmentation_rules"),
  qualityMetrics: jsonb("quality_metrics"),
  dataFormat: varchar("data_format", { length: 50 }).default("json"), // json, csv, text, audio, video
  encoding: varchar("encoding", { length: 50 }).default("utf-8"),
  compressionType: varchar("compression_type", { length: 50 }), // gzip, zip, none
  sizeBytes: integer("size_bytes"),
  checksum: varchar("checksum", { length: 255 }),
  source: varchar("source", { length: 255 }), // where the data came from
  licenseType: varchar("license_type", { length: 100 }),
  isPublic: boolean("is_public").default(false),
  accessLevel: varchar("access_level", { length: 50 }).default("private"), // public, private, restricted
  allowedUsers: text("allowed_users").array().default([]),
  lastProcessed: timestamp("last_processed"),
  processingStatus: varchar("processing_status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  processingLog: text("processing_log"),
  tags: text("tags").array().default([]),
  customFields: jsonb("custom_fields"),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Models table for tracking trained AI models and their performance
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  modelType: varchar("model_type", { length: 100 }).notNull(), // language_model, classifier, conversation, tts, stt
  version: varchar("version", { length: 50 }).notNull(),
  language: varchar("language", { length: 20 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }), // A1, A2, B1, B2, C1, C2, all
  category: varchar("category", { length: 100 }), // grammar, vocabulary, pronunciation, conversation
  architecture: varchar("architecture", { length: 100 }), // transformer, lstm, cnn, etc
  parameters: integer("parameters"), // number of model parameters
  datasetId: varchar("dataset_id", { length: 255 }),
  trainingDataSize: integer("training_data_size"), // number of training samples
  validationDataSize: integer("validation_data_size"),
  testDataSize: integer("test_data_size"),
  trainingStarted: timestamp("training_started"),
  trainingCompleted: timestamp("training_completed"),
  trainingDuration: integer("training_duration"), // in seconds
  trainingLoss: decimal("training_loss", { precision: 10, scale: 6 }),
  validationLoss: decimal("validation_loss", { precision: 10, scale: 6 }),
  testAccuracy: decimal("test_accuracy", { precision: 5, scale: 4 }),
  modelPath: varchar("model_path", { length: 500 }),
  configPath: varchar("config_path", { length: 500 }),
  checkpointPath: varchar("checkpoint_path", { length: 500 }),
  hyperparameters: jsonb("hyperparameters"),
  metrics: jsonb("metrics"),
  status: varchar("status", { length: 50 }).default("training"), // training, completed, failed, deployed, deprecated
  deploymentUrl: varchar("deployment_url", { length: 500 }),
  apiEndpoint: varchar("api_endpoint", { length: 500 }),
  inferenceLatency: decimal("inference_latency", { precision: 8, scale: 3 }), // milliseconds
  throughput: integer("throughput"), // requests per second
  memoryUsage: integer("memory_usage"), // in bytes
  diskUsage: integer("disk_usage"), // in bytes
  trainingCost: decimal("training_cost", { precision: 10, scale: 2 }),
  inferenceCost: decimal("inference_cost", { precision: 10, scale: 6 }), // per request
  notes: text("notes"),
  trainedBy: integer("trained_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  isProduction: boolean("is_production").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Dataset Items table for training data management
export const aiDatasetItems = pgTable("ai_dataset_items", {
  id: serial("id").primaryKey(),
  datasetName: varchar("dataset_name", { length: 255 }).notNull(),
  itemType: varchar("item_type", { length: 100 }).notNull(), // text, conversation, audio, video, image
  category: varchar("category", { length: 100 }).notNull(), // grammar, vocabulary, pronunciation, conversation
  language: varchar("language", { length: 20 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  content: jsonb("content").notNull(),
  expectedOutput: jsonb("expected_output"),
  metadata: jsonb("metadata"),
  source: varchar("source", { length: 255 }), // where the data came from
  quality: varchar("quality", { length: 20 }).default("unverified"), // verified, unverified, flagged
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  tags: text("tags").array().default([]),
  usage: varchar("usage", { length: 100 }).default("training"), // training, validation, testing
  promptTemplate: text("prompt_template"),
  responseTemplate: text("response_template"),
  trainingNotes: text("training_notes"),
  performance: jsonb("performance"), // model performance metrics
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Call Insights table for call analytics and AI performance tracking
export const aiCallInsights = pgTable("ai_call_insights", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 255 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  leadId: integer("lead_id"),
  callStartTime: timestamp("call_start_time").notNull(),
  callEndTime: timestamp("call_end_time"),
  callDuration: integer("call_duration"), // seconds
  callType: varchar("call_type", { length: 100 }).notNull(), // inbound, outbound, callback
  callStatus: varchar("call_status", { length: 50 }).notNull(), // completed, abandoned, failed
  aiEngagementScore: integer("ai_engagement_score"), // 0-100
  sentimentScore: integer("sentiment_score"), // -100 to +100
  conversationQuality: varchar("conversation_quality", { length: 50 }), // excellent, good, fair, poor
  keyTopics: text("key_topics").array(),
  aiSuggestions: jsonb("ai_suggestions"),
  transcriptSummary: text("transcript_summary"),
  nextActionRecommended: text("next_action_recommended"),
  followUpScheduled: timestamp("follow_up_scheduled"),
  leadTemperature: varchar("lead_temperature", { length: 20 }), // hot, warm, cold
  conversionProbability: integer("conversion_probability"), // 0-100 percentage
  painPointsIdentified: text("pain_points_identified").array(),
  objections: text("objections").array(),
  productInterest: text("product_interest").array(),
  budgetIndicators: jsonb("budget_indicators"),
  timelineIndicators: varchar("timeline_indicators", { length: 100 }),
  decisionMakerLevel: varchar("decision_maker_level", { length: 50 }),
  competitorsMentioned: text("competitors_mentioned").array(),
  callOutcome: varchar("call_outcome", { length: 100 }), // qualified, not_qualified, follow_up, demo_scheduled
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Leads table for prospect and customer lead management
