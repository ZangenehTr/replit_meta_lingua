import { Express } from 'express';
import { z } from 'zod';

const virtualMallConversationSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    currentShop: z.string().optional(),
    shopgirlName: z.string().optional(), 
    visitedShops: z.array(z.string()).optional()
  }).optional()
});

export function registerVirtualMallRoutes(app: Express, authenticateToken: any, requireRole: any) {
  // Virtual Mall AI Conversation endpoint
  app.post("/api/ai/virtual-mall-conversation", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      // Validate request body
      const validationResult = virtualMallConversationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const { message, context } = validationResult.data;
      const { currentShop, shopgirlName, visitedShops } = context || {};

      // Determine who should respond based on context
      let speaker = 'Lexi';
      let responseMessage = '';
      let newVocabulary: string[] = [];
      
      if (currentShop && shopgirlName) {
        // If in a shop, alternate between shopgirl and Lexi
        if (Math.random() > 0.5) {
          speaker = shopgirlName;
          // Generate shopgirl responses
          const shopResponses = {
            'fashion': [
              "That's a great choice! This style is very popular. Would you like to try it on?",
              "I can see you have great taste! This color would look wonderful on you.",
              "We have this in different sizes. What size would you prefer?"
            ],
            'electronics': [
              "This model is our best seller! It has excellent battery life.",
              "Would you like me to show you the features? It's very user-friendly.",
              "This device is perfect for students. It will help with your studies!"
            ],
            'bookstore': [
              "This is an excellent book for English learners! The language is clear and engaging.",
              "I recommend this author - very good for improving vocabulary.",
              "Would you like a book with more challenging vocabulary or something easier?"
            ],
            'grocery': [
              "These are fresh from the farm! Perfect for a healthy meal.",
              "This is a local specialty. Have you tried cooking with these ingredients?",
              "I can suggest some recipes if you'd like!"
            ],
            'accessories': [
              "This piece would complement your outfit perfectly!",
              "It's handmade and very unique. The quality is excellent.",
              "Would you like to see how it looks on you?"
            ],
            'cafe': [
              "Our coffee is freshly roasted! Would you like to try our house blend?",
              "I recommend this pastry - it pairs perfectly with our cappuccino.",
              "Would you prefer something hot or cold today?"
            ]
          };
          
          const shopType = currentShop as keyof typeof shopResponses;
          const responses = shopResponses[shopType] || shopResponses['fashion'];
          responseMessage = responses[Math.floor(Math.random() * responses.length)];
          
          // Add some vocabulary words
          newVocabulary = ['blend', 'complement', 'specialty', 'handmade'];
        } else {
          // Lexi helps with translation or encouragement
          responseMessage = `Great job communicating with ${shopgirlName}! I noticed you're doing well with shop vocabulary. Let me help if you need translation.`;
        }
      } else {
        // General Lexi responses
        const lexiResponses = [
          "Welcome to the virtual mall! Which shop would you like to visit first?",
          "I'm here to help you practice English! Try talking to the shopkeepers.",
          "Great question! Let me help you with that vocabulary.",
          "You're making excellent progress! Keep practicing those conversations.",
          "Don't worry about making mistakes - that's how we learn!"
        ];
        responseMessage = lexiResponses[Math.floor(Math.random() * lexiResponses.length)];
      }

      res.json({
        speaker,
        message: responseMessage,
        newVocabulary,
        originalLanguage: 'en',
        translation: null
      });
      
    } catch (error) {
      console.error('Error in virtual mall conversation:', error);
      res.status(500).json({ message: "Lexi is taking a short break. Please try again!" });
    }
  });
}