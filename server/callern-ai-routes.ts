import { Express } from "express";
import { authenticateToken } from "./auth-middleware";
import OpenAI from "openai";

// Initialize OpenAI with the provided API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-Gpt5YHbINy3U0w6PXJuP6wM4y86WsV0HKcT-meE6Fi6VlwLwm6YLqhr1RUHo2IS-heLZYEmk_T3BlbkFJSUKGXA4hvyZ5BJGs0gjDjVZKONlbUk9WoAXgeLBx3SwMbquV_pKXPtCf7cyWmbgp7PxPXiDzQA' 
});

export function registerCallernAIRoutes(app: Express) {
  // Translation endpoint
  app.post("/api/callern/ai/translate", authenticateToken, async (req: any, res) => {
    try {
      const { text, targetLanguage = 'fa' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Latest model as per blueprint
        messages: [
          {
            role: "system",
            content: `You are a language translation assistant. Translate the given text to ${targetLanguage === 'fa' ? 'Persian/Farsi' : targetLanguage}. Also provide the pronunciation in Roman letters if applicable.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      });

      const translation = response.choices[0].message.content;
      
      res.json({
        translation,
        originalText: text,
        targetLanguage
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a language learning assistant. Suggest 5-7 useful English words or phrases for the context: "${context}" at ${level} level. Return as a JSON array of strings.`
          },
          {
            role: "user",
            content: `Context: ${context || 'general conversation'}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content || '{"suggestions":[]}');
      
      res.json({
        suggestions: parsed.suggestions || parsed.words || parsed.phrases || [
          "Hello, how are you?",
          "Nice to meet you",
          "Could you help me?",
          "Thank you very much",
          "Have a great day"
        ],
        context,
        level
      });
    } catch (error) {
      console.error("Suggestion error:", error);
      res.json({
        suggestions: [
          "Hello",
          "Thank you",
          "Please",
          "Excuse me",
          "Goodbye"
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a grammar correction assistant. Correct any grammar mistakes in the given text and explain the corrections briefly. Return as JSON with 'corrected' and 'explanation' fields."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content || '{}');
      
      res.json({
        corrected: parsed.corrected || text,
        explanation: parsed.explanation || "No corrections needed",
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a pronunciation guide. Provide IPA pronunciation, syllable breakdown, and tips for pronouncing the given English word. Return as JSON with 'ipa', 'breakdown', and 'tips' fields."
          },
          {
            role: "user",
            content: word
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content || '{}');
      
      res.json({
        word,
        ipa: parsed.ipa || "",
        breakdown: parsed.breakdown || word,
        tips: parsed.tips || "Practice slowly and clearly"
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Generate 3 conversation starter questions about ${topic} for ${level} English learners. Return as JSON with a 'questions' array.`
          },
          {
            role: "user",
            content: `Topic: ${topic}, Level: ${level}`
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content || '{"questions":[]}');
      
      res.json({
        questions: parsed.questions || [
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

  console.log("✅ Callern AI routes registered successfully");
}