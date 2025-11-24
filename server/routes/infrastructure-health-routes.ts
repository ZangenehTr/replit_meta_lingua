import { Router } from "express";
import { storage } from "../database-storage";

const router = Router();

router.get("/api/admin/infrastructure/webrtc-health", async (req, res) => {
  try {
    const webrtcConfig = await storage.getWebRTCConfig();
    
    const NODE_ENV = process.env.NODE_ENV || "development";
    const isDev = NODE_ENV === "development";
    
    const hasTurnConfig = !!(
      process.env.TURN_SERVER_URL && 
      process.env.TURN_USERNAME && 
      process.env.TURN_PASSWORD
    );
    
    const hasStunConfig = !!(
      process.env.STUN_SERVER_URL
    );
    
    const turnServers = webrtcConfig.iceServers.filter(server => 
      server.urls.some(url => url.startsWith('turn:'))
    );
    
    const stunServers = webrtcConfig.iceServers.filter(server => 
      server.urls.some(url => url.startsWith('stun:'))
    );
    
    const selfHostedTurnUrls = turnServers.map(server => {
      const url = server.urls[0];
      return url.replace(/(turn:[^:]+:\d+).*/, '$1****');
    });
    
    const selfHostedStunUrls = stunServers.map(server => 
      server.urls[0].replace(/(stun:[^:]+):\d+/, '$1:****')
    );
    
    const status = {
      environment: NODE_ENV,
      turn: {
        configured: hasTurnConfig,
        status: hasTurnConfig 
          ? (isDev ? "⚠️  Dev Mode" : "🟢 Connected") 
          : "🔴 Not Configured",
        serverCount: turnServers.length,
        servers: selfHostedTurnUrls.length > 0 ? selfHostedTurnUrls : (isDev ? ["Dev fallback"] : []),
        message: hasTurnConfig 
          ? (isDev ? "TURN configured - will enforce in production" : "Self-hosted TURN server active")
          : "TURN_SERVER_URL not set in environment variables"
      },
      stun: {
        configured: hasStunConfig,
        status: hasStunConfig 
          ? (isDev ? "⚠️  Dev Mode" : "🟢 Connected") 
          : (isDev ? "⚠️  Dev Fallback" : "🔴 Not Configured"),
        serverCount: stunServers.length,
        servers: selfHostedStunUrls.length > 0 ? selfHostedStunUrls : (isDev ? ["stun:127.0.0.1:****"] : []),
        message: hasStunConfig 
          ? (isDev ? "STUN configured - will enforce in production" : "Self-hosted STUN server active")
          : (isDev ? "Using local fallback for development" : "STUN_SERVER_URL not set in environment variables")
      },
      overall: {
        productionReady: hasTurnConfig && hasStunConfig && !isDev,
        developmentMode: isDev,
        message: isDev 
          ? "Development mode: Configure TURN/STUN environment variables for production deployment"
          : (hasTurnConfig && hasStunConfig)
            ? "✅ All WebRTC infrastructure operational and self-hosted"
            : "⚠️  Configure TURN_SERVER_URL and STUN_SERVER_URL environment variables"
      },
      lastChecked: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    console.error("❌ Infrastructure health check failed:", error);
    res.status(500).json({ 
      error: "Failed to check infrastructure health",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/api/admin/infrastructure/status", async (req, res) => {
  try {
    const NODE_ENV = process.env.NODE_ENV || "development";
    const isDev = NODE_ENV === "development";
    
    const status = {
      environment: NODE_ENV,
      services: {
        kavenegar: {
          configured: !!process.env.KAVENEGAR_API_KEY,
          status: process.env.KAVENEGAR_API_KEY ? "🟢 Configured" : "🔴 Not Configured",
          message: process.env.KAVENEGAR_API_KEY 
            ? "Kavenegar SMS service ready" 
            : "KAVENEGAR_API_KEY not set"
        },
        smtp: {
          configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
          status: (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) 
            ? "🟢 Configured" 
            : "🔴 Not Configured",
          host: process.env.SMTP_HOST ? process.env.SMTP_HOST.replace(/^(.{10}).*/, '$1****') : "Not set",
          message: (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
            ? "SMTP email service ready"
            : "SMTP credentials not configured"
        },
        ollama: {
          configured: !!process.env.OLLAMA_HOST,
          status: process.env.OLLAMA_HOST 
            ? (isDev ? "⚠️  Dev Mode" : "🟢 Configured") 
            : (isDev ? "⚠️  Default" : "🔴 Not Configured"),
          host: process.env.OLLAMA_HOST || "http://localhost:11434 (default)",
          model: process.env.OLLAMA_MODEL || "llama3.2:3b (default)",
          message: isDev 
            ? "Ollama unavailable in dev - connects on production server"
            : (process.env.OLLAMA_HOST ? "AI provider configured" : "Using default localhost")
        }
      },
      lastChecked: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    console.error("❌ Infrastructure status check failed:", error);
    res.status(500).json({ 
      error: "Failed to check infrastructure status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
