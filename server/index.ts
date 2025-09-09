import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
  
  // Verify critical variables in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      console.error('❌ CRITICAL: JWT_SECRET not found in environment');
      process.exit(1);
    }
    console.log('✅ Production environment variables validated');
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
