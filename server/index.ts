import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http"; 
import jwt from "jsonwebtoken";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { healthRouter } from './health-monitoring.js';
import { validateEnvironment } from './config/env-validator.js';
import { metricsMiddleware } from './monitoring/metrics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
  console.log('Environment variables loaded from .env file');
}

// ============================================
// CRITICAL: Validate environment before ANY initialization
// This prevents startup with invalid configuration
// ============================================
console.log('');
console.log('🔍 Validating environment configuration...');
const envValidation = validateEnvironment();

// In production, exit immediately if validation fails
if (process.env.NODE_ENV === 'production' && !envValidation.success) {
  console.error('');
  console.error('❌ FATAL: Cannot start server - environment validation failed');
  process.exit(1);
}

// In development, apply safe fallbacks ONLY after validation
if (process.env.NODE_ENV !== 'production') {
  // Development fallback for JWT_SECRET (ONLY in development)
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-fallback-secret-key-change-in-production-INSECURE';
    console.warn('⚠️  Using INSECURE development fallback for JWT_SECRET');
    console.warn('⚠️  Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  // Development fallback for Ollama
  if (!process.env.OLLAMA_HOST) {
    process.env.OLLAMA_HOST = 'http://localhost:11434';
    console.log('⚠️  OLLAMA_HOST not set, using default: http://localhost:11434');
  }
  
  if (!process.env.OLLAMA_MODEL) {
    process.env.OLLAMA_MODEL = 'llama3.2:3b';
    console.log('⚠️  OLLAMA_MODEL not set, using default: llama3.2:3b');
  }
}

console.log('');

const app = express();

// CRITICAL: Set Express app environment from NODE_ENV
// This ensures app.get("env") returns the correct value in both dev and production
app.set('env', process.env.NODE_ENV || 'development');

// Disable ETags to prevent 304 Not Modified responses
app.set('etag', false);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add metrics middleware for performance tracking
app.use(metricsMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Audio fallback middleware for MST listening files
app.get('/assets/audio/:filename', async (req, res) => {
  const filename = req.params.filename;
  const originalPath = path.join(__dirname, '../client/public/assets/audio', filename);
  
  // Check if file exists
  if (fs.existsSync(originalPath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.sendFile(originalPath);
  }
  
  try {
    // Import TTS service and MST item bank
    const { ttsService } = await import('./tts-service.js');
    const mstItemBank = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/mst_item_bank.json'), 'utf8'));
    
    // Find the item with matching audio filename
    let transcript = null;
    for (const skill in mstItemBank.skills) {
      for (const stage in mstItemBank.skills[skill]) {
        const items = mstItemBank.skills[skill][stage];
        for (const item of items) {
          if (item.assets?.audio && item.assets.audio.includes(filename)) {
            transcript = item.assets.transcript;
            break;
          }
        }
        if (transcript) break;
      }
      if (transcript) break;
    }
    
    if (transcript) {
      console.log(`🎧 Generating TTS audio for missing file: ${filename}`);
      
      // Generate TTS audio
      const ttsResult = await ttsService.generateSpeech({
        text: transcript,
        language: 'en',
        speed: 1.0
      });
      
      if (ttsResult.success && ttsResult.audioFile) {
        const ttsPath = path.join(__dirname, '../uploads/tts', ttsResult.audioFile);
        if (fs.existsSync(ttsPath)) {
          res.setHeader('Content-Type', 'audio/mpeg');
          return res.sendFile(ttsPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error generating TTS for ${filename}:`, error);
  }
  
  // If all else fails, return 404
  res.status(404).json({ error: 'Audio file not found' });
});

// Serve static assets from client/public/assets (for MST audio files)
app.use('/assets', express.static(path.join(__dirname, '../client/public/assets')));

// Serve test HTML files directly
app.get('/test-video-call.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../test-video-call.html'));
});
app.get('/test-mobile-login.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../test-mobile-login.html'));
});
app.get('/test-video-simple.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../test-video-simple.html'));
});
app.get('/test-callern-ai.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../test-callern-ai.html'));
});
app.get('/test-callern-scoring.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../test-callern-scoring.html'));
});

// Serve IELTS audio interactive page
app.get('/ielts_section1_audio.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../ielts_section1_audio.html'));
});

// Serve improved IELTS audio page
app.get('/ielts_improved_audio.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../ielts_improved_audio.html'));
});

// Serve professional IELTS audio page
app.get('/professional_ielts_audio.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../professional_ielts_audio.html'));
});

// Serve professional audio files
app.use('/professional_audio', express.static(path.join(__dirname, '../professional_audio')));

// Serve final IELTS audio files
app.use('/ielts_audio_final', express.static(path.join(__dirname, '../ielts_audio_final')));

// Serve offline IELTS audio player
app.get('/ielts_swimming_lesson_offline.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../ielts_swimming_lesson_offline.html'));
});

// Serve online IELTS audio player  
app.get('/ielts_swimming_lesson_online.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../ielts_swimming_lesson_online.html'));
});

// Serve online IELTS audio files
app.use('/ielts_audio_online', express.static(path.join(__dirname, '../ielts_audio_online')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create HTTP server IMMEDIATELY
const server = createServer(app);

// CRITICAL: Use PORT environment variable for Autoscale deployment (43265)
// Fall back to 5000 for local development
const port = parseInt(process.env.PORT || '5000', 10);

// Exit immediately on SIGTERM so the process manager can restart cleanly
// without leaving port 5000 held by a dying tsx process
process.on('SIGTERM', () => { process.exit(0); });
process.on('SIGINT',  () => { process.exit(0); });

// CRITICAL: Open port on app startup - BEFORE any async initialization
// This must be first to prevent deployment timeout
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is still in use. Exiting so the process manager can restart cleanly.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen({ port, host: '0.0.0.0' }, () => {
  log(`🚀 Server listening on port ${port} (${process.env.NODE_ENV || 'development'} mode)`);
});

// ============================================
// BACKGROUND INITIALIZATION (Non-Blocking)
// ============================================
(async () => {
  // INLINE SECURITY FIXES - Fix critical authentication vulnerabilities
  
  // Authentication middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  };

  // Role requirement middleware  
  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      next();
    };
  };

  // SECURITY FIX: Protected student endpoints
  app.get("/api/student/placement-test-status", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    res.json({ hasCompleted: false, currentLevel: "beginner", message: "Complete placement test" });
  });

  app.get("/api/student/peer-groups", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    res.json([{ id: 1, name: "Beginner English", participants: 5, isJoined: false }]);
  });

  app.get("/api/student/online-teachers", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    res.json([{ id: 74, name: "Teacher Two", isOnline: false, status: "offline" }]);
  });

  app.get("/api/student/special-classes", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    res.json([{ id: 1, title: "IELTS Speaking", level: "intermediate", enrollmentOpen: true }]);
  });

  // Socializer availability toggle
  app.put('/api/student/socializer-availability', authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const { isAvailable, level, skills } = req.body;
      const userId = req.user.userId;
      
      // Mock response for now (storage implementation needed)
      res.json({ success: true, message: 'Socializer availability updated' });
    } catch (error) {
      console.error('Error updating socializer availability:', error);
      res.status(500).json({ error: 'Failed to update availability' });
    }
  });

  // Get socializer status
  app.get('/api/student/socializer-status', authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      // Mock response for now
      res.json({
        isAvailable: false,
        level: null,
        skills: []
      });
    } catch (error) {
      console.error('Error getting socializer status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  // AI-powered socializer matching for teachers
  app.post('/api/teacher/match-socializer', authenticateToken, requireRole(['Teacher', 'Tutor']), async (req: any, res) => {
    try {
      const { callernSessionId, studentLevel, studentWeakSkills } = req.body;
      const teacherId = req.user.userId;
      
      // Mock AI matching response
      const mockSocializer = {
        id: 123,
        name: "Alex Student",
        level: studentLevel,
        skills: ["speaking", "pronunciation"]
      };
      
      res.json({
        success: true,
        socializer: mockSocializer,
        matchReason: `Matched based on level similarity (${studentLevel}) and complementary skills`
      });
    } catch (error) {
      console.error('Error matching socializer:', error);
      res.status(500).json({ error: 'Failed to match socializer' });
    }
  });


  // CORS support for OPTIONS requests (fix for CORS configuration issue)
  app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
  });

  // Add CORS headers to all requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // SECURITY FIX: Admin endpoints that return 403 for unauthorized access
  // NOTE: Real implementation is in routes.ts at line 18100 - this placeholder is removed

  // NOTE: Real /api/admin/settings GET is registered in routes.ts — placeholder removed to avoid shadowing

  app.get("/api/admin/branding", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    res.json({ 
      id: 1, 
      name: "MetaLingo Academy", 
      logo: "/logo.png", 
      primaryColor: "#0079F2",
      secondaryColor: "#00C851",
      accentColor: "#FFC107",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      favicon: "/favicon.ico",
      loginBackgroundImage: "/login-bg.jpg",
      fontFamily: "Inter, sans-serif",
      borderRadius: "0.5rem",
      instituteName: "MetaLingo Academy",
      description: "AI-enhanced multilingual language learning platform",
      updatedAt: new Date().toISOString()
    });
  });

  // SECURITY FIX: Public branding endpoint (fix for frontend branding access)
  app.get("/api/branding", async (req: any, res) => {
    res.json({ 
      id: 1, 
      name: "MetaLingo Academy", 
      logo: "/logo.png", 
      primaryColor: "#0079F2",
      secondaryColor: "#00C851",
      accentColor: "#FFC107",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      favicon: "/favicon.ico",
      loginBackgroundImage: "/login-bg.jpg",
      fontFamily: "Inter, sans-serif",
      borderRadius: "0.5rem",
      instituteName: "MetaLingo Academy",
      description: "AI-enhanced multilingual language learning platform",
      updatedAt: new Date().toISOString()
    });
  });

  // Essential user endpoints
  app.get('/api/users/me', authenticateToken, async (req: any, res) => {
    const user = req.user;
    res.json({ id: user.userId, email: user.email, role: user.role, firstName: "Student", lastName: "User" });
  });

  // Login route handled by routes.js - removed conflicting hardcoded route

  // FRONTEND FIX: Add refresh token endpoint for frontend authentication persistence
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err: any, decoded: any) => {
        if (err || decoded?.type !== 'refresh') {
          return res.status(403).json({ message: 'Invalid refresh token' });
        }
        
        const newAccessToken = jwt.sign(
          { userId: decoded.userId, email: 'student2@test.com', role: 'Student' },
          process.env.JWT_SECRET || 'default-secret',
          { expiresIn: '24h' }
        );
        
        res.json({ accessToken: newAccessToken });
      });
    } catch (error) {
      res.status(500).json({ message: 'Token refresh failed' });
    }
  });

  // CRITICAL FIX: Direct TTS route bypass for MST compatibility
  app.post('/api/tts/generate', async (req, res) => {
    try {
      const { ttsService } = await import('./tts-service.js');
      const { text, language, speed, voice } = req.body;
      
      if (!text || !language) {
        return res.status(400).json({ 
          success: false, 
          error: 'Text and language are required' 
        });
      }

      // Use Microsoft Edge TTS for better quality, fallback to Google TTS
      let result = await ttsService.generateSpeechWithEdgeTTS({
        text,
        language,
        speed: speed || 1.0,
        voice
      });

      // Fallback to Google TTS if Edge TTS fails
      if (!result.success) {
        console.log('🔄 Edge TTS failed, falling back to Google TTS');
        result = await ttsService.generateSpeech({
          text,
          language,
          speed: speed || 1.0,
          voice
        });
      }

      res.json(result);
    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // Import and inject Map-based unified testing storage (NO database dependencies)
  const { getUnifiedTestingStorage } = await import("./unified-testing-storage-factory");
  const mapBasedStorage = getUnifiedTestingStorage();
  app.set('unifiedTestingStorage', mapBasedStorage);
  console.log('✅ Map-based unified testing storage injected (NO database dependencies)');

  // Register health monitoring endpoints
  app.use('/api', healthRouter);
  console.log('✅ Health monitoring endpoints registered');
  
  // Register telemetry endpoints
  const telemetryRouter = (await import('./routes/telemetry-routes.js')).default;
  app.use('/api/admin/telemetry', telemetryRouter);
  console.log('✅ Telemetry endpoints registered');
  
  // Register disk monitoring endpoints
  const diskRouter = (await import('./routes/disk-routes.js')).default;
  app.use('/api/admin/disk', diskRouter);
  console.log('✅ Disk monitoring endpoints registered');
  
  // Register form file upload routes (using existing authenticateToken middleware)
  const { registerFormFileRoutes } = await import('./routes/form-file-routes.js');
  registerFormFileRoutes(app, authenticateToken);
  console.log('✅ Form file upload routes registered');
  
  // Register CMS routes (Content Management System)
  const { registerCmsRoutes } = await import('./routes/cms-routes.js');
  registerCmsRoutes(app, authenticateToken, requireRole);
  console.log('✅ CMS routes registered (Pages, Blog, Videos, Media)');

  // Run AI pipeline migration (retry up to 3x to handle Neon cold-start)
  (async () => {
    const { runAIPipelineMigration } = await import('./migrations/ai-pipeline-schema.js');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await runAIPipelineMigration();
        break;
      } catch (migErr: unknown) {
        console.error(`⚠️  AI pipeline migration attempt ${attempt} failed:`, migErr instanceof Error ? migErr.message : String(migErr));
        if (attempt < 3) await new Promise(r => setTimeout(r, 5000 * attempt));
      }
    }
  })();

  // Run landing pages migration (creates site_landing_pages table and seeds default content)
  (async () => {
    const { runLandingPagesMigration } = await import('./migrations/landing-pages-migration.js');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await runLandingPagesMigration();
        break;
      } catch (migErr: unknown) {
        console.error(`⚠️  Landing pages migration attempt ${attempt} failed:`, migErr instanceof Error ? migErr.message : String(migErr));
        if (attempt < 3) await new Promise(r => setTimeout(r, 5000 * attempt));
      }
    }
  })();
  
  // Register Placement Test routes (including guest routes)
  const placementTestRouter = (await import('./routes/placement-test-routes.js')).default;
  app.use('/api/placement-test', placementTestRouter);
  console.log('✅ Placement Test routes registered (including guest routes)');
  
  // Register Phone-First Authentication routes
  const phoneAuthRouter = (await import('./routes/phone-auth-routes.js')).default;
  app.use('/api/auth', phoneAuthRouter);
  console.log('✅ Phone-First Authentication routes registered');
  
  // Register Shetab Payment routes
  const shetabPaymentRouter = (await import('./routes/shetab-payment-routes.js')).default;
  app.use('/api/payment', shetabPaymentRouter);
  console.log('✅ Shetab Payment Gateway routes registered');

  // Register Promo Code routes
  const promoCodeRouter = (await import('./routes/promo-code-routes.js')).default;
  app.use(promoCodeRouter);
  console.log('✅ Promo Code routes registered');

  // Register Certificate routes
  const certificateRouter = (await import('./routes/certificate-routes.js')).default;
  app.use(certificateRouter);
  console.log('✅ Certificate routes registered');

  // Register Course Reviews routes
  const courseReviewsRouter = (await import('./routes/course-reviews-routes.js')).default;
  app.use(courseReviewsRouter);
  console.log('✅ Course Reviews routes registered');

  // Register Referral Program routes
  const referralRouter = (await import('./routes/referral-routes.js')).default;
  app.use(referralRouter);
  console.log('✅ Referral Program routes registered');
  
  // Register modular feature routes
  try {
    const { default: interactiveScenesRoutes } = await import('./routes/interactive-scenes-routes.js');
    const { default: socialDuelsRoutes } = await import('./routes/social-duels-routes.js');
    const { default: sessionCrashersRoutes } = await import('./routes/session-crashers-routes.js');
    const { default: diasporaBridgeRoutes } = await import('./routes/diaspora-bridge-routes.js');
    app.use(interactiveScenesRoutes);
    app.use(socialDuelsRoutes);
    app.use(sessionCrashersRoutes);
    app.use(diasporaBridgeRoutes);
    console.log('✅ Feature routes registered (3D Scenes, Social Duels, Session Crashers, Diaspora Bridge)');
  } catch (error) {
    console.error('⚠️  Failed to register feature routes:', error);
  }

  // Register private class operational stack routes
  try {
    const { registerPrivateClassRoutes } = await import('./routes/private-class-routes.js');
    registerPrivateClassRoutes(app);
    console.log('✅ Private Class routes registered (Session Bundles, Student Packages, Session Logging)');
  } catch (error) {
    console.error('⚠️  Failed to register private class routes:', error);
  }

  // Register all main routes SYNCHRONOUSLY before 404 handler
  try {
    const { registerRoutes } = await import('./routes.js');
    await registerRoutes(app);
    console.log('✅ All main routes registered');
  } catch (error) {
    console.error('⚠️  Failed to register routes:', error);
  }
  
  // 404 handler for API endpoints (MUST come AFTER all route registration)
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development, static serving in production (non-blocking)
  if (app.get("env") === "development") {
    try {
      await setupVite(app, server);
    } catch (error) {
      console.error('⚠️  Failed to setup Vite:', error);
    }
  } else {
    serveStatic(app);
  }

  // ============================================
  // BACKGROUND INITIALIZATION (Non-Blocking)
  // These tasks run AFTER port is open
  // ============================================
  
  // Non-blocking: Seed LinguaQuest lessons
  (async () => {
    try {
      const { seedLinguaquestLessons } = await import('./content/seed-linguaquest-lessons.js');
      await seedLinguaquestLessons();
    } catch (error) {
      console.error('⚠️  Failed to seed LinguaQuest lessons:', error);
    }
  })();

  // Non-blocking: Seed sample content (courses, games, placement test questions)
  (async () => {
    try {
      const { seedAllSampleContent } = await import('./content/seed-sample-content.js');
      await seedAllSampleContent();
    } catch (error) {
      console.error('⚠️  Failed to seed sample content:', error);
    }
  })();

  // Non-blocking: Initialize Whisper service
  (async () => {
    try {
      const { whisperService } = await import('./whisper-service.js');
      const { storage } = await import('./storage.js');
      await whisperService.initializeFromDatabase(() => storage.getAdminSettings());
    } catch (error) {
      console.warn('⚠️  Could not initialize Whisper service from database:', error);
    }
  })();

  // Non-blocking: Initialize Isabel VoIP
  (async () => {
    if (process.env.ISABEL_VOIP_ENABLED === 'true' && process.env.ISABEL_VOIP_SERVER) {
      try {
        const { isabelVoipService } = await import('./isabel-voip-service.js');
        const connected = await isabelVoipService.configure({
          serverAddress: process.env.ISABEL_VOIP_SERVER,
          port: parseInt(process.env.ISABEL_VOIP_PORT || '5038'),
          username: process.env.ISABEL_VOIP_USERNAME || '',
          password: process.env.ISABEL_VOIP_PASSWORD || '',
          enabled: true,
          callRecordingEnabled: process.env.ISABEL_VOIP_RECORDING_ENABLED === 'true',
          recordingStoragePath: process.env.ISABEL_VOIP_RECORDING_PATH || '/var/recordings'
        });
        
        if (connected) {
          console.log(`✅ Isabel VoIP connected to real server: ${process.env.ISABEL_VOIP_SERVER}:${process.env.ISABEL_VOIP_PORT || '5038'}`);
        } else {
          console.warn(`⚠️  Isabel VoIP configured but connection failed: ${process.env.ISABEL_VOIP_SERVER}:${process.env.ISABEL_VOIP_PORT || '5038'}`);
          console.log('   VoIP calls will use simulation mode. Check server connectivity and credentials.');
        }
      } catch (error) {
        console.error('❌ Isabel VoIP initialization error:', error.message);
        console.warn('   ⚠️  VoIP is not available. Using simulation mode for VoIP features.');
        console.warn('   To enable VoIP in production, ensure ISABEL_VOIP_SERVER is reachable and credentials are correct.');
      }
    } else {
      console.log('ℹ️  Isabel VoIP not configured - set ISABEL_VOIP_ENABLED=true and ISABEL_VOIP_SERVER to enable');
    }
  })();

  // Non-blocking: BullMQ workers — only when Redis is reachable
  (async () => {
    const { redisAvailable } = await import('./services/queue-service.js');
    if (!redisAvailable) {
      console.log('ℹ️  Redis unavailable — BullMQ workers skipped (queues run in no-op mode)');
      return;
    }

    // SMS Reminder Worker
    try {
      const { smsReminderWorker } = await import('./workers/sms-reminder.worker.js');
      smsReminderWorker.start();
      console.log('✅ SMS Reminder Worker initialized');
    } catch (error) {
      console.error('⚠️  Failed to initialize SMS Reminder Worker:', error);
    }

    // CMS Adaptive Content Worker
    try {
      await import('./workers/cms-adaptive-content.worker.js');
      console.log('✅ CMS Adaptive Content Worker initialized (adaptive-content-generation queue)');
    } catch (error) {
      console.error('⚠️  Failed to initialize CMS Adaptive Content Worker:', error);
    }

    // CMS Content Generation Worker
    try {
      await import('./workers/cms-content.worker.js');
      console.log('✅ CMS Content Generation Worker initialized');
    } catch (error) {
      console.error('⚠️  Failed to initialize CMS Content Worker:', error);
    }
  })();

  // Non-blocking: Scheduled publishing scheduler (every 5 minutes, approval-gated)
  (() => {
    const SCHEDULE_INTERVAL_MS = 5 * 60 * 1000;
    const runScheduledPublishing = () => {
      import('./db.js').then(({ db }) =>
        import('@shared/schema').then(({ cmsBlogPosts, cmsContentVersions, cmsContentGenerationLogs }) =>
          import('drizzle-orm').then(({ and, eq, lte, sql, inArray }) => {
            const now = new Date();
            // Only promote posts that have a version snapshot with an 'Approved by' note,
            // ensuring the approval workflow was followed before scheduled publish fires
            db.select({ postId: cmsContentVersions.postId })
              .from(cmsContentVersions)
              .where(sql`change_note ILIKE ${'Approved by%'}`)
              .then(async (approvedVersionRows: Array<{ postId: number }>) => {
                const approvedPostIds = [...new Set(approvedVersionRows.map((r) => r.postId))];
                if (approvedPostIds.length === 0) return;

                return db.update(cmsBlogPosts)
                  .set({ status: 'published', publishedAt: now, scheduledPublishAt: null, updatedAt: now })
                  .where(
                    and(
                      eq(cmsBlogPosts.status, 'draft'),
                      lte(cmsBlogPosts.scheduledPublishAt, now),
                      inArray(cmsBlogPosts.id, approvedPostIds)
                    )
                  )
                  .returning()
                  .then(async (promoted: Array<{ id: number }>) => {
                    if (promoted.length > 0) {
                      console.log(`[Scheduled Publisher] Promoted ${promoted.length} approved post(s) to published`);
                      for (const post of promoted) {
                        await db.insert(cmsContentGenerationLogs).values({
                          postId: post.id,
                          sourceType: 'manual',
                          status: 'completed',
                          promptUsed: 'Scheduled publishing promotion (approval-gated)',
                          completedAt: now,
                          startedAt: now,
                        }).catch((e: unknown) => console.error('[Scheduled Publisher] Log error:', e));
                      }
                    }
                  });
              })
              .catch((e: unknown) => console.error('[Scheduled Publisher] Error:', e));
          })
        )
      ).catch((e: unknown) => console.error('[Scheduled Publisher] Import error:', e));
    };

    setInterval(runScheduledPublishing, SCHEDULE_INTERVAL_MS);
    console.log('✅ Scheduled publishing scheduler started (every 5 minutes)');
  })();
})().catch((error) => {
  console.error('❌ Background initialization error:', error);
  // Don't exit - background services are optional
});

// Global unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let background tasks fail gracefully
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Log but don't exit - let the app continue running with graceful degradation
  // The server is already listening so we don't terminate unexpectedly
});
