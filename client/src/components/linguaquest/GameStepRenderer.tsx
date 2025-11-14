import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Volume2, Check, X, Mic, Play, RotateCcw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';

interface GameStepProps {
  step: any;
  onComplete: (score: number) => void;
  onProgress?: (progress: number) => void;
}

export function GameStepRenderer({ step, onComplete, onProgress }: GameStepProps) {
  const { t } = useTranslation('linguaquest');
  const [stepProgress, setStepProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Route to appropriate step type renderer
  const renderStepContent = () => {
    switch (step.type) {
      case 'introduction':
      case 'scenario_intro':
      case 'scenario_introduction':
      case 'cultural_context':
        return <IntroductionStep step={step} onComplete={handleStepComplete} />;
      
      case 'vocabulary_introduction':
      case 'vocabulary_flashcards':
      case 'vocabulary_gallery':
      case 'vocabulary_body_parts':
      case 'word_building':
        return <VocabularyStep step={step} onComplete={handleStepComplete} />;
      
      case 'matching_game':
      case 'memory_game':
      case 'idiom_matching':
        return <MatchingGameStep step={step} onComplete={handleStepComplete} />;
      
      case 'conversation_practice':
      case 'conversation_builder':
      case 'dialogue_roleplay':
      case 'dialogue_doctor':
      case 'waiter_dialogue':
        return <ConversationStep step={step} onComplete={handleStepComplete} />;
      
      case 'pronunciation_challenge':
      case 'pronunciation_practice':
        return <PronunciationStep step={step} onComplete={handleStepComplete} />;
      
      case 'listening_comprehension':
      case 'listening_diagnosis':
        return <ListeningStep step={step} onComplete={handleStepComplete} />;
      
      case 'fill_in_blank':
      case 'story_completion':
        return <FillInBlankStep step={step} onComplete={handleStepComplete} />;
      
      case 'drag_and_drop':
      case 'shopping_task':
        return <DragDropStep step={step} onComplete={handleStepComplete} />;
      
      case 'quick_quiz':
      case 'checkout_simulation':
        return <QuizStep step={step} onComplete={handleStepComplete} />;
      
      case 'menu_exploration':
        return <MenuExplorationStep step={step} onComplete={handleStepComplete} />;
      
      case 'ordering_practice':
      case 'special_requests':
        return <OrderingPracticeStep step={step} onComplete={handleStepComplete} />;
      
      case 'symptom_description':
        return <SymptomDescriptionStep step={step} onComplete={handleStepComplete} />;
      
      case 'prescription_reading':
        return <PrescriptionReadingStep step={step} onComplete={handleStepComplete} />;
      
      case 'sentence_reordering':
      case 'word_order':
        return <SentenceReorderingStep step={step} onComplete={handleStepComplete} />;
      
      case 'image_selection':
      case 'picture_choice':
        return <ImageSelectionStep step={step} onComplete={handleStepComplete} />;
      
      case 'true_false':
      case 'true_or_false':
        return <TrueFalseStep step={step} onComplete={handleStepComplete} />;
      
      case 'spelling_challenge':
      case 'spell_word':
        return <SpellingStep step={step} onComplete={handleStepComplete} />;
      
      case 'synonym_antonym':
      case 'synonym_matching':
      case 'antonym_matching':
        return <SynonymAntonymStep step={step} onComplete={handleStepComplete} />;
      
      case 'word_formation':
      case 'word_family':
        return <WordFormationStep step={step} onComplete={handleStepComplete} />;
      
      case 'grammar_battles':
      case 'grammar_challenge':
        return <GrammarBattlesStep step={step} onComplete={handleStepComplete} />;
      
      case 'timed_vocabulary_blitz':
      case 'timed_blitz':
      case 'vocabulary_blitz':
        return <TimedVocabularyBlitzStep step={step} onComplete={handleStepComplete} />;
      
      default:
        return <DefaultStep step={step} onComplete={handleStepComplete} />;
    }
  };

  const handleStepComplete = (stepScore: number) => {
    setScore(stepScore);
    onComplete(stepScore);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-emerald-700">{step.title}</h2>
          <Badge variant="outline" className="text-lg">
            {t('gameSteps.step', { stepId: step.stepId })}
          </Badge>
        </div>
        {step.instruction && (
          <p className="text-gray-600 mb-4">{step.instruction}</p>
        )}
      </div>
      
      {renderStepContent()}
    </div>
  );
}

// Introduction Step Component
function IntroductionStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [objectClicked, setObjectClicked] = useState(false);

  const handleInteraction = () => {
    setObjectClicked(true);
    setTimeout(() => onComplete(100), 500);
  };

  return (
    <Card className="border-emerald-200">
      <CardContent className="pt-6">
        {step.audioNarration && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4"
            onClick={() => new Audio(step.audioNarration).play()}
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {t('gameSteps.playAudio')}
          </Button>
        )}
        <div className="text-center py-8">
          <p className="text-lg mb-6">{step.instruction}</p>
          {!objectClicked && (
            <Button 
              onClick={handleInteraction}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="interaction-button"
            >
              {step.interactionRequired || t('gameSteps.continue')}
            </Button>
          )}
          {objectClicked && (
            <div className="flex items-center justify-center text-green-600">
              <Check className="w-6 h-6 mr-2" />
              <span>{t('gameSteps.movingForward')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Vocabulary Step Component
function VocabularyStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [listenedWords, setListenedWords] = useState<Set<string>>(new Set());
  const [wordAudioUrls, setWordAudioUrls] = useState<Record<string, string>>({});
  const words = step.words || [];
  const language = step.language || 'en';
  const { generateVocabularyAudio, isLoading } = useTTS(language);

  // Generate audio for all vocabulary words on mount
  useEffect(() => {
    const loadAudio = async () => {
      const wordTexts = words.map((w: any) => w.word || w.text || w);
      const audioUrls = await generateVocabularyAudio(wordTexts);
      setWordAudioUrls(prevUrls => {
        // Only update if URLs actually changed
        const hasChanges = Object.keys(audioUrls).some(word => 
          audioUrls[word] && audioUrls[word] !== prevUrls[word]
        );
        return hasChanges ? { ...prevUrls, ...audioUrls } : prevUrls;
      });
    };

    if (words.length > 0) {
      loadAudio();
    }
  }, [words, generateVocabularyAudio]);

  const handleWordClick = (word: string, existingAudio?: string) => {
    // Use existing audio from step config, or generated audio from TTS
    const audioUrl = existingAudio || wordAudioUrls[word];
    if (audioUrl) {
      new Audio(audioUrl).play().catch(err => {
        console.error('Audio playback error:', err);
      });
    }
    setListenedWords(prev => new Set([...prev, word]));
  };

  useEffect(() => {
    if (listenedWords.size === words.length && words.length > 0) {
      setTimeout(() => onComplete(100), 500);
    }
  }, [listenedWords, words, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.vocabularyIntroduction')}</CardTitle>
        {isLoading && (
          <p className="text-sm text-gray-500 mt-2">{t('gameSteps.loadingAudio')}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {words.map((wordObj: any, index: number) => (
            <Card 
              key={index}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                listenedWords.has(wordObj.word) && "border-emerald-500 bg-emerald-50"
              )}
              onClick={() => handleWordClick(wordObj.word, wordObj.audio)}
              data-testid={`vocab-word-${wordObj.word}`}
            >
              <CardContent className="p-4 text-center">
                {wordObj.image && (
                  <div className="w-20 h-20 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img src={wordObj.image} alt={wordObj.word} className="w-16 h-16 object-contain" />
                  </div>
                )}
                <p className="font-bold text-lg">{wordObj.word}</p>
                {wordObj.translation && (
                  <p className="text-sm text-gray-500">{wordObj.translation}</p>
                )}
                <div className="mt-2">
                  {listenedWords.has(wordObj.word) ? (
                    <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-400 mx-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Progress value={(listenedWords.size / words.length) * 100} className="h-2" />
          <p className="text-sm text-gray-500 mt-2 text-center">
            {t('gameSteps.wordsLearned', { learned: listenedWords.size, total: words.length })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Matching Game Step Component
function MatchingGameStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const items = step.items || step.pairs || [];

  const handleItemClick = (itemId: string) => {
    if (!selectedItem) {
      setSelectedItem(itemId);
    } else {
      const newMatches = { ...matches, [selectedItem]: itemId };
      setMatches(newMatches);
      setSelectedItem(null);
      
      // Auto-submit when all matches complete
      if (Object.keys(newMatches).length === items.length && items.length > 0) {
        const correctMatches = items.filter((item: any) => {
          const key = item.word || item.id;
          const value = item.image || item.id;
          return newMatches[key] === value || newMatches[item.id] === item.id;
        }).length;
        const score = (correctMatches / items.length) * 100;
        setTimeout(() => onComplete(score), 800);
      }
    }
  };

  const allMatched = Object.keys(matches).length === items.length && items.length > 0;

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.matchingGame')}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{t('gameSteps.matchingInstruction')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            {items.map((item: any, index: number) => (
              <Button
                key={index}
                variant={selectedItem === (item.word || item.id) ? "default" : 
                        matches[item.word || item.id] ? "outline" : "outline"}
                className={cn(
                  "w-full justify-start",
                  matches[item.word || item.id] && "bg-emerald-50 border-emerald-300"
                )}
                onClick={() => handleItemClick(item.word || item.id)}
                data-testid={`match-word-${item.word || item.id}`}
              >
                {item.word || item.name}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {items.map((item: any, index: number) => {
              const matchedWord = Object.keys(matches).find(key => matches[key] === (item.image || item.id));
              const matchedItem = items.find((i: any) => (i.word || i.id) === matchedWord);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "border-2 rounded-lg p-3 cursor-pointer transition-all min-h-[100px] flex flex-col items-center justify-center",
                    matchedWord && "border-emerald-500 bg-emerald-50"
                  )}
                  onClick={() => {
                    if (selectedItem) {
                      handleItemClick(item.image || item.id);
                    }
                  }}
                  data-testid={`match-image-${item.image || item.id}`}
                >
                  {matchedItem && (
                    <p className="text-sm font-medium text-emerald-700 mb-2">{matchedItem.word}</p>
                  )}
                  {item.image && (
                    <img src={item.image} alt="" className="w-full h-20 object-contain" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {allMatched && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-center">
            <p className="text-emerald-700 font-medium">
              {t('gameSteps.matchingComplete')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Conversation Step Component
function ConversationStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const dialogue = step.dialogue || [];

  const currentDialogue = dialogue[currentDialogueIndex];

  const handleResponseSelect = (response: any) => {
    setSelectedResponse(response.text);
    
    if (response.correct) {
      const points = response.points || 10;
      setScore(prev => prev + points);
      
      if (currentDialogue.audio) {
        new Audio(currentDialogue.audio).play();
      }
      
      setTimeout(() => {
        if (currentDialogueIndex < dialogue.length - 1) {
          setCurrentDialogueIndex(prev => prev + 1);
          setSelectedResponse(null);
        } else {
          onComplete(score + points);
        }
      }, 1500);
    }
  };

  if (!currentDialogue) return null;

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.conversationPractice')}</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge>{t('gameSteps.dialogue', { current: currentDialogueIndex + 1, total: dialogue.length })}</Badge>
          <Badge variant="outline">{t('gameSteps.score', { score })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium text-blue-900">{currentDialogue.speaker === 'player' ? 'You' : currentDialogue.speaker}</p>
          <p className="text-lg mt-2">{currentDialogue.text}</p>
          {currentDialogue.audio && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => new Audio(currentDialogue.audio).play()}
              className="mt-2"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Listen
            </Button>
          )}
        </div>

        {currentDialogue.playerResponses && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">{t('gameSteps.chooseResponse')}</p>
            {currentDialogue.playerResponses.map((response: any, index: number) => (
              <Button
                key={index}
                variant={selectedResponse === response.text ? 
                  (response.correct ? "default" : "destructive") : 
                  "outline"
                }
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleResponseSelect(response)}
                disabled={selectedResponse !== null}
                data-testid={`response-option-${index}`}
              >
                <div className="flex-1">
                  <p>{response.text}</p>
                  {selectedResponse === response.text && !response.correct && response.feedback && (
                    <p className="text-sm mt-1 opacity-90">{response.feedback}</p>
                  )}
                </div>
                {selectedResponse === response.text && (
                  response.correct ? <Check className="w-5 h-5 ml-2" /> : <X className="w-5 h-5 ml-2" />
                )}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pronunciation Step Component
function PronunciationStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [referenceAudio, setReferenceAudio] = useState<string | null>(step.referenceAudio || null);
  const language = step.language || 'en';
  const { generateWordAudio, isLoading } = useTTS(language);

  // Generate reference audio if not provided
  useEffect(() => {
    const loadReferenceAudio = async () => {
      if (!step.referenceAudio && step.targetSentence) {
        const audioUrl = await generateWordAudio(step.targetSentence);
        if (audioUrl) {
          setReferenceAudio(prev => prev === audioUrl ? prev : audioUrl); // Only update if URL changed
        }
      }
    };

    loadReferenceAudio();
  }, [step.referenceAudio, step.targetSentence, generateWordAudio]);

  const handleRecord = () => {
    setIsRecording(true);
    // Simulate recording and scoring
    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
      setScore(randomScore);
      setIsRecording(false);
      setTimeout(() => onComplete(randomScore), 1000);
    }, 2000);
  };

  const playReferenceAudio = () => {
    if (referenceAudio) {
      new Audio(referenceAudio).play().catch(err => {
        console.error('Audio playback error:', err);
      });
    }
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.pronunciationChallenge')}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <p className="text-2xl font-bold mb-4">{step.targetSentence}</p>
          {referenceAudio && (
            <Button 
              variant="outline" 
              onClick={playReferenceAudio}
              className="mb-4"
              disabled={isLoading}
              data-testid="play-reference-audio"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {isLoading ? t('gameSteps.loading') : t('gameSteps.listenToExample')}
            </Button>
          )}
        </div>

        {score === null && (
          <Button
            onClick={handleRecord}
            disabled={isRecording}
            className="bg-red-600 hover:bg-red-700"
            size="lg"
            data-testid="record-button"
          >
            {isRecording ? (
              <>
                <div className="animate-pulse w-4 h-4 bg-white rounded-full mr-2" />
                {t('gameSteps.recording')}
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                {t('gameSteps.startRecording')}
              </>
            )}
          </Button>
        )}

        {score !== null && (
          <div className="mt-6">
            <div className="text-4xl font-bold text-emerald-600 mb-2">{score}%</div>
            <p className={score >= 80 ? "text-green-600" : "text-yellow-600"}>
              {score >= 80 ? t('feedback.excellent') : t('feedback.keepTrying')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Listening Step Component
function ListeningStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [played, setPlayed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const questions = step.comprehensionQuestions || (step.options ? [{ question: step.question, options: step.options, correct: step.options.findIndex((opt: any) => opt.correct) }] : []);

  const handlePlay = () => {
    if (step.audioClip) {
      new Audio(step.audioClip).play();
      setPlayed(true);
    }
  };

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    const isCorrect = index === questions[0]?.correct;
    setTimeout(() => onComplete(isCorrect ? 100 : 50), 1000);
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.listeningComprehension')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <Button
            onClick={handlePlay}
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
            data-testid="play-audio-button"
          >
            <Play className="w-5 h-5 mr-2" />
            Play Audio
          </Button>
        </div>

        {played && questions[0] && (
          <div className="mt-6">
            <p className="text-lg font-medium mb-4">{questions[0].question}</p>
            <div className="space-y-3">
              {questions[0].options.map((option: any, index: number) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? 
                    (index === questions[0].correct ? "default" : "destructive") : 
                    "outline"
                  }
                  className="w-full justify-start"
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  data-testid={`listening-option-${index}`}
                >
                  {option.text || option}
                  {selectedAnswer === index && (
                    index === questions[0].correct ? 
                      <Check className="w-5 h-5 ml-auto" /> : 
                      <X className="w-5 h-5 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Fill in Blank Step Component
function FillInBlankStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const sentences = step.sentences || [];

  const handleAnswerSelect = (sentenceIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [sentenceIndex]: answer }));
  };

  useEffect(() => {
    if (Object.keys(answers).length === sentences.length && sentences.length > 0) {
      const correct = sentences.filter((sent: any, index: number) => 
        answers[index] === sent.answer
      ).length;
      const score = (correct / sentences.length) * 100;
      setTimeout(() => onComplete(score), 500);
    }
  }, [answers, sentences, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.fillInBlank')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sentences.map((sentence: any, index: number) => (
            <div key={index}>
              <p className="text-lg mb-3">{sentence.text}</p>
              <div className="flex gap-2">
                {sentence.options.map((option: string, optIndex: number) => (
                  <Button
                    key={optIndex}
                    variant={answers[index] === option ? "default" : "outline"}
                    onClick={() => handleAnswerSelect(index, option)}
                    data-testid={`fill-blank-option-${index}-${optIndex}`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Drag and Drop Step Component
function DragDropStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const items = step.draggableItems || step.availableItems || [];

  const handleDrop = (itemId: string) => {
    if (!droppedItems.includes(itemId)) {
      setDroppedItems(prev => [...prev, itemId]);
    }
  };

  useEffect(() => {
    if (step.shoppingList && droppedItems.length === step.shoppingList.length) {
      const correct = step.shoppingList.filter((item: string) => droppedItems.includes(item)).length;
      const score = (correct / step.shoppingList.length) * 100;
      setTimeout(() => onComplete(score), 500);
    }
  }, [droppedItems, step, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.dragAndDrop')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="font-medium mb-3">{t('gameSteps.availableItems')}</p>
            {items.map((item: any) => (
              <Button
                key={item.id}
                variant="outline"
                className="w-full"
                onClick={() => handleDrop(item.id)}
                disabled={droppedItems.includes(item.id)}
                data-testid={`drag-item-${item.id}`}
              >
                {item.name}
              </Button>
            ))}
          </div>
          <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 min-h-[200px]">
            <p className="font-medium mb-3">{t('gameSteps.dropZone')}</p>
            {droppedItems.map((itemId, index) => (
              <Badge key={index} className="mr-2 mb-2">
                {items.find((i: any) => i.id === itemId)?.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quiz Step Component
function QuizStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const questions = step.questions || [];

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  useEffect(() => {
    if (Object.keys(selectedAnswers).length === questions.length && questions.length > 0) {
      const correct = questions.filter((q: any, index: number) => 
        selectedAnswers[index] === q.correct
      ).length;
      const score = (correct / questions.length) * 100;
      setTimeout(() => onComplete(score), 500);
    }
  }, [selectedAnswers, questions, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.quickQuiz')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {questions.map((question: any, qIndex: number) => (
            <div key={qIndex}>
              <p className="font-medium mb-3">{question.question}</p>
              <div className="space-y-2">
                {question.options.map((option: string, oIndex: number) => (
                  <Button
                    key={oIndex}
                    variant={selectedAnswers[qIndex] === oIndex ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleAnswerSelect(qIndex, oIndex)}
                    data-testid={`quiz-option-${qIndex}-${oIndex}`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Menu Exploration Step Component
function MenuExplorationStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [exploredItems, setExploredItems] = useState<Set<string>>(new Set());
  const menu = step.menu || { categories: [] };

  const totalItems = menu.categories.reduce((sum: number, cat: any) => sum + (cat.items?.length || 0), 0);

  const handleItemClick = (itemName: string, audio?: string) => {
    if (audio) {
      new Audio(audio).play();
    }
    setExploredItems(prev => new Set([...prev, itemName]));
  };

  useEffect(() => {
    if (exploredItems.size === totalItems && totalItems > 0) {
      setTimeout(() => onComplete(100), 500);
    }
  }, [exploredItems, totalItems, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.exploreMenu')}</CardTitle>
        <Progress value={(exploredItems.size / totalItems) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        {menu.categories.map((category: any, catIndex: number) => (
          <div key={catIndex} className="mb-6">
            <h3 className="font-bold text-lg mb-3">{category.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              {category.items?.map((item: any, itemIndex: number) => (
                <Card
                  key={itemIndex}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    exploredItems.has(item.name) && "border-emerald-500 bg-emerald-50"
                  )}
                  onClick={() => handleItemClick(item.name, item.audio)}
                  data-testid={`menu-item-${item.name}`}
                >
                  <CardContent className="p-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-20 object-cover rounded mb-2" />
                    )}
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-emerald-600">{item.price}</p>
                    {exploredItems.has(item.name) && (
                      <Check className="w-4 h-4 text-emerald-600 mt-1" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Ordering Practice Step Component
function OrderingPracticeStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set());
  const phrases = step.orderingPhrases || step.requestTemplates || [];

  const handlePhraseSelect = (situation: string, correct: boolean, points: number) => {
    if (correct) {
      setCompletedPhrases(prev => new Set([...prev, situation]));
    }
  };

  useEffect(() => {
    if (completedPhrases.size === phrases.length && phrases.length > 0) {
      const totalPoints = phrases.reduce((sum: number, p: any) => sum + (p.points || 10), 0);
      setTimeout(() => onComplete(totalPoints), 500);
    }
  }, [completedPhrases, phrases, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.orderingPractice')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {phrases.map((phrase: any, index: number) => (
            <div key={index}>
              <p className="font-medium mb-3">{phrase.situation || phrase.template}</p>
              <div className="space-y-2">
                <Button
                  variant={completedPhrases.has(phrase.situation) ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handlePhraseSelect(phrase.situation, true, phrase.points || 10)}
                  data-testid={`phrase-correct-${index}`}
                >
                  ✓ {phrase.correct || phrase.example}
                </Button>
                {phrase.wrong?.map((wrongPhrase: string, wIndex: number) => (
                  <Button
                    key={wIndex}
                    variant="outline"
                    className="w-full justify-start text-gray-500"
                    onClick={() => handlePhraseSelect(phrase.situation, false, 0)}
                  >
                    ✗ {wrongPhrase}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Symptom Description Step Component
function SymptomDescriptionStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const builder = step.sentenceBuilder || {};

  const handleSubmit = () => {
    const isValid = builder.correctCombinations?.some((combo: any) => 
      combo.symptom === selectedSymptom && combo.bodyPart === selectedBodyPart
    );
    onComplete(isValid ? 100 : 50);
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.symptomDescription')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-lg">{builder.template}</p>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Select symptom:</p>
            <div className="flex gap-2 flex-wrap">
              {builder.blanks?.[0]?.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={selectedSymptom === option ? "default" : "outline"}
                  onClick={() => setSelectedSymptom(option)}
                  data-testid={`symptom-${option}`}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Select body part:</p>
            <div className="flex gap-2 flex-wrap">
              {builder.blanks?.[1]?.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={selectedBodyPart === option ? "default" : "outline"}
                  onClick={() => setSelectedBodyPart(option)}
                  data-testid={`bodypart-${option}`}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          {selectedSymptom && selectedBodyPart && (
            <div className="mt-4">
              <p className="text-lg font-medium p-4 bg-blue-50 rounded">
                I have a {selectedSymptom} in my {selectedBodyPart}.
              </p>
              <Button 
                onClick={handleSubmit} 
                className="w-full mt-4"
                data-testid="submit-symptom"
              >
                Submit
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Prescription Reading Step Component
function PrescriptionReadingStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [matches, setMatches] = useState<Record<string, string>>({});
  const task = step.matchingTask || {};

  const handleMatch = (item: string, instruction: string) => {
    setMatches(prev => ({ ...prev, [item]: instruction }));
  };

  useEffect(() => {
    if (Object.keys(matches).length === task.items?.length && task.items?.length > 0) {
      const correct = task.items.filter((item: string, index: number) => 
        matches[item] === task.instructions[index]
      ).length;
      const score = (correct / task.items.length) * 100;
      setTimeout(() => onComplete(score), 500);
    }
  }, [matches, task, onComplete]);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.prescriptionReading')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="font-medium mb-3">Medicines:</p>
            {task.items?.map((item: string, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full"
                data-testid={`medicine-${item}`}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="font-medium mb-3">Instructions:</p>
            {task.instructions?.map((instruction: string, index: number) => (
              <Button
                key={index}
                variant={Object.values(matches).includes(instruction) ? "default" : "outline"}
                className="w-full text-left h-auto py-2"
                onClick={() => {
                  const medicine = task.items[index];
                  handleMatch(medicine, instruction);
                }}
                data-testid={`instruction-${index}`}
              >
                {instruction}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sentence Reordering Step Component
function SentenceReorderingStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<Array<{word: string, index: number}>>(
    [...(step.scrambledWords || step.words || [])]
      .map((word, index) => ({ word, index }))
      .sort(() => Math.random() - 0.5)
  );
  const correctSentence = step.correctOrder || step.sentence || '';
  const { generateWordAudio } = useTTS(step.language || 'en');
  const [sentenceAudio, setSentenceAudio] = useState<string | null>(step.audio || null);

  // Generate audio for correct sentence
  useEffect(() => {
    const loadAudio = async () => {
      if (!step.audio && correctSentence) {
        const audioUrl = await generateWordAudio(correctSentence);
        if (audioUrl) {
          setSentenceAudio(prev => prev === audioUrl ? prev : audioUrl); // Only update if URL changed
        }
      }
    };
    loadAudio();
  }, [step.audio, correctSentence, generateWordAudio]);

  const addWord = (wordObj: {word: string, index: number}) => {
    setOrderedWords(prev => [...prev, wordObj.word]);
    setAvailableWords(prev => prev.filter(w => w.index !== wordObj.index));
  };

  const removeWord = (word: string, orderedIndex: number) => {
    // Restore word to available pool with original index
    const removedWord = orderedWords[orderedIndex];
    setOrderedWords(prev => prev.filter((_, i) => i !== orderedIndex));
    setAvailableWords(prev => [...prev, { word: removedWord, index: Date.now() + orderedIndex }]);
  };

  const checkAnswer = () => {
    const userSentence = orderedWords.join(' ');
    const isCorrect = userSentence.toLowerCase() === correctSentence.toLowerCase();
    const score = isCorrect ? 100 : 0;
    setTimeout(() => onComplete(score), 500);
  };

  const playAudio = () => {
    if (sentenceAudio) {
      new Audio(sentenceAudio).play().catch(err => console.error('Audio playback error:', err));
    }
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.sentenceReordering')}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{step.instruction || t('gameSteps.reorderInstruction')}</p>
      </CardHeader>
      <CardContent>
        {sentenceAudio && (
          <Button variant="outline" size="sm" onClick={playAudio} className="mb-4" data-testid="play-sentence-audio">
            <Volume2 className="w-4 h-4 mr-2" />
            {t('gameSteps.listenToSentence')}
          </Button>
        )}
        
        {/* Ordered sentence area */}
        <div className="min-h-[80px] border-2 border-dashed border-emerald-300 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2">{t('gameSteps.yourSentence')}</p>
          <div className="flex flex-wrap gap-2">
            {orderedWords.map((word, index) => (
              <Badge 
                key={index} 
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1"
                onClick={() => removeWord(word, index)}
                data-testid={`ordered-word-${index}`}
              >
                {word}
              </Badge>
            ))}
          </div>
        </div>

        {/* Available words */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">{t('gameSteps.availableWords')}</p>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((wordObj) => (
              <Button
                key={wordObj.index}
                variant="outline"
                size="sm"
                onClick={() => addWord(wordObj)}
                data-testid={`available-word-${wordObj.word}-${wordObj.index}`}
              >
                {wordObj.word}
              </Button>
            ))}
          </div>
        </div>

        {orderedWords.length === (step.scrambledWords || step.words || []).length && availableWords.length === 0 && (
          <Button 
            onClick={checkAnswer} 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            data-testid="check-sentence"
          >
            {t('gameSteps.checkAnswer')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Image Selection Step Component
function ImageSelectionStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const images = step.images || step.options || [];
  const correctImage = step.correctImage || step.answer;
  const { generateWordAudio } = useTTS(step.language || 'en');
  const [promptAudio, setPromptAudio] = useState<string | null>(step.audio || null);

  // Generate audio for prompt
  useEffect(() => {
    const loadAudio = async () => {
      if (!step.audio && step.prompt) {
        const audioUrl = await generateWordAudio(step.prompt);
        if (audioUrl) {
          setPromptAudio(prev => prev === audioUrl ? prev : audioUrl); // Only update if URL changed
        }
      }
    };
    loadAudio();
  }, [step.audio, step.prompt, generateWordAudio]);

  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
    const isCorrect = imageId === correctImage;
    const score = isCorrect ? 100 : 0;
    setTimeout(() => onComplete(score), 800);
  };

  const playPrompt = () => {
    if (promptAudio) {
      new Audio(promptAudio).play().catch(err => console.error('Audio playback error:', err));
    }
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.imageSelection')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <p className="text-lg font-medium mb-3">{step.prompt || step.question}</p>
          {promptAudio && (
            <Button variant="outline" size="sm" onClick={playPrompt} data-testid="play-prompt-audio">
              <Volume2 className="w-4 h-4 mr-2" />
              {t('gameSteps.playPrompt')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image: any, index: number) => (
            <Card
              key={index}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg border-2",
                selectedImage === (image.id || image.url) && (
                  image.id === correctImage || image.url === correctImage
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                )
              )}
              onClick={() => handleImageSelect(image.id || image.url)}
              data-testid={`image-option-${index}`}
            >
              <CardContent className="p-3">
                <img 
                  src={image.url || image.image || image} 
                  alt={image.alt || `Option ${index + 1}`} 
                  className="w-full h-32 object-cover rounded mb-2" 
                />
                {image.label && <p className="text-sm text-center">{image.label}</p>}
                {selectedImage === (image.id || image.url) && (
                  <div className="mt-2 text-center">
                    {image.id === correctImage || image.url === correctImage ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// True/False Step Component
function TrueFalseStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);
  const questions = step.questions || (step.statement ? [{ statement: step.statement, answer: step.answer }] : []);
  const { generateWordAudio } = useTTS(step.language || 'en');
  const [questionAudio, setQuestionAudio] = useState<Record<number, string>>({});

  // Generate audio for all questions
  useEffect(() => {
    const loadAudio = async () => {
      const audioMap: Record<number, string> = {};
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.audio && q.statement) {
          const audioUrl = await generateWordAudio(q.statement);
          if (audioUrl) {
            audioMap[i] = audioUrl;
          }
        } else if (q.audio) {
          audioMap[i] = q.audio;
        }
      }
      setQuestionAudio(prevAudio => {
        // Only update if URLs actually changed
        const hasChanges = Object.keys(audioMap).some(key => 
          audioMap[parseInt(key)] && audioMap[parseInt(key)] !== prevAudio[parseInt(key)]
        );
        return hasChanges ? { ...prevAudio, ...audioMap } : prevAudio;
      });
    };
    loadAudio();
  }, [questions, generateWordAudio]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: boolean) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Calculate final score
        const correct = questions.filter((q: any, index: number) => 
          newAnswers[index] === q.answer
        ).length;
        const score = (correct / questions.length) * 100;
        onComplete(score);
      }
    }, 1500);
  };

  const playQuestionAudio = () => {
    const audioUrl = questionAudio[currentQuestionIndex];
    if (audioUrl) {
      new Audio(audioUrl).play().catch(err => console.error('Audio playback error:', err));
    }
  };

  if (!currentQuestion) return null;

  const isCorrect = showResult && answers[currentQuestionIndex] === currentQuestion.answer;
  const isWrong = showResult && answers[currentQuestionIndex] !== currentQuestion.answer;

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.trueFalse')}</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge>{t('gameSteps.question', { current: currentQuestionIndex + 1, total: questions.length })}</Badge>
          <Badge variant="outline">
            {t('gameSteps.correct', { count: Object.values(answers).filter((a, i) => a === questions[i]?.answer).length })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <p className="text-xl font-medium mb-4">{currentQuestion.statement}</p>
          {questionAudio[currentQuestionIndex] && (
            <Button variant="outline" size="sm" onClick={playQuestionAudio} data-testid="play-question-audio">
              <Volume2 className="w-4 h-4 mr-2" />
              {t('gameSteps.listenToQuestion')}
            </Button>
          )}
        </div>

        {!showResult && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAnswer(true)}
              className="h-20 text-lg bg-green-600 hover:bg-green-700"
              data-testid="answer-true"
            >
              <Check className="w-6 h-6 mr-2" />
              {t('gameSteps.true')}
            </Button>
            <Button
              onClick={() => handleAnswer(false)}
              className="h-20 text-lg bg-red-600 hover:bg-red-700"
              data-testid="answer-false"
            >
              <X className="w-6 h-6 mr-2" />
              {t('gameSteps.false')}
            </Button>
          </div>
        )}

        {showResult && (
          <div className={cn(
            "p-6 rounded-lg text-center",
            isCorrect ? "bg-green-50" : "bg-red-50"
          )}>
            <div className="flex items-center justify-center mb-2">
              {isCorrect ? (
                <Check className="w-8 h-8 text-green-600" />
              ) : (
                <X className="w-8 h-8 text-red-600" />
              )}
            </div>
            <p className={cn("text-lg font-medium", isCorrect ? "text-green-700" : "text-red-700")}>
              {isCorrect ? t('feedback.correct') : t('feedback.incorrect')}
            </p>
            {currentQuestion.explanation && (
              <p className="text-sm text-gray-600 mt-2">{currentQuestion.explanation}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Spelling Step Component
function SpellingStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [userSpelling, setUserSpelling] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>(
    [...(step.letters || step.word.split(''))].sort(() => Math.random() - 0.5)
  );
  const correctWord = step.word || step.answer || '';
  const { generateWordAudio } = useTTS(step.language || 'en');
  const [wordAudio, setWordAudio] = useState<string | null>(step.audio || null);

  // Generate audio for the word
  useEffect(() => {
    const loadAudio = async () => {
      if (!step.audio && correctWord) {
        const audioUrl = await generateWordAudio(correctWord);
        if (audioUrl) {
          setWordAudio(prev => prev === audioUrl ? prev : audioUrl); // Only update if URL changed
        }
      }
    };
    loadAudio();
  }, [step.audio, correctWord, generateWordAudio]);

  const addLetter = (letter: string, index: number) => {
    setUserSpelling(prev => [...prev, letter]);
    setAvailableLetters(prev => prev.filter((_, i) => i !== index));
  };

  const removeLetter = (index: number) => {
    const letter = userSpelling[index];
    setUserSpelling(prev => prev.filter((_, i) => i !== index));
    setAvailableLetters(prev => [...prev, letter]);
  };

  const checkSpelling = () => {
    const userWord = userSpelling.join('');
    const isCorrect = userWord.toLowerCase() === correctWord.toLowerCase();
    const score = isCorrect ? 100 : 0;
    setTimeout(() => onComplete(score), 500);
  };

  const resetSpelling = () => {
    setUserSpelling([]);
    setAvailableLetters([...(step.letters || step.word.split(''))].sort(() => Math.random() - 0.5));
  };

  const playWordAudio = () => {
    if (wordAudio) {
      new Audio(wordAudio).play().catch(err => console.error('Audio playback error:', err));
    }
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{t('gameSteps.spelling')}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{step.instruction || t('gameSteps.spellingInstruction')}</p>
      </CardHeader>
      <CardContent>
        {/* Word hint */}
        <div className="text-center mb-6">
          {step.hint && <p className="text-lg mb-3">{step.hint}</p>}
          {step.image && (
            <div className="w-40 h-40 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <img src={step.image} alt="Word hint" className="w-32 h-32 object-contain" />
            </div>
          )}
          {wordAudio && (
            <Button variant="outline" size="sm" onClick={playWordAudio} data-testid="play-word-audio">
              <Volume2 className="w-4 h-4 mr-2" />
              {t('gameSteps.listenToWord')}
            </Button>
          )}
        </div>

        {/* User's spelling */}
        <div className="min-h-[80px] border-2 border-dashed border-emerald-300 rounded-lg p-4 mb-4 bg-emerald-50">
          <div className="flex flex-wrap gap-2 justify-center">
            {userSpelling.map((letter, index) => (
              <div
                key={index}
                className="w-12 h-12 bg-white border-2 border-emerald-500 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer hover:bg-emerald-100"
                onClick={() => removeLetter(index)}
                data-testid={`spelling-letter-${index}`}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Available letters */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 text-center">{t('gameSteps.tapLetters')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {availableLetters.map((letter, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-12 h-12 text-xl font-bold"
                onClick={() => addLetter(letter, index)}
                data-testid={`available-letter-${letter}-${index}`}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={resetSpelling} 
            variant="outline" 
            className="flex-1"
            data-testid="reset-spelling"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('gameSteps.reset')}
          </Button>
          {userSpelling.length === correctWord.length && (
            <Button 
              onClick={checkSpelling} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              data-testid="check-spelling"
            >
              {t('gameSteps.checkAnswer')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Synonym/Antonym Step Component
// Data: { pairs: [{word, match, type: "synonym"|"antonym", translation}], mode: "mixed"|"synonym"|"antonym" }
function SynonymAntonymStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [score, setScore] = useState(0);
  
  const pairs = step.pairs || [];
  if (!pairs || !Array.isArray(pairs) || !pairs.length) return null;
  
  const handleWordClick = (word: string) => {
    const pairKey = `${word}`;
    if (matchedPairs.has(pairKey)) return;
    
    if (selectedWord === word) {
      setSelectedWord(null);
    } else {
      setSelectedWord(word);
      if (selectedMatch) {
        checkMatch(word, selectedMatch);
      }
    }
  };
  
  const handleMatchClick = (match: string) => {
    if (selectedMatch === match) {
      setSelectedMatch(null);
    } else {
      setSelectedMatch(match);
      if (selectedWord) {
        checkMatch(selectedWord, match);
      }
    }
  };
  
  const checkMatch = (word: string, match: string) => {
    const pair = pairs.find((p: any) => p.word === word && p.match === match);
    const pairKey = `${word}-${match}`;
    
    if (pair) {
      setMatchedPairs(prev => new Set([...prev, pairKey]));
      setScore(prev => prev + 10);
      setSelectedWord(null);
      setSelectedMatch(null);
      
      if (matchedPairs.size + 1 >= pairs.length) {
        setTimeout(() => {
          const finalScore = Math.round((score + 10) / pairs.length * 100);
          onComplete(finalScore);
        }, 500);
      }
    } else {
      setIncorrectAttempts(prev => prev + 1);
      setSelectedWord(null);
      setSelectedMatch(null);
    }
  };
  
  const uniqueWords = Array.from(new Set(pairs.map((p: any) => p.word)));
  const matches = [...pairs.map((p: any) => p.match)].sort(() => Math.random() - 0.5);
  
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{step.title || t('gameSteps.synonymAntonym')}</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline">{t('gameSteps.matched', { count: matchedPairs.size, total: pairs.length })}</Badge>
          <Badge>{t('gameSteps.score', { score })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{step.instructions}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 mb-2">{t('gameSteps.words')}</p>
            {uniqueWords.map((word: string, index: number) => {
              const isMatched = Array.from(matchedPairs).some(key => key.startsWith(`${word}-`));
              return (
                <Button
                  key={index}
                  variant={isMatched ? "default" : selectedWord === word ? "secondary" : "outline"}
                  className={cn(
                    "w-full justify-start",
                    isMatched && "bg-emerald-600 text-white",
                    selectedWord === word && "ring-2 ring-emerald-500"
                  )}
                  onClick={() => handleWordClick(word)}
                  disabled={isMatched}
                  data-testid={`word-${index}`}
                >
                  {word}
                </Button>
              );
            })}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 mb-2">{t('gameSteps.matches')}</p>
            {matches.map((match: string, index: number) => {
              const isMatched = Array.from(matchedPairs).some(key => key.endsWith(`-${match}`));
              return (
                <Button
                  key={index}
                  variant={isMatched ? "default" : selectedMatch === match ? "secondary" : "outline"}
                  className={cn(
                    "w-full justify-start",
                    isMatched && "bg-emerald-600 text-white",
                    selectedMatch === match && "ring-2 ring-emerald-500"
                  )}
                  onClick={() => handleMatchClick(match)}
                  disabled={isMatched}
                  data-testid={`match-${index}`}
                >
                  {match}
                </Button>
              );
            })}
          </div>
        </div>
        {incorrectAttempts > 0 && (
          <p className="text-sm text-orange-600 mt-3">
            {t('gameSteps.incorrectAttempts', { count: incorrectAttempts })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Word Formation Step Component
// Data: { words: [{target, tiles[], translation, audioUrl?}] }
function WordFormationStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const words = step.words || [];
  if (!words || !Array.isArray(words) || !words.length) return null;
  
  const currentWord = words[currentWordIndex];
  if (!currentWord) return null;
  
  const shuffledTiles = [...(currentWord.tiles || [])].sort(() => Math.random() - 0.5);
  const availableTiles = shuffledTiles.filter(tile => !selectedTiles.includes(tile));
  
  const handleTileClick = (tile: string) => {
    setSelectedTiles(prev => [...prev, tile]);
  };
  
  const handleRemoveTile = (index: number) => {
    setSelectedTiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleCheck = () => {
    const formedPhrase = selectedTiles.join(' ');
    const correct = formedPhrase === currentWord.target;
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 15);
    }
    
    setTimeout(() => {
      setShowFeedback(false);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setSelectedTiles([]);
      } else {
        const finalScore = Math.round((score + (correct ? 15 : 0)) / words.length * 100);
        onComplete(finalScore);
      }
    }, 1500);
  };
  
  const handleReset = () => {
    setSelectedTiles([]);
  };
  
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{step.title || t('gameSteps.wordFormation')}</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge>{t('gameSteps.word', { current: currentWordIndex + 1, total: words.length })}</Badge>
          <Badge variant="outline">{t('gameSteps.score', { score })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{step.instructions}</p>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-lg font-medium">{currentWord.translation}</p>
          {currentWord.audioUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => new Audio(currentWord.audioUrl).play()}
              className="mt-2"
              data-testid="play-audio"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {t('gameSteps.listen')}
            </Button>
          )}
        </div>
        
        <div className="mb-4 min-h-[60px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex flex-wrap gap-2">
            {selectedTiles.length === 0 && (
              <p className="text-gray-400 text-sm">{t('gameSteps.selectTiles')}</p>
            )}
            {selectedTiles.map((tile, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => handleRemoveTile(index)}
                data-testid={`selected-tile-${index}`}
              >
                {tile}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {availableTiles.map((tile: string, index: number) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleTileClick(tile)}
              data-testid={`tile-${index}`}
            >
              {tile}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={selectedTiles.length === 0}
            data-testid="reset-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('gameSteps.reset')}
          </Button>
          <Button
            variant="default"
            onClick={handleCheck}
            disabled={selectedTiles.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            data-testid="check-button"
          >
            {t('gameSteps.check')}
          </Button>
        </div>
        
        {showFeedback && (
          <div className={cn(
            "mt-4 p-3 rounded-lg text-center",
            isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
          )}>
            {isCorrect ? (
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" />
                {t('feedback.correct')}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <X className="w-5 h-5 mr-2" />
                {t('feedback.tryAgain')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grammar Battles Step Component (Multi-rule quiz with questions)
function GrammarBattlesStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const rules = step.rules || [];
  const currentRule = rules[currentRuleIndex];
  const questions = currentRule?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    
    if (correct) {
      setScore(prev => prev + 10);
    }
    
    setShowExplanation(true);
    
    setTimeout(() => {
      setShowExplanation(false);
      setSelectedAnswer(null);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (currentRuleIndex < rules.length - 1) {
        setCurrentRuleIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
      } else {
        onComplete(score + (correct ? 10 : 0));
      }
    }, 2000);
  };
  
  if (!currentRule || !currentQuestion) return null;
  
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{step.title || t('gameSteps.grammarBattles')}</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge>{t('gameSteps.rule', { current: currentRuleIndex + 1, total: rules.length })}</Badge>
          <Badge variant="outline">{t('gameSteps.score', { score })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <p className="text-sm font-semibold text-purple-900 mb-2">{t('gameSteps.grammarRule')}</p>
          <p className="text-sm text-purple-800 mb-3">{currentRule.ruleText}</p>
          {currentRule.example && (
            <div className="p-2 bg-white rounded border border-purple-200">
              <p className="text-xs text-gray-500 mb-1">{t('gameSteps.example')}</p>
              <p className="text-sm italic">{currentRule.example}</p>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            {t('gameSteps.question')} {currentQuestionIndex + 1}/{questions.length}
          </p>
          <p className="text-lg font-medium mb-4">{currentQuestion.sentence}</p>
        </div>
        
        <div className="space-y-2">
          {currentQuestion.options?.map((option: string, index: number) => (
            <Button
              key={index}
              variant={
                selectedAnswer === option
                  ? option === currentQuestion.correctAnswer
                    ? "default"
                    : "destructive"
                  : "outline"
              }
              className={cn(
                "w-full justify-start text-left h-auto py-3",
                selectedAnswer === option && option === currentQuestion.correctAnswer && "bg-emerald-600"
              )}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              data-testid={`option-${index}`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option}</span>
                {selectedAnswer === option && (
                  option === currentQuestion.correctAnswer ? 
                    <Check className="w-5 h-5" /> : 
                    <X className="w-5 h-5" />
                )}
              </div>
            </Button>
          ))}
        </div>
        
        {showExplanation && currentQuestion.explanation && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">{currentQuestion.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Timed Vocabulary Blitz Step Component
// Data: { pairs: [{word, translation}], timeLimit }
function TimedVocabularyBlitzStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  const [timeLeft, setTimeLeft] = useState(step.timeLimit || 60);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  const pairs = step.pairs || [];
  if (!pairs || !Array.isArray(pairs) || !pairs.length) return null;
  
  // Timer countdown
  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft <= 0 && isActive) {
        setIsActive(false);
        const finalScore = Math.round((score / pairs.length) * 100);
        onComplete(finalScore);
      }
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft, score, pairs.length, onComplete]);
  
  const handleWordClick = (word: string) => {
    const pairKey = pairs.findIndex((p: any) => p.word === word).toString();
    if (matchedPairs.has(pairKey) || !isActive) return;
    
    if (selectedWord === word) {
      setSelectedWord(null);
    } else {
      setSelectedWord(word);
      if (selectedTranslation) {
        checkMatch(word, selectedTranslation);
      }
    }
  };
  
  const handleTranslationClick = (translation: string) => {
    if (!isActive) return;
    
    if (selectedTranslation === translation) {
      setSelectedTranslation(null);
    } else {
      setSelectedTranslation(translation);
      if (selectedWord) {
        checkMatch(selectedWord, translation);
      }
    }
  };
  
  const checkMatch = (word: string, translation: string) => {
    const pairIndex = pairs.findIndex((p: any) => p.word === word && p.translation === translation);
    
    if (pairIndex !== -1) {
      setMatchedPairs(prev => new Set([...prev, pairIndex.toString()]));
      setScore(prev => prev + 1);
      setSelectedWord(null);
      setSelectedTranslation(null);
      
      if (matchedPairs.size + 1 >= pairs.length) {
        setIsActive(false);
        setTimeout(() => {
          const finalScore = Math.round(((score + 1) / pairs.length) * 100);
          onComplete(finalScore);
        }, 300);
      }
    } else {
      setSelectedWord(null);
      setSelectedTranslation(null);
    }
  };
  
  const words = pairs.map((p: any) => p.word);
  const translations = [...pairs.map((p: any) => p.translation)].sort(() => Math.random() - 0.5);
  
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">{step.title || t('gameSteps.vocabularyBlitz')}</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge variant={timeLeft <= 10 ? "destructive" : "default"}>
            {t('gameSteps.timeLeft', { time: timeLeft })}
          </Badge>
          <Badge variant="outline">{t('gameSteps.matched', { count: matchedPairs.size, total: pairs.length })}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{step.instructions}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 mb-2">English</p>
            {words.map((word: string, index: number) => {
              const pairIndex = pairs.findIndex((p: any) => p.word === word);
              const isMatched = matchedPairs.has(pairIndex.toString());
              return (
                <Button
                  key={index}
                  variant={isMatched ? "default" : selectedWord === word ? "secondary" : "outline"}
                  className={cn(
                    "w-full justify-start",
                    isMatched && "bg-emerald-600 text-white",
                    selectedWord === word && "ring-2 ring-emerald-500"
                  )}
                  onClick={() => handleWordClick(word)}
                  disabled={isMatched || !isActive}
                  data-testid={`blitz-word-${index}`}
                >
                  {word}
                </Button>
              );
            })}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 mb-2">فارسی</p>
            {translations.map((translation: string, index: number) => {
              const pairIndex = pairs.findIndex((p: any) => p.translation === translation);
              const isMatched = matchedPairs.has(pairIndex.toString());
              return (
                <Button
                  key={index}
                  variant={isMatched ? "default" : selectedTranslation === translation ? "secondary" : "outline"}
                  className={cn(
                    "w-full justify-start",
                    isMatched && "bg-emerald-600 text-white",
                    selectedTranslation === translation && "ring-2 ring-emerald-500"
                  )}
                  onClick={() => handleTranslationClick(translation)}
                  disabled={isMatched || !isActive}
                  data-testid={`blitz-translation-${index}`}
                >
                  {translation}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Default Step Component (fallback)
function DefaultStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const { t } = useTranslation('linguaquest');
  return (
    <Card className="border-emerald-200">
      <CardContent className="pt-6 text-center">
        <p className="mb-4">{step.instruction || 'Complete this step to continue'}</p>
        <Button onClick={() => onComplete(100)} data-testid="default-continue">
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
