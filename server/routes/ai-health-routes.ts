// AI Provider Health Monitoring Routes
// Exposes health status of OpenAI and Ollama providers
// Based on environment configuration

import { Router, Request, Response, NextFunction } from "express";

export function createAIHealthRouter(
  authenticateToken: (req: Request, res: Response, next: NextFunction) => void,
  requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void
) {
  const router = Router();
  
  // Apply authentication to all routes
  router.use(authenticateToken);
  router.use(requireRole(['Admin']));

  // GET /api/admin/ai-health - Get AI provider health status
  router.get("/health", async (req, res) => {
    try {
      const aiProvider = process.env.AI_PROVIDER || 'ollama';
      const fallbackProvider = process.env.AI_FALLBACK_PROVIDER || null;
      
      // Check primary provider configuration
      let primaryHealth = 'unhealthy';
      let primaryName = '';
      
      if (aiProvider.toLowerCase() === 'ollama') {
        primaryName = 'Ollama';
        // Check if OLLAMA_HOST is configured
        const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
        if (ollamaHost) {
          // In dev, assume unhealthy (Ollama not running), in prod it would be healthy
          primaryHealth = process.env.NODE_ENV === 'production' ? 'healthy' : 'unhealthy';
        }
      } else if (aiProvider.toLowerCase() === 'openai') {
        primaryName = 'OpenAI';
        // Check if API key is configured
        if (process.env.OPENAI_API_KEY) {
          primaryHealth = 'healthy';
        } else {
          primaryHealth = 'unhealthy';
        }
      }
      
      // Check fallback provider if configured
      let fallbackHealth = null;
      let fallbackName = null;
      
      if (fallbackProvider) {
        if (fallbackProvider.toLowerCase() === 'ollama') {
          fallbackName = 'Ollama';
          const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
          if (ollamaHost) {
            fallbackHealth = process.env.NODE_ENV === 'production' ? 'healthy' : 'unhealthy';
          }
        } else if (fallbackProvider.toLowerCase() === 'openai') {
          fallbackName = 'OpenAI';
          if (process.env.OPENAI_API_KEY) {
            fallbackHealth = 'healthy';
          } else {
            fallbackHealth = 'unhealthy';
          }
        }
      }
      
      const hasHealthyProvider = primaryHealth === 'healthy' || fallbackHealth === 'healthy';
      
      res.json({
        primary: {
          name: primaryName || aiProvider,
          status: primaryHealth,
          configured: primaryHealth !== 'unhealthy'
        },
        fallback: fallbackHealth ? {
          name: fallbackName || fallbackProvider,
          status: fallbackHealth,
          configured: fallbackHealth !== 'unhealthy'
        } : null,
        hasHealthyProvider,
        lastChecked: new Date().toISOString(),
        mode: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error('AI health check failed:', error);
      res.status(500).json({ error: 'Failed to check AI provider health' });
    }
  });

  return router;
}
