import { Router } from 'express';
// Remove authentication requirement for TTS routes - they should be public for MST test functionality
import { ttsService } from '../tts-service.js';
import { 
  TTSMasterPromptService, 
  ListeningPracticeRequest, 
  VocabularyFileRequest 
} from '../services/tts-master-prompt.js';

const router = Router();

/**
 * Enhanced TTS Routes following Master Prompt Guidelines
 */

// Generate basic TTS (existing functionality) - PUBLIC for MST compatibility
router.post('/generate', async (req, res) => {
  try {
    const { text, language, speed, voice } = req.body;
    
    if (!text || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and language are required' 
      });
    }

    // Use Edge TTS exclusively (Iranian self-hosting - Google services blocked)
    const result = await ttsService.generateSpeech({
      text,
      language,
      speed,
      voice
    });

    res.json(result);
  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate listening practice following Master Prompt - PUBLIC for MST compatibility
router.post('/listening-practice', async (req, res) => {
  try {
    const request: ListeningPracticeRequest = {
      topic: req.body.topic,
      duration: req.body.duration || 120, // Default 2 minutes
      examConfig: {
        examType: req.body.examType || 'General English',
        learnerLevel: req.body.learnerLevel || 'B1',
        learnerNativeLanguage: req.body.learnerNativeLanguage
      },
      includeVocabulary: req.body.includeVocabulary || false
    };

    // Validate request
    if (!TTSMasterPromptService.validateRequest(request)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listening practice request. Topic and duration are required.'
      });
    }

    const result = await ttsService.generateListeningPractice(request);
    
    // Generate vocabulary files if requested
    let vocabularyFiles: any[] = [];
    if (request.includeVocabulary && result.success) {
      // Extract vocabulary from topic (simplified for demo)
      const vocabularyWords = extractVocabularyFromTopic(request.topic);
      
      if (vocabularyWords.length > 0) {
        const vocabRequest: VocabularyFileRequest = {
          words: vocabularyWords,
          examConfig: request.examConfig
        };
        
        vocabularyFiles = await ttsService.generateVocabularyPractice(vocabRequest);
      }
    }

    res.json({
      listeningPractice: result,
      vocabularyFiles,
      masterPromptUsed: true,
      examConfig: request.examConfig
    });

  } catch (error) {
    console.error('Listening practice generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate listening practice' 
    });
  }
});

// Generate vocabulary practice following Master Prompt - PUBLIC for MST compatibility
router.post('/vocabulary-practice', async (req, res) => {
  try {
    const request: VocabularyFileRequest = {
      words: req.body.words || [],
      examConfig: {
        examType: req.body.examType || 'General English',
        learnerLevel: req.body.learnerLevel || 'B1',
        learnerNativeLanguage: req.body.learnerNativeLanguage
      },
      sourceListeningText: req.body.sourceListeningText
    };

    // Validate request
    if (!TTSMasterPromptService.validateRequest(request)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vocabulary request. Words array is required.'
      });
    }

    const results = await ttsService.generateVocabularyPractice(request);
    
    res.json({
      vocabularyFiles: results,
      masterPromptUsed: true,
      examConfig: request.examConfig,
      totalWords: request.words.length
    });

  } catch (error) {
    console.error('Vocabulary practice generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate vocabulary practice' 
    });
  }
});

// Get TTS Master Prompt information - PUBLIC for MST compatibility
router.get('/master-prompt-info', async (req, res) => {
  try {
    const examType = req.query.examType as any;
    const learnerLevel = req.query.learnerLevel as any;
    const learnerNativeLanguage = req.query.learnerNativeLanguage as any;

    if (!examType || !learnerLevel) {
      return res.status(400).json({
        success: false,
        error: 'examType and learnerLevel are required'
      });
    }

    const examConfig = { examType, learnerLevel, learnerNativeLanguage };
    
    const accentInstructions = TTSMasterPromptService.getAccentInstructions(examConfig);
    const vocabularyInstructions = TTSMasterPromptService.getVocabularyInstructions(examConfig);

    res.json({
      success: true,
      examConfig,
      accentInstructions,
      vocabularyInstructions,
      supportedExamTypes: ['TOEFL', 'IELTS', 'PTE', 'Business English', 'General English'],
      supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      supportedNativeLanguages: ['Farsi', 'Arabic', 'Other']
    });

  } catch (error) {
    console.error('Master prompt info error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get master prompt information' 
    });
  }
});

// Pronunciation practice (existing but enhanced) - PUBLIC for MST compatibility
router.post('/pronunciation', async (req, res) => {
  try {
    const { text, language, level } = req.body;
    
    if (!text || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and language are required' 
      });
    }

    const result = await ttsService.generatePronunciationAudio(text, language, level);
    res.json(result);
  } catch (error) {
    console.error('Pronunciation generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get supported languages - PUBLIC for MST compatibility
router.get('/languages', async (req, res) => {
  try {
    const languages = ttsService.getSupportedLanguages();
    res.json({
      success: true,
      languages: languages.map(lang => ({
        code: lang,
        name: ttsService.getLanguageName(lang)
      }))
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get supported languages' 
    });
  }
});

/**
 * Helper function to extract vocabulary from topic
 * This is a simplified version - in production, you'd use NLP or predefined word lists
 */
function extractVocabularyFromTopic(topic: string): string[] {
  const commonTopicWords: { [key: string]: string[] } = {
    'shopping': ['groceries', 'vegetables', 'crowded', 'queue', 'cashier', 'discount', 'receipt'],
    'travel': ['journey', 'destination', 'luggage', 'passport', 'boarding', 'departure', 'arrival'],
    'food': ['ingredients', 'recipe', 'delicious', 'spicy', 'nutritious', 'cuisine', 'restaurant'],
    'work': ['colleague', 'deadline', 'meeting', 'presentation', 'promotion', 'salary', 'schedule'],
    'education': ['assignment', 'lecture', 'professor', 'semester', 'graduation', 'scholarship', 'library']
  };

  // Find matching topic
  const lowerTopic = topic.toLowerCase();
  for (const [key, words] of Object.entries(commonTopicWords)) {
    if (lowerTopic.includes(key)) {
      return words.slice(0, 5); // Return first 5 words
    }
  }

  // Default vocabulary if no specific topic match
  return ['practice', 'learning', 'language', 'vocabulary', 'pronunciation'];
}

export default router;