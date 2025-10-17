/**
 * LinguaQuest Content Bank - CEFR-Aligned Seed Data
 * 
 * This file contains real educational content for all game types (A1-C2):
 * - Vocabulary Matching
 * - Sentence Scramble
 * - Multiple-Choice
 * - Word Formation
 * - Listening Comprehension
 * - Synonym/Antonym
 * - Grammar Battles
 * - Timed Vocabulary Blitz
 */

import type { LinguaquestContentBankInsert } from "../../shared/schema";

// ============================================================================
// A1 LEVEL - BEGINNER (Basic words, simple sentences)
// ============================================================================

export const A1_VOCABULARY: LinguaquestContentBankInsert[] = [
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'timed_blitz', 'multiple_choice'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'hello',
    translation: 'سلام',
    phonetic: 'həˈloʊ',
    exampleSentences: ['Hello! How are you?', 'She said hello to everyone.'],
    partOfSpeech: 'interjection',
    topicCategory: 'greetings',
    tags: ['basic', 'greeting', 'common'],
    difficultyScore: 1
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'timed_blitz'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'goodbye',
    translation: 'خداحافظ',
    phonetic: 'ɡʊdˈbaɪ',
    exampleSentences: ['Goodbye! See you tomorrow.', 'They waved goodbye.'],
    partOfSpeech: 'interjection',
    synonyms: ['farewell', 'bye'],
    topicCategory: 'greetings',
    tags: ['basic', 'farewell'],
    difficultyScore: 1
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'word_formation', 'synonym_antonym'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'happy',
    translation: 'خوشحال',
    phonetic: 'ˈhæpi',
    exampleSentences: ['I am very happy today.', 'She looks happy.'],
    partOfSpeech: 'adjective',
    synonyms: ['joyful', 'glad', 'cheerful'],
    antonyms: ['sad', 'unhappy'],
    wordFamily: ['happiness', 'happily', 'unhappy'],
    topicCategory: 'emotions',
    tags: ['feelings', 'common'],
    difficultyScore: 2
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'timed_blitz'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'sad',
    translation: 'غمگین',
    phonetic: 'sæd',
    exampleSentences: ['He was sad after losing the game.', 'Don\'t be sad.'],
    partOfSpeech: 'adjective',
    synonyms: ['unhappy', 'sorrowful'],
    antonyms: ['happy', 'joyful'],
    wordFamily: ['sadly', 'sadness'],
    topicCategory: 'emotions',
    tags: ['feelings'],
    difficultyScore: 2
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'timed_blitz', 'multiple_choice'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'cat',
    translation: 'گربه',
    phonetic: 'kæt',
    exampleSentences: ['The cat is sleeping.', 'I have a black cat.'],
    partOfSpeech: 'noun',
    relatedWords: ['kitten', 'feline', 'pet'],
    topicCategory: 'animals',
    tags: ['animals', 'pets', 'common'],
    difficultyScore: 1
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'timed_blitz'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'dog',
    translation: 'سگ',
    phonetic: 'dɔːɡ',
    exampleSentences: ['The dog is barking.', 'My dog loves to play.'],
    partOfSpeech: 'noun',
    relatedWords: ['puppy', 'canine', 'pet'],
    topicCategory: 'animals',
    tags: ['animals', 'pets'],
    difficultyScore: 1
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'word_formation'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'eat',
    translation: 'خوردن',
    phonetic: 'iːt',
    exampleSentences: ['I eat breakfast every morning.', 'Let\'s eat together.'],
    partOfSpeech: 'verb',
    wordFamily: ['eating', 'eaten', 'eats', 'ate'],
    topicCategory: 'daily_activities',
    tags: ['verbs', 'food', 'common'],
    difficultyScore: 2
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'word_formation'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'drink',
    translation: 'نوشیدن',
    phonetic: 'drɪŋk',
    exampleSentences: ['I drink water every day.', 'What do you want to drink?'],
    partOfSpeech: 'verb',
    wordFamily: ['drinking', 'drinks', 'drank', 'drunk'],
    topicCategory: 'daily_activities',
    tags: ['verbs', 'food'],
    difficultyScore: 2
  }
];

export const A1_GRAMMAR: LinguaquestContentBankInsert[] = [
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles', 'multiple_choice'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'Present Simple: I/You/We/They',
    grammarRule: 'Use the base form of the verb with I, you, we, and they.',
    grammarExamples: ['I walk to school.', 'You like ice cream.', 'We play football.', 'They eat dinner.'],
    commonMistakes: ['I walks (wrong) → I walk (correct)', 'They likes (wrong) → They like (correct)'],
    topicCategory: 'verb_tenses',
    tags: ['present_simple', 'basics'],
    difficultyScore: 2
  },
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles', 'multiple_choice'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'Present Simple: He/She/It',
    grammarRule: 'Add -s or -es to the verb with he, she, and it.',
    grammarExamples: ['He works hard.', 'She teaches English.', 'It rains every day.'],
    commonMistakes: ['He work (wrong) → He works (correct)', 'She teach (wrong) → She teaches (correct)'],
    topicCategory: 'verb_tenses',
    tags: ['present_simple', 'third_person'],
    difficultyScore: 3
  }
];

export const A1_QUESTIONS: LinguaquestContentBankInsert[] = [
  {
    contentType: 'question',
    gameTypes: ['multiple_choice', 'listening_comprehension'],
    cefrLevel: 'A1',
    language: 'en',
    questionText: 'How do you greet someone in the morning?',
    correctAnswer: 'Good morning',
    wrongAnswers: ['Good night', 'Goodbye', 'See you'],
    explanation: '"Good morning" is the standard greeting used before noon.',
    hint: 'Think about the time of day.',
    topicCategory: 'greetings',
    tags: ['greetings', 'basics'],
    difficultyScore: 1
  },
  {
    contentType: 'question',
    gameTypes: ['multiple_choice'],
    cefrLevel: 'A1',
    language: 'en',
    questionText: 'Which word means the opposite of "big"?',
    correctAnswer: 'small',
    wrongAnswers: ['large', 'huge', 'giant'],
    explanation: '"Small" is the opposite (antonym) of "big".',
    hint: 'Think about size.',
    topicCategory: 'adjectives',
    tags: ['opposites', 'size'],
    difficultyScore: 2
  }
];

export const A1_SENTENCES: LinguaquestContentBankInsert[] = [
  {
    contentType: 'sentence',
    gameTypes: ['sentence_scramble', 'listening_comprehension'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'I like pizza.',
    translation: 'من پیتزا دوست دارم.',
    contextNotes: 'Simple subject-verb-object sentence expressing preference.',
    topicCategory: 'food_preferences',
    tags: ['simple_sentence', 'food'],
    difficultyScore: 1
  },
  {
    contentType: 'sentence',
    gameTypes: ['sentence_scramble'],
    cefrLevel: 'A1',
    language: 'en',
    primaryText: 'She is my friend.',
    translation: 'او دوست من است.',
    contextNotes: 'Basic sentence using "to be" verb.',
    topicCategory: 'relationships',
    tags: ['to_be', 'friends'],
    difficultyScore: 1
  }
];

// ============================================================================
// A2 LEVEL - ELEMENTARY (Expanded vocabulary, basic past tense)
// ============================================================================

export const A2_VOCABULARY: LinguaquestContentBankInsert[] = [
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym', 'word_formation'],
    cefrLevel: 'A2',
    language: 'en',
    primaryText: 'beautiful',
    translation: 'زیبا',
    phonetic: 'ˈbjuːtɪfl',
    exampleSentences: ['The sunset is beautiful.', 'She has a beautiful smile.'],
    partOfSpeech: 'adjective',
    synonyms: ['pretty', 'lovely', 'gorgeous'],
    antonyms: ['ugly', 'unattractive'],
    wordFamily: ['beauty', 'beautifully', 'beautify'],
    topicCategory: 'appearance',
    tags: ['descriptive', 'common'],
    difficultyScore: 3
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'word_formation'],
    cefrLevel: 'A2',
    language: 'en',
    primaryText: 'travel',
    translation: 'مسافرت کردن',
    phonetic: 'ˈtrævl',
    exampleSentences: ['I love to travel around the world.', 'They travel by train.'],
    partOfSpeech: 'verb',
    synonyms: ['journey', 'trip'],
    wordFamily: ['traveler', 'traveling', 'traveled'],
    relatedWords: ['trip', 'journey', 'voyage'],
    topicCategory: 'travel',
    tags: ['verbs', 'travel', 'common'],
    difficultyScore: 4
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym'],
    cefrLevel: 'A2',
    language: 'en',
    primaryText: 'expensive',
    translation: 'گران',
    phonetic: 'ɪkˈspensɪv',
    exampleSentences: ['This restaurant is very expensive.', 'The car was too expensive.'],
    partOfSpeech: 'adjective',
    synonyms: ['costly', 'pricey'],
    antonyms: ['cheap', 'inexpensive', 'affordable'],
    topicCategory: 'shopping',
    tags: ['price', 'shopping'],
    difficultyScore: 3
  }
];

export const A2_GRAMMAR: LinguaquestContentBankInsert[] = [
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles', 'multiple_choice'],
    cefrLevel: 'A2',
    language: 'en',
    primaryText: 'Past Simple: Regular Verbs',
    grammarRule: 'Add -ed to regular verbs to form past simple.',
    grammarExamples: ['I walked to the park.', 'She played tennis yesterday.', 'They watched a movie.'],
    commonMistakes: ['I walk yesterday (wrong) → I walked yesterday (correct)'],
    topicCategory: 'verb_tenses',
    tags: ['past_simple', 'regular_verbs'],
    difficultyScore: 4
  },
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles', 'multiple_choice'],
    cefrLevel: 'A2',
    language: 'en',
    primaryText: 'Past Simple: Irregular Verbs',
    grammarRule: 'Irregular verbs have unique past forms that must be memorized.',
    grammarExamples: ['I went to London.', 'She ate lunch at noon.', 'They saw a bird.'],
    commonMistakes: ['I goed (wrong) → I went (correct)', 'She eated (wrong) → She ate (correct)'],
    topicCategory: 'verb_tenses',
    tags: ['past_simple', 'irregular_verbs'],
    difficultyScore: 5
  }
];

export const A2_QUESTIONS: LinguaquestContentBankInsert[] = [
  {
    contentType: 'question',
    gameTypes: ['multiple_choice'],
    cefrLevel: 'A2',
    language: 'en',
    questionText: 'I _____ to Paris last summer.',
    correctAnswer: 'went',
    wrongAnswers: ['go', 'goes', 'going'],
    explanation: 'Use "went" (past simple) for actions completed in the past.',
    hint: 'The sentence says "last summer" (past time).',
    topicCategory: 'verb_tenses',
    tags: ['past_simple', 'irregular_verbs'],
    difficultyScore: 4
  },
  {
    contentType: 'question',
    gameTypes: ['multiple_choice'],
    cefrLevel: 'A2',
    language: 'en',
    questionText: 'Which word is a synonym of "happy"?',
    correctAnswer: 'joyful',
    wrongAnswers: ['sad', 'angry', 'tired'],
    explanation: '"Joyful" means the same as "happy".',
    hint: 'A synonym means the same thing.',
    topicCategory: 'vocabulary',
    tags: ['synonyms'],
    difficultyScore: 3
  }
];

// ============================================================================
// B1 LEVEL - INTERMEDIATE (Complex sentences, conditionals)
// ============================================================================

export const B1_VOCABULARY: LinguaquestContentBankInsert[] = [
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym', 'word_formation'],
    cefrLevel: 'B1',
    language: 'en',
    primaryText: 'achievement',
    translation: 'دستاورد',
    phonetic: 'əˈtʃiːvmənt',
    exampleSentences: ['Graduating was a great achievement.', 'The team celebrated their achievement.'],
    partOfSpeech: 'noun',
    synonyms: ['accomplishment', 'success', 'attainment'],
    wordFamily: ['achieve', 'achievable', 'achiever'],
    relatedWords: ['success', 'goal', 'milestone'],
    topicCategory: 'success',
    tags: ['abstract', 'formal'],
    difficultyScore: 6
  },
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym'],
    cefrLevel: 'B1',
    language: 'en',
    primaryText: 'persuade',
    translation: 'متقاعد کردن',
    phonetic: 'pərˈsweɪd',
    exampleSentences: ['I tried to persuade him to come.', 'She persuaded me to buy it.'],
    partOfSpeech: 'verb',
    synonyms: ['convince', 'influence'],
    wordFamily: ['persuasion', 'persuasive', 'persuaded'],
    topicCategory: 'communication',
    tags: ['verbs', 'influence'],
    difficultyScore: 6
  }
];

export const B1_GRAMMAR: LinguaquestContentBankInsert[] = [
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles', 'multiple_choice'],
    cefrLevel: 'B1',
    language: 'en',
    primaryText: 'First Conditional',
    grammarRule: 'If + present simple, will + base verb. Used for real future possibilities.',
    grammarExamples: ['If it rains, I will stay home.', 'If you study hard, you will pass the exam.'],
    commonMistakes: ['If it will rain (wrong) → If it rains (correct)'],
    topicCategory: 'conditionals',
    tags: ['conditionals', 'future'],
    difficultyScore: 7
  }
];

// ============================================================================
// B2 LEVEL - UPPER-INTERMEDIATE (Idiomatic expressions, complex grammar)
// ============================================================================

export const B2_VOCABULARY: LinguaquestContentBankInsert[] = [
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym', 'word_formation'],
    cefrLevel: 'B2',
    language: 'en',
    primaryText: 'substantial',
    translation: 'قابل توجه',
    phonetic: 'səbˈstænʃl',
    exampleSentences: ['There was a substantial increase in sales.', 'The company made substantial progress.'],
    partOfSpeech: 'adjective',
    synonyms: ['significant', 'considerable', 'sizable'],
    antonyms: ['insignificant', 'negligible'],
    wordFamily: ['substance', 'substantially'],
    topicCategory: 'quantity',
    tags: ['formal', 'academic'],
    difficultyScore: 8
  }
];

export const B2_GRAMMAR: LinguaquestContentBankInsert[] = [
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles', 'multiple_choice'],
    cefrLevel: 'B2',
    language: 'en',
    primaryText: 'Past Perfect',
    grammarRule: 'Had + past participle. Used for actions completed before another past action.',
    grammarExamples: ['I had finished dinner when she arrived.', 'They had already left before I got there.'],
    commonMistakes: ['I have finished (recent past, wrong context) vs I had finished (before another past action)'],
    topicCategory: 'verb_tenses',
    tags: ['past_perfect', 'advanced'],
    difficultyScore: 8
  }
];

// ============================================================================
// C1 LEVEL - ADVANCED (Nuanced meanings, advanced structures)
// ============================================================================

export const C1_VOCABULARY: LinguaquestContentBankInsert[] = [
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym'],
    cefrLevel: 'C1',
    language: 'en',
    primaryText: 'ubiquitous',
    translation: 'همه جا حاضر',
    phonetic: 'juːˈbɪkwɪtəs',
    exampleSentences: ['Smartphones have become ubiquitous in modern society.', 'The ubiquitous presence of cameras raises privacy concerns.'],
    partOfSpeech: 'adjective',
    synonyms: ['omnipresent', 'pervasive', 'widespread'],
    antonyms: ['rare', 'scarce'],
    topicCategory: 'advanced_descriptive',
    tags: ['advanced', 'formal', 'academic'],
    difficultyScore: 9
  }
];

export const C1_GRAMMAR: LinguaquestContentBankInsert[] = [
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles'],
    cefrLevel: 'C1',
    language: 'en',
    primaryText: 'Inversion after Negative Adverbials',
    grammarRule: 'After certain negative adverbials (rarely, seldom, never), use inverted word order.',
    grammarExamples: ['Rarely have I seen such talent.', 'Never before had they experienced such difficulties.'],
    commonMistakes: ['Rarely I have seen (wrong) → Rarely have I seen (correct)'],
    topicCategory: 'advanced_grammar',
    tags: ['inversion', 'formal'],
    difficultyScore: 9
  }
];

// ============================================================================
// C2 LEVEL - PROFICIENCY (Sophisticated vocabulary, complex structures)
// ============================================================================

export const C2_VOCABULARY: LinguaquestContentBankInsert[] = [
  {
    contentType: 'vocabulary',
    gameTypes: ['vocabulary_matching', 'synonym_antonym'],
    cefrLevel: 'C2',
    language: 'en',
    primaryText: 'ephemeral',
    translation: 'زودگذر',
    phonetic: 'ɪˈfemərəl',
    exampleSentences: ['The beauty of cherry blossoms is ephemeral.', 'Fashion trends are often ephemeral.'],
    partOfSpeech: 'adjective',
    synonyms: ['transient', 'fleeting', 'temporary'],
    antonyms: ['permanent', 'enduring', 'eternal'],
    topicCategory: 'sophisticated_vocabulary',
    tags: ['advanced', 'literary'],
    difficultyScore: 10
  }
];

export const C2_GRAMMAR: LinguaquestContentBankInsert[] = [
  {
    contentType: 'grammar',
    gameTypes: ['grammar_battles'],
    cefrLevel: 'C2',
    language: 'en',
    primaryText: 'Subjunctive Mood',
    grammarRule: 'The subjunctive mood expresses wishes, suggestions, or hypothetical situations using "were" for all persons.',
    grammarExamples: ['If I were rich, I would travel the world.', 'I suggest that he be more careful.'],
    commonMistakes: ['If I was rich (colloquial) vs If I were rich (formal subjunctive)'],
    topicCategory: 'advanced_grammar',
    tags: ['subjunctive', 'formal', 'complex'],
    difficultyScore: 10
  }
];

// ============================================================================
// AGGREGATE ALL CONTENT
// ============================================================================

export const ALL_CONTENT: LinguaquestContentBankInsert[] = [
  ...A1_VOCABULARY,
  ...A1_GRAMMAR,
  ...A1_QUESTIONS,
  ...A1_SENTENCES,
  ...A2_VOCABULARY,
  ...A2_GRAMMAR,
  ...A2_QUESTIONS,
  ...B1_VOCABULARY,
  ...B1_GRAMMAR,
  ...B2_VOCABULARY,
  ...B2_GRAMMAR,
  ...C1_VOCABULARY,
  ...C1_GRAMMAR,
  ...C2_VOCABULARY,
  ...C2_GRAMMAR
];

// Summary statistics
export const CONTENT_STATS = {
  total: ALL_CONTENT.length,
  byLevel: {
    A1: A1_VOCABULARY.length + A1_GRAMMAR.length + A1_QUESTIONS.length + A1_SENTENCES.length,
    A2: A2_VOCABULARY.length + A2_GRAMMAR.length + A2_QUESTIONS.length,
    B1: B1_VOCABULARY.length + B1_GRAMMAR.length,
    B2: B2_VOCABULARY.length + B2_GRAMMAR.length,
    C1: C1_VOCABULARY.length + C1_GRAMMAR.length,
    C2: C2_VOCABULARY.length + C2_GRAMMAR.length
  },
  gameTypes: {
    vocabulary_matching: ALL_CONTENT.filter(c => c.gameTypes?.includes('vocabulary_matching')).length,
    sentence_scramble: ALL_CONTENT.filter(c => c.gameTypes?.includes('sentence_scramble')).length,
    multiple_choice: ALL_CONTENT.filter(c => c.gameTypes?.includes('multiple_choice')).length,
    word_formation: ALL_CONTENT.filter(c => c.gameTypes?.includes('word_formation')).length,
    listening_comprehension: ALL_CONTENT.filter(c => c.gameTypes?.includes('listening_comprehension')).length,
    synonym_antonym: ALL_CONTENT.filter(c => c.gameTypes?.includes('synonym_antonym')).length,
    grammar_battles: ALL_CONTENT.filter(c => c.gameTypes?.includes('grammar_battles')).length,
    timed_blitz: ALL_CONTENT.filter(c => c.gameTypes?.includes('timed_blitz')).length
  }
};
