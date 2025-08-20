import { Express } from "express";
import { authenticateToken } from "./auth-middleware";
import { ollamaService } from "./services/ollama-service";

// Initialize Ollama service (using local instance or user's server)

export function registerCallernAIRoutes(app: Express) {
  // Test endpoint (no auth required for testing)
  app.post("/api/callern/ai/test", async (req, res) => {
    try {
      const isHealthy = await ollamaService.healthCheck();
      
      if (!isHealthy) {
        return res.status(503).json({ 
          error: "AI service not configured", 
          message: "Ollama service is not available. Please ensure Ollama is running." 
        });
      }
      
      const models = await ollamaService.listModels();
      
      res.json({ 
        status: "Ollama connected successfully",
        models: models,
        defaultModel: process.env.OLLAMA_MODEL || 'llama2',
        host: process.env.OLLAMA_HOST || 'http://localhost:11434',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Test failed" });
    }
  });

  // TEST VERSIONS WITHOUT AUTH (for testing only)
  // Test Translation endpoint
  app.post("/api/callern/ai/test/translate", async (req, res) => {
    try {
      const { text, targetLanguage = "fa" } = req.body;
      
      const result = await ollamaService.translateText(text, targetLanguage);
      
      res.json({
        translation: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        confidence: result.confidence
      });
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test Word Helper endpoint
  app.post("/api/callern/ai/test/word-helper", async (req, res) => {
    try {
      const { context, level = "B1" } = req.body;
      
      const suggestions = await ollamaService.generateWordSuggestions(
        context || "general conversation",
        "English",
        level
      );
      
      res.json({
        words: suggestions.map(s => ({
          word: s.word,
          definition: s.translation,
          example: s.usage
        }))
      });
    } catch (error: any) {
      console.error("Word helper error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test Grammar Check endpoint
  app.post("/api/callern/ai/test/grammar-check", async (req, res) => {
    try {
      const { text } = req.body;
      
      const result = await ollamaService.correctGrammar(text, "English");
      
      res.json({
        corrected: result.corrected,
        explanation: result.explanation
      });
    } catch (error: any) {
      console.error("Grammar check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test Pronunciation endpoint
  app.post("/api/callern/ai/test/pronunciation", async (req, res) => {
    try {
      const { word } = req.body;
      
      const result = await ollamaService.generatePronunciationGuide(word, "English");
      
      res.json({
        pronunciation: result.phonetic,
        syllables: result.syllables,
        tips: result.tips
      });
    } catch (error: any) {
      console.error("Pronunciation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Translation endpoint
  app.post("/api/callern/ai/translate", authenticateToken, async (req: any, res) => {
    try {
      const { text, targetLanguage = 'fa' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await ollamaService.translateText(text, targetLanguage);
      
      res.json({
        translation: result.translatedText,
        originalText: text,
        targetLanguage,
        sourceLanguage: result.sourceLanguage,
        confidence: result.confidence
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Word suggestions endpoint
  app.post("/api/callern/ai/suggest-words", authenticateToken, async (req: any, res) => {
    try {
      const { context, level = 'intermediate' } = req.body;

      const suggestions = await ollamaService.generateWordSuggestions(
        context || "general conversation",
        "English",
        level
      );
      
      res.json({
        suggestions: suggestions.map(s => `${s.word} - ${s.translation}`),
        context,
        level
      });
    } catch (error) {
      console.error("Suggestion error:", error);
      res.json({
        suggestions: [
          "Hello - سلام",
          "Thank you - متشکرم",
          "Please - لطفا",
          "Excuse me - ببخشید",
          "Goodbye - خداحافظ"
        ]
      });
    }
  });

  // Grammar correction endpoint
  app.post("/api/callern/ai/grammar-correct", authenticateToken, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await ollamaService.correctGrammar(text, "English");
      
      res.json({
        corrected: result.corrected,
        explanation: result.explanation,
        original: text
      });
    } catch (error) {
      console.error("Grammar correction error:", error);
      res.status(500).json({ error: "Grammar correction failed" });
    }
  });

  // Pronunciation guide endpoint
  app.post("/api/callern/ai/pronunciation", authenticateToken, async (req: any, res) => {
    try {
      const { word } = req.body;
      
      if (!word) {
        return res.status(400).json({ error: "Word is required" });
      }

      const result = await ollamaService.generatePronunciationGuide(word, "English");
      
      res.json({
        word,
        ipa: result.phonetic,
        breakdown: result.syllables.join("-"),
        tips: result.tips.join(". ")
      });
    } catch (error) {
      console.error("Pronunciation error:", error);
      res.status(500).json({ error: "Pronunciation guide failed" });
    }
  });

  // Conversation starter endpoint
  app.post("/api/callern/ai/conversation-starter", authenticateToken, async (req: any, res) => {
    try {
      const { topic = 'general', level = 'intermediate' } = req.body;

      const questions = await ollamaService.generateQuestions(
        topic,
        level,
        "English",
        3
      );
      
      res.json({
        questions: questions.length > 0 
          ? questions.map(q => q.question)
          : [
              "What do you like to do in your free time?",
              "Tell me about your hometown.",
              "What are your plans for the weekend?"
            ],
        topic,
        level
      });
    } catch (error) {
      console.error("Conversation starter error:", error);
      res.json({
        questions: [
          "How was your day?",
          "What do you think about the weather?",
          "What's your favorite food?"
        ]
      });
    }
  });

  // Word helper endpoint (alias for suggest-words)
  app.post("/api/callern/ai/word-helper", authenticateToken, async (req: any, res) => {
    try {
      const { conversationContext, studentLevel = 'B1', targetLanguage = 'English' } = req.body;

      const suggestions = await ollamaService.generateWordSuggestions(
        conversationContext || "general conversation",
        targetLanguage,
        studentLevel
      );
      
      res.json({
        words: suggestions.map(s => s.word),
        context: conversationContext,
        level: studentLevel
      });
    } catch (error) {
      console.error("Word helper error:", error);
      res.status(500).json({ 
        error: "Word suggestions failed",
        message: "Could not generate word suggestions"
      });
    }
  });

  // Grammar check endpoint (alias for grammar-correct)
  app.post("/api/callern/ai/grammar-check", authenticateToken, async (req: any, res) => {
    try {
      const { sentence, targetLanguage = 'English' } = req.body;
      
      if (!sentence) {
        return res.status(400).json({ error: "Sentence is required" });
      }

      const result = await ollamaService.correctGrammar(sentence, targetLanguage);
      
      res.json({
        corrected: result.corrected,
        explanation: result.explanation,
        original: sentence
      });
    } catch (error) {
      console.error("Grammar check error:", error);
      res.status(500).json({ 
        error: "Grammar check failed",
        message: "Could not check grammar"
      });
    }
  });

  console.log("✅ Callern AI routes registered successfully");
}