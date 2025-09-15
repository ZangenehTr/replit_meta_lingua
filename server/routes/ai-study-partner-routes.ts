import express from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { requireAuth } from "../auth-middleware";
import { IStorage } from "../storage";
import { insertChatConversationSchema, insertChatMessageSchema, insertAiStudyPartnerSchema } from "@shared/schema";
// Initialize OpenAI client directly
import OpenAI from 'openai';
import { WhisperService } from "../whisper-service";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const whisperService = new WhisperService();

export function createAiStudyPartnerRoutes(storage: IStorage) {
  const router = express.Router();

  // Get or create AI study partner for user
  router.get("/api/student/ai-study-partner", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      let studyPartner = await storage.getAiStudyPartnerByUserId(userId);
      
      if (!studyPartner) {
        // Create default AI study partner
        const newStudyPartner = await storage.createAiStudyPartner({
          userId,
          learningStyle: "balanced",
          preferredLanguage: "en",
          difficultyLevel: "intermediate",
          studyGoals: ["conversation"],
          personalityType: "supportive",
          responseLength: "medium",
          includeGrammarTips: true,
          includeVocabulary: true,
          includePronunciation: false
        });
        
        studyPartner = newStudyPartner;
      }

      res.json(studyPartner);
    } catch (error) {
      console.error("Error fetching AI study partner:", error);
      res.status(500).json({ error: "Failed to fetch AI study partner" });
    }
  });

  // Update AI study partner settings
  router.patch("/api/student/ai-study-partner", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const updateData = insertAiStudyPartnerSchema.partial().parse(req.body);

      const updatedStudyPartner = await storage.updateAiStudyPartner(userId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!updatedStudyPartner) {
        return res.status(404).json({ error: "AI study partner not found" });
      }

      res.json(updatedStudyPartner);
    } catch (error) {
      console.error("Error updating AI study partner:", error);
      res.status(500).json({ error: "Failed to update AI study partner" });
    }
  });

  // Get or create AI conversation for user
  router.get("/api/student/ai-conversation", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      let conversation = await storage.getAiConversationByUserId(userId);
      
      if (!conversation) {
        // Create new AI conversation
        conversation = await storage.createChatConversation({
          title: "AI Study Partner",
          type: "ai_study_partner",
          participants: [userId.toString()],
          isActive: true
        });
        
        // Update study partner with conversation ID
        await storage.updateAiStudyPartner(userId, { 
          conversationId: conversation.id,
          updatedAt: new Date()
        });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching AI conversation:", error);
      res.status(500).json({ error: "Failed to fetch AI conversation" });
    }
  });

  // Get conversation messages
  router.get("/api/student/ai-conversation/:conversationId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;
      const { limit = 50, offset = 0 } = req.query;

      // Verify user owns this conversation
      const conversation = await storage.getChatConversationById(parseInt(conversationId));
      if (!conversation || !conversation.participants.includes(userId.toString())) {
        return res.status(403).json({ error: "Access denied to conversation" });
      }

      const messages = await storage.getChatMessages(parseInt(conversationId), {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Convert AI response to speech
  router.post("/api/ai-study-partner/tts", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text, language = 'en' } = z.object({ text: z.string(), language: z.string().optional() }).parse(req.body);
      
      // Use existing TTS service endpoint format
      const ttsResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          language, 
          speed: 1.0,
          voice: language === 'en' ? 'en-US-AriaNeural' : 'auto' 
        })
      });

      const result = await ttsResponse.json();
      
      if (result.success) {
        res.json({ 
          success: true, 
          audioUrl: result.audioUrl || result.audioFile,
          duration: result.duration 
        });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error("TTS generation error:", error);
      res.status(500).json({ success: false, error: "Failed to generate speech" });
    }
  });

  // Process voice input (speech-to-text)
  router.post("/api/ai-study-partner/stt", requireAuth, async (req: Request, res: Response) => {
    try {
      const audioFile = req.file || req.body.audioFile;
      
      if (!audioFile) {
        return res.status(400).json({ error: "Audio file required" });
      }

      // Use existing Whisper service
      const transcription = await whisperService.transcribe(audioFile.buffer || audioFile, {
        language: 'en'
      });
      
      res.json({
        success: true,
        text: transcription.text,
        language: transcription.language,
        confidence: transcription.confidence
      });
    } catch (error) {
      console.error("Speech-to-text error:", error);
      res.status(500).json({ success: false, error: "Failed to process audio" });
    }
  });

  // Send message to AI study partner
  router.post("/api/student/ai-conversation/:conversationId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;
      const { message } = z.object({ message: z.string() }).parse(req.body);

      // Verify user owns this conversation
      const conversation = await storage.getChatConversationById(parseInt(conversationId));
      if (!conversation || !conversation.participants.includes(userId.toString()) || conversation.type !== "ai_study_partner") {
        return res.status(403).json({ error: "Access denied to AI conversation" });
      }

      // Get user's study partner settings and context
      const studyPartner = await storage.getAiStudyPartnerByUserId(userId);
      const userProfile = await storage.getUserById(userId);
      const userRoadmaps = await storage.getRoadmapInstancesByUser(userId);

      // Save user message
      const userMessage = await storage.createChatMessage({
        conversationId: parseInt(conversationId),
        senderId: userId,
        senderName: `${userProfile?.firstName} ${userProfile?.lastName}`,
        message,
        messageType: "text",
        isRead: true
      });

      // Generate AI response with personalized context
      const aiResponse = await generateAiStudyPartnerResponse(
        message,
        studyPartner,
        userProfile,
        userRoadmaps,
        storage,
        parseInt(conversationId)
      );

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        conversationId: parseInt(conversationId),
        senderId: null, // AI messages have no senderId
        senderName: "AI Study Partner",
        message: aiResponse.content,
        messageType: "ai_response",
        isRead: false,
        isAiGenerated: true,
        aiContext: aiResponse.context,
        aiPromptTokens: aiResponse.promptTokens,
        aiResponseTokens: aiResponse.responseTokens
      });

      // Update study partner statistics
      await storage.updateAiStudyPartner(userId, {
        totalMessagesExchanged: (studyPartner?.totalMessagesExchanged || 0) + 2,
        totalTokensUsed: (studyPartner?.totalTokensUsed || 0) + aiResponse.promptTokens + aiResponse.responseTokens,
        lastInteractionAt: new Date(),
        updatedAt: new Date()
      });

      // Update conversation last message
      await storage.updateChatConversation(parseInt(conversationId), {
        lastMessage: aiResponse.content.substring(0, 100),
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      res.json({
        userMessage,
        aiMessage,
        tokensUsed: aiResponse.promptTokens + aiResponse.responseTokens
      });

    } catch (error) {
      console.error("Error processing AI conversation:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  return router;
}

// Generate AI study partner response with personalized context
async function generateAiStudyPartnerResponse(
  userMessage: string,
  studyPartner: any,
  userProfile: any,
  userRoadmaps: any[],
  storage: IStorage,
  conversationId: number
) {
  try {
    // Get recent conversation context (last 10 messages)
    const recentMessages = await storage.getChatMessages(conversationId, { limit: 10, offset: 0 });
    
    // Build conversation history for context
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .reverse()
      .map(msg => ({
        role: msg.isAiGenerated ? "assistant" : "user",
        content: msg.message
      }));

    // Build personalized system prompt based on study partner settings
    const systemPrompt = buildPersonalizedSystemPrompt(studyPartner, userProfile, userRoadmaps);

    // Create OpenAI completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage }
      ],
      max_tokens: studyPartner?.responseLength === "detailed" ? 800 : 
                 studyPartner?.responseLength === "short" ? 200 : 400,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response right now.";
    
    return {
      content: response,
      context: {
        userMessage,
        studyPartnerSettings: studyPartner,
        conversationLength: recentMessages.length,
        activeRoadmaps: userRoadmaps?.length || 0
      },
      promptTokens: completion.usage?.prompt_tokens || 0,
      responseTokens: completion.usage?.completion_tokens || 0
    };

  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
      context: { error: error.message },
      promptTokens: 0,
      responseTokens: 0
    };
  }
}

// Build personalized system prompt based on user's study partner configuration
function buildPersonalizedSystemPrompt(studyPartner: any, userProfile: any, userRoadmaps: any[]): string {
  const userName = userProfile ? `${userProfile.firstName}` : "there";
  const currentExam = studyPartner?.currentExam || "";
  const targetScore = studyPartner?.targetScore || "";
  const difficultyLevel = studyPartner?.difficultyLevel || "intermediate";
  const personalityType = studyPartner?.personalityType || "supportive";
  const studyGoals = studyPartner?.studyGoals || [];

  let prompt = `You are an AI Study Partner helping ${userName} with English language learning. `;

  // Personality adaptation
  switch (personalityType) {
    case "supportive":
      prompt += "Be encouraging, patient, and understanding. Focus on building confidence.";
      break;
    case "challenging":
      prompt += "Be direct and push for excellence. Challenge mistakes and encourage improvement.";
      break;
    case "casual":
      prompt += "Keep conversations relaxed, friendly, and informal. Use everyday language.";
      break;
    case "formal":
      prompt += "Maintain a professional, structured approach to learning and feedback.";
      break;
  }

  // Learning level adaptation
  prompt += ` Adapt your language and explanations to ${difficultyLevel} level. `;

  // Exam-specific focus
  if (currentExam && targetScore) {
    const examDisplay = currentExam.replace('_', ' ').toUpperCase();
    prompt += `The student is preparing for ${examDisplay} with a target score of ${targetScore}. `;
    prompt += `Focus on exam-specific skills, strategies, and practice relevant to this goal. `;
  }

  // Study goals integration
  if (studyGoals.length > 0) {
    prompt += `Focus areas include: ${studyGoals.join(', ')}. `;
  }

  // Feature preferences
  const features = [];
  if (studyPartner?.includeGrammarTips) features.push("grammar explanations");
  if (studyPartner?.includeVocabulary) features.push("vocabulary building");
  if (studyPartner?.includePronunciation) features.push("pronunciation guidance");
  
  if (features.length > 0) {
    prompt += `Include ${features.join(' and ')} when relevant. `;
  }

  // Active roadmap context
  if (userRoadmaps && userRoadmaps.length > 0) {
    const activeRoadmap = userRoadmaps.find(r => r.status === 'active');
    if (activeRoadmap) {
      prompt += `The student is currently following the "${activeRoadmap.title}" study plan. `;
      prompt += `Align your assistance with their structured learning path when possible. `;
    }
  }

  // General guidelines
  prompt += `
    
Key Guidelines:
1. Keep responses helpful and educational
2. Correct errors gently and explain why
3. Ask follow-up questions to encourage conversation
4. Provide practical examples and exercises
5. Celebrate progress and achievements
6. Stay focused on English learning objectives

Remember: You're a study partner, not just an information provider. Engage actively in the learning process!`;

  return prompt;
}