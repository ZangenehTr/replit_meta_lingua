import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Volume2, Check, X, Mic, Play, RotateCcw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameStepProps {
  step: any;
  onComplete: (score: number) => void;
  onProgress?: (progress: number) => void;
}

export function GameStepRenderer({ step, onComplete, onProgress }: GameStepProps) {
  const [stepProgress, setStepProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Route to appropriate step type renderer
  const renderStepContent = () => {
    switch (step.type) {
      case 'introduction':
      case 'scenario_intro':
      case 'scenario_introduction':
        return <IntroductionStep step={step} onComplete={handleStepComplete} />;
      
      case 'vocabulary_introduction':
      case 'vocabulary_flashcards':
      case 'vocabulary_gallery':
      case 'vocabulary_body_parts':
        return <VocabularyStep step={step} onComplete={handleStepComplete} />;
      
      case 'matching_game':
      case 'memory_game':
        return <MatchingGameStep step={step} onComplete={handleStepComplete} />;
      
      case 'conversation_practice':
      case 'dialogue_roleplay':
      case 'dialogue_doctor':
      case 'waiter_dialogue':
        return <ConversationStep step={step} onComplete={handleStepComplete} />;
      
      case 'pronunciation_challenge':
        return <PronunciationStep step={step} onComplete={handleStepComplete} />;
      
      case 'listening_comprehension':
      case 'listening_diagnosis':
        return <ListeningStep step={step} onComplete={handleStepComplete} />;
      
      case 'fill_in_blank':
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
            Step {step.stepId}
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
            Play Audio
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
              {step.interactionRequired || 'Continue'}
            </Button>
          )}
          {objectClicked && (
            <div className="flex items-center justify-center text-green-600">
              <Check className="w-6 h-6 mr-2" />
              <span>Great! Moving forward...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Vocabulary Step Component
function VocabularyStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
  const [listenedWords, setListenedWords] = useState<Set<string>>(new Set());
  const words = step.words || [];

  const handleWordClick = (word: string, audio?: string) => {
    if (audio) {
      new Audio(audio).play();
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
        <CardTitle className="text-emerald-700">Learn New Words</CardTitle>
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
            {listenedWords.size} / {words.length} words learned
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Matching Game Step Component
function MatchingGameStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
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
        <CardTitle className="text-emerald-700">Match the Items</CardTitle>
        <p className="text-sm text-gray-600 mt-1">Click a word, then click its matching picture</p>
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
              ✓ All matched! Scoring...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Conversation Step Component
function ConversationStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
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
        <CardTitle className="text-emerald-700">Conversation Practice</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Badge>Dialogue {currentDialogueIndex + 1} / {dialogue.length}</Badge>
          <Badge variant="outline">Score: {score}</Badge>
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
            <p className="text-sm text-gray-600 mb-3">Choose your response:</p>
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
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);

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

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-700">Pronunciation Challenge</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <p className="text-2xl font-bold mb-4">{step.targetSentence}</p>
          {step.referenceAudio && (
            <Button 
              variant="outline" 
              onClick={() => new Audio(step.referenceAudio).play()}
              className="mb-4"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Listen to Example
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
                Recording...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        )}

        {score !== null && (
          <div className="mt-6">
            <div className="text-4xl font-bold text-emerald-600 mb-2">{score}%</div>
            <p className={score >= 80 ? "text-green-600" : "text-yellow-600"}>
              {score >= 80 ? "Excellent pronunciation!" : "Good try! Practice more!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Listening Step Component
function ListeningStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
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
        <CardTitle className="text-emerald-700">Listening Comprehension</CardTitle>
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
        <CardTitle className="text-emerald-700">Fill in the Blanks</CardTitle>
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
        <CardTitle className="text-emerald-700">Drag & Drop Challenge</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="font-medium mb-3">Available Items:</p>
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
            <p className="font-medium mb-3">Drop Zone:</p>
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
        <CardTitle className="text-emerald-700">Quick Quiz</CardTitle>
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
        <CardTitle className="text-emerald-700">Explore the Menu</CardTitle>
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
        <CardTitle className="text-emerald-700">Practice Ordering Phrases</CardTitle>
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
        <CardTitle className="text-emerald-700">Describe Your Symptoms</CardTitle>
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
        <CardTitle className="text-emerald-700">Read the Prescription</CardTitle>
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

// Default Step Component (fallback)
function DefaultStep({ step, onComplete }: { step: any; onComplete: (score: number) => void }) {
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
