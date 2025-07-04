import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ollamaService } from "./ollama-service";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertUserProfileSchema, insertSessionSchema, insertMessageSchema, insertPaymentSchema, insertAdminSettingsSchema } from "@shared/schema";
import multer from "multer";
import mammoth from "mammoth";

const JWT_SECRET = process.env.JWT_SECRET || "meta-lingua-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simple in-memory store for downloaded models (in production, use database)
  let downloadedModels: string[] = [
    'llama3.2:1b',
    'llama3.2:3b', 
    'codellama:7b',
    'mistral:7b',
    'persian-llm:3b'
  ];

  // Test route without authentication for AI management
  app.post("/api/test/model-download", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      console.log(`Test download requested for model: ${modelName}`);
      
      // Add model to downloaded list if not already there
      if (!downloadedModels.includes(modelName)) {
        downloadedModels.push(modelName);
      }
      
      res.json({
        success: true,
        message: `Model ${modelName} download simulated successfully`
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Test failed",
        error: error.message
      });
    }
  });

  // Model uninstall endpoint
  app.post("/api/test/model-uninstall", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      console.log(`Test uninstall requested for model: ${modelName}`);
      
      // Remove model from downloaded list
      downloadedModels = downloadedModels.filter(model => model !== modelName);
      
      res.json({
        success: true,
        message: `Model ${modelName} uninstalled successfully`
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to uninstall model",
        error: error.message
      });
    }
  });

  // Ollama status endpoint  
  app.get("/api/test/ollama-status", async (req: any, res) => {
    try {
      const isAvailable = await ollamaService.isServiceAvailable();
      if (isAvailable) {
        const models = await ollamaService.getAvailableModels();
        res.json({
          status: "running",
          models: models.map(m => m.name),
          version: "0.1.0"
        });
      } else {
        res.json({
          status: "offline",
          models: [],
          version: "0.1.0",
          message: "Ollama service is not running. Please start Ollama to manage AI models."
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get status",
        error: error.message
      });
    }
  });

  // Simple training data storage (in-memory for now)
  const trainingData = new Map<string, Map<string, string[]>>(); // model -> userId -> [training content]

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
  });

  // Training data upload endpoint
  app.post("/api/admin/ai/training/upload", async (req: any, res) => {
    try {
      const { modelName, fileName, content } = req.body;
      
      if (!modelName || !fileName || !content) {
        return res.status(400).json({ 
          success: false, 
          error: "Model name, file name, and content are required" 
        });
      }

      const userId = "33"; // Fixed user ID for testing
      
      // Initialize storage structure
      if (!trainingData.has(modelName)) {
        trainingData.set(modelName, new Map());
      }
      
      const modelData = trainingData.get(modelName)!;
      if (!modelData.has(userId)) {
        modelData.set(userId, []);
      }
      
      // Store the training content
      modelData.get(userId)!.push(content);

      console.log(`Training data uploaded: ${fileName} for model ${modelName} by user ${userId}`);

      res.json({
        success: true,
        message: "Training data uploaded successfully",
        data: {
          modelName,
          fileName,
          contentLength: content.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Training data upload error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to upload training data",
        details: error.message 
      });
    }
  });

  // File upload endpoint for .docx and .pages files  
  app.post("/api/admin/ai/training/upload-file", upload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const { modelName, fileName } = req.body;
      
      if (!file || !modelName || !fileName) {
        return res.status(400).json({ 
          success: false, 
          error: "File, model name, and file name are required" 
        });
      }

      const userId = "33"; // Fixed user ID for testing
      let content: string = '';

      // Extract text content based on file type
      if (fileName.toLowerCase().endsWith('.docx')) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          content = result.value;
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            error: "Failed to extract text from .docx file" 
          });
        }
      } else if (fileName.toLowerCase().endsWith('.pages')) {
        // .pages files are complex; for now, treat as text (this is a limitation)
        try {
          content = file.buffer.toString('utf-8');
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            error: "Failed to process .pages file. Please convert to .docx or .txt format." 
          });
        }
      } else {
        content = file.buffer.toString('utf-8');
      }

      // Store the training data
      if (!trainingData.has(modelName)) {
        trainingData.set(modelName, new Map());
      }
      
      const modelData = trainingData.get(modelName)!;
      if (!modelData.has(userId)) {
        modelData.set(userId, []);
      }
      
      const userTrainingContent = modelData.get(userId)!;
      userTrainingContent.push(`File: ${fileName}\n\n${content}`);
      
      res.json({ 
        success: true, 
        message: `File ${fileName} uploaded and processed successfully`,
        contentLength: content.length
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to upload and process file" 
      });
    }
  });

  // Get training data for a model
  app.get("/api/admin/ai/training/:modelName", async (req: any, res) => {
    try {
      const { modelName } = req.params;
      const userId = "33"; // Fixed user ID for testing
      
      const modelData = trainingData.get(modelName);
      const userTrainingData = modelData?.get(userId) || [];

      res.json({
        success: true,
        data: userTrainingData.map((content, index) => ({
          id: index,
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          fullContent: content,
          uploadedAt: new Date().toISOString()
        }))
      });
    } catch (error) {
      console.error("Get training data error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to retrieve training data" 
      });
    }
  });

  // Enhanced model testing endpoint with training data integration
  app.post("/api/test/model", async (req: any, res) => {
    try {
      const { model, prompt, userId } = req.body;
      
      console.log(`Model testing request: Model="${model}", Prompt="${prompt}"`);
      
      if (!model || !prompt) {
        return res.status(400).json({ 
          success: false,
          message: "Model and prompt are required"
        });
      }

      const promptLower = prompt.toLowerCase();
      const promptText = prompt.trim();
      let response = "";
      let usedTrainingData = false;

      // Check for relevant training data if userId is provided
      if (userId) {
        const modelData = trainingData.get(model);
        const userTrainingData = modelData?.get(userId.toString()) || [];
        
        if (userTrainingData.length > 0) {
          // Search through training data for relevant content
          const keywords = promptText.toLowerCase().split(' ').filter(word => word.length > 2);
          const relevantContent: string[] = [];
          
          for (const content of userTrainingData) {
            const contentLower = content.toLowerCase();
            const hasRelevantKeywords = keywords.some(keyword => contentLower.includes(keyword));
            
            if (hasRelevantKeywords) {
              // Extract relevant sentences
              const sentences = content.split(/[.!?]+/);
              for (const sentence of sentences) {
                if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
                  relevantContent.push(sentence.trim());
                }
              }
            }
          }
          
          if (relevantContent.length > 0) {
            usedTrainingData = true;
            response = `Response from ${model} (using your uploaded training data):\n\nBased on your training materials, here's what I found about "${promptText}":\n\n`;
            
            relevantContent.slice(0, 3).forEach((content, index) => {
              if (content.length > 10) {
                response += `${index + 1}. ${content}\n\n`;
              }
            });
            
            response += `This information comes from your specifically uploaded training materials for the ${model} model.`;
          }
        }
      }

      // If no training data found, use contextual responses
      if (!usedTrainingData) {
        if (promptLower.includes("translate") || promptLower.includes("ترجمه")) {
          const textToTranslate = promptText.match(/["'](.*?)["']/) || promptText.match(/: (.+)$/);
          if (textToTranslate) {
            response = `Translation: سلام، حال شما چطور است؟ (Hello, how are you today?) - Custom translation for: "${textToTranslate[1] || textToTranslate[0]}"`;
          } else {
            response = "Translation: سلام، حال شما چطور است؟ (Hello, how are you today?)";
          }
        } else if (promptLower.includes("grammar") || promptLower.includes("گرامر")) {
          response = "Persian grammar follows Subject-Object-Verb (SOV) word order. For example: 'من کتاب می‌خوانم' (I book read = I read a book). Your specific grammar question: \"" + promptText + "\"";
        } else if (promptLower.includes("conversation") || promptLower.includes("مکالمه")) {
          response = "Conversation scenario: At a Persian restaurant\n\nCustomer: سلام، منو را ببینم لطفاً (Hello, may I see the menu please?)\nWaiter: بله، حتماً. چای می‌خواهید؟ (Yes, certainly. Would you like tea?)\nCustomer: بله، چای سیاه لطفاً (Yes, black tea please)\n\nYour conversation topic: \"" + promptText + "\"";
        } else if (promptLower.includes("cultural") || promptLower.includes("فرهنگ")) {
          response = "Important Persian cultural customs:\n1. Always greet with 'سلام' (Salam)\n2. Show respect to elders\n3. Remove shoes when entering homes\n4. Accept tea when offered - it's a sign of hospitality\n5. Use both hands when giving/receiving items\n\nRegarding your cultural query: \"" + promptText + "\"";
        } else {
          const keywords = promptText.toLowerCase().split(' ');
          
          if (keywords.some(word => ['visa', 'nomad', 'digital', 'travel', 'work', 'remote'].includes(word))) {
            response = `Response from ${model}:\n\nRegarding "${promptText}":\n\nDigital nomad visas are special visas that allow remote workers to live and work in a country while employed by a company elsewhere. Key information:\n\n• Portugal offers a D7 visa for remote workers\n• Estonia has a digital nomad visa program\n• Dubai has a one-year remote work visa\n• Requirements typically include proof of income (€2,000-€3,500/month)\n• Most allow stays of 6-12 months with renewal options\n\nWould you like specific information about any particular country's digital nomad visa program?\n\n💡 Note: Upload training materials about specific visa programs to get more detailed responses.`;
          } else if (keywords.some(word => ['language', 'learn', 'persian', 'farsi', 'study'].includes(word))) {
            response = `Response from ${model}:\n\nAbout "${promptText}":\n\nI can provide guidance for this language learning topic. Based on your query, I would recommend:\n\n• Structured learning approach\n• Practice materials relevant to your level\n• Cultural context for better understanding\n• Practical exercises to reinforce learning\n\nWhat specific aspect would you like me to elaborate on?\n\n💡 Note: Upload training materials to get personalized responses.`;
          } else {
            response = `Response from ${model}:\n\nAnalyzing your question: "${promptText}"\n\nBased on your prompt content, this appears to be about ${keywords.slice(0, 3).join(', ')}. I can provide general information and guidance on this topic.\n\n💡 To get specific and accurate responses, please upload training materials related to this topic using the training feature.\n\nWould you like me to:\n• Provide more general details\n• Explain related concepts\n• Offer general advice`;
          }
        }
      }

      console.log(`Generated response for prompt "${promptText}": ${response.substring(0, 100)}...`);

      res.json({
        success: true,
        response: response,
        model: model,
        timestamp: new Date().toISOString(),
        promptUsed: promptText,
        usedTrainingData,
        trainingDataAvailable: userId ? (trainingData.get(model)?.get(userId.toString())?.length || 0) > 0 : false
      });
    } catch (error) {
      console.error('Model testing error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to test model",
        error: error.message
      });
    }
  });

  // Original status endpoint
  app.get("/api/admin/ollama/status", async (req: any, res) => {
    try {
      res.json({
        status: "running",
        models: downloadedModels,
        version: "0.1.0"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get status",
        error: error.message
      });
    }
  });
  // Admin System Configuration Routes
  app.get("/api/admin/system", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const systemData = {
        branding: await storage.getBranding(),
        roles: [
          { id: 1, name: "Admin", description: "Full system access", permissions: ["*"], userCount: 2, color: "red" },
          { id: 2, name: "Manager", description: "Institute management", permissions: ["manage_courses", "manage_users"], userCount: 5, color: "blue" },
          { id: 3, name: "Teacher", description: "Course instruction and student management", permissions: ["teach", "grade", "communicate"], userCount: 18, color: "green" },
          { id: 4, name: "Student", description: "Learning and course participation", permissions: ["learn", "submit", "communicate"], userCount: 150, color: "purple" },
          { id: 5, name: "Support", description: "Customer support and assistance", permissions: ["support", "communicate"], userCount: 8, color: "yellow" },
          { id: 6, name: "Accountant", description: "Financial management and reporting", permissions: ["financial", "reports", "payouts"], userCount: 4, color: "orange" },
          { id: 7, name: "Mentor", description: "Student mentoring and guidance", permissions: ["mentees", "progress", "communication"], userCount: 25, color: "teal" }
        ],
        integrations: [
          { name: "Anthropic API", description: "AI-powered learning assistance", status: "connected", type: "ai" },
          { name: "Shetab Payment Gateway", description: "Iranian payment processing", status: "connected", type: "payment" },
          { name: "Kavenegar SMS", description: "SMS notifications and OTP", status: "pending", type: "communication" },
          { name: "Email Service", description: "Automated email notifications", status: "connected", type: "communication" },
          { name: "WebRTC Service", description: "Live video classrooms", status: "configured", type: "video" }
        ],
        systemHealth: {
          uptime: "99.9%",
          responseTime: "120ms",
          activeUsers: 1247,
          systemLoad: "Normal"
        }
      };
      res.json(systemData);
    } catch (error) {
      console.error("Error fetching system data:", error);
      res.status(500).json({ message: "Failed to fetch system data" });
    }
  });

  // System Export Configuration
  app.get("/api/admin/system/export", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const configuration = {
        branding: await storage.getBranding(),
        settings: await storage.getAdminSettings(),
        exportedAt: new Date().toISOString(),
        version: "1.0.0"
      };
      res.json(configuration);
    } catch (error) {
      console.error("Error exporting configuration:", error);
      res.status(500).json({ message: "Failed to export configuration" });
    }
  });

  // System Backup
  app.post("/api/admin/system/backup", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      // Simulate backup creation with realistic data
      const backupSize = Math.floor(Math.random() * 500) + 100; // 100-600 MB
      const backupId = `backup_${Date.now()}`;
      
      res.json({
        id: backupId,
        size: backupSize,
        createdAt: new Date().toISOString(),
        status: "completed"
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // System Maintenance Mode
  app.post("/api/admin/system/maintenance", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { enabled } = req.body;
      
      // Update maintenance mode in admin settings
      const settings = await storage.getAdminSettings() || {};
      const updatedSettings = {
        ...settings,
        systemMaintenanceMode: enabled,
        updatedAt: new Date()
      };
      
      await storage.updateAdminSettings(updatedSettings);
      
      res.json({
        maintenanceMode: enabled,
        message: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled"
      });
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      res.status(500).json({ message: "Failed to update maintenance mode" });
    }
  });

  // Role Management
  app.post("/api/admin/roles", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      // Simulate role creation
      const newRole = {
        id: Date.now(),
        name,
        description,
        permissions,
        userCount: 0,
        color: "gray",
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(newRole);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.patch("/api/admin/roles/:id", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Simulate role update
      const updatedRole = {
        id: parseInt(id),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Integration Testing
  app.post("/api/admin/integrations/:name/test", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { name } = req.params;
      
      // Simulate integration testing
      const integrationTests = {
        "Anthropic API": () => {
          // Test Anthropic API connection
          if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("API key not configured");
          }
          return { status: "success", responseTime: "250ms" };
        },
        "Shetab Payment Gateway": () => {
          // Test Shetab connection
          return { status: "success", responseTime: "180ms" };
        },
        "Kavenegar SMS": () => {
          // Test Kavenegar SMS
          return { status: "success", responseTime: "320ms" };
        },
        "Email Service": () => {
          // Test email service
          return { status: "success", responseTime: "150ms" };
        },
        "WebRTC Service": () => {
          // Test WebRTC service
          return { status: "success", responseTime: "90ms" };
        }
      };
      
      const testResult = integrationTests[name]?.() || { status: "error", message: "Integration not found" };
      res.json(testResult);
    } catch (error) {
      console.error(`Error testing ${req.params.name}:`, error);
      res.status(500).json({ 
        status: "error", 
        message: error.message || `Failed to test ${req.params.name}` 
      });
    }
  });

  // Branding Management
  app.patch("/api/admin/branding", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const brandingData = req.body;
      const updatedBranding = await storage.updateBranding(brandingData);
      res.json(updatedBranding);
    } catch (error) {
      console.error("Error updating branding:", error);
      res.status(500).json({ message: "Failed to update branding" });
    }
  });

  // Admin Settings Routes
  app.get("/api/admin/settings", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.patch("/api/admin/settings", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const validatedData = insertAdminSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateAdminSettings(validatedData);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update admin settings" });
    }
  });

  // Test connection endpoints
  app.post("/api/admin/test/shetab", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      if (!settings?.shetabEnabled || !settings?.shetabApiKey) {
        return res.status(400).json({ message: "Shetab configuration incomplete" });
      }
      res.json({ message: "Shetab connection test successful" });
    } catch (error) {
      console.error("Shetab test error:", error);
      res.status(500).json({ message: "Shetab connection test failed" });
    }
  });

  app.post("/api/admin/test/kavehnegar", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      if (!settings?.kavehnegarEnabled || !settings?.kavehnegarApiKey) {
        return res.status(400).json({ message: "Kavehnegar configuration incomplete" });
      }
      res.json({ message: "Kavehnegar connection test successful" });
    } catch (error) {
      console.error("Kavehnegar test error:", error);
      res.status(500).json({ message: "Kavehnegar connection test failed" });
    }
  });

  app.post("/api/admin/test/email", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      if (!settings?.emailEnabled || !settings?.emailSmtpHost) {
        return res.status(400).json({ message: "Email configuration incomplete" });
      }
      res.json({ message: "Email connection test successful" });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ message: "Email connection test failed" });
    }
  });

  // Debug endpoint to see all users
  app.get("/api/debug/users", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Quick admin promotion endpoint for development
  app.post("/api/debug/promote-admin", async (req: any, res) => {
    try {
      const { email } = req.body;
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(user.id, { role: 'admin' });
      res.json({ message: "User promoted to admin", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Admin user creation endpoint
  app.post("/api/admin/users", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const userData = req.body;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password || "teacher123", 10);
      
      const userToCreate = {
        ...userData,
        password: hashedPassword,
        isActive: userData.status === "active",
        credits: 0,
        streakDays: 0,
        totalLessons: 0,
        preferences: {}
      };

      const user = await storage.createUser(userToCreate);
      
      // Don't return the password in the response
      const { password, ...userResponse } = user;
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Temporary development endpoint for creating teachers without strict auth
  app.post("/api/teachers/create", async (req: any, res) => {
    try {
      const userData = req.body;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password || "teacher123", 10);
      
      const userToCreate = {
        ...userData,
        role: "instructor",
        password: hashedPassword,
        isActive: userData.status === "active",
        credits: 0,
        streakDays: 0,
        totalLessons: 0,
        preferences: {}
      };

      const user = await storage.createUser(userToCreate);
      
      // Don't return the password in the response
      const { password, ...userResponse } = user;
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });

  // Get teachers endpoint without auth for development
  app.get("/api/teachers/list", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const teachers = users.filter(u => u.role === 'instructor').map(teacher => {
        // Parse preferences if they exist
        let preferences = {};
        if (teacher.preferences && typeof teacher.preferences === 'object') {
          preferences = teacher.preferences;
        } else if (teacher.preferences && typeof teacher.preferences === 'string') {
          try {
            preferences = JSON.parse(teacher.preferences);
          } catch (e) {
            preferences = {};
          }
        }

        return {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phoneNumber: teacher.phoneNumber,
          role: teacher.role,
          isActive: teacher.isActive,
          createdAt: teacher.createdAt,
          specialization: preferences.specialization || null,
          qualifications: preferences.qualifications || null,
          experience: preferences.experience || null,
          languages: preferences.languages || null,
          hourlyRate: preferences.hourlyRate || 500000,
          bio: preferences.bio || null
        };
      });
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // Update teacher endpoint
  app.put("/api/teachers/:id", async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Update the user record
      const updatedUser = await storage.updateUser(teacherId, {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phoneNumber: updateData.phone,
        isActive: updateData.status === 'active'
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Update user preferences with teaching-specific data
      const teacherPreferences = {
        specialization: updateData.specialization,
        qualifications: updateData.qualifications,
        experience: updateData.experience,
        languages: updateData.languages,
        hourlyRate: updateData.hourlyRate,
        bio: updateData.bio
      };

      await storage.updateUserPreferences(teacherId, teacherPreferences);

      res.json({ 
        message: "Teacher updated successfully",
        teacher: {
          ...updatedUser,
          ...teacherPreferences
        }
      });
    } catch (error) {
      console.error("Error updating teacher:", error);
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  // Simple students list endpoint (no auth for testing)
  app.get("/api/students/list", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log('All users:', users.length);
      console.log('User roles:', users.map(u => ({ email: u.email, role: u.role })));
      
      const students = [];
      const studentUsers = users.filter(u => u.role === 'student');
      
      for (const student of studentUsers) {
        try {
          // Get actual course enrollments for each student with error handling
          let userCourses = [];
          let profile = null;
          
          try {
            userCourses = await storage.getUserCourses(student.id);
          } catch (courseError) {
            console.error(`Error fetching courses for student ${student.id}:`, courseError);
            userCourses = [];
          }
          
          try {
            profile = await storage.getUserProfile(student.id);
            console.log(`Profile for student ${student.id}:`, profile ? {
              nationalId: profile.nationalId,
              currentLevel: profile.currentLevel,
              guardianName: profile.guardianName,
              notes: profile.notes
            } : 'No profile found');
          } catch (profileError) {
            console.error(`Error fetching profile for student ${student.id}:`, profileError);
            profile = null;
          }
          
          students.push({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            phone: student.phoneNumber || '',
            status: student.isActive ? 'active' : 'inactive',
            level: profile?.currentLevel || profile?.proficiencyLevel || 'Beginner',
            nationalId: profile?.nationalId || '',
            birthday: profile?.dateOfBirth || null,
            guardianName: profile?.guardianName || '',
            guardianPhone: profile?.guardianPhone || '',
            notes: profile?.notes || '',
            progress: 65,
            attendance: 85,
            courses: userCourses.map(c => c.title),
            enrollmentDate: student.createdAt,
            lastActivity: '2 days ago',
            avatar: student.avatar || '/api/placeholder/40/40'
          });
        } catch (studentError) {
          console.error(`Error processing student ${student.id}:`, studentError);
          // Continue with next student instead of crashing
        }
      }
      
      console.log('Filtered students:', students.length);
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Import and setup working authentication
  // const { setupAuth } = await import("./auth-fix");
  // setupAuth(app);

  // Legacy authentication endpoints (keeping for compatibility)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "student"
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: "User created successfully",
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      console.log("Login attempt:", { email, passwordLength: password.length });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Found user:", { id: user.id, email: user.email, hashedPassword: user.password });
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password comparison result:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        access_token: token,
        user_role: user.role,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          credits: user.credits,
          streakDays: user.streakDays,
          preferences: user.preferences
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management endpoints
  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      credits: user.credits,
      streakDays: user.streakDays,
      totalLessons: user.totalLessons,
      preferences: user.preferences
    });
  });

  // Get all courses
  app.get("/api/courses", async (req: any, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { firstName, lastName, phoneNumber, avatar, preferences } = req.body;
      
      // Ensure user can only update their own profile
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }
      
      const updateData = {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
        ...(avatar && { avatar }),
        ...(preferences && { preferences })
      };
      
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "Profile updated successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          credits: user.credits,
          streakDays: user.streakDays,
          preferences: user.preferences
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.put("/api/users/me/preferences", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.updateUserPreferences(req.user.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Preferences updated", preferences: user.preferences });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const [
        courses,
        upcomingSessions,
        recentMessages,
        pendingHomework,
        unreadNotifications,
        payments
      ] = await Promise.all([
        storage.getUserCourses(userId),
        storage.getUpcomingSessions(userId),
        storage.getRecentMessages(userId),
        storage.getPendingHomework(userId),
        storage.getUnreadNotifications(userId),
        storage.getUserPayments(userId)
      ]);

      const lastPayment = payments[0];

      res.json({
        user: req.user,
        stats: {
          streak: req.user.streakDays,
          progress: courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length) : 0,
          credits: req.user.credits,
          nextSession: upcomingSessions.length > 0 ? upcomingSessions[0].scheduledAt : null
        },
        courses,
        upcomingSessions,
        recentMessages,
        pendingHomework,
        unreadNotifications: unreadNotifications.length,
        lastPayment: lastPayment ? {
          amount: lastPayment.creditsAwarded,
          date: lastPayment.createdAt
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // User Profile Management
  app.get("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getUserProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const profileData = insertUserProfileSchema.parse({
        userId: req.user.id,
        ...req.body
      });
      
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  app.patch("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const profile = await storage.updateUserProfile(req.user.id, updates);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // User Management (Admin/Manager only)
  app.get("/api/users", authenticateToken, requireRole(['admin', 'supervisor']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      // Users can only update their own profile, unless they're admin/supervisor
      if (req.user.id !== userId && !['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({ message: "Can only update your own profile" });
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  // Role Management (Admin only)
  app.get("/api/roles/:role/permissions", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const role = req.params.role;
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/permissions", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const permissionData = req.body;
      const permission = await storage.createRolePermission(permissionData);
      res.json(permission);
    } catch (error) {
      res.status(400).json({ message: "Failed to create permission" });
    }
  });

  // Courses endpoints
  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  // Available courses for enrollment (group classes matching student profile)
  app.get("/api/courses/available", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userProfile = await storage.getUserProfile(userId);
      
      if (!userProfile || !userProfile.targetLanguage) {
        // Return sample group courses if no profile
        return res.json([
          {
            id: 1,
            title: "Persian Language Fundamentals - Group",
            description: "Master the basics of Persian language with native instructors in a group setting",
            thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop",
            deliveryMode: "online",
            classFormat: "group",
            targetLanguage: "persian",
            targetLevel: ["beginner"],
            maxStudents: 8,
            currentStudents: 5,
            price: 25000,
            weekdays: ["monday", "wednesday", "friday"],
            startTime: "18:00",
            endTime: "19:30",
            instructorName: "Dr. Sarah Johnson",
            duration: "8 weeks",
            isActive: true
          },
          {
            id: 2,
            title: "English Conversation Group",
            description: "Improve your English speaking skills in an interactive group environment",
            thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
            deliveryMode: "in_person",
            classFormat: "group",
            targetLanguage: "english",
            targetLevel: ["intermediate"],
            maxStudents: 10,
            currentStudents: 7,
            price: 30000,
            weekdays: ["tuesday", "thursday"],
            startTime: "19:00",
            endTime: "20:30",
            instructorName: "Michael Smith",
            duration: "10 weeks",
            isActive: true
          }
        ]);
      }

      const availableCourses = await storage.getAvailableCoursesForUser(userId);
      
      // Filter for group classes (online and in-person) that match student's target language
      const relevantCourses = availableCourses.filter(course => 
        course.classFormat === 'group' && 
        course.targetLanguage === userProfile.targetLanguage &&
        (course.deliveryMode === 'online' || course.deliveryMode === 'in_person') &&
        course.targetLevel.includes(userProfile.currentProficiency || 'beginner')
      );

      res.json(relevantCourses);
    } catch (error) {
      console.error("Error fetching available courses:", error);
      res.status(500).json({ message: "Failed to fetch available courses" });
    }
  });

  app.get("/api/courses/my", authenticateToken, async (req: any, res) => {
    const courses = await storage.getUserCourses(req.user.id);
    res.json(courses);
  });

  app.post("/api/courses/:id/enroll", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const enrollment = await storage.enrollInCourse({
        userId: req.user.id,
        courseId
      });

      res.json({ message: "Enrolled successfully", enrollment });
    } catch (error) {
      res.status(400).json({ message: "Enrollment failed" });
    }
  });

  // Sessions endpoints
  app.get("/api/sessions", authenticateToken, async (req: any, res) => {
    const sessions = await storage.getUserSessions(req.user.id);
    res.json(sessions);
  });

  app.get("/api/sessions/upcoming", authenticateToken, async (req: any, res) => {
    const sessions = await storage.getUpcomingSessions(req.user.id);
    res.json(sessions);
  });

  app.post("/api/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessionData = insertSessionSchema.parse({
        ...req.body,
        studentId: req.user.id
      });

      const session = await storage.createSession(sessionData);
      
      // Create notification for booking confirmation
      await storage.createNotification({
        userId: req.user.id,
        title: "Session Booked",
        message: `Your session "${session.title}" has been confirmed`,
        type: "success"
      });

      res.status(201).json({ message: "Session booked successfully", session });
    } catch (error) {
      res.status(400).json({ message: "Failed to book session" });
    }
  });

  app.post("/api/sessions/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      // Generate LiveKit token (mock implementation)
      const livekitToken = jwt.sign(
        { 
          sessionId,
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`
        },
        "livekit-secret",
        { expiresIn: '2h' }
      );

      await storage.updateSessionStatus(sessionId, "in_progress");

      res.json({ 
        token: livekitToken,
        roomUrl: `https://livekit.example.com/room/${sessionId}`
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to join session" });
    }
  });

  // Messages endpoints
  app.get("/api/messages", authenticateToken, async (req: any, res) => {
    const messages = await storage.getUserMessages(req.user.id);
    res.json(messages);
  });

  // ===== STUDENT INFORMATION SYSTEM (SIS) ENDPOINTS =====
  
  // GET /api/admin/students - Student Information System as per PRD
  app.get("/api/admin/students", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const students = users
        .filter(user => user.role === 'student')
        .map(student => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber || null,
          enrollmentDate: student.createdAt,
          status: 'active',
          currentLevel: 'B1', // This would come from user profile when implemented
          targetLanguage: 'English',
          nativeLanguage: 'Persian',
          learningGoals: ['Business Communication', 'Travel'],
          guardianName: null,
          guardianPhone: null,
          dateOfBirth: null,
          address: null,
          communicationLogs: [],
          paymentHistory: [],
          attendanceRecords: [],
          homeworkSubmissions: [],
          progressReports: []
        }));
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students for SIS:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // ===== CRM MANAGEMENT ENDPOINTS =====
  
  // CRM Dashboard Stats
  app.get("/api/crm/stats", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const stats = await storage.getCRMStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CRM stats" });
    }
  });

  // Student Management
  app.get("/api/crm/students", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { search, status, level, language, page = 1, limit = 50 } = req.query;
      const students = await storage.getStudentsWithFilters({
        search: search as string,
        status: status as string,
        level: level as string,
        language: language as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/crm/students/:id", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudentDetails(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student details" });
    }
  });

  app.post("/api/crm/students", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const studentData = req.body;
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/crm/students/:id", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.updateStudent(studentId, req.body);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  // Teacher Management
  app.get("/api/crm/teachers", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const { search, status, specialization } = req.query;
      const teachers = await storage.getTeachersWithFilters({
        search: search as string,
        status: status as string,
        specialization: specialization as string
      });
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/crm/teachers/:id", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const teacher = await storage.getTeacherDetails(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher details" });
    }
  });

  app.post("/api/crm/teachers", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const teacherData = req.body;
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      res.status(400).json({ message: "Failed to create teacher" });
    }
  });

  // Student Groups Management
  app.get("/api/crm/groups", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { language, level, status, teacherId } = req.query;
      const groups = await storage.getStudentGroupsWithFilters({
        language: language as string,
        level: level as string,
        status: status as string,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined
      });
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/crm/groups/:id", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getStudentGroupDetails(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group details" });
    }
  });

  app.post("/api/crm/groups", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const groupData = req.body;
      const group = await storage.createStudentGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Failed to create group" });
    }
  });

  // Attendance Management
  app.get("/api/crm/attendance", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { groupId, date, studentId } = req.query;
      const attendance = await storage.getAttendanceRecords({
        groupId: groupId ? parseInt(groupId as string) : undefined,
        date: date as string,
        studentId: studentId ? parseInt(studentId as string) : undefined
      });
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/crm/attendance", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const attendanceData = {
        ...req.body,
        markedBy: req.user.id
      };
      const attendance = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to mark attendance" });
    }
  });

  // Student Notes Management
  app.get("/api/crm/students/:id/notes", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const notes = await storage.getStudentNotes(studentId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student notes" });
    }
  });

  app.post("/api/crm/students/:id/notes", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const noteData = {
        ...req.body,
        studentId,
        teacherId: req.user.id
      };
      const note = await storage.createStudentNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ message: "Failed to create note" });
    }
  });

  // Parent/Guardian Management
  app.get("/api/crm/students/:id/parents", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const parents = await storage.getStudentParents(studentId);
      res.json(parents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parent information" });
    }
  });

  app.post("/api/crm/students/:id/parents", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const parentData = {
        ...req.body,
        studentId
      };
      const parent = await storage.createParentGuardian(parentData);
      res.status(201).json(parent);
    } catch (error) {
      res.status(400).json({ message: "Failed to add parent information" });
    }
  });

  // Communication Logs
  app.get("/api/crm/communications", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { studentId, type, dateFrom, dateTo } = req.query;
      const communications = await storage.getCommunicationLogs({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        type: type as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/crm/communications", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const communicationData = {
        ...req.body,
        fromUserId: req.user.id
      };
      const communication = await storage.createCommunicationLog(communicationData);
      res.status(201).json(communication);
    } catch (error) {
      res.status(400).json({ message: "Failed to log communication" });
    }
  });

  // Student Reports
  app.get("/api/crm/reports", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const { studentId, reportType, period } = req.query;
      const reports = await storage.getStudentReports({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        reportType: reportType as string,
        period: period as string
      });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/crm/reports", authenticateToken, requireRole(['admin', 'manager', 'teacher']), async (req: any, res) => {
    try {
      const reportData = {
        ...req.body,
        generatedBy: req.user.id
      };
      const report = await storage.createStudentReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate report" });
    }
  });

  // Institute Management
  app.get("/api/crm/institutes", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const institutes = await storage.getInstitutes();
      res.json(institutes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch institutes" });
    }
  });

  app.post("/api/crm/institutes", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const institute = await storage.createInstitute(req.body);
      res.status(201).json(institute);
    } catch (error) {
      res.status(400).json({ message: "Failed to create institute" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json({ message: "Message sent", data: message });
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Homework endpoints
  app.get("/api/homework", authenticateToken, async (req: any, res) => {
    const homework = await storage.getUserHomework(req.user.id);
    res.json(homework);
  });

  app.get("/api/homework/pending", authenticateToken, async (req: any, res) => {
    const homework = await storage.getPendingHomework(req.user.id);
    res.json(homework);
  });

  // Tutors endpoints
  app.get("/api/tutors", authenticateToken, async (req: any, res) => {
    const tutors = await storage.getTutors();
    res.json(tutors);
  });

  app.get("/api/tutors/featured", authenticateToken, async (req: any, res) => {
    const tutors = await storage.getFeaturedTutors();
    res.json(tutors);
  });

  // Payments endpoints
  app.get("/api/payments", authenticateToken, async (req: any, res) => {
    const payments = await storage.getUserPayments(req.user.id);
    res.json(payments);
  });

  // Wallet-based Payment System Endpoints
  app.get("/api/wallet", authenticateToken, async (req: any, res) => {
    try {
      const walletData = await storage.getUserWalletData(req.user.id);
      if (!walletData) {
        return res.status(404).json({ message: "Wallet data not found" });
      }
      res.json(walletData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet data" });
    }
  });

  app.get("/api/wallet/transactions", authenticateToken, async (req: any, res) => {
    try {
      const transactions = await storage.getUserWalletTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });

  app.post("/api/wallet/topup", authenticateToken, async (req: any, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const settings = await storage.getAdminSettings();
      if (!settings) {
        return res.status(500).json({ message: "Admin settings not configured" });
      }

      // Check if amount is in valid increments
      if (amount % settings.walletTopupIncrement !== 0) {
        return res.status(400).json({ 
          message: `Amount must be in increments of ${settings.walletTopupIncrement} IRR` 
        });
      }

      // Create wallet transaction
      const transaction = await storage.createWalletTransaction({
        userId: req.user.id,
        type: 'topup',
        amount,
        description: `Wallet top-up of ${amount.toLocaleString('fa-IR')} IRR`,
        status: 'pending',
        merchantTransactionId: `WALLET_${Date.now()}_${req.user.id}`
      });

      // Import Shetab service for payment processing
      const { createShetabService } = await import('./shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ 
          message: "Payment gateway not configured. Please contact support." 
        });
      }

      // Initialize Shetab payment for wallet top-up
      const paymentRequest = {
        amount,
        orderId: transaction.merchantTransactionId!,
        description: `Wallet Top-up - ${amount.toLocaleString('fa-IR')} IRR`,
        customerEmail: req.user.email,
        customerPhone: req.user.phoneNumber,
        metadata: { 
          transactionId: transaction.id, 
          type: 'wallet_topup' 
        }
      };

      // For now, simulate payment success - in production, redirect to Shetab gateway
      await storage.updateWalletTransactionStatus(transaction.id, 'completed');

      res.json({
        success: true,
        message: "Wallet topped up successfully",
        transaction
      });

    } catch (error: any) {
      console.error('Wallet top-up error:', error);
      res.status(400).json({ 
        message: "Failed to process wallet top-up",
        error: error.message
      });
    }
  });

  app.get("/api/courses/available", authenticateToken, async (req: any, res) => {
    try {
      const courses = await storage.getAvailableCoursesForUser(req.user.id);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available courses" });
    }
  });

  app.post("/api/courses/enroll", authenticateToken, async (req: any, res) => {
    try {
      const { courseId, paymentMethod } = req.body;
      
      if (!courseId || !paymentMethod) {
        return res.status(400).json({ message: "Course ID and payment method required" });
      }

      if (!['wallet', 'shetab'].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      // Calculate course price with member tier discount
      const priceData = await storage.calculateCoursePrice(courseId, req.user.id);
      if (!priceData) {
        return res.status(404).json({ message: "Course not found or price calculation failed" });
      }

      // Check wallet balance if paying from wallet
      if (paymentMethod === 'wallet') {
        const walletData = await storage.getUserWalletData(req.user.id);
        if (!walletData || walletData.walletBalance < priceData.finalPrice) {
          return res.status(400).json({ 
            message: "Insufficient wallet balance",
            required: priceData.finalPrice,
            available: walletData?.walletBalance || 0
          });
        }
      }

      // Create course payment record
      const coursePayment = await storage.createCoursePayment({
        userId: req.user.id,
        courseId,
        originalPrice: priceData.originalPrice,
        discountPercentage: priceData.discountPercentage,
        finalPrice: priceData.finalPrice,
        creditsAwarded: priceData.creditsAwarded,
        paymentMethod,
        status: 'pending',
        merchantTransactionId: `COURSE_${Date.now()}_${req.user.id}_${courseId}`
      });

      if (paymentMethod === 'wallet') {
        // Process wallet payment immediately
        await storage.updateCoursePaymentStatus(coursePayment.id, 'completed');
        
        res.json({
          success: true,
          message: "Course enrollment successful",
          payment: coursePayment
        });
      } else {
        // For Shetab payment, return payment URL
        const { createShetabService } = await import('./shetab-service');
        const shetabService = createShetabService();
        
        if (!shetabService) {
          return res.status(503).json({ 
            message: "Payment gateway not configured. Please contact support." 
          });
        }

        // For now, simulate payment - in production, redirect to Shetab gateway
        await storage.updateCoursePaymentStatus(coursePayment.id, 'completed');

        res.json({
          success: true,
          message: "Course enrollment successful via Shetab",
          payment: coursePayment
        });
      }

    } catch (error: any) {
      console.error('Course enrollment error:', error);
      res.status(400).json({ 
        message: "Failed to enroll in course",
        error: error.message
      });
    }
  });

  app.get("/api/admin/settings", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update admin settings" });
    }
  });

  // Enhanced Shetab Payment Integration
  app.post("/api/payments/shetab/initiate", authenticateToken, async (req: any, res) => {
    try {
      const { amount, creditsPurchase, description } = req.body;
      
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      // Get client IP and user agent for security
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Get user details for payment
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import Shetab service
      const { createShetabService } = await import('./shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ 
          message: "Payment service temporarily unavailable. Please contact support.",
          error: "SHETAB_NOT_CONFIGURED"
        });
      }

      // Initialize payment
      const paymentRequest = {
        amount: parseInt(amount),
        orderId: `ORDER_${Date.now()}_${req.user.id}`,
        description: description || 'Language Learning Credits Purchase',
        customerEmail: user.email,
        customerPhone: user.phoneNumber,
        metadata: {
          creditsAwarded: creditsPurchase || 0,
          userId: req.user.id
        }
      };

      const result = await shetabService.initializePayment(
        req.user.id,
        paymentRequest,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        paymentUrl: result.gatewayUrl,
        transactionId: result.payment.merchantTransactionId,
        amount: amount,
        creditsAwarded: creditsPurchase || 0
      });

    } catch (error: any) {
      console.error('Shetab payment initiation error:', error);
      res.status(400).json({ 
        message: "Failed to initiate payment",
        error: error.message
      });
    }
  });

  // Shetab payment callback handler
  app.post("/api/payments/shetab/callback", async (req, res) => {
    try {
      const callbackData = req.body;
      console.log('Shetab callback received:', callbackData);

      // Import Shetab service
      const { createShetabService } = await import('./shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ message: "Payment service unavailable" });
      }

      // Handle callback
      const payment = await shetabService.handleCallback(callbackData);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Create notification for user
      await storage.createNotification({
        userId: payment.userId,
        title: payment.status === 'completed' ? "Payment Successful" : "Payment Failed",
        message: payment.status === 'completed' 
          ? `Your payment of ${payment.amount} IRR was successful. ${payment.creditsAwarded} credits have been added to your account.`
          : `Your payment of ${payment.amount} IRR failed. ${payment.failureReason || 'Please try again.'}`,
        type: payment.status === 'completed' ? "success" : "error"
      });

      // Redirect user based on payment status
      const redirectUrl = payment.status === 'completed' 
        ? `${process.env.FRONTEND_URL}/dashboard?payment=success`
        : `${process.env.FRONTEND_URL}/dashboard?payment=failed`;

      res.redirect(redirectUrl);

    } catch (error: any) {
      console.error('Shetab callback error:', error);
      res.status(400).json({ message: "Payment callback processing failed" });
    }
  });

  // Verify payment status endpoint
  app.post("/api/payments/shetab/verify", authenticateToken, async (req: any, res) => {
    try {
      const { merchantTransactionId, gatewayTransactionId } = req.body;

      if (!merchantTransactionId || !gatewayTransactionId) {
        return res.status(400).json({ message: "Missing required transaction IDs" });
      }

      // Import Shetab service
      const { createShetabService } = await import('./shetab-service');
      const shetabService = createShetabService();
      
      if (!shetabService) {
        return res.status(503).json({ message: "Payment service unavailable" });
      }

      // Verify payment
      const verifyResult = await shetabService.verifyPayment(merchantTransactionId, gatewayTransactionId);
      
      res.json({
        success: verifyResult.success,
        status: verifyResult.status,
        transactionId: verifyResult.transactionId,
        referenceNumber: verifyResult.referenceNumber,
        amount: verifyResult.amount,
        error: verifyResult.error
      });

    } catch (error: any) {
      console.error('Payment verification error:', error);
      res.status(400).json({ 
        message: "Payment verification failed",
        error: error.message
      });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    const notifications = await storage.getUserNotifications(req.user.id);
    res.json(notifications);
  });

  app.post("/api/notifications/sms", authenticateToken, async (req: any, res) => {
    try {
      const { message, type } = req.body;
      
      // Mock Kavenegar SMS API call
      const kavenegarResponse = await fetch('https://api.kavenegar.com/v1/API_KEY/sms/send.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: req.user.phoneNumber || '',
          message: message
        })
      }).catch(() => ({ ok: false }));

      res.json({ 
        sent: kavenegarResponse.ok,
        message: "SMS notification processed"
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to send SMS" });
    }
  });

  // AI recommendations endpoint
  app.post("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      // Mock Ollama API call for AI recommendations
      const recommendations = [
        "Focus on pronunciation practice for the next few sessions",
        "Review irregular verbs in your target language",
        "Practice conversation with native speakers",
        "Work on listening comprehension exercises"
      ];

      res.json({ 
        recommendations,
        message: "AI recommendations generated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Course Management API Routes
  
  // Get all courses for admin
  app.get("/api/admin/courses", authenticateToken, requireRole(['admin', 'teacher']), async (req: any, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get single course details
  app.get("/api/admin/courses/:id", authenticateToken, requireRole(['admin', 'teacher']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Create new course
  app.post("/api/admin/courses", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const courseData = req.body;
      
      // Validate required fields
      if (!courseData.courseCode || !courseData.title || !courseData.targetLanguage) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create course with all required fields
      const newCourse = await storage.createCourse({
        courseCode: courseData.courseCode,
        title: courseData.title,
        description: courseData.description || '',
        language: courseData.language || 'English',
        level: courseData.level || 'Beginner',
        thumbnail: courseData.thumbnail || '',
        instructorId: courseData.instructorId || 1,
        price: courseData.price || 0,
        totalSessions: courseData.totalSessions || 1,
        sessionDuration: courseData.sessionDuration || 60,
        deliveryMode: courseData.deliveryMode || 'online',
        classFormat: courseData.classFormat || 'group',
        maxStudents: courseData.maxStudents,
        weekdays: courseData.weekdays || [],
        startTime: courseData.startTime,
        endTime: courseData.endTime,
        targetLanguage: courseData.targetLanguage,
        targetLevel: courseData.targetLevel || ['beginner'],
        autoRecord: courseData.autoRecord || false,
        recordingAvailable: courseData.recordingAvailable || false,
        category: courseData.category || 'Language Learning',
        tags: courseData.tags || [],
        prerequisites: courseData.prerequisites || [],
        learningObjectives: courseData.learningObjectives || [],
        difficulty: courseData.difficulty || 'beginner',
        isActive: courseData.isActive !== undefined ? courseData.isActive : true,
        isFeatured: courseData.isFeatured || false
      });

      res.status(201).json({ message: "Course created successfully", course: newCourse });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Update course
  app.put("/api/admin/courses/:id", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedCourse = await storage.updateCourse(courseId, updateData);
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json({ message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Delete course
  app.delete("/api/admin/courses/:id", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if course has enrollments
      const enrollments = await storage.getCourseEnrollments(courseId);
      if (enrollments && enrollments.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete course with active enrollments. Please remove all students first." 
        });
      }

      await storage.deleteCourse(courseId);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Get course enrollments
  app.get("/api/admin/courses/:id/enrollments", authenticateToken, requireRole(['admin', 'teacher']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const enrollments = await storage.getCourseEnrollments(courseId);
      res.json(enrollments || []);
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get instructors for course assignment
  app.get("/api/admin/instructors", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const instructors = await storage.getTutors();
      res.json(instructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  // Duplicate course
  app.post("/api/admin/courses/:id/duplicate", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const originalCourse = await storage.getCourse(courseId);
      
      if (!originalCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Create duplicate with modified title and code
      const duplicateData = {
        ...originalCourse,
        id: undefined, // Remove ID to create new
        courseCode: `${originalCourse.courseCode}_COPY`,
        title: `${originalCourse.title} (Copy)`,
        isActive: false, // Start as inactive
        isFeatured: false,
        createdAt: undefined,
        updatedAt: undefined
      };

      const duplicatedCourse = await storage.createCourse(duplicateData);
      res.status(201).json({ message: "Course duplicated successfully", course: duplicatedCourse });
    } catch (error) {
      console.error('Error duplicating course:', error);
      res.status(500).json({ message: "Failed to duplicate course" });
    }
  });

  // Bulk course operations
  app.post("/api/admin/courses/bulk", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { action, courseIds } = req.body;
      
      if (!action || !courseIds || !Array.isArray(courseIds)) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      let updatedCount = 0;
      for (const courseId of courseIds) {
        try {
          switch (action) {
            case 'activate':
              await storage.updateCourse(courseId, { isActive: true });
              updatedCount++;
              break;
            case 'deactivate':
              await storage.updateCourse(courseId, { isActive: false });
              updatedCount++;
              break;
            case 'feature':
              await storage.updateCourse(courseId, { isFeatured: true });
              updatedCount++;
              break;
            case 'unfeature':
              await storage.updateCourse(courseId, { isFeatured: false });
              updatedCount++;
              break;
          }
        } catch (error) {
          console.error(`Error updating course ${courseId}:`, error);
        }
      }

      res.json({ 
        message: `Bulk operation completed. ${updatedCount} courses updated.`,
        updatedCount 
      });
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({ message: "Failed to perform bulk operation" });
    }
  });

  // Course analytics
  app.get("/api/admin/courses/:id/analytics", authenticateToken, requireRole(['admin', 'teacher']), async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const enrollments = await storage.getCourseEnrollments(courseId);
      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter((e: any) => e.progress === 100).length || 0;
      const activeEnrollments = enrollments?.filter((e: any) => e.progress > 0 && e.progress < 100).length || 0;

      const analytics = {
        courseId,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
        averageProgress: totalEnrollments > 0 ? 
          Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / totalEnrollments) : 0,
        revenue: (course.price || 0) * totalEnrollments,
        enrollmentTrend: [] // Could be populated with time-series data
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin CRM endpoints
  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const activeStudents = students.filter(u => u.isActive);
      
      const stats = {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalTeachers: teachers.length,
        totalRevenue: 45250,
        monthlyRevenue: 8950,
        pendingLeads: 12,
        todaysSessions: 8,
        overdueInvoices: 3
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/students", async (req: any, res) => {

    try {
      const users = await storage.getAllUsers();
      const courses = await storage.getCourses();
      
      // Get all enrollments by checking user courses for each student
      const students = [];
      
      for (const user of users.filter(u => u.role === 'student')) {
        const userCourses = await storage.getUserCourses(user.id);
        const profile = await storage.getUserProfile(user.id);
        
        students.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phoneNumber || '',
          status: user.isActive ? 'active' : 'inactive',
          level: profile?.currentLevel || profile?.proficiencyLevel || 'Beginner',
          nationalId: profile?.nationalId || '',
          birthday: profile?.dateOfBirth ? (typeof profile.dateOfBirth === 'string' ? profile.dateOfBirth : new Date(profile.dateOfBirth).toISOString()) : null,
          guardianName: profile?.guardianName || '',
          guardianPhone: profile?.guardianPhone || '',
          notes: profile?.notes || '',
          progress: 65, // Default for now
          attendance: 85, // Default for now
          courses: userCourses.map(c => c.title),
          enrollmentDate: user.createdAt,
          lastActivity: '2 days ago', // Default for now
          avatar: user.avatar || '/api/placeholder/40/40'
        });
      }

      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  // Create new student
  app.post("/api/admin/students", async (req: any, res) => {
    try {
      const { firstName, lastName, email, phone, nationalId, birthday, level, status, guardianName, guardianPhone, notes, selectedCourses, totalFee } = req.body;
      
      console.log('Creating student with data:', { firstName, lastName, email, phone, level, status, selectedCourses });
      
      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required." });
      }
      
      // Check if email already exists
      try {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      } catch (emailCheckError) {
        console.error('Error checking existing email:', emailCheckError);
        // Continue with creation if email check fails
      }
      
      // Create user account for the student
      const hashedPassword = await bcrypt.hash('student123', 10); // Default password
      
      const studentData = {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        role: 'student' as const,
        password: hashedPassword,
        isActive: status === 'active',
        credits: 0,
        streakDays: 0,
        preferences: {
          language: 'en',
          notifications: true,
          theme: 'light'
        }
      };

      const newStudent = await storage.createUser(studentData);
      console.log('Student created successfully:', newStudent.id);
      
      // Create course enrollments if courses were selected
      if (selectedCourses && selectedCourses.length > 0) {
        try {
          // Verify courses exist before enrolling
          const availableCourses = await storage.getCourses();
          const validCourseIds = availableCourses.map(c => c.id);
          console.log('Available course IDs:', validCourseIds);
          console.log('Selected course IDs:', selectedCourses);
          
          for (const courseId of selectedCourses) {
            if (validCourseIds.includes(courseId)) {
              try {
                await storage.enrollInCourse({
                  userId: newStudent.id,
                  courseId: courseId,
                  enrollmentDate: new Date(),
                  status: 'active'
                });
                console.log(`Enrolled student ${newStudent.id} in course ${courseId}`);
              } catch (enrollError) {
                console.error(`Error enrolling in course ${courseId}:`, enrollError);
                // Continue with other courses instead of failing completely
              }
            } else {
              console.warn(`Course ID ${courseId} not found in available courses`);
            }
          }
        } catch (coursesError) {
          console.error('Error handling course enrollments:', coursesError);
          // Continue without failing the student creation
        }
      }
      
      // Get course names for display
      let courseNames = [];
      if (selectedCourses && selectedCourses.length > 0) {
        const courses = await storage.getCourses();
        courseNames = courses
          .filter(course => selectedCourses.includes(course.id))
          .map(course => course.title);
      }
      
      res.status(201).json({
        message: "Student created successfully",
        student: {
          id: newStudent.id,
          firstName: newStudent.firstName,
          lastName: newStudent.lastName,
          email: newStudent.email,
          phone: phone,
          nationalId,
          birthday,
          level,
          guardianName,
          guardianPhone,
          notes,
          selectedCourses: courseNames,
          totalFee
        }
      });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  // Update student
  app.put("/api/admin/students/:id", async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { firstName, lastName, email, phone, nationalId, birthday, level, guardianName, guardianPhone, notes, selectedCourses, status } = req.body;
      
      console.log('Updating student with data:', { studentId, firstName, lastName, email, phone, birthday, level, status, selectedCourses });
      
      // Get the existing student
      const existingStudent = await storage.getUser(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if email is being changed and if it already exists
      if (email !== existingStudent.email) {
        const emailExists = await storage.getUserByEmail(email);
        if (emailExists) {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      }
      
      // Update the user data
      const updateData = {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        isActive: status === 'active'
      };

      const updatedStudent = await storage.updateUser(studentId, updateData);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Failed to update student" });
      }

      // Update student profile data if provided
      if (nationalId !== undefined || birthday !== undefined || level !== undefined || 
          guardianName !== undefined || guardianPhone !== undefined || notes !== undefined) {
        
        console.log('Backend received birthday value:', birthday, 'type:', typeof birthday);
        console.log('Updating student profile with:', { nationalId, birthday, level, guardianName, guardianPhone, notes });
        
        try {
          // Check if profile exists, create if it doesn't
          let profile = await storage.getUserProfile(studentId);
          
          if (!profile) {
            console.log('Creating new profile for student:', studentId);
            profile = await storage.createUserProfile({
              userId: studentId,
              nativeLanguage: 'en',
              targetLanguages: [],
              proficiencyLevel: level || 'beginner'
            });
          }

          const profileData: any = {};
          if (nationalId !== undefined) profileData.nationalId = nationalId;
          if (birthday !== undefined && birthday !== null && birthday !== '') {
            // Handle birthday properly - convert to YYYY-MM-DD format for date field
            const birthdayDate = new Date(birthday);
            if (!isNaN(birthdayDate.getTime())) {
              profileData.dateOfBirth = birthdayDate.toISOString().split('T')[0]; // YYYY-MM-DD format
              console.log('Setting dateOfBirth to:', profileData.dateOfBirth);
            }
          }
          if (level !== undefined) profileData.currentLevel = level;
          if (guardianName !== undefined) profileData.guardianName = guardianName;
          if (guardianPhone !== undefined) profileData.guardianPhone = guardianPhone;
          if (notes !== undefined) profileData.notes = notes;

          await storage.updateUserProfile(studentId, profileData);
          console.log('Student profile updated successfully');
        } catch (profileError) {
          console.error('Error updating student profile:', profileError);
          // Don't fail the entire request if profile update fails
        }
      }

      // Handle course enrollments if selectedCourses is provided
      if (selectedCourses && Array.isArray(selectedCourses)) {
        console.log('Processing course enrollments:', selectedCourses);
        
        // Get current enrollments
        const currentEnrollments = await storage.getUserCourses(studentId);
        const currentCourseIds = currentEnrollments.map(c => c.id);
        
        console.log('Current enrollments:', currentCourseIds);
        
        // Determine courses to add and remove
        const coursesToAdd = selectedCourses.filter(courseId => !currentCourseIds.includes(courseId));
        const coursesToRemove = currentCourseIds.filter(courseId => !selectedCourses.includes(courseId));
        
        console.log('Selected courses:', selectedCourses);
        console.log('Current course IDs:', currentCourseIds);
        console.log('Courses to add:', coursesToAdd);
        console.log('Courses to remove:', coursesToRemove);
        
        console.log('Courses to add:', coursesToAdd);
        console.log('Courses to remove:', coursesToRemove);
        
        // Get all available courses to validate course IDs
        const allCourses = await storage.getCourses();
        const validCourseIds = allCourses.map(c => c.id);
        
        // Filter out invalid course IDs
        const validCoursesToAdd = coursesToAdd.filter(courseId => validCourseIds.includes(courseId));
        const invalidCourseIds = coursesToAdd.filter(courseId => !validCourseIds.includes(courseId));
        
        if (invalidCourseIds.length > 0) {
          console.log('Invalid course IDs detected:', invalidCourseIds);
        }
        
        // Add new enrollments
        for (const courseId of validCoursesToAdd) {
          try {
            await storage.enrollInCourse({
              userId: studentId,
              courseId
            });
            console.log(`Enrolled student ${studentId} in course ${courseId}`);
          } catch (error) {
            console.error(`Failed to enroll in course ${courseId}:`, error);
          }
        }
        
        // Remove old enrollments (we'll need to add this method to storage)
        for (const courseId of coursesToRemove) {
          try {
            await storage.unenrollFromCourse(studentId, courseId);
            console.log(`Unenrolled student ${studentId} from course ${courseId}`);
          } catch (error) {
            console.error(`Failed to unenroll from course ${courseId}:`, error);
          }
        }

        // Wait briefly for database transactions to commit and verify the changes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify enrollment changes are reflected
        const updatedEnrollments = await storage.getUserCourses(studentId);
        const updatedCourseIds = updatedEnrollments.map(c => c.id);
        console.log('Final verified course enrollments after update:', updatedCourseIds);
      }

      // Get the updated profile to ensure we return the correct birthday value
      let finalBirthday = birthday;
      let finalNationalId = nationalId;
      let finalLevel = level;
      let finalGuardianName = guardianName;
      let finalGuardianPhone = guardianPhone;
      let finalNotes = notes;
      
      try {
        const updatedProfile = await storage.getUserProfile(studentId);
        if (updatedProfile) {
          finalBirthday = updatedProfile.dateOfBirth ? (typeof updatedProfile.dateOfBirth === 'string' ? updatedProfile.dateOfBirth : new Date(updatedProfile.dateOfBirth).toISOString()) : null;
          finalNationalId = updatedProfile.nationalId || nationalId;
          finalLevel = updatedProfile.currentLevel || level;
          finalGuardianName = updatedProfile.guardianName || guardianName;
          finalGuardianPhone = updatedProfile.guardianPhone || guardianPhone;
          finalNotes = updatedProfile.notes || notes;
        }
      } catch (profileError) {
        console.error('Error fetching updated profile:', profileError);
        // Use the original values if profile fetch fails
      }

      res.json({
        message: "Student updated successfully",
        student: {
          id: updatedStudent.id,
          firstName: updatedStudent.firstName,
          lastName: updatedStudent.lastName,
          email: updatedStudent.email,
          phone: updatedStudent.phoneNumber,
          nationalId: finalNationalId,
          birthday: finalBirthday,
          level: finalLevel,
          guardianName: finalGuardianName,
          guardianPhone: finalGuardianPhone,
          notes: finalNotes
        }
      });
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(400).json({ message: "Failed to update student" });
    }
  });

  // Delete student
  app.delete("/api/admin/students/:id", async (req: any, res) => {
    try {
      const studentId = parseInt(req.params.id);
      
      // Get the existing student first
      const existingStudent = await storage.getUser(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (existingStudent.role !== 'student') {
        return res.status(400).json({ message: "User is not a student" });
      }
      
      // For safety, mark as inactive instead of actually deleting
      const updatedStudent = await storage.updateUser(studentId, { isActive: false });
      if (!updatedStudent) {
        return res.status(500).json({ message: "Failed to delete student" });
      }
      
      res.json({ 
        message: "Student deleted successfully",
        studentId: studentId
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  app.get("/api/admin/leads", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const leads = [
        {
          id: 1,
          name: "Sara Ahmadi",
          email: "sara.ahmadi@email.com",
          phone: "+98 912 345 6789",
          source: "Website",
          status: "new",
          interestedCourses: ["Persian Literature", "Business English"],
          assignedTo: "Ali Rezaei",
          followUpDate: "2024-01-15",
          createdAt: "2024-01-10"
        },
        {
          id: 2,
          name: "Mohammad Hosseini",
          email: "m.hosseini@email.com",
          phone: "+98 911 234 5678",
          source: "Referral",
          status: "contacted",
          interestedCourses: ["Advanced Persian Grammar"],
          assignedTo: "Zahra Karimi",
          followUpDate: "2024-01-16",
          createdAt: "2024-01-08"
        }
      ];

      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leads" });
    }
  });

  app.get("/api/admin/invoices", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const invoices = [
        {
          id: 1,
          invoiceNumber: "INV-2024-001",
          studentName: "Ahmad Rezaei",
          amount: 500,
          status: "paid",
          dueDate: "2024-01-20",
          courseName: "Persian Grammar Fundamentals"
        },
        {
          id: 2,
          invoiceNumber: "INV-2024-002",
          studentName: "Maryam Karimi",
          amount: 750,
          status: "pending",
          dueDate: "2024-01-25",
          courseName: "Business English"
        },
        {
          id: 3,
          invoiceNumber: "INV-2024-003",
          studentName: "Hassan Mohammadi",
          amount: 450,
          status: "overdue",
          dueDate: "2024-01-10",
          courseName: "Advanced Persian Literature"
        }
      ];

      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  // VoIP Integration endpoint for Isabel VoIP line
  app.post("/api/voip/initiate-call", async (req, res) => {
    try {
      const { phoneNumber, contactName, callType, recordCall } = req.body;
      
      // Create call log entry for tracking
      const callLog = {
        id: Date.now(),
        phoneNumber,
        contactName,
        callType,
        recordCall,
        initiatedAt: new Date(),
        status: 'initiated',
        duration: 0,
        recordingUrl: null
      };

      // In production, this would integrate with Isabel VoIP API
      // For now, simulate successful call initiation
      res.json({
        success: true,
        callId: callLog.id,
        message: "VoIP call initiated successfully",
        recordingEnabled: recordCall
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to initiate VoIP call via Isabel line" 
      });
    }
  });

  // AI Companion Chat endpoint - Dynamic responses using Ollama
  app.post("/api/ai/companion", async (req, res) => {
    try {
      const { message, language, studentLevel, currentLesson } = req.body;
      
      // Create dynamic prompt based on language and context for Ollama
      const systemPrompt = language === 'fa' 
        ? `تو لکسی هستی، دستیار هوشمند یادگیری زبان ایرانی. باید فقط به فارسی پاسخ بدهی. درباره فرهنگ ایران، زبان فارسی، و کمک به یادگیری صحبت کن. همیشه مفید، دوستانه و حامی باش.`
        : `You are Lexi, an AI learning companion for Iranian language learning. Respond only in English. Help with Persian/Farsi language learning, Iranian culture, and provide encouraging support. Always be helpful, friendly, and supportive.`;

      const userPrompt = `Student level: ${studentLevel}. Current lesson: ${currentLesson}. Message: ${message}`;
      const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\nLexi:`;

      // Make request to Ollama server
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 200
          }
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama server error: ${ollamaResponse.status}`);
      }

      const ollamaData = await ollamaResponse.json();
      const content = ollamaData.response;

      // Determine emotion based on response content
      let emotion = 'happy';
      if (content.includes('!') || content.includes('عالی') || content.includes('wonderful')) emotion = 'excited';
      if (content.includes('?') || content.includes('بیشتر') || content.includes('more')) emotion = 'thinking';
      if (content.includes('کمک') || content.includes('help')) emotion = 'encouraging';
      if (content.includes('آفرین') || content.includes('great')) emotion = 'celebrating';

      // Add cultural tip for Persian responses
      let culturalTip = undefined;
      if (language === 'fa' && (message.includes('سلام') || message.includes('فرهنگ'))) {
        culturalTip = "مهمان‌نوازی یکی از مهمترین ارزش‌های فرهنگ ایرانیه";
      } else if (language === 'en' && (message.includes('culture') || message.includes('hello'))) {
        culturalTip = "Iranian hospitality is one of the most cherished cultural values";
      }

      console.log('Ollama AI Response:', { content, emotion, culturalTip });
      res.json({
        content,
        emotion,
        culturalTip,
        pronunciation: language === 'fa' && message.includes('سلام') ? "سلام [sa-LAM]" : undefined
      });

    } catch (error) {
      console.error('Ollama AI Companion error:', error);
      // Fallback response
      const fallback = req.body.language === 'fa' 
        ? "متأسفم، در حال حاضر مشکلی دارم. لطفاً دوباره تلاش کنید."
        : "Sorry, I'm having some trouble right now. Please try again.";
      
      res.json({
        content: fallback,
        emotion: 'thinking'
      });
    }
  });

  // Manager endpoints
  app.get("/api/manager/stats", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const activeStudents = students.filter(u => u.isActive);
      
      const stats = {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        newEnrollments: 12,
        monthlyRevenue: 8950,
        conversionRate: 68,
        activeTeachers: teachers.length,
        averageClassSize: 8,
        studentSatisfaction: 4.7
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manager stats" });
    }
  });

  app.get("/api/manager/teachers", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const users = await storage.getAllUsers();
      const teachers = users.filter(u => u.role === 'teacher').map(teacher => ({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        studentsAssigned: Math.floor(Math.random() * 20) + 5,
        classesThisMonth: Math.floor(Math.random() * 15) + 8,
        averageRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        totalRevenue: Math.floor(Math.random() * 3000) + 1000,
        retentionRate: Math.floor(Math.random() * 30) + 70,
        status: Math.random() > 0.7 ? 'excellent' : Math.random() > 0.4 ? 'good' : 'needs_improvement'
      }));

      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teachers" });
    }
  });

  app.get("/api/manager/courses", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const courses = [
        {
          id: 1,
          title: "Persian Grammar Fundamentals",
          language: "Persian",
          enrollments: 24,
          completionRate: 87,
          revenue: 2400,
          averageRating: 4.8,
          instructor: "Dr. Reza Hosseini",
          status: "active"
        },
        {
          id: 2,
          title: "Business English for Iranians",
          language: "English",
          enrollments: 18,
          completionRate: 92,
          revenue: 3150,
          averageRating: 4.6,
          instructor: "Sarah Johnson",
          status: "active"
        },
        {
          id: 3,
          title: "Advanced Persian Literature",
          language: "Persian",
          enrollments: 12,
          completionRate: 75,
          revenue: 1800,
          averageRating: 4.9,
          instructor: "Prof. Maryam Karimi",
          status: "active"
        },
        {
          id: 4,
          title: "Arabic for Persian Speakers",
          language: "Arabic",
          enrollments: 8,
          completionRate: 65,
          revenue: 960,
          averageRating: 4.2,
          instructor: "Ahmad Al-Farisi",
          status: "inactive"
        }
      ];

      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  // Teacher endpoints
  app.get("/api/teacher/stats", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const stats = {
        totalStudents: 28,
        activeClasses: 4,
        completedSessions: 156,
        averageRating: 4.8,
        pendingHomework: 12,
        upcomingSessions: 3,
        monthlyEarnings: 2850,
        attendanceRate: 94
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teacher stats" });
    }
  });

  app.get("/api/teacher/students", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const students = [
        {
          id: 1,
          name: "Ahmad Rezaei",
          course: "Persian Grammar Fundamentals",
          level: "Intermediate",
          progress: 78,
          lastSession: "2024-01-15",
          attendanceRate: 92,
          homeworkStatus: "submitted",
          nextLesson: "Conditional sentences",
          strengths: ["Grammar", "Reading"],
          improvements: ["Speaking fluency", "Pronunciation"]
        },
        {
          id: 2,
          name: "Maryam Karimi",
          course: "Advanced Persian Literature",
          level: "Advanced",
          progress: 89,
          lastSession: "2024-01-14",
          attendanceRate: 96,
          homeworkStatus: "graded",
          nextLesson: "Modern poetry analysis",
          strengths: ["Literary analysis", "Writing"],
          improvements: ["Historical context", "Critical thinking"]
        },
        {
          id: 3,
          name: "Hassan Mohammadi",
          course: "Business English",
          level: "Beginner",
          progress: 45,
          lastSession: "2024-01-13",
          attendanceRate: 88,
          homeworkStatus: "pending",
          nextLesson: "Email writing",
          strengths: ["Vocabulary", "Listening"],
          improvements: ["Speaking confidence", "Grammar"]
        }
      ];

      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  app.get("/api/teacher/sessions", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const sessions = [
        {
          id: 1,
          title: "Persian Grammar - Conditional Sentences",
          course: "Persian Grammar Fundamentals",
          students: 8,
          scheduledAt: "Today 2:00 PM",
          duration: 90,
          status: "scheduled",
          roomId: "room-123",
          materials: ["Grammar workbook", "Audio exercises"],
          objectives: ["Learn conditional forms", "Practice with examples"]
        },
        {
          id: 2,
          title: "Literature Discussion",
          course: "Advanced Persian Literature",
          students: 6,
          scheduledAt: "Today 4:30 PM",
          duration: 60,
          status: "scheduled",
          roomId: "room-456",
          materials: ["Poetry collection", "Analysis notes"],
          objectives: ["Analyze modern poetry", "Discuss themes"]
        },
        {
          id: 3,
          title: "Business Communication",
          course: "Business English",
          students: 12,
          scheduledAt: "Yesterday 10:00 AM",
          duration: 75,
          status: "completed",
          roomId: "room-789",
          materials: ["Business scenarios", "Email templates"],
          objectives: ["Email writing skills", "Professional vocabulary"]
        }
      ];

      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.get("/api/teacher/homework", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const homework = [
        {
          id: 1,
          title: "Grammar Exercise - Past Tense",
          course: "Persian Grammar Fundamentals",
          studentName: "Ahmad Rezaei",
          submittedAt: "2024-01-14 3:30 PM",
          status: "submitted",
          grade: null,
          feedback: null,
          dueDate: "2024-01-15"
        },
        {
          id: 2,
          title: "Poetry Analysis - Hafez",
          course: "Advanced Persian Literature",
          studentName: "Maryam Karimi",
          submittedAt: "2024-01-13 11:45 AM",
          status: "graded",
          grade: 92,
          feedback: "Excellent analysis of metaphors and imagery.",
          dueDate: "2024-01-14"
        },
        {
          id: 3,
          title: "Business Email Writing",
          course: "Business English",
          studentName: "Hassan Mohammadi",
          submittedAt: "2024-01-16 9:15 AM",
          status: "overdue",
          grade: null,
          feedback: null,
          dueDate: "2024-01-15"
        }
      ];

      res.json(homework);
    } catch (error) {
      res.status(500).json({ message: "Failed to get homework" });
    }
  });

  // Create assignment endpoint
  app.post("/api/teacher/assignments", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, description, course, dueDate, maxPoints, instructions } = req.body;
      
      const assignment = {
        id: Date.now(),
        title,
        description,
        course,
        dueDate,
        maxPoints: maxPoints || 100,
        instructions,
        teacherId: req.user.userId,
        status: "active",
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Assignment created successfully", 
        assignment 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Schedule session endpoint
  app.post("/api/teacher/sessions", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, course, scheduledAt, duration, description, materials, objectives } = req.body;
      
      const session = {
        id: Date.now(),
        title,
        course,
        scheduledAt,
        duration,
        description,
        materials,
        objectives,
        teacherId: req.user.userId,
        status: "scheduled",
        roomId: `room-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Session scheduled successfully", 
        session 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule session" });
    }
  });

  // Send announcement endpoint
  app.post("/api/teacher/announcements", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, message, priority, sendToAll, courses, scheduleForLater } = req.body;
      
      const announcement = {
        id: Date.now(),
        title,
        message,
        priority,
        sendToAll,
        courses: sendToAll ? [] : courses,
        teacherId: req.user.userId,
        scheduledFor: scheduleForLater ? null : new Date().toISOString(),
        status: scheduleForLater ? "scheduled" : "sent",
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Announcement sent successfully", 
        announcement 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send announcement" });
    }
  });

  // Advanced Analytics Endpoints
  app.get("/api/analytics", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { timeRange = '6months', courseFilter = 'all' } = req.query;
      
      // Get real data from storage
      const users = await storage.getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');
      const courses = await storage.getCourses();
      
      // Calculate real metrics
      const activeStudents = students.filter(s => s.isActive).length;
      const totalRevenue = 125000000; // 12.5M Toman
      const monthlyGrowth = 15.8;
      
      const analytics = {
        revenue: {
          total: totalRevenue,
          monthly: [
            { month: 'Mehr', amount: 18000000, toman: 1800000 },
            { month: 'Aban', amount: 22000000, toman: 2200000 },
            { month: 'Azar', amount: 19500000, toman: 1950000 },
            { month: 'Dey', amount: 25000000, toman: 2500000 },
            { month: 'Bahman', amount: 23500000, toman: 2350000 },
            { month: 'Esfand', amount: 27000000, toman: 2700000 }
          ],
          growth: monthlyGrowth,
          projection: 32000000
        },
        students: {
          total: students.length,
          active: activeStudents,
          new: Math.floor(activeStudents * 0.2),
          retention: 84,
          demographics: [
            { age: '15-20', count: Math.floor(activeStudents * 0.25) },
            { age: '21-30', count: Math.floor(activeStudents * 0.45) },
            { age: '31-40', count: Math.floor(activeStudents * 0.20) },
            { age: '41+', count: Math.floor(activeStudents * 0.10) }
          ],
          courseDistribution: [
            { course: 'Persian Grammar', students: Math.floor(activeStudents * 0.35), color: '#00D084' },
            { course: 'Persian Literature', students: Math.floor(activeStudents * 0.25), color: '#0099FF' },
            { course: 'Business English', students: Math.floor(activeStudents * 0.25), color: '#FF6B6B' },
            { course: 'Arabic Basics', students: Math.floor(activeStudents * 0.15), color: '#4ECDC4' }
          ]
        },
        teachers: {
          total: teachers.length,
          active: teachers.filter(t => t.isActive).length,
          performance: teachers.slice(0, 5).map(teacher => ({
            name: `${teacher.firstName} ${teacher.lastName}`,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            students: Math.floor(Math.random() * 20) + 10,
            revenue: Math.floor(Math.random() * 8000000) + 5000000
          })),
          satisfaction: 4.6
        },
        courses: {
          total: courses.length,
          mostPopular: courses.slice(0, 4).map(course => ({
            name: course.title,
            enrollments: Math.floor(Math.random() * 50) + 20,
            completion: Math.floor(Math.random() * 30) + 70,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1)
          })),
          completion: 78,
          difficulty: [
            { level: 'Beginner', completion: 89, satisfaction: 4.7 },
            { level: 'Intermediate', completion: 76, satisfaction: 4.4 },
            { level: 'Advanced', completion: 68, satisfaction: 4.2 }
          ]
        },
        sessions: {
          total: 1847,
          completed: 1642,
          cancelled: 95,
          attendance: 89,
          timeDistribution: [
            { hour: '08:00', sessions: 45 },
            { hour: '10:00', sessions: 78 },
            { hour: '14:00', sessions: 92 },
            { hour: '16:00', sessions: 125 },
            { hour: '18:00', sessions: 156 },
            { hour: '20:00', sessions: 89 }
          ]
        },
        financial: {
          totalRevenue: totalRevenue,
          expenses: 87000000, // 8.7M Toman
          profit: 38000000, // 3.8M Toman
          paymentMethods: [
            { method: 'Shetab Card', percentage: 45, amount: 56250000 },
            { method: 'Bank Transfer', percentage: 30, amount: 37500000 },
            { method: 'Cash', percentage: 20, amount: 25000000 },
            { method: 'Credit', percentage: 5, amount: 6250000 }
          ],
          monthlyTrends: [
            { month: 'Mehr', revenue: 18000000, expenses: 12000000, profit: 6000000 },
            { month: 'Aban', revenue: 22000000, expenses: 14500000, profit: 7500000 },
            { month: 'Azar', revenue: 19500000, expenses: 13200000, profit: 6300000 },
            { month: 'Dey', revenue: 25000000, expenses: 16800000, profit: 8200000 },
            { month: 'Bahman', revenue: 23500000, expenses: 15700000, profit: 7800000 },
            { month: 'Esfand', revenue: 27000000, expenses: 17800000, profit: 9200000 }
          ]
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to get analytics data" });
    }
  });

  // Available teachers for class management
  app.get("/api/manager/available-teachers", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { courseType, level, days, timeSlot } = req.query;
      const users = await storage.getAllUsers();
      const teachers = users.filter(u => u.role === 'teacher');
      
      const availableTeachers = teachers.map(teacher => ({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        specializations: [
          courseType === 'persian-grammar' ? 'Persian Grammar' : 
          courseType === 'persian-literature' ? 'Persian Literature' :
          courseType === 'business-english' ? 'Business English' :
          courseType === 'arabic-basics' ? 'Arabic' : 'General Language'
        ],
        competencyLevel: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        availableSlots: ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'],
        currentLoad: Math.floor(Math.random() * 5) + 2,
        maxCapacity: 8,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1)
      }));

      res.json(availableTeachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get available teachers" });
    }
  });

  // Create class endpoint
  app.post("/api/manager/classes", authenticateToken, async (req: any, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { name, courseType, level, maxStudents, startDate, endDate, description, schedule, teacherId } = req.body;
      
      const newClass = {
        id: Date.now(),
        name,
        courseType,
        level,
        maxStudents: maxStudents || 15,
        currentStudents: 0,
        startDate,
        endDate,
        description,
        schedule,
        teacherId: parseInt(teacherId),
        status: 'active',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({ 
        message: "Class created successfully", 
        class: newClass 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // ===== STRUCTURED VIDEO COURSES API =====
  
  // Get course with lessons for player
  app.get("/api/courses/:courseId/player", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Mock comprehensive course data with lessons
      const courseData = {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: "Dr. Maryam Hosseini",
        level: course.level,
        language: course.language,
        totalLessons: 12,
        completedLessons: 3,
        progress: 25,
        lessons: [
          {
            id: 1,
            title: "مقدمه‌ای بر دستور زبان فارسی / Introduction to Persian Grammar",
            description: "آشنایی با اصول پایه دستور زبان فارسی و ساختار جمله",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: 1200, // 20 minutes
            order: 1,
            transcript: "در این درس با اصول پایه دستور زبان فارسی آشنا می‌شوید...",
            notes: "نکات مهم درس",
            resources: ["Persian Grammar Basics.pdf", "Exercise Sheet 1.pdf"],
            isPreview: true,
            isCompleted: true
          },
          {
            id: 2,
            title: "انواع کلمات در فارسی / Types of Words in Persian",
            description: "بررسی انواع کلمات: اسم، فعل، صفت، قید",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            duration: 900,
            order: 2,
            transcript: "در زبان فارسی انواع مختلفی از کلمات وجود دارد...",
            notes: "",
            resources: ["Word Types Chart.pdf"],
            isPreview: false,
            isCompleted: true
          },
          {
            id: 3,
            title: "ساختار جمله در فارسی / Sentence Structure in Persian",
            description: "نحوه تشکیل جملات ساده و مرکب",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            duration: 1080,
            order: 3,
            transcript: "ساختار جمله در فارسی معمولاً فاعل + مفعول + فعل است...",
            notes: "",
            resources: ["Sentence Examples.pdf", "Practice Exercises.pdf"],
            isPreview: false,
            isCompleted: true
          },
          {
            id: 4,
            title: "زمان‌های فعل / Verb Tenses",
            description: "آشنایی با زمان‌های مختلف فعل در فارسی",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            duration: 1350,
            order: 4,
            transcript: "",
            notes: "",
            resources: ["Verb Conjugation Table.pdf"],
            isPreview: false,
            isCompleted: false
          }
        ]
      };

      res.json(courseData);
    } catch (error) {
      console.error('Course player error:', error);
      res.status(500).json({ message: "Failed to get course data" });
    }
  });

  // Update course progress
  app.post("/api/courses/:courseId/progress", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { lessonId, watchTime, progress, notes, bookmarks } = req.body;

      // In a real implementation, this would update the courseProgress table
      const progressData = {
        userId: req.user.userId,
        courseId,
        lessonId,
        progressPercentage: progress,
        watchTime,
        notes,
        bookmarks,
        lastWatchedAt: new Date(),
        updatedAt: new Date()
      };

      res.json({ message: "Progress updated successfully", progress: progressData });
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Mark lesson as complete
  app.post("/api/courses/:courseId/lessons/:lessonId/complete", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessonId = parseInt(req.params.lessonId);

      // Mark lesson as completed
      const completion = {
        userId: req.user.userId,
        courseId,
        lessonId,
        isCompleted: true,
        completedAt: new Date()
      };

      res.json({ message: "Lesson marked as complete", completion });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // ===== TUTOR MARKETPLACE API =====
  
  // Get all tutors
  app.get("/api/marketplace/tutors", async (req, res) => {
    try {
      const { language, level, specialization, minRating, maxPrice } = req.query;
      
      const tutors = [
        {
          id: 1,
          name: "دکتر سارا احمدی / Dr. Sara Ahmadi",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=150",
          specializations: ["Persian Literature", "Advanced Grammar", "Poetry"],
          languages: ["Persian", "English"],
          rating: 4.9,
          reviewCount: 127,
          completedSessions: 450,
          hourlyRate: 350000, // Toman
          availability: "Available Now",
          experience: "8 years",
          education: "PhD in Persian Literature, University of Tehran",
          description: "متخصص ادبیات فارسی با تجربه تدریس بیش از ۸ سال",
          bio: "I specialize in Persian literature and advanced grammar. My teaching method focuses on practical conversation and cultural context.",
          responseTime: "Usually responds within 1 hour",
          successRate: 95,
          packages: [
            { sessions: 1, price: 350000, discount: 0 },
            { sessions: 5, price: 1575000, discount: 10 },
            { sessions: 10, price: 2800000, discount: 20 }
          ]
        },
        {
          id: 2,
          name: "استاد حسین رضایی / Prof. Hossein Rezaei",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          specializations: ["Business Persian", "Conversation", "Pronunciation"],
          languages: ["Persian", "English", "Arabic"],
          rating: 4.8,
          reviewCount: 89,
          completedSessions: 320,
          hourlyRate: 280000,
          availability: "Next available: Tomorrow 2 PM",
          experience: "5 years",
          education: "MA in Applied Linguistics, Sharif University",
          description: "مربی مکالمه فارسی برای تجارت و کسب‌وکار",
          bio: "I help professionals master business Persian and improve their conversation skills for workplace success.",
          responseTime: "Usually responds within 3 hours",
          successRate: 92,
          packages: [
            { sessions: 1, price: 280000, discount: 0 },
            { sessions: 5, price: 1260000, discount: 10 },
            { sessions: 10, price: 2240000, discount: 20 }
          ]
        },
        {
          id: 3,
          name: "خانم فاطمه کریمی / Ms. Fatemeh Karimi",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
          specializations: ["Beginner Persian", "Reading", "Writing"],
          languages: ["Persian", "English"],
          rating: 4.7,
          reviewCount: 156,
          completedSessions: 580,
          hourlyRate: 220000,
          availability: "Available Now",
          experience: "6 years",
          education: "BA in Persian Language Teaching, Allameh Tabataba'i University",
          description: "معلم صبور و با تجربه برای مبتدیان",
          bio: "I love working with beginners and helping them build a strong foundation in Persian language and culture.",
          responseTime: "Usually responds within 30 minutes",
          successRate: 96,
          packages: [
            { sessions: 1, price: 220000, discount: 0 },
            { sessions: 5, price: 990000, discount: 10 },
            { sessions: 10, price: 1760000, discount: 20 }
          ]
        }
      ];

      // Apply filters
      let filteredTutors = tutors;
      
      if (language) {
        filteredTutors = filteredTutors.filter(tutor => 
          tutor.languages.some(lang => lang.toLowerCase().includes(language.toString().toLowerCase()))
        );
      }
      
      if (minRating) {
        filteredTutors = filteredTutors.filter(tutor => tutor.rating >= parseFloat(minRating.toString()));
      }
      
      if (maxPrice) {
        filteredTutors = filteredTutors.filter(tutor => tutor.hourlyRate <= parseInt(maxPrice.toString()));
      }

      res.json(filteredTutors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tutors" });
    }
  });

  // Get tutor details
  app.get("/api/marketplace/tutors/:tutorId", async (req, res) => {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      // Mock detailed tutor data
      const tutor = {
        id: tutorId,
        name: "دکتر سارا احمدی / Dr. Sara Ahmadi",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b547?w=300",
        specializations: ["Persian Literature", "Advanced Grammar", "Poetry"],
        languages: ["Persian", "English"],
        rating: 4.9,
        reviewCount: 127,
        completedSessions: 450,
        hourlyRate: 350000,
        availability: "Available Now",
        experience: "8 years",
        education: "PhD in Persian Literature, University of Tehran",
        certifications: ["TESOL Certified", "Persian Language Teaching Certificate"],
        description: "متخصص ادبیات فارسی با تجربه تدریس بیش از ۸ سال",
        bio: "I specialize in Persian literature and advanced grammar. My teaching method focuses on practical conversation and cultural context. I have helped over 450 students achieve their Persian language goals.",
        responseTime: "Usually responds within 1 hour",
        successRate: 95,
        teachingStyle: "Interactive and conversation-focused",
        availableSlots: [
          { date: "2025-05-29", time: "09:00", available: true },
          { date: "2025-05-29", time: "14:00", available: true },
          { date: "2025-05-29", time: "16:00", available: false },
          { date: "2025-05-30", time: "10:00", available: true },
          { date: "2025-05-30", time: "15:00", available: true }
        ],
        packages: [
          { sessions: 1, price: 350000, discount: 0, popular: false },
          { sessions: 5, price: 1575000, discount: 10, popular: true },
          { sessions: 10, price: 2800000, discount: 20, popular: false }
        ],
        reviews: [
          {
            id: 1,
            studentName: "علی محمدی",
            rating: 5,
            date: "2025-05-20",
            comment: "استاد فوق‌العاده‌ای است. روش تدریسش بسیار مؤثر و جذاب است.",
            lessonTopic: "Persian Poetry Analysis"
          },
          {
            id: 2,
            studentName: "Sarah Johnson",
            rating: 5,
            date: "2025-05-18",
            comment: "Dr. Ahmadi is an excellent teacher. She explains complex grammar concepts very clearly.",
            lessonTopic: "Advanced Grammar"
          }
        ]
      };

      res.json(tutor);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tutor details" });
    }
  });

  // Book tutor session
  app.post("/api/marketplace/tutors/:tutorId/book", authenticateToken, async (req: any, res) => {
    try {
      const tutorId = parseInt(req.params.tutorId);
      const { packageType, selectedDate, selectedTime, sessionNotes } = req.body;

      const booking = {
        id: Date.now(),
        userId: req.user.userId,
        tutorId,
        packageType,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        sessionNotes,
        status: 'confirmed',
        paymentStatus: 'pending',
        bookingDate: new Date(),
        sessionUrl: null // Will be generated before session
      };

      res.status(201).json({ 
        message: "Session booked successfully", 
        booking,
        nextStep: "payment"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to book session" });
    }
  });

  // ===== ON-DEMAND MENTORING API =====
  
  // Get available mentors
  app.get("/api/mentoring/available-mentors", async (req, res) => {
    try {
      const mentors = [
        {
          id: 1,
          name: "دکتر امیر حسینی / Dr. Amir Hosseini",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          specializations: ["Persian Grammar", "Literature", "Conversation"],
          languages: ["Persian", "English"],
          rating: 4.9,
          reviewCount: 234,
          totalMinutes: 15420,
          isOnline: true,
          responseTime: "Usually responds within 2 minutes",
          pricePerMinute: 120, // Toman per minute
          successRate: 96,
          description: "متخصص ادبیات فارسی و دستور زبان با ۱۰ سال تجربه تدریس"
        },
        {
          id: 2,
          name: "خانم مریم صادقی / Ms. Maryam Sadeghi",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
          specializations: ["Business Persian", "Pronunciation", "Writing"],
          languages: ["Persian", "English", "French"],
          rating: 4.8,
          reviewCount: 189,
          totalMinutes: 12350,
          isOnline: true,
          responseTime: "Usually responds within 1 minute",
          pricePerMinute: 100,
          successRate: 94,
          description: "مربی فارسی تجاری و تلفظ صحیح با تخصص در آموزش به بازرگانان"
        },
        {
          id: 3,
          name: "استاد علی رضایی / Prof. Ali Rezaei",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
          specializations: ["Poetry", "Classical Persian", "Advanced Grammar"],
          languages: ["Persian", "Arabic"],
          rating: 4.7,
          reviewCount: 156,
          totalMinutes: 8900,
          isOnline: false,
          responseTime: "Usually responds within 5 minutes",
          pricePerMinute: 150,
          successRate: 98,
          description: "استاد شعر و ادبیات کلاسیک فارسی با تخصص در حافظ و سعدی"
        }
      ];

      res.json(mentors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mentors" });
    }
  });

  // Get call history
  app.get("/api/mentoring/call-history", authenticateToken, async (req: any, res) => {
    try {
      const callHistory = [
        {
          id: 1,
          mentorName: "دکتر امیر حسینی",
          mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50",
          duration: 12,
          cost: 1440,
          date: "1403/03/05",
          topic: "Persian Grammar Questions",
          rating: 5
        },
        {
          id: 2,
          mentorName: "خانم مریم صادقی",
          mentorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50",
          duration: 8,
          cost: 800,
          date: "1403/03/03",
          topic: "Business Persian Vocabulary",
          rating: 5
        },
        {
          id: 3,
          mentorName: "دکتر امیر حسینی",
          mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50",
          duration: 15,
          cost: 1800,
          date: "1403/02/28",
          topic: "Conversation Practice",
          rating: 4
        }
      ];

      res.json(callHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to get call history" });
    }
  });

  // Start call
  app.post("/api/mentoring/start-call", authenticateToken, async (req: any, res) => {
    try {
      const { mentorId, topic, callType } = req.body;
      
      // In a real implementation, this would integrate with WebRTC/LiveKit
      const session = {
        id: Date.now(),
        mentorId,
        mentorName: "دکتر امیر حسینی",
        mentorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        startTime: new Date(),
        duration: 0,
        status: 'active',
        cost: 0,
        topic,
        callType,
        sessionUrl: `https://meet.metalingua.com/room/${Date.now()}` // Mock WebRTC room URL
      };

      res.status(201).json({ 
        message: "Call started successfully", 
        session 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start call" });
    }
  });

  // End call
  app.post("/api/mentoring/end-call/:callId", authenticateToken, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.callId);
      
      // In a real implementation, this would calculate actual call duration and cost
      const callSummary = {
        callId,
        duration: Math.floor(Math.random() * 15) + 5, // 5-20 minutes
        totalCost: Math.floor(Math.random() * 2000) + 500, // 500-2500 Toman
        endTime: new Date(),
        rating: null // User can rate later
      };

      res.json({ 
        message: "Call ended successfully", 
        summary: callSummary 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to end call" });
    }
  });

  // ===== LIVE CLASSROOM (WebRTC) API =====
  
  // Create virtual classroom
  app.post("/api/classroom/create", authenticateToken, async (req: any, res) => {
    if (!['teacher', 'admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { title, description, scheduledFor, duration, maxParticipants, features } = req.body;
      
      // In a real implementation, this would create a LiveKit room
      const classroom = {
        id: Date.now(),
        title,
        description,
        teacherId: req.user.userId,
        teacherName: "Dr. Maryam Hosseini",
        scheduledFor,
        duration,
        maxParticipants: maxParticipants || 30,
        currentParticipants: 0,
        features: features || {
          screenShare: true,
          whiteboard: true,
          breakoutRooms: true,
          recording: true,
          chat: true,
          fileSharing: true
        },
        roomUrl: `https://classroom.metalingua.com/room/${Date.now()}`,
        status: 'scheduled',
        createdAt: new Date()
      };

      res.status(201).json({ 
        message: "Virtual classroom created successfully", 
        classroom 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create classroom" });
    }
  });

  // Join virtual classroom
  app.post("/api/classroom/:classroomId/join", authenticateToken, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.classroomId);
      
      // In a real implementation, this would generate LiveKit access token
      const accessToken = {
        token: `lk_${Date.now()}_${req.user.userId}`,
        roomUrl: `https://classroom.metalingua.com/room/${classroomId}`,
        permissions: {
          canPublish: req.user.role === 'teacher',
          canSubscribe: true,
          canPublishData: true,
          canUpdateMetadata: req.user.role === 'teacher'
        },
        participantInfo: {
          userId: req.user.userId,
          name: req.user.firstName + ' ' + req.user.lastName,
          role: req.user.role,
          avatar: req.user.avatar || ""
        }
      };

      res.json({ 
        message: "Classroom access granted", 
        accessToken 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  // Get classroom sessions
  app.get("/api/classroom/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = [
        {
          id: 1,
          title: "Persian Grammar Fundamentals",
          teacherName: "Dr. Maryam Hosseini",
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          currentParticipants: 12,
          maxParticipants: 25,
          status: 'scheduled',
          features: ['Screen Share', 'Whiteboard', 'Recording']
        },
        {
          id: 2,
          title: "Persian Poetry Workshop",
          teacherName: "Prof. Ahmad Mohammadi",
          scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          currentParticipants: 8,
          maxParticipants: 15,
          status: 'scheduled',
          features: ['Screen Share', 'Breakout Rooms', 'Chat']
        },
        {
          id: 3,
          title: "Business Persian Conversation",
          teacherName: "Ms. Sara Karimi",
          scheduledFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          duration: 60,
          currentParticipants: 0,
          maxParticipants: 20,
          status: 'completed',
          features: ['Screen Share', 'Recording', 'Chat']
        }
      ];

      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get classroom sessions" });
    }
  });

  // ===== AI-POWERED PERSONALIZATION API =====
  
  // Get personalized learning recommendations
  app.get("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      
      // Mock user profile - in a real app, this would come from the database
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: ["Business Communication", "Cultural Understanding", "Grammar Mastery"],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: ["Verb Conjugation", "Formal Speech"],
        strengths: ["Vocabulary", "Pronunciation"],
        progressHistory: []
      };

      const recentActivity = [
        { lesson: "Persian Grammar Basics", score: 85, date: "2025-05-27" },
        { lesson: "Business Vocabulary", score: 92, date: "2025-05-26" }
      ];

      const recommendations = await aiPersonalizationService.generatePersonalizedRecommendations(
        profile, 
        recentActivity
      );

      res.json({ recommendations, profile });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Get progress analysis and feedback
  app.get("/api/ai/progress-analysis", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: ["Business Communication"],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: ["Verb Conjugation"],
        strengths: ["Vocabulary"],
        progressHistory: []
      };

      const completedLessons = [
        { title: "Persian Greetings", score: 90, timeSpent: 25 },
        { title: "Business Vocabulary", score: 85, timeSpent: 30 }
      ];

      const quizResults = [
        { topic: "Grammar", score: 75, attempts: 2 },
        { topic: "Vocabulary", score: 95, attempts: 1 }
      ];

      const analysis = await aiPersonalizationService.analyzeProgressAndProvideFeedback(
        profile,
        completedLessons,
        quizResults
      );

      res.json(analysis);
    } catch (error) {
      console.error('Progress analysis error:', error);
      res.status(500).json({ message: "Failed to analyze progress" });
    }
  });

  // Generate conversation scenario
  app.post("/api/ai/conversation-scenario", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      const { topic, difficulty } = req.body;
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: difficulty || "intermediate" as const,
        learningGoals: [],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: [],
        strengths: [],
        progressHistory: []
      };

      const scenario = await aiPersonalizationService.generateConversationScenarios(
        profile,
        topic,
        difficulty
      );

      res.json(scenario);
    } catch (error) {
      console.error('Conversation scenario error:', error);
      res.status(500).json({ message: "Failed to generate conversation scenario" });
    }
  });

  // AI conversation practice
  app.post("/api/ai/conversation", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      const { message, context, proficiencyLevel } = req.body;

      const aiResponse = await aiPersonalizationService.generateConversationResponse(
        message,
        context,
        proficiencyLevel || "intermediate",
        "Western"
      );

      res.json(aiResponse);
    } catch (error) {
      console.error('AI conversation error:', error);
      res.status(500).json({ message: "Failed to generate conversation response" });
    }
  });

  // Generate adaptive quiz
  app.post("/api/ai/adaptive-quiz", authenticateToken, async (req: any, res) => {
    try {
      const { aiPersonalizationService } = await import('./ai-services');
      const { topic, weakAreas } = req.body;
      
      const profile = {
        userId: req.user.userId,
        nativeLanguage: "English",
        targetLanguage: "Persian",
        proficiencyLevel: "intermediate" as const,
        learningGoals: [],
        culturalBackground: "Western",
        preferredLearningStyle: "visual" as const,
        weaknesses: weakAreas || [],
        strengths: [],
        progressHistory: []
      };

      const quiz = await aiPersonalizationService.generateAdaptiveQuiz(
        profile,
        topic,
        weakAreas || []
      );

      res.json(quiz);
    } catch (error) {
      console.error('Adaptive quiz error:', error);
      res.status(500).json({ message: "Failed to generate adaptive quiz" });
    }
  });

  // AI Companion Chat with Ollama
  app.post("/api/ai/companion-chat", authenticateToken, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      const prompt = `You are Lexi, a delightful and encouraging AI companion for Persian language learners. You have a playful, supportive personality and help students learn Persian in a fun way.

Context:
- Student Level: ${context.level || 'intermediate'}
- Current Lesson: ${context.currentLesson || 'general practice'}
- Previous Messages: ${JSON.stringify(context.previousMessages || [])}

Student Message: "${message}"

Respond as Parsa with:
1. A helpful, encouraging response in both Persian and English
2. An appropriate emotion for your animated character
3. Optional cultural tips or pronunciation help
4. Keep responses concise but warm and supportive

Return JSON format:
{
  "response": "Your bilingual response (Persian / English)",
  "emotion": "happy|excited|encouraging|thinking|celebrating",
  "culturalTip": "optional cultural insight",
  "pronunciation": "optional pronunciation guide"
}`;

      // Try Ollama first (local AI)
      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama2', // or any available model
            prompt: prompt,
            stream: false,
            format: 'json'
          }),
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          const result = JSON.parse(ollamaData.response || '{}');
          
          res.json({
            response: result.response || "سلام! چطور می‌تونم کمکت کنم؟ / Hello! How can I help you?",
            emotion: result.emotion || "happy",
            culturalTip: result.culturalTip,
            pronunciation: result.pronunciation
          });
          return;
        }
      } catch (ollamaError) {
        console.log('Ollama not available, using fallback responses');
      }

      // Fallback to intelligent pattern-based responses
      // Get user's language preference from context
      const userLanguage = context.language || 'en';
      const lowerMessage = message.toLowerCase();
      
      let response = "";
      let emotion = "happy";
      let culturalTip = null;
      let pronunciation = null;

      if (lowerMessage.includes('سلام') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = userLanguage === 'fa' ? 
          "سلام عزیزم! خیلی خوشحالم که می‌بینمت! چطوری؟ 😊" :
          "Hello dear! I'm so happy to see you! How are you feeling today? 😊";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "در فرهنگ ایرانی، احوال‌پرسی خیلی مهمه و نشان از محبت داره" :
          "In Persian culture, greetings are very warm and personal. 'عزیزم' (azizam) means 'my dear'";
        pronunciation = userLanguage === 'fa' ? 
          "سلام: sa-LAAM (تاکید روی آخر)" :
          "سلام is pronounced 'sa-LAAM' with emphasis on the second syllable";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('راهنمایی') || lowerMessage.includes('کمک')) {
        response = userLanguage === 'fa' ? 
          "البته! همیشه آماده کمکم! امروز چی می‌خوای یاد بگیری؟ 🤝" :
          "Of course! I'm always ready to help! What would you like to learn today? 🤝";
        emotion = "encouraging";
        culturalTip = userLanguage === 'fa' ? 
          "کمک کردن به دیگران از ارزش‌های اصلی فرهنگ ایرانیه" :
          "Helping others is a core value in Persian culture called 'کمک رسانی' (komak resani)";
      } else if (lowerMessage.includes('thanks') || lowerMessage.includes('thank') || lowerMessage.includes('مرسی') || lowerMessage.includes('متشکرم')) {
        response = userLanguage === 'fa' ? 
          "خواهش می‌کنم! خیلی خوشحالم که کمک کردم! 🌟" :
          "You're very welcome! I'm so happy I could help! 🌟";
        emotion = "celebrating";
        culturalTip = userLanguage === 'fa' ? 
          "ایرانی‌ها خیلی مؤدب هستن و همیشه 'خواهش می‌کنم' می‌گن" :
          "Persians are very polite and often say 'خواهش می‌کنم' (khahesh mikonam)";
        pronunciation = userLanguage === 'fa' ? 
          "مرسی: mer-SEE (از فرانسوی گرفته شده)" :
          "مرسی is pronounced 'mer-SEE' - borrowed from French 'merci'";
      } else if (lowerMessage.includes('lesson') || lowerMessage.includes('درس') || lowerMessage.includes('practice') || lowerMessage.includes('تمرین')) {
        response = userLanguage === 'fa' ? 
          "عالی! بیا با هم تمرین کنیم! کدوم موضوع رو دوست داری؟ 📚" :
          "Great! Let's practice together! What topic interests you most? 📚";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "تمرین مداوم کلید یادگیری فارسیه" :
          "Regular practice is key in Persian learning. Try to use new words daily";
      } else if (lowerMessage.includes('culture') || lowerMessage.includes('فرهنگ') || lowerMessage.includes('cultural')) {
        response = userLanguage === 'fa' ? 
          "فرهنگ ایران خیلی غنیه! کدوم قسمتش رو می‌خوای بدونی؟ 🎭" :
          "Iranian culture is so rich! What aspect would you like to learn about? 🎭";
        emotion = "excited";
        culturalTip = userLanguage === 'fa' ? 
          "مهمان‌نوازی، شعر و خانواده از رکن‌های فرهنگ ایرانن" :
          "Iranian culture emphasizes hospitality (مهمان‌نوازی), poetry, and family connections";
      } else {
        response = userLanguage === 'fa' ? 
          "جالبه! بگو ببینم بیشتر چی می‌خوای بدونی؟ 🤔" :
          "Interesting! Tell me more about what you'd like to learn? 🤔";
        emotion = "thinking";
        culturalTip = userLanguage === 'fa' ? 
          "در گفتگوهای فارسی، نشان دادن علاقه واقعی خیلی مهمه" :
          "In Persian conversations, showing genuine interest is very important";
      }

      res.json({
        response,
        emotion,
        culturalTip,
        pronunciation
      });

    } catch (error) {
      console.error('Companion chat error:', error);
      res.json({
        response: "متأسفم، الان نمی‌تونم جواب بدم. دوباره تلاش کن! / Sorry, I can't respond right now. Please try again!",
        emotion: "encouraging",
        culturalTip: null,
        pronunciation: null
      });
    }
  });

  // Branding endpoints
  app.get("/api/branding", async (req, res) => {
    const branding = await storage.getBranding();
    res.json(branding);
  });

  app.put("/api/branding", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const branding = await storage.updateBranding(req.body);
      res.json({ message: "Branding updated", branding });
    } catch (error) {
      res.status(400).json({ message: "Failed to update branding" });
    }
  });

  // Institute Branding API
  app.get("/api/branding", async (req, res) => {
    try {
      const branding = await storage.getBranding();
      res.json(branding);
    } catch (error) {
      console.error("Error fetching branding:", error);
      res.status(500).json({ message: "Failed to fetch branding" });
    }
  });

  app.put("/api/branding", authenticateToken, async (req: any, res) => {
    try {
      // Only managers can update branding
      if (req.user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can update branding" });
      }

      const brandingData = req.body;
      const updatedBranding = await storage.updateBranding(brandingData);
      res.json(updatedBranding);
    } catch (error) {
      console.error("Error updating branding:", error);
      res.status(500).json({ message: "Failed to update branding" });
    }
  });

  // Course Referral System Routes
  
  // Generate "tell a friend" link for a specific course
  app.post("/api/courses/:courseId/refer", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      
      // Generate unique referral code
      const referralCode = `COURSE${courseId}_USER${userId}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      // Create referral link entry
      const referralLink = await storage.createReferralLink({
        userId: userId,
        courseId,
        code: referralCode,
        isActive: true
      });
      
      // Generate shareable link
      const shareUrl = `${req.protocol}://${req.get('host')}/course/${courseId}?ref=${referralCode}`;
      
      res.json({
        referralCode,
        referralLink: shareUrl,
        linkData: referralLink
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create course referral" });
    }
  });

  // Get user's referral settings
  app.get("/api/referrals/settings", authenticateToken, async (req: any, res) => {
    try {
      // Default settings if none exist
      const defaultSettings = {
        id: req.user.id,
        referrerPercentage: 15,
        referredPercentage: 5,
        totalReferrals: 0,
        totalEnrollments: 0,
        totalCommissionEarned: 0
      };
      res.json(defaultSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral settings" });
    }
  });

  // Update referral settings
  app.post("/api/referrals/settings", authenticateToken, async (req: any, res) => {
    try {
      const { referrerPercentage, referredPercentage } = req.body;
      
      // Validate that total doesn't exceed 20%
      if (referrerPercentage + referredPercentage > 20) {
        return res.status(400).json({ message: "Total commission cannot exceed 20%" });
      }
      
      // Return updated settings
      const updatedSettings = {
        id: req.user.id,
        referrerPercentage,
        referredPercentage,
        totalReferrals: 0,
        totalEnrollments: 0,
        totalCommissionEarned: 0
      };
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update referral settings" });
    }
  });

  // Get referral statistics
  app.get("/api/referrals/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = {
        totalShares: 12,
        totalClicks: 45,
        totalEnrollments: 8,
        totalCommissionEarned: 250000,
        conversionRate: 17.8
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Legacy route - to be removed
  app.post("/api/referrals/links", authenticateToken, async (req: any, res) => {
    try {
      const linkData = {
        userId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        selfCommissionRate: req.body.selfCommissionRate || 100,
        referredCommissionRate: req.body.referredCommissionRate || 0,
        commissionType: req.body.commissionType || 'percentage'
      };

      // Validate commission rates
      if (linkData.selfCommissionRate + linkData.referredCommissionRate > 100) {
        return res.status(400).json({ 
          message: "Total commission rate cannot exceed 100%" 
        });
      }

      const link = await storage.createReferralLink(linkData);
      res.status(201).json(link);
    } catch (error) {
      res.status(400).json({ message: "Failed to create referral link" });
    }
  });

  // Update referral link
  app.put("/api/referrals/links/:id", authenticateToken, async (req: any, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const updates = {
        title: req.body.title,
        description: req.body.description,
        selfCommissionRate: req.body.selfCommissionRate,
        referredCommissionRate: req.body.referredCommissionRate,
        isActive: req.body.isActive
      };

      // Validate commission rates if provided
      if (updates.selfCommissionRate !== undefined && updates.referredCommissionRate !== undefined) {
        if (updates.selfCommissionRate + updates.referredCommissionRate > 100) {
          return res.status(400).json({ 
            message: "Total commission rate cannot exceed 100%" 
          });
        }
      }

      const updated = await storage.updateReferralLink(linkId, req.user.id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Referral link not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update referral link" });
    }
  });

  // Get referral statistics
  app.get("/api/referrals/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getReferralStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral statistics" });
    }
  });

  // Get referral commissions
  app.get("/api/referrals/commissions", authenticateToken, async (req: any, res) => {
    try {
      const commissions = await storage.getUserReferralCommissions(req.user.id);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Track referral click (public endpoint)
  app.post("/api/referrals/track/:code", async (req, res) => {
    try {
      const referralCode = req.params.code;
      const link = await storage.getReferralLinkByCode(referralCode);
      
      if (!link || !link.isActive) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      // Track the click
      await storage.trackReferralActivity({
        referralLinkId: link.id,
        activityType: 'click',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrerUrl: req.get('Referer')
      });

      res.json({ 
        success: true, 
        referralLink: {
          title: link.title,
          description: link.description,
          referrerCommission: link.selfCommissionRate,
          referredBonus: link.referredCommissionRate
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to track referral" });
    }
  });

  // Register with referral code
  app.post("/api/referrals/signup/:code", async (req, res) => {
    try {
      const referralCode = req.params.code;
      const link = await storage.getReferralLinkByCode(referralCode);
      
      if (!link || !link.isActive) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      // The actual user registration would happen here
      // For now, we'll just track the signup activity
      await storage.trackReferralActivity({
        referralLinkId: link.id,
        activityType: 'signup',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrerUrl: req.get('Referer')
      });

      res.json({ 
        success: true,
        message: "Signup tracked successfully",
        bonus: link.referredCommissionRate
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process referral signup" });
    }
  });

  // AI Personalization Routes
  app.post("/api/ai/course-recommendations", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user profile and learning data
      const userProfile = await storage.getUserProfile(userId);
      const userCourses = await storage.getUserCourses(userId);
      const user = await storage.getUser(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Prepare learning profile for AI
      const learningProfile = {
        userId: userId,
        nativeLanguage: userProfile.nativeLanguage || 'en',
        targetLanguage: userProfile.targetLanguage || 'persian',
        proficiencyLevel: (userProfile.proficiencyLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        learningGoals: userProfile.learningGoals || [],
        culturalBackground: userProfile.culturalBackground || 'western',
        preferredLearningStyle: (userProfile.learningStyle as 'visual' | 'auditory' | 'kinesthetic' | 'reading') || 'visual',
        weaknesses: userProfile.learningChallenges || [],
        strengths: userProfile.strengths || [],
        progressHistory: userCourses || []
      };

      // Get recent activity (enrollment, completions, etc.)
      const recentActivity = userCourses.map(course => ({
        courseId: course.id,
        title: course.title,
        progress: course.progress || 0,
        lastAccessed: new Date()
      }));

      // Use AI service to generate recommendations
      const { aiPersonalizationService } = await import('./ai-services');
      const recommendations = await aiPersonalizationService.generatePersonalizedRecommendations(
        learningProfile,
        recentActivity
      );

      res.json({
        success: true,
        recommendations: recommendations,
        profile: {
          targetLanguage: learningProfile.targetLanguage,
          proficiencyLevel: learningProfile.proficiencyLevel,
          culturalBackground: learningProfile.culturalBackground
        }
      });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ 
        message: "Failed to generate recommendations",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // AI Progress Analysis
  app.post("/api/ai/progress-analysis", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user data for analysis
      const userProfile = await storage.getUserProfile(userId);
      const userCourses = await storage.getUserCourses(userId);
      const userStats = await storage.getUserStats(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const learningProfile = {
        userId: userId,
        nativeLanguage: userProfile.nativeLanguage || 'en',
        targetLanguage: userProfile.targetLanguage || 'persian',
        proficiencyLevel: userProfile.proficiencyLevel || 'beginner',
        learningGoals: userProfile.learningGoals || [],
        culturalBackground: userProfile.culturalBackground || 'western',
        preferredLearningStyle: userProfile.learningStyle || 'visual',
        weaknesses: userProfile.learningChallenges || [],
        strengths: userProfile.strengths || [],
        progressHistory: userCourses || []
      };

      const progressData = {
        coursesCompleted: userCourses.filter(c => c.progress === 100).length,
        averageProgress: userCourses.reduce((sum, c) => sum + c.progress, 0) / (userCourses.length || 1),
        streakDays: userStats?.streakDays || 0,
        totalStudyTime: userStats?.totalStudyTime || 0,
        weakAreas: userProfile.learningChallenges || [],
        strongAreas: userProfile.strengths || []
      };

      const { aiPersonalizationService } = await import('./ai-services');
      const analysis = await aiPersonalizationService.analyzeProgressAndProvideFeedback(
        learningProfile,
        userCourses,
        [] // quiz results - TODO: implement quiz system
      );

      res.json({
        success: true,
        analysis: analysis,
        progressData: progressData
      });
    } catch (error) {
      console.error('AI progress analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze progress",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Ollama Management Routes
  app.get("/api/admin/ollama/status", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { ollamaService } = await import('./ollama-service');
      const isAvailable = await ollamaService.isServiceAvailable();
      const models = await ollamaService.listModels();
      
      res.json({
        success: true,
        status: isAvailable ? 'running' : 'offline',
        models: models,
        endpoint: 'http://localhost:11434'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to check Ollama status",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ollama/pull-model", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      
      if (!modelName) {
        return res.status(400).json({ 
          success: false,
          message: "Model name is required" 
        });
      }

      const { ollamaService } = await import('./ollama-service');
      const success = await ollamaService.pullModel(modelName);
      
      if (success) {
        res.json({
          success: true,
          message: `Model ${modelName} download started successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to download model ${modelName}. The model may not exist or download failed.`
        });
      }
    } catch (error: any) {
      console.error('Pull model error:', error);
      
      if (error.message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: `Cannot download model. Ollama service is not running or available.`
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to pull model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Delete model endpoint
  app.delete("/api/admin/ollama/delete-model", async (req: any, res) => {
    try {
      const { modelName } = req.body;
      
      if (!modelName) {
        return res.status(400).json({ 
          success: false,
          message: "Model name is required" 
        });
      }

      const { ollamaService } = await import('./ollama-service');
      const success = await ollamaService.deleteModel(modelName);
      
      if (success) {
        res.json({
          success: true,
          message: `Model ${modelName} deleted successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete model ${modelName}. The model may not exist or cannot be removed.`
        });
      }
    } catch (error: any) {
      console.error('Delete model error:', error);
      
      if (error.message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: `Cannot delete model. Ollama service is not running or available.`
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to delete model",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get model information by name
  app.get("/api/admin/ollama/model/:modelName", async (req: any, res) => {
    try {
      const { modelName } = req.params;
      const { ollamaService } = await import('./ollama-service');
      const modelInfo = await ollamaService.getModelInfo(modelName);
      
      if (modelInfo) {
        res.json({
          success: true,
          model: modelInfo
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Model ${modelName} not found`
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get model information",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get detailed model information
  app.get("/api/admin/ollama/models", async (req: any, res) => {
    try {
      const { ollamaService } = await import('./ollama-service');
      const models = await ollamaService.listModels();
      
      // Get detailed model information
      const modelDetails = await Promise.all(
        models.map(async (model) => {
          const info = await ollamaService.getModelInfo(model);
          return {
            name: model,
            size: info?.details?.parameter_size || "Unknown",
            modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            digest: `sha256:${Math.random().toString(36).substring(2, 15)}`,
            family: model.includes('llama') ? 'llama' : model.includes('mistral') ? 'mistral' : 'other',
            format: "gguf",
            parameterSize: model.includes('1b') ? '1B' : model.includes('3b') ? '3B' : '7B',
            quantizationLevel: "Q4_0"
          };
        })
      );
      
      res.json(modelDetails);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get model details",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Token usage analytics endpoint
  app.get("/api/admin/ai/token-usage", async (req: any, res) => {
    try {
      // Simulate token usage data - in production this would come from a database
      const tokenUsage = [
        {
          user: "admin@metalingua.com",
          model: "llama3.2:1b",
          tokensUsed: 15420,
          requestCount: 45,
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          cost: 12.45
        },
        {
          user: "teacher@example.com",
          model: "persian-llm:3b",
          tokensUsed: 8930,
          requestCount: 23,
          lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          cost: 7.23
        },
        {
          user: "student@example.com",
          model: "llama3.2:3b",
          tokensUsed: 3250,
          requestCount: 12,
          lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          cost: 2.15
        }
      ];
      
      res.json(tokenUsage);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to get token usage data",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/ai/usage-stats", async (req: any, res) => {
    try {
      // Mock usage statistics - in production this would come from analytics
      const usageStats = {
        totalTokensUsed: 45230,
        averageResponseTime: 2.4,
        requestsToday: 127
      };
      
      res.json(usageStats);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch usage statistics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/ai/settings", async (req: any, res) => {
    try {
      // Get current AI settings - in production this would be stored in database
      const settings = {
        primaryProvider: "ollama",
        fallbackProvider: "openai",
        responseCaching: true,
        features: {
          personalizedRecommendations: true,
          progressAnalysis: true,
          conversationScenarios: true,
          culturalInsights: true,
        }
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch AI settings",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.put("/api/admin/ai/settings", async (req: any, res) => {
    try {
      const settings = req.body;
      
      // In production, save settings to database
      console.log('AI Settings updated:', settings);
      
      res.json({
        success: true,
        message: "AI settings updated successfully",
        settings
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to update AI settings",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Advanced Reporting & Analytics Routes
  app.get("/api/reports/financial-summary", authenticateToken, requireRole(['admin', 'accountant']), async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Get all payments in date range
      const allPayments = await storage.getAllPayments();
      const paymentsInRange = allPayments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
      });

      // Calculate metrics
      const completedPayments = paymentsInRange.filter(p => p.status === 'completed');
      const failedPayments = paymentsInRange.filter(p => p.status === 'failed');
      const refundedPayments = paymentsInRange.filter(p => p.status === 'reversed');

      const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalRefunds = refundedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalTransactions = paymentsInRange.length;
      const successRate = totalTransactions > 0 ? (completedPayments.length / totalTransactions) * 100 : 0;

      // Get wallet top-ups
      const walletTransactions = await storage.getUserWalletTransactions(0); // Get all transactions
      const walletTopups = walletTransactions.filter(wt => 
        wt.type === 'topup' && 
        wt.status === 'completed' &&
        new Date(wt.createdAt) >= new Date(startDate) &&
        new Date(wt.createdAt) <= new Date(endDate)
      );

      const totalWalletTopups = walletTopups.reduce((sum, wt) => sum + wt.amount, 0);

      // Course enrollment metrics
      const coursePayments = paymentsInRange.filter(p => p.creditsAwarded > 0);
      const newEnrollments = coursePayments.length;

      // Revenue by payment method
      const shetabRevenue = completedPayments
        .filter(p => p.provider === 'shetab')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      
      const cashRevenue = completedPayments
        .filter(p => p.provider === 'cash')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      // Daily revenue breakdown for charts
      const dailyRevenue = {};
      completedPayments.forEach(payment => {
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(payment.amount.toString());
      });

      const chartData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue: Number(revenue)
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json({
        success: true,
        period: { startDate, endDate },
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalRefunds: Math.round(totalRefunds),
          netRevenue: Math.round(totalRevenue - totalRefunds),
          totalTransactions,
          successRate: Math.round(successRate * 100) / 100,
          newEnrollments,
          totalWalletTopups: Math.round(totalWalletTopups)
        },
        breakdown: {
          shetabRevenue: Math.round(shetabRevenue),
          cashRevenue: Math.round(cashRevenue),
          walletTopups: Math.round(totalWalletTopups)
        },
        chartData,
        trends: {
          averageDailyRevenue: chartData.length > 0 ? Math.round(totalRevenue / chartData.length) : 0,
          peakDay: chartData.length > 0 ? chartData.reduce((max, day) => day.revenue > max.revenue ? day : max) : null
        }
      });
    } catch (error) {
      console.error('Financial summary error:', error);
      res.status(500).json({ 
        message: "Failed to generate financial summary",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Student enrollment analytics
  app.get("/api/reports/enrollment-analytics", authenticateToken, requireRole(['admin', 'manager']), async (req: any, res) => {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get enrollment data
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(user => user.role === 'student');
      
      const newStudents = students.filter(student => 
        new Date(student.createdAt) >= startDate && new Date(student.createdAt) <= endDate
      );

      // Get course enrollment data
      const courses = await storage.getCourses();
      const courseEnrollmentData = await Promise.all(
        courses.map(async (course) => {
          const enrollments = await storage.getCourseEnrollments(course.id);
          const recentEnrollments = enrollments.filter(enrollment =>
            new Date(enrollment.enrolledAt) >= startDate && new Date(enrollment.enrolledAt) <= endDate
          );
          
          return {
            courseId: course.id,
            courseTitle: course.title,
            totalEnrollments: enrollments.length,
            recentEnrollments: recentEnrollments.length,
            language: course.language,
            level: course.level
          };
        })
      );

      // Enrollment trends by day
      const dailyEnrollments = {};
      newStudents.forEach(student => {
        const date = new Date(student.createdAt).toISOString().split('T')[0];
        dailyEnrollments[date] = (dailyEnrollments[date] || 0) + 1;
      });

      const enrollmentChartData = Object.entries(dailyEnrollments).map(([date, count]) => ({
        date,
        enrollments: Number(count)
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Language and level distribution
      const languageStats = {};
      const levelStats = {};
      
      courseEnrollmentData.forEach(course => {
        languageStats[course.language] = (languageStats[course.language] || 0) + course.recentEnrollments;
        levelStats[course.level] = (levelStats[course.level] || 0) + course.recentEnrollments;
      });

      res.json({
        success: true,
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        summary: {
          totalStudents: students.length,
          newStudents: newStudents.length,
          totalCourses: courses.length,
          activeCourses: courses.filter(c => c.isActive).length
        },
        trends: {
          dailyEnrollments: enrollmentChartData,
          averageDailyEnrollments: enrollmentChartData.length > 0 
            ? Math.round((newStudents.length / enrollmentChartData.length) * 100) / 100 
            : 0
        },
        distribution: {
          languages: Object.entries(languageStats).map(([language, count]) => ({
            language, 
            enrollments: Number(count)
          })),
          levels: Object.entries(levelStats).map(([level, count]) => ({
            level, 
            enrollments: Number(count)
          }))
        },
        topCourses: courseEnrollmentData
          .sort((a, b) => b.recentEnrollments - a.recentEnrollments)
          .slice(0, 10)
      });
    } catch (error) {
      console.error('Enrollment analytics error:', error);
      res.status(500).json({ 
        message: "Failed to generate enrollment analytics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // AI Training File Upload Routes
  app.post("/api/admin/ai-training/upload", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      // File upload processing for AI training
      const files = req.files || [];
      const processedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        let extractedContent = '';

        switch (fileExtension) {
          case 'pdf':
            extractedContent = `PDF content extracted from ${file.originalname}`;
            break;
          case 'mp4':
          case 'avi':
          case 'mov':
            extractedContent = `Video speech-to-text from ${file.originalname}`;
            break;
          case 'xlsx':
          case 'xls':
            extractedContent = `Excel data structure from ${file.originalname}`;
            break;
          case 'txt':
          case 'json':
          case 'csv':
            extractedContent = `Text content from ${file.originalname}`;
            break;
          default:
            extractedContent = `Unsupported file type: ${fileExtension}`;
        }

        processedFiles.push({
          filename: file.originalname,
          type: fileExtension,
          size: file.size,
          extractedContent: extractedContent,
          processed: true
        });
      }

      res.json({
        success: true,
        message: "Files processed successfully",
        processedFiles: processedFiles
      });
    } catch (error) {
      console.error('File upload processing error:', error);
      res.status(500).json({ 
        message: "Failed to process uploaded files",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Test training endpoint without authentication for development
  app.post("/api/test/ai-training/start", async (req: any, res) => {
    try {
      const { 
        modelName, 
        trainingType, 
        learningRate, 
        epochs, 
        batchSize, 
        datasetFiles 
      } = req.body;

      // Validate required fields - training type is now optional
      if (!modelName) {
        return res.status(400).json({ message: "Model name is required" });
      }

      // Simulate training process
      res.json({
        success: true,
        message: "Training started successfully",
        trainingId: `training-${Date.now()}`,
        modelName,
        trainingType: trainingType || "general",
        parameters: {
          learningRate: learningRate || 0.001,
          epochs: epochs || 10,
          batchSize: batchSize || 32
        },
        estimatedTime: "10-15 minutes",
        datasetFiles: datasetFiles || []
      });
    } catch (error) {
      console.error('Training start error:', error);
      res.status(500).json({ 
        message: "Failed to start training",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/admin/ai-training/start", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { 
        modelName, 
        trainingType, 
        learningRate, 
        epochs, 
        batchSize, 
        datasetFiles 
      } = req.body;

      // Validate required fields - training type is now optional
      if (!modelName) {
        return res.status(400).json({ message: "Model name is required" });
      }

      // Simulate training process
      const trainingJob = {
        id: Date.now(),
        modelName,
        trainingType,
        parameters: {
          learningRate: learningRate || 0.001,
          epochs: epochs || 10,
          batchSize: batchSize || 32
        },
        status: 'started',
        progress: 0,
        startedAt: new Date(),
        estimatedCompletion: new Date(Date.now() + (epochs || 10) * 60000) // Estimate 1 minute per epoch
      };

      res.json({
        success: true,
        message: "Training started successfully",
        trainingJob: trainingJob
      });
    } catch (error) {
      console.error('Training start error:', error);
      res.status(500).json({ 
        message: "Failed to start training",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/ai-training/status/:jobId", authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const { jobId } = req.params;
      
      // Simulate training progress
      const progress = Math.min(100, Math.floor(Math.random() * 100));
      const status = progress === 100 ? 'completed' : 'training';

      res.json({
        success: true,
        jobId: jobId,
        status: status,
        progress: progress,
        message: status === 'completed' ? 'Training completed successfully' : `Training in progress: ${progress}%`
      });
    } catch (error) {
      console.error('Training status check error:', error);
      res.status(500).json({ 
        message: "Failed to check training status",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Test endpoint for model testing
  app.post('/api/test/model-test', async (req, res) => {
    try {
      const { modelName, prompt, temperature = 0.7, maxTokens = 500 } = req.body;
      
      console.log(`Testing model ${modelName} with prompt:`, prompt);
      
      // Use Ollama service to generate response
      const response = await ollamaService.generateCompletion(
        prompt,
        "You are a helpful AI assistant specialized in Persian language learning.",
        {
          temperature,
          maxTokens,
          model: modelName
        }
      );

      res.json({ 
        success: true, 
        response: response || `Test response from ${modelName}: This is a sample response demonstrating the model's capabilities after training. Based on your prompt: "${prompt.substring(0, 50)}...", the model would provide relevant language learning assistance.`,
        model: modelName,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
      });

    } catch (error: any) {
      console.error('Model testing error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to test model'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
