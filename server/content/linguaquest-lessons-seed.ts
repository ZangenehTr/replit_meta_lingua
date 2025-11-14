/**
 * LinguaQuest Lesson Templates - 6 Free Intermediate to Advanced Lessons
 * 
 * Structure:
 * - sceneData: 2D React environment configuration (despite "3D" branding)
 * - interactionConfig: Ordered array of game steps for lesson flow
 * - All lessons are FREE (isPremium: false) for guests and students
 * - Includes 4 new game types: synonym_antonym, word_formation, grammar_battles, timed_blitz
 */

import type { z } from "zod";
import type { insertLinguaquestLessonSchema } from "@shared/schema";

type LessonSeedData = z.infer<typeof insertLinguaquestLessonSchema>;

// ============================================================================
// B1 INTERMEDIATE LESSONS (2 lessons)
// ============================================================================

export const B1_LESSON_1: LessonSeedData = {
  title: "Daily Routines & Time Expressions",
  description: "Master talking about your daily activities with time expressions and frequency adverbs. Practice present simple and expand your vocabulary.",
  language: "en",
  difficulty: "B1",
  lessonType: "vocabulary_grammar_mixed",
  sceneType: "modern_apartment",
  sceneData: {
    environment: {
      theme: "modern_apartment",
      timeOfDay: "morning",
      background: "/assets/scenes/apartment-morning.jpg",
      ambientSound: "/audio/ambient/morning-birds.mp3"
    },
    characters: [
      {
        id: "emma",
        name: "Emma",
        avatar: "/assets/characters/emma.png",
        role: "language_guide"
      }
    ]
  },
  interactionConfig: [
    {
      stepId: "intro",
      type: "dialogue",
      characterId: "emma",
      text: "Good morning! Today we'll learn how to talk about daily routines. Let's start!",
      duration: 5000
    },
    {
      stepId: "vocab_1",
      type: "vocabulary_matching",
      title: "Match Daily Activities",
      instructions: "Match the verbs with their Farsi translations",
      pairs: [
        { word: "wake up", translation: "بیدار شدن", imageUrl: "/uploads/linguaquest/images/wake-up.jpg" },
        { word: "brush teeth", translation: "مسواک زدن", imageUrl: "/uploads/linguaquest/images/brush-teeth.jpg" },
        { word: "get dressed", translation: "لباس پوشیدن", imageUrl: "/uploads/linguaquest/images/get-dressed.jpg" },
        { word: "have breakfast", translation: "صبحانه خوردن", imageUrl: "/uploads/linguaquest/images/breakfast.jpg" },
        { word: "go to work", translation: "به سر کار رفتن", imageUrl: "/uploads/linguaquest/images/go-to-work.jpg" },
        { word: "come home", translation: "به خانه آمدن", imageUrl: "/uploads/linguaquest/images/come-home.jpg" }
      ],
      timeLimit: 120,
      xpReward: 50
    },
    {
      stepId: "grammar_1",
      type: "grammar_battles",
      title: "Frequency Adverbs Challenge",
      instructions: "Choose the correct frequency adverb for each sentence",
      rules: [
        {
          id: "rule_1",
          ruleText: "Always (100%)",
          example: "I always wake up at 7 AM.",
          questions: [
            {
              sentence: "I ___ brush my teeth before bed.",
              correctAnswer: "always",
              options: ["always", "sometimes", "never"],
              explanation: "Use 'always' for things you do 100% of the time."
            }
          ]
        },
        {
          id: "rule_2",
          ruleText: "Usually (80%)",
          example: "I usually have coffee for breakfast.",
          questions: [
            {
              sentence: "She ___ goes to the gym on Mondays.",
              correctAnswer: "usually",
              options: ["always", "usually", "rarely"],
              explanation: "Use 'usually' for regular habits."
            }
          ]
        },
        {
          id: "rule_3",
          ruleText: "Sometimes (50%)",
          example: "I sometimes work from home.",
          questions: [
            {
              sentence: "They ___ eat out on weekends.",
              correctAnswer: "sometimes",
              options: ["never", "sometimes", "always"],
              explanation: "Use 'sometimes' for occasional actions."
            }
          ]
        }
      ],
      timeLimit: 180,
      xpReward: 75
    },
    {
      stepId: "word_form_1",
      type: "word_formation",
      title: "Build Time Expressions",
      instructions: "Form correct phrases from the word tiles",
      words: [
        {
          target: "in the morning",
          tiles: ["in", "the", "morning"],
          translation: "در صبح",
          audioUrl: "/audio/phrases/in-the-morning.mp3"
        },
        {
          target: "at night",
          tiles: ["at", "night"],
          translation: "در شب",
          audioUrl: "/audio/phrases/at-night.mp3"
        },
        {
          target: "on weekends",
          tiles: ["on", "weekends"],
          translation: "در آخر هفته‌ها",
          audioUrl: "/audio/phrases/on-weekends.mp3"
        },
        {
          target: "after work",
          tiles: ["after", "work"],
          translation: "بعد از کار",
          audioUrl: "/audio/phrases/after-work.mp3"
        }
      ],
      timeLimit: 150,
      xpReward: 60
    },
    {
      stepId: "blitz_1",
      type: "timed_blitz",
      title: "Quick Match: Daily Routines",
      instructions: "Match as many words as you can in 60 seconds!",
      pairs: [
        { word: "wake up", translation: "بیدار شدن" },
        { word: "shower", translation: "دوش گرفتن" },
        { word: "breakfast", translation: "صبحانه" },
        { word: "lunch", translation: "ناهار" },
        { word: "dinner", translation: "شام" },
        { word: "sleep", translation: "خوابیدن" },
        { word: "study", translation: "درس خواندن" },
        { word: "exercise", translation: "ورزش کردن" },
        { word: "relax", translation: "استراحت کردن" },
        { word: "clean", translation: "تمیز کردن" }
      ],
      timeLimit: 60,
      xpReward: 80
    }
  ],
  estimatedDurationMinutes: 25,
  xpReward: 265,
  vocabularyWords: ["wake up", "brush teeth", "get dressed", "have breakfast", "go to work", "come home", "always", "usually", "sometimes", "rarely", "never"],
  grammarTopics: ["present simple", "frequency adverbs", "time expressions"],
  audioFiles: ["/audio/ambient/morning-birds.mp3", "/audio/phrases/in-the-morning.mp3", "/audio/phrases/at-night.mp3", "/audio/phrases/on-weekends.mp3", "/audio/phrases/after-work.mp3"],
  tags: ["daily_routines", "time", "frequency", "intermediate"],
  isPremium: false,
  isActive: true
};

export const B1_LESSON_2: LessonSeedData = {
  title: "Shopping & Expressing Preferences",
  description: "Learn to shop confidently in English! Practice vocabulary for clothes, prices, and how to express likes and dislikes.",
  language: "en",
  difficulty: "B1",
  lessonType: "conversation_vocabulary",
  sceneType: "shopping_mall",
  sceneData: {
    environment: {
      theme: "shopping_mall",
      timeOfDay: "afternoon",
      background: "/assets/scenes/shopping-mall.jpg",
      ambientSound: "/audio/ambient/mall-sounds.mp3"
    },
    characters: [
      {
        id: "alex",
        name: "Alex",
        avatar: "/assets/characters/alex.png",
        role: "shop_assistant"
      }
    ]
  },
  interactionConfig: [
    {
      stepId: "intro",
      type: "dialogue",
      characterId: "alex",
      text: "Welcome to the shopping center! I'll help you learn shopping vocabulary today.",
      duration: 5000
    },
    {
      stepId: "synonym_1",
      type: "synonym_antonym",
      title: "Shopping Vocabulary: Synonyms & Antonyms",
      instructions: "Match words with their synonyms or antonyms",
      mode: "mixed",
      pairs: [
        { word: "expensive", match: "costly", type: "synonym", translation: "گران" },
        { word: "expensive", match: "cheap", type: "antonym", translation: "گران ≠ ارزان" },
        { word: "large", match: "big", type: "synonym", translation: "بزرگ" },
        { word: "large", match: "small", type: "antonym", translation: "بزرگ ≠ کوچک" },
        { word: "beautiful", match: "attractive", type: "synonym", translation: "زیبا" },
        { word: "beautiful", match: "ugly", type: "antonym", translation: "زیبا ≠ زشت" },
        { word: "modern", match: "contemporary", type: "synonym", translation: "مدرن" },
        { word: "modern", match: "old-fashioned", type: "antonym", translation: "مدرن ≠ قدیمی" }
      ],
      timeLimit: 150,
      xpReward: 70
    },
    {
      stepId: "vocab_2",
      type: "vocabulary_matching",
      title: "Clothing Items",
      instructions: "Match clothing items with their Farsi translations",
      pairs: [
        { word: "shirt", translation: "پیراهن", imageUrl: "/uploads/linguaquest/images/shirt.jpg" },
        { word: "pants", translation: "شلوار", imageUrl: "/uploads/linguaquest/images/pants.jpg" },
        { word: "dress", translation: "لباس (زنانه)", imageUrl: "/uploads/linguaquest/images/dress.jpg" },
        { word: "jacket", translation: "کت", imageUrl: "/uploads/linguaquest/images/jacket.jpg" },
        { word: "shoes", translation: "کفش", imageUrl: "/uploads/linguaquest/images/shoes.jpg" },
        { word: "hat", translation: "کلاه", imageUrl: "/uploads/linguaquest/images/hat.jpg" }
      ],
      timeLimit: 120,
      xpReward: 50
    },
    {
      stepId: "grammar_2",
      type: "grammar_battles",
      title: "Expressing Preferences",
      instructions: "Choose the correct form to express preferences",
      rules: [
        {
          id: "prefer_to",
          ruleText: "I prefer + noun / I prefer to + verb",
          example: "I prefer tea. / I prefer to drink tea.",
          questions: [
            {
              sentence: "I prefer ___ this dress.",
              correctAnswer: "to buy",
              options: ["buy", "to buy", "buying"],
              explanation: "Use 'prefer to + verb' for actions."
            }
          ]
        },
        {
          id: "would_rather",
          ruleText: "I would rather + base verb",
          example: "I would rather stay home.",
          questions: [
            {
              sentence: "I'd rather ___ the blue shirt.",
              correctAnswer: "take",
              options: ["take", "to take", "taking"],
              explanation: "'Would rather' is followed by the base form."
            }
          ]
        },
        {
          id: "like_better",
          ruleText: "I like X better than Y",
          example: "I like coffee better than tea.",
          questions: [
            {
              sentence: "I like this jacket better ___ that one.",
              correctAnswer: "than",
              options: ["then", "than", "from"],
              explanation: "Use 'than' for comparisons with 'better'."
            }
          ]
        }
      ],
      timeLimit: 180,
      xpReward: 75
    },
    {
      stepId: "blitz_2",
      type: "timed_blitz",
      title: "Shopping Blitz!",
      instructions: "Quick! Match the shopping terms!",
      pairs: [
        { word: "receipt", translation: "رسید" },
        { word: "discount", translation: "تخفیف" },
        { word: "sale", translation: "حراج" },
        { word: "price", translation: "قیمت" },
        { word: "size", translation: "سایز" },
        { word: "color", translation: "رنگ" },
        { word: "cash", translation: "نقدی" },
        { word: "card", translation: "کارت" },
        { word: "refund", translation: "بازپرداخت" },
        { word: "exchange", translation: "تعویض" }
      ],
      timeLimit: 60,
      xpReward: 80
    }
  ],
  estimatedDurationMinutes: 28,
  xpReward: 275,
  vocabularyWords: ["expensive", "cheap", "shirt", "pants", "dress", "jacket", "shoes", "receipt", "discount", "sale", "price", "prefer", "would rather"],
  grammarTopics: ["preferences", "comparatives", "shopping expressions"],
  audioFiles: ["/audio/ambient/mall-sounds.mp3"],
  tags: ["shopping", "clothes", "preferences", "intermediate"],
  isPremium: false,
  isActive: true
};

// ============================================================================
// B2 UPPER-INTERMEDIATE LESSONS (2 lessons)
// ============================================================================

export const B2_LESSON_1: LessonSeedData = {
  title: "Technology & Innovation Debate",
  description: "Discuss technology's impact on society. Learn advanced vocabulary, practice debate skills, and master conditionals.",
  language: "en",
  difficulty: "B2",
  lessonType: "debate_advanced_grammar",
  sceneType: "modern_office",
  sceneData: {
    environment: {
      theme: "tech_conference",
      timeOfDay: "afternoon",
      background: "/assets/scenes/tech-conference.jpg",
      ambientSound: "/audio/ambient/office-subtle.mp3"
    },
    characters: [
      {
        id: "dr_chen",
        name: "Dr. Chen",
        avatar: "/assets/characters/dr-chen.png",
        role: "tech_expert"
      }
    ]
  },
  interactionConfig: [
    {
      stepId: "intro",
      type: "dialogue",
      characterId: "dr_chen",
      text: "Welcome to the technology symposium. Today we'll explore how innovation shapes our world.",
      duration: 5000
    },
    {
      stepId: "synonym_2",
      type: "synonym_antonym",
      title: "Technology Vocabulary Mastery",
      instructions: "Match advanced tech terms with synonyms and antonyms",
      mode: "mixed",
      pairs: [
        { word: "innovative", match: "groundbreaking", type: "synonym", translation: "نوآورانه" },
        { word: "innovative", match: "conventional", type: "antonym", translation: "نوآورانه ≠ سنتی" },
        { word: "efficient", match: "effective", type: "synonym", translation: "کارآمد" },
        { word: "efficient", match: "wasteful", type: "antonym", translation: "کارآمد ≠ اسراف‌کننده" },
        { word: "reliable", match: "dependable", type: "synonym", translation: "قابل اعتماد" },
        { word: "reliable", match: "unreliable", type: "antonym", translation: "قابل اعتماد ≠ غیرقابل اعتماد" },
        { word: "obsolete", match: "outdated", type: "synonym", translation: "منسوخ شده" },
        { word: "obsolete", match: "current", type: "antonym", translation: "منسوخ ≠ جاری" },
        { word: "disruptive", match: "revolutionary", type: "synonym", translation: "مخل / انقلابی" },
        { word: "sustainable", match: "eco-friendly", type: "synonym", translation: "پایدار" }
      ],
      timeLimit: 180,
      xpReward: 90
    },
    {
      stepId: "word_form_2",
      type: "word_formation",
      title: "Build Complex Tech Phrases",
      instructions: "Construct technical expressions correctly",
      words: [
        {
          target: "artificial intelligence",
          tiles: ["artificial", "intelligence"],
          translation: "هوش مصنوعی",
          audioUrl: "/audio/phrases/artificial-intelligence.mp3"
        },
        {
          target: "machine learning",
          tiles: ["machine", "learning"],
          translation: "یادگیری ماشین",
          audioUrl: "/audio/phrases/machine-learning.mp3"
        },
        {
          target: "data privacy",
          tiles: ["data", "privacy"],
          translation: "حریم خصوصی داده",
          audioUrl: "/audio/phrases/data-privacy.mp3"
        },
        {
          target: "cloud computing",
          tiles: ["cloud", "computing"],
          translation: "رایانش ابری",
          audioUrl: "/audio/phrases/cloud-computing.mp3"
        },
        {
          target: "cyber security",
          tiles: ["cyber", "security"],
          translation: "امنیت سایبری",
          audioUrl: "/audio/phrases/cyber-security.mp3"
        }
      ],
      timeLimit: 180,
      xpReward: 75
    },
    {
      stepId: "grammar_3",
      type: "grammar_battles",
      title: "Second & Third Conditionals",
      instructions: "Master hypothetical situations",
      rules: [
        {
          id: "second_cond",
          ruleText: "Second Conditional: If + past simple, would + base verb",
          example: "If I had more time, I would learn programming.",
          questions: [
            {
              sentence: "If technology ___ cheaper, more people would have access.",
              correctAnswer: "were",
              options: ["is", "were", "would be"],
              explanation: "Use past simple in the if-clause of second conditional."
            },
            {
              sentence: "If we ___ AI responsibly, society would benefit greatly.",
              correctAnswer: "used",
              options: ["use", "used", "would use"],
              explanation: "Second conditional uses past simple in if-clause."
            }
          ]
        },
        {
          id: "third_cond",
          ruleText: "Third Conditional: If + past perfect, would have + past participle",
          example: "If we had invested earlier, we would have succeeded.",
          questions: [
            {
              sentence: "If they ___ the risks, they wouldn't have launched the product.",
              correctAnswer: "had known",
              options: ["knew", "had known", "would know"],
              explanation: "Use past perfect in if-clause of third conditional."
            },
            {
              sentence: "The company would have grown faster if it ___ in innovation.",
              correctAnswer: "had invested",
              options: ["invested", "had invested", "would invest"],
              explanation: "Third conditional describes unreal past situations."
            }
          ]
        }
      ],
      timeLimit: 210,
      xpReward: 100
    },
    {
      stepId: "blitz_3",
      type: "timed_blitz",
      title: "Tech Terminology Sprint",
      instructions: "Match tech terms rapidly!",
      pairs: [
        { word: "algorithm", translation: "الگوریتم" },
        { word: "blockchain", translation: "بلاکچین" },
        { word: "encryption", translation: "رمزنگاری" },
        { word: "bandwidth", translation: "پهنای باند" },
        { word: "malware", translation: "بدافزار" },
        { word: "firewall", translation: "فایروال" },
        { word: "prototype", translation: "نمونه اولیه" },
        { word: "interface", translation: "رابط کاربری" },
        { word: "database", translation: "پایگاه داده" },
        { word: "server", translation: "سرور" },
        { word: "bug", translation: "باگ / اشکال" },
        { word: "update", translation: "به‌روزرسانی" }
      ],
      timeLimit: 75,
      xpReward: 95
    }
  ],
  estimatedDurationMinutes: 32,
  xpReward: 360,
  vocabularyWords: ["innovative", "efficient", "reliable", "obsolete", "disruptive", "sustainable", "artificial intelligence", "machine learning", "algorithm", "encryption"],
  grammarTopics: ["second conditional", "third conditional", "hypothetical situations", "advanced conditionals"],
  audioFiles: ["/audio/ambient/office-subtle.mp3", "/audio/phrases/artificial-intelligence.mp3", "/audio/phrases/machine-learning.mp3", "/audio/phrases/data-privacy.mp3", "/audio/phrases/cloud-computing.mp3", "/audio/phrases/cyber-security.mp3"],
  tags: ["technology", "debate", "conditionals", "upper-intermediate"],
  isPremium: false,
  isActive: true
};

export const B2_LESSON_2: LessonSeedData = {
  title: "Environmental Awareness & Sustainability",
  description: "Explore environmental issues and solutions. Master passive voice, learn ecology vocabulary, and discuss global challenges.",
  language: "en",
  difficulty: "B2",
  lessonType: "academic_discussion",
  sceneType: "nature_reserve",
  sceneData: {
    environment: {
      theme: "eco_center",
      timeOfDay: "day",
      background: "/assets/scenes/nature-center.jpg",
      ambientSound: "/audio/ambient/forest-birds.mp3"
    },
    characters: [
      {
        id: "maya",
        name: "Maya",
        avatar: "/assets/characters/maya.png",
        role: "environmental_scientist"
      }
    ]
  },
  interactionConfig: [
    {
      stepId: "intro",
      type: "dialogue",
      characterId: "maya",
      text: "Welcome to the Environmental Research Center. Let's discuss how we can protect our planet.",
      duration: 5000
    },
    {
      stepId: "vocab_3",
      type: "vocabulary_matching",
      title: "Environmental Vocabulary",
      instructions: "Match environmental terms with translations",
      pairs: [
        { word: "deforestation", translation: "جنگل‌زدایی", imageUrl: "/uploads/linguaquest/images/deforestation.jpg" },
        { word: "pollution", translation: "آلودگی", imageUrl: "/uploads/linguaquest/images/pollution.jpg" },
        { word: "renewable energy", translation: "انرژی تجدیدپذیر", imageUrl: "/uploads/linguaquest/images/renewable-energy.jpg" },
        { word: "carbon footprint", translation: "رد پای کربن", imageUrl: "/uploads/linguaquest/images/carbon-footprint.jpg" },
        { word: "recycling", translation: "بازیافت", imageUrl: "/uploads/linguaquest/images/recycling.jpg" },
        { word: "biodiversity", translation: "تنوع زیستی", imageUrl: "/uploads/linguaquest/images/biodiversity.jpg" },
        { word: "climate change", translation: "تغییر اقلیم", imageUrl: "/uploads/linguaquest/images/climate-change.jpg" }
      ],
      timeLimit: 150,
      xpReward: 80
    },
    {
      stepId: "synonym_3",
      type: "synonym_antonym",
      title: "Environmental Language Precision",
      instructions: "Distinguish between similar and opposite concepts",
      mode: "mixed",
      pairs: [
        { word: "sustainable", match: "renewable", type: "synonym", translation: "پایدار" },
        { word: "sustainable", match: "unsustainable", type: "antonym", translation: "پایدار ≠ ناپایدار" },
        { word: "conservation", match: "preservation", type: "synonym", translation: "حفاظت" },
        { word: "conservation", match: "destruction", type: "antonym", translation: "حفاظت ≠ تخریب" },
        { word: "toxic", match: "poisonous", type: "synonym", translation: "سمی" },
        { word: "toxic", match: "harmless", type: "antonym", translation: "سمی ≠ بی‌ضرر" },
        { word: "degradation", match: "deterioration", type: "synonym", translation: "تخریب" },
        { word: "restore", match: "rehabilitate", type: "synonym", translation: "بازسازی کردن" }
      ],
      timeLimit: 170,
      xpReward: 85
    },
    {
      stepId: "grammar_4",
      type: "grammar_battles",
      title: "Passive Voice in Environmental Contexts",
      instructions: "Convert active sentences to passive correctly",
      rules: [
        {
          id: "passive_present",
          ruleText: "Passive Present: is/are + past participle",
          example: "Forests are destroyed every day.",
          questions: [
            {
              sentence: "Plastic waste ___ into the ocean daily.",
              correctAnswer: "is dumped",
              options: ["dumps", "is dumped", "dumping"],
              explanation: "Use passive when the action is more important than who does it."
            },
            {
              sentence: "Many species ___ by habitat loss.",
              correctAnswer: "are threatened",
              options: ["threaten", "are threatened", "threatening"],
              explanation: "Passive voice: are + past participle."
            }
          ]
        },
        {
          id: "passive_perfect",
          ruleText: "Passive Present Perfect: has/have been + past participle",
          example: "The forest has been protected since 1990.",
          questions: [
            {
              sentence: "Significant progress ___ in renewable energy.",
              correctAnswer: "has been made",
              options: ["has made", "has been made", "is made"],
              explanation: "Present perfect passive for actions with present relevance."
            }
          ]
        }
      ],
      timeLimit: 200,
      xpReward: 95
    },
    {
      stepId: "word_form_3",
      type: "word_formation",
      title: "Environmental Collocations",
      instructions: "Build correct environmental phrases",
      words: [
        {
          target: "global warming",
          tiles: ["global", "warming"],
          translation: "گرمایش جهانی",
          audioUrl: "/audio/phrases/global-warming.mp3"
        },
        {
          target: "greenhouse gases",
          tiles: ["greenhouse", "gases"],
          translation: "گازهای گلخانه‌ای",
          audioUrl: "/audio/phrases/greenhouse-gases.mp3"
        },
        {
          target: "fossil fuels",
          tiles: ["fossil", "fuels"],
          translation: "سوخت‌های فسیلی",
          audioUrl: "/audio/phrases/fossil-fuels.mp3"
        },
        {
          target: "sea level",
          tiles: ["sea", "level"],
          translation: "سطح دریا",
          audioUrl: "/audio/phrases/sea-level.mp3"
        }
      ],
      timeLimit: 160,
      xpReward: 70
    },
    {
      stepId: "blitz_4",
      type: "timed_blitz",
      title: "Environmental Action Blitz",
      instructions: "Quick match: ecology terms!",
      pairs: [
        { word: "ecosystem", translation: "بوم‌سازگان" },
        { word: "habitat", translation: "زیستگاه" },
        { word: "emission", translation: "انتشار" },
        { word: "extinction", translation: "انقراض" },
        { word: "compost", translation: "کمپوست" },
        { word: "organic", translation: "ارگانیک" },
        { word: "pesticide", translation: "آفت‌کش" },
        { word: "landfill", translation: "محل دفن زباله" },
        { word: "smog", translation: "مه دود" },
        { word: "ozone", translation: "ازن" }
      ],
      timeLimit: 70,
      xpReward: 90
    }
  ],
  estimatedDurationMinutes: 35,
  xpReward: 420,
  vocabularyWords: ["deforestation", "pollution", "renewable energy", "carbon footprint", "recycling", "biodiversity", "climate change", "sustainable", "conservation", "ecosystem"],
  grammarTopics: ["passive voice", "present passive", "present perfect passive", "environmental collocations"],
  audioFiles: ["/audio/ambient/forest-birds.mp3", "/audio/phrases/global-warming.mp3", "/audio/phrases/greenhouse-gases.mp3", "/audio/phrases/fossil-fuels.mp3", "/audio/phrases/sea-level.mp3"],
  tags: ["environment", "sustainability", "passive_voice", "upper-intermediate"],
  isPremium: false,
  isActive: true
};

// ============================================================================
// C1 ADVANCED LESSONS (2 lessons)
// ============================================================================

export const C1_LESSON_1: LessonSeedData = {
  title: "Global Economics & Financial Literacy",
  description: "Master advanced economic vocabulary, complex sentence structures, and financial discourse. Explore global markets and economic theories.",
  language: "en",
  difficulty: "C1",
  lessonType: "academic_professional",
  sceneType: "financial_district",
  sceneData: {
    environment: {
      theme: "business_center",
      timeOfDay: "day",
      background: "/assets/scenes/financial-district.jpg",
      ambientSound: "/audio/ambient/city-business.mp3"
    },
    characters: [
      {
        id: "prof_martinez",
        name: "Prof. Martinez",
        avatar: "/assets/characters/prof-martinez.png",
        role: "economics_professor"
      }
    ]
  },
  interactionConfig: [
    {
      stepId: "intro",
      type: "dialogue",
      characterId: "prof_martinez",
      text: "Welcome to Advanced Economics. Today we analyze market dynamics and fiscal policies.",
      duration: 5000
    },
    {
      stepId: "synonym_4",
      type: "synonym_antonym",
      title: "Financial Terminology Mastery",
      instructions: "Match sophisticated economic terms",
      mode: "mixed",
      pairs: [
        { word: "lucrative", match: "profitable", type: "synonym", translation: "سودآور" },
        { word: "lucrative", match: "unprofitable", type: "antonym", translation: "سودآور ≠ زیان‌ده" },
        { word: "volatile", match: "unstable", type: "synonym", translation: "بی‌ثبات" },
        { word: "volatile", match: "stable", type: "antonym", translation: "بی‌ثبات ≠ باثبات" },
        { word: "recession", match: "downturn", type: "synonym", translation: "رکود" },
        { word: "recession", match: "boom", type: "antonym", translation: "رکود ≠ رونق" },
        { word: "surplus", match: "excess", type: "synonym", translation: "مازاد" },
        { word: "surplus", match: "deficit", type: "antonym", translation: "مازاد ≠ کسری" },
        { word: "appreciating", match: "increasing", type: "synonym", translation: "افزایش یافتن" },
        { word: "appreciating", match: "depreciating", type: "antonym", translation: "افزایش ≠ کاهش" },
        { word: "solvent", match: "financially stable", type: "synonym", translation: "دارای نقدینگی" },
        { word: "solvent", match: "bankrupt", type: "antonym", translation: "باثبات ≠ ورشکسته" }
      ],
      timeLimit: 210,
      xpReward: 110
    },
    {
      stepId: "word_form_4",
      type: "word_formation",
      title: "Complex Economic Phrases",
      instructions: "Construct advanced financial terminology",
      words: [
        {
          target: "quantitative easing",
          tiles: ["quantitative", "easing"],
          translation: "تسهیل کمی",
          audioUrl: "/audio/phrases/quantitative-easing.mp3"
        },
        {
          target: "fiscal policy",
          tiles: ["fiscal", "policy"],
          translation: "سیاست مالی",
          audioUrl: "/audio/phrases/fiscal-policy.mp3"
        },
        {
          target: "monetary policy",
          tiles: ["monetary", "policy"],
          translation: "سیاست پولی",
          audioUrl: "/audio/phrases/monetary-policy.mp3"
        },
        {
          target: "market capitalization",
          tiles: ["market", "capitalization"],
          translation: "ارزش بازار",
          audioUrl: "/audio/phrases/market-capitalization.mp3"
        },
        {
          target: "supply and demand",
          tiles: ["supply", "and", "demand"],
          translation: "عرضه و تقاضا",
          audioUrl: "/audio/phrases/supply-and-demand.mp3"
        },
        {
          target: "gross domestic product",
          tiles: ["gross", "domestic", "product"],
          translation: "تولید ناخالص داخلی",
          audioUrl: "/audio/phrases/gdp.mp3"
        }
      ],
      timeLimit: 200,
      xpReward: 90
    },
    {
      stepId: "grammar_5",
      type: "grammar_battles",
      title: "Advanced Clause Structures",
      instructions: "Master complex subordinate clauses",
      rules: [
        {
          id: "relative_clauses",
          ruleText: "Non-defining relative clauses add extra information (use commas)",
          example: "The CEO, who has 20 years of experience, announced the merger.",
          questions: [
            {
              sentence: "The policy___ was implemented last year___ has reduced inflation.",
              correctAnswer: ", which,",
              options: ["which", ", which,", "that"],
              explanation: "Non-defining clauses require commas and 'which' (not 'that')."
            },
            {
              sentence: "Investors___ portfolios are diversified___ tend to minimize risk.",
              correctAnswer: ", whose,",
              options: ["whose", ", whose,", "who's"],
              explanation: "Use 'whose' for possession; commas for non-defining clauses."
            }
          ]
        },
        {
          id: "cleft_sentences",
          ruleText: "Cleft sentences emphasize specific information: 'What...is' or 'It is...that'",
          example: "What drives inflation is excessive money supply.",
          questions: [
            {
              sentence: "___ the central bank decides ___ will affect interest rates.",
              correctAnswer: "What, that",
              options: ["What, that", "It, which", "That, what"],
              explanation: "'What' introduces the cleft; 'that' connects the emphasized part."
            }
          ]
        }
      ],
      timeLimit: 240,
      xpReward: 115
    },
    {
      stepId: "vocab_4",
      type: "vocabulary_matching",
      title: "Investment & Market Terms",
      instructions: "Match financial instruments with definitions",
      pairs: [
        { word: "equity", translation: "سهام", imageUrl: "/uploads/linguaquest/images/equity.jpg" },
        { word: "bond", translation: "اوراق قرضه", imageUrl: "/uploads/linguaquest/images/bond.jpg" },
        { word: "dividend", translation: "سود سهام", imageUrl: "/uploads/linguaquest/images/dividend.jpg" },
        { word: "portfolio", translation: "سبد سرمایه", imageUrl: "/uploads/linguaquest/images/portfolio.jpg" },
        { word: "derivative", translation: "مشتقه مالی", imageUrl: "/uploads/linguaquest/images/derivative.jpg" },
        { word: "commodity", translation: "کالا", imageUrl: "/uploads/linguaquest/images/commodity.jpg" }
      ],
      timeLimit: 160,
      xpReward: 85
    },
    {
      stepId: "blitz_5",
      type: "timed_blitz",
      title: "Economics Speed Challenge",
      instructions: "Rapid-fire economic terminology!",
      pairs: [
        { word: "inflation", translation: "تورم" },
        { word: "deflation", translation: "کاهش قیمت‌ها" },
        { word: "tariff", translation: "تعرفه" },
        { word: "subsidy", translation: "یارانه" },
        { word: "monopoly", translation: "انحصار" },
        { word: "oligopoly", translation: "انحصار چند جانبه" },
        { word: "liability", translation: "بدهی" },
        { word: "asset", translation: "دارایی" },
        { word: "liquidity", translation: "نقدینگی" },
        { word: "leverage", translation: "اهرم مالی" },
        { word: "hedge", translation: "پوشش ریسک" },
        { word: "arbitrage", translation: "آربیتراژ" }
      ],
      timeLimit: 80,
      xpReward: 105
    }
  ],
  estimatedDurationMinutes: 40,
  xpReward: 505,
  vocabularyWords: ["lucrative", "volatile", "recession", "surplus", "appreciating", "solvent", "equity", "bond", "dividend", "portfolio", "inflation", "deflation", "monopoly"],
  grammarTopics: ["non-defining relative clauses", "cleft sentences", "complex subordination", "advanced clause structures"],
  audioFiles: ["/audio/ambient/city-business.mp3", "/audio/phrases/quantitative-easing.mp3", "/audio/phrases/fiscal-policy.mp3", "/audio/phrases/monetary-policy.mp3", "/audio/phrases/market-capitalization.mp3", "/audio/phrases/supply-and-demand.mp3", "/audio/phrases/gdp.mp3"],
  tags: ["economics", "finance", "advanced_grammar", "professional"],
  isPremium: false,
  isActive: true
};

export const C1_LESSON_2: LessonSeedData = {
  title: "Philosophy & Critical Thinking",
  description: "Engage with philosophical concepts, master abstract vocabulary, and practice sophisticated argumentation techniques.",
  language: "en",
  difficulty: "C1",
  lessonType: "academic_discourse",
  sceneType: "university_library",
  sceneData: {
    environment: {
      theme: "classical_library",
      timeOfDay: "evening",
      background: "/assets/scenes/library-study.jpg",
      ambientSound: "/audio/ambient/library-quiet.mp3"
    },
    characters: [
      {
        id: "dr_thompson",
        name: "Dr. Thompson",
        avatar: "/assets/characters/dr-thompson.png",
        role: "philosophy_professor"
      }
    ]
  },
  interactionConfig: [
    {
      stepId: "intro",
      type: "dialogue",
      characterId: "dr_thompson",
      text: "Welcome to Philosophy 401. Today we explore epistemology, ethics, and the nature of knowledge itself.",
      duration: 5000
    },
    {
      stepId: "vocab_5",
      type: "vocabulary_matching",
      title: "Philosophical Terminology",
      instructions: "Match abstract philosophical concepts",
      pairs: [
        { word: "empiricism", translation: "تجربه‌گرایی", imageUrl: "/uploads/linguaquest/images/empiricism.jpg" },
        { word: "rationalism", translation: "عقل‌گرایی", imageUrl: "/uploads/linguaquest/images/rationalism.jpg" },
        { word: "existentialism", translation: "اگزیستانسیالیسم", imageUrl: "/uploads/linguaquest/images/existentialism.jpg" },
        { word: "utilitarianism", translation: "سودگرایی", imageUrl: "/uploads/linguaquest/images/utilitarianism.jpg" },
        { word: "dialectic", translation: "دیالکتیک", imageUrl: "/uploads/linguaquest/images/dialectic.jpg" },
        { word: "determinism", translation: "جبرگرایی", imageUrl: "/uploads/linguaquest/images/determinism.jpg" }
      ],
      timeLimit: 180,
      xpReward: 95
    },
    {
      stepId: "synonym_5",
      type: "synonym_antonym",
      title: "Abstract Concepts: Nuances & Contrasts",
      instructions: "Distinguish subtle philosophical meanings",
      mode: "mixed",
      pairs: [
        { word: "objective", match: "impartial", type: "synonym", translation: "عینی" },
        { word: "objective", match: "subjective", type: "antonym", translation: "عینی ≠ ذهنی" },
        { word: "inherent", match: "intrinsic", type: "synonym", translation: "ذاتی" },
        { word: "inherent", match: "acquired", type: "antonym", translation: "ذاتی ≠ اکتسابی" },
        { word: "absolute", match: "unconditional", type: "synonym", translation: "مطلق" },
        { word: "absolute", match: "relative", type: "antonym", translation: "مطلق ≠ نسبی" },
        { word: "a priori", match: "innate", type: "synonym", translation: "پیشینی" },
        { word: "a priori", match: "a posteriori", type: "antonym", translation: "پیشینی ≠ پسینی" },
        { word: "transcendent", match: "beyond ordinary", type: "synonym", translation: "متعالی" },
        { word: "transcendent", match: "mundane", type: "antonym", translation: "متعالی ≠ دنیوی" }
      ],
      timeLimit: 220,
      xpReward: 115
    },
    {
      stepId: "word_form_5",
      type: "word_formation",
      title: "Philosophical Expressions",
      instructions: "Build complex philosophical phrases",
      words: [
        {
          target: "categorical imperative",
          tiles: ["categorical", "imperative"],
          translation: "امر مطلق",
          audioUrl: "/audio/phrases/categorical-imperative.mp3"
        },
        {
          target: "social contract",
          tiles: ["social", "contract"],
          translation: "قرارداد اجتماعی",
          audioUrl: "/audio/phrases/social-contract.mp3"
        },
        {
          target: "moral relativism",
          tiles: ["moral", "relativism"],
          translation: "نسبیت اخلاقی",
          audioUrl: "/audio/phrases/moral-relativism.mp3"
        },
        {
          target: "free will",
          tiles: ["free", "will"],
          translation: "اراده آزاد",
          audioUrl: "/audio/phrases/free-will.mp3"
        },
        {
          target: "cogito ergo sum",
          tiles: ["cogito", "ergo", "sum"],
          translation: "می‌اندیشم پس هستم",
          audioUrl: "/audio/phrases/cogito-ergo-sum.mp3"
        }
      ],
      timeLimit: 190,
      xpReward: 85
    },
    {
      stepId: "grammar_6",
      type: "grammar_battles",
      title: "Subjunctive & Inversion Mastery",
      instructions: "Navigate sophisticated formal structures",
      rules: [
        {
          id: "subjunctive",
          ruleText: "Subjunctive after 'suggest/recommend/insist': base form without 's'",
          example: "I suggest that he reconsider his position.",
          questions: [
            {
              sentence: "The philosopher insisted that truth ___ independent of perception.",
              correctAnswer: "be",
              options: ["is", "be", "was"],
              explanation: "Use base form (be) in subjunctive after 'insist'."
            },
            {
              sentence: "Kant recommended that morality ___ based on reason alone.",
              correctAnswer: "be",
              options: ["is", "be", "being"],
              explanation: "Subjunctive uses base verb after 'recommend'."
            }
          ]
        },
        {
          id: "inversion_emphasis",
          ruleText: "Inversion for emphasis: 'Not only...but also' / 'Rarely' / 'Seldom'",
          example: "Not only did Socrates question assumptions, but he also inspired generations.",
          questions: [
            {
              sentence: "Rarely ___ philosophers achieved such clarity of thought.",
              correctAnswer: "have",
              options: ["have", "they have", "has"],
              explanation: "After 'rarely', invert: auxiliary + subject."
            },
            {
              sentence: "Seldom ___ such profound insights been articulated.",
              correctAnswer: "have",
              options: ["has", "have", "they have"],
              explanation: "Inversion after negative adverbials: have + subject."
            }
          ]
        }
      ],
      timeLimit: 250,
      xpReward: 120
    },
    {
      stepId: "blitz_6",
      type: "timed_blitz",
      title: "Philosophy Vocabulary Sprint",
      instructions: "Rapid philosophical term matching!",
      pairs: [
        { word: "metaphysics", translation: "مابعدالطبیعه" },
        { word: "epistemology", translation: "معرفت‌شناسی" },
        { word: "ontology", translation: "هستی‌شناسی" },
        { word: "ethics", translation: "اخلاق" },
        { word: "aesthetics", translation: "زیبایی‌شناسی" },
        { word: "logic", translation: "منطق" },
        { word: "paradox", translation: "پارادوکس" },
        { word: "syllogism", translation: "قیاس منطقی" },
        { word: "premise", translation: "مقدمه" },
        { word: "conclusion", translation: "نتیجه" },
        { word: "fallacy", translation: "مغالطه" },
        { word: "virtue", translation: "فضیلت" }
      ],
      timeLimit: 85,
      xpReward: 110
    }
  ],
  estimatedDurationMinutes: 42,
  xpReward: 525,
  vocabularyWords: ["empiricism", "rationalism", "existentialism", "utilitarianism", "dialectic", "determinism", "objective", "subjective", "inherent", "absolute", "metaphysics", "epistemology", "ethics"],
  grammarTopics: ["subjunctive mood", "inversion after negative adverbials", "formal structures", "advanced subordination"],
  audioFiles: ["/audio/ambient/library-quiet.mp3", "/audio/phrases/categorical-imperative.mp3", "/audio/phrases/social-contract.mp3", "/audio/phrases/moral-relativism.mp3", "/audio/phrases/free-will.mp3", "/audio/phrases/cogito-ergo-sum.mp3"],
  tags: ["philosophy", "critical_thinking", "abstract_concepts", "advanced"],
  isPremium: false,
  isActive: true
};

// ============================================================================
// AGGREGATE ALL LESSONS FOR EXPORT
// ============================================================================

export const ALL_LINGUAQUEST_LESSONS: LessonSeedData[] = [
  B1_LESSON_1,
  B1_LESSON_2,
  B2_LESSON_1,
  B2_LESSON_2,
  C1_LESSON_1,
  C1_LESSON_2
];

export const LESSON_SUMMARY = {
  total: ALL_LINGUAQUEST_LESSONS.length,
  byLevel: {
    B1: 2,
    B2: 2,
    C1: 2
  },
  totalXP: ALL_LINGUAQUEST_LESSONS.reduce((sum, lesson) => sum + (lesson.xpReward || 0), 0),
  totalEstimatedMinutes: ALL_LINGUAQUEST_LESSONS.reduce((sum, lesson) => sum + (lesson.estimatedDurationMinutes || 0), 0),
  allFree: ALL_LINGUAQUEST_LESSONS.every(lesson => lesson.isPremium === false)
};
