import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, Volume2, RotateCcw, Check, X, Sparkles } from "lucide-react";

interface LessonData {
  id: number;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  lessonType: 'vocabulary' | 'grammar' | 'conversation' | 'listening' | 'pronunciation';
  sceneType: string;
  vocabularyWords?: string[];
  grammarTopics?: string[];
  exampleSentences?: string[];
  estimatedDurationMinutes: number;
  xpReward: number;
}

interface InteractionPoint {
  id: string;
  position: { x: number; y: number }; // 2D position for grid layout
  word: string;
  translation: string;
  audioUrl?: string;
  isCompleted: boolean;
}

interface Three3DLessonProps {
  lesson: LessonData;
  onComplete: (timeSpent: number) => void;
  onProgress: (progress: number) => void;
  onInteraction: (pointId: string) => void;
  isMobile?: boolean;
}

/**
 * 2D Interactive Vocabulary Scene Component
 */
function VocabularyScene({ lesson, interactionPoints, onPointClick }: {
  lesson: LessonData;
  interactionPoints: InteractionPoint[];
  onPointClick: (pointId: string) => void;
}) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {/* Interactive vocabulary objects */}
      <div className="relative z-10 w-full h-full p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {interactionPoints.map((point, index) => (
            <VocabularyObject
              key={point.id}
              word={point.word}
              translation={point.translation}
              isCompleted={point.isCompleted}
              onClick={() => onPointClick(point.id)}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-30 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual vocabulary object in 2D space
 */
function VocabularyObject({ 
  word, 
  translation, 
  isCompleted, 
  onClick, 
  delay = 0 
}: {
  word: string;
  translation: string;
  isCompleted: boolean;
  onClick: () => void;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
        isCompleted 
          ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 shadow-green-200/50' 
          : hovered 
            ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 shadow-blue-200/50'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg'
      } ${
        !isCompleted ? 'animate-pulse' : ''
      } shadow-lg hover:shadow-xl`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`vocab-card-${word.toLowerCase()}`}
    >
      <CardContent className="p-4 text-center relative">
        {/* Completion indicator */}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        
        {/* Sparkle effect for interactive elements */}
        {!isCompleted && (
          <div className="absolute top-2 left-2">
            <Sparkles className={`w-4 h-4 ${hovered ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
          </div>
        )}
        
        {/* Word */}
        <h3 className={`text-lg font-bold mb-2 transition-colors ${
          isCompleted 
            ? 'text-green-800' 
            : hovered 
              ? 'text-blue-800'
              : 'text-gray-800'
        }`}>
          {word}
        </h3>
        
        {/* Translation */}
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {translation}
        </p>
        
        {/* Interactive hint */}
        <div className={`mt-2 text-xs transition-opacity ${
          hovered ? 'opacity-100' : 'opacity-50'
        }`}>
          {isCompleted ? '✅ Completed!' : '👆 Click to practice'}
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile optimization is now handled through responsive CSS classes

/**
 * Main 3D Lesson Component
 */
export function Three3DLesson({ 
  lesson, 
  onComplete, 
  onProgress, 
  onInteraction,
  isMobile = false 
}: Three3DLessonProps) {
  const [interactionPoints, setInteractionPoints] = useState<InteractionPoint[]>([]);
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [selectedPoint, setSelectedPoint] = useState<InteractionPoint | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // Initialize interaction points from lesson data
  useEffect(() => {
    if (lesson.vocabularyWords) {
      const points: InteractionPoint[] = lesson.vocabularyWords.map((word, index) => ({
        id: `vocab_${index}`,
        position: {
          x: index % 4, // Grid column (0-3)
          y: Math.floor(index / 4) // Grid row
        },
        word: word,
        translation: `Translation of ${word}`, // Would come from lesson data
        isCompleted: false
      }));
      setInteractionPoints(points);
    }
  }, [lesson]);

  // Handle point interaction
  const handlePointClick = useCallback((pointId: string) => {
    setInteractionPoints(prev => {
      const updated = prev.map(point => 
        point.id === pointId 
          ? { ...point, isCompleted: true }
          : point
      );

      // Calculate progress
      const completedCount = updated.filter(p => p.isCompleted).length;
      const newProgress = (completedCount / updated.length) * 100;
      setProgress(newProgress);
      onProgress(newProgress);

      // Check if lesson completed
      if (completedCount === updated.length) {
        const timeSpent = Math.floor((Date.now() - startTime) / 60000); // minutes
        setTimeout(() => onComplete(timeSpent), 500);
      }

      return updated;
    });

    // Find selected point for interaction panel
    const point = interactionPoints.find(p => p.id === pointId);
    if (point) {
      setSelectedPoint(point);
      onInteraction(pointId);
    }
  }, [interactionPoints, onComplete, onProgress, onInteraction, startTime]);

  // Voice interaction handler
  const handleVoiceInteraction = useCallback(() => {
    setIsVoiceMode(!isVoiceMode);
    // Voice recording logic would go here
  }, [isVoiceMode]);

  const resetLesson = useCallback(() => {
    setInteractionPoints(prev => prev.map(point => ({ ...point, isCompleted: false })));
    setProgress(0);
    setSelectedPoint(null);
    onProgress(0);
  }, [onProgress]);

  return (
    <div className="h-full w-full relative bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 2D Interactive Learning Area */}
      <div className="h-2/3 w-full overflow-auto">
        <VocabularyScene 
          lesson={lesson}
          interactionPoints={interactionPoints}
          onPointClick={handlePointClick}
        />
      </div>

      {/* Control Panel */}
      <div className="h-1/3 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress: {Math.round(progress)}%
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {lesson.xpReward} XP
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Interaction area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected word info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedPoint ? selectedPoint.word : "Click on objects to learn!"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPoint ? (
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-300">
                      Translation: {selectedPoint.translation}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleVoiceInteraction}
                        variant={isVoiceMode ? "destructive" : "default"}
                        data-testid="button-voice-practice"
                      >
                        <Mic className="w-4 h-4 mr-1" />
                        {isVoiceMode ? "Stop" : "Practice"}
                      </Button>
                      <Button size="sm" variant="outline" data-testid="button-play-audio">
                        <Volume2 className="w-4 h-4 mr-1" />
                        Listen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Tap or click on the vocabulary cards above to start learning!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Lesson controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={resetLesson}
                    data-testid="button-reset-lesson"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  
                  {progress === 100 && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onComplete(Math.floor((Date.now() - startTime) / 60000))}
                      data-testid="button-complete-lesson"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
                
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <p>🎯 Difficulty: <span className="capitalize">{lesson.difficulty}</span></p>
                  <p>⏱️ Est. Time: {lesson.estimatedDurationMinutes} minutes</p>
                  <p>🎮 Type: <span className="capitalize">{lesson.lessonType}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile help overlay */}
      {isMobile && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-lg text-xs">
          📱 Tap cards to practice • Scroll to see more
        </div>
      )}
    </div>
  );
}