import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, RefreshCw, Trophy, Clock, Star, Target } from 'lucide-react';
import { Link } from 'wouter';

interface Game {
  id: number;
  title: string;
  description: string;
  gameType: string;
  ageGroup: string;
  difficultyLevel: string;
  skillFocus: string;
  estimatedDuration: number;
  xpReward: number;
  thumbnailUrl: string;
  totalLevels?: number;
}

interface GameSession {
  id: string;
  gameId: number;
  userId: number;
  currentLevel: number;
  score: number;
  startTime: string;
  endTime?: string;
  isCompleted: boolean;
  timeSpent: number;
  xpEarned: number;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
}

export default function GamePlayer() {
  const [, params] = useRoute('/game/:gameId');
  const gameId = params?.gameId ? parseInt(params.gameId) : null;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch game details
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ['/api/games', gameId],
    queryFn: async () => {
      const response = await apiRequest(`/api/games/${gameId}`);
      return response as Game;
    },
    enabled: !!gameId
  });

  // Fetch game questions from API
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/games', gameId, 'questions'],
    queryFn: async () => {
      const response = await apiRequest(`/api/games/${gameId}/questions`);
      return response as Question[];
    },
    enabled: !!gameId && !!gameSession
  });

  // Start game session
  const startGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await apiRequest(`/api/games/${gameId}/start`, {
        method: 'POST'
      });
      return response as GameSession;
    },
    onSuccess: (session) => {
      setGameSession(session);
      setIsPlaying(true);
      setTimeElapsed(0);
      toast({
        title: "Game Started!",
        description: "Good luck with your learning adventure!"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Complete game mutation
  const completeGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/games/${gameId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          level: 1,
          score: score,
          timeSpent: timeElapsed,
          xpEarned: score
        })
      });
      return response;
    },
    onSuccess: () => {
      setShowResults(true);
      setIsPlaying(false);
      toast({
        title: "Game Completed! 🎉",
        description: `You earned ${score} XP in ${Math.floor(timeElapsed / 60)} minutes!`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete game. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Submit answer (simplified for demo)
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number, answer: string }) => {
      // Simulate answer checking
      const question = questions.find(q => q.id === questionId);
      const isCorrect = question?.correctAnswer === answer;
      
      if (isCorrect) {
        setScore(prev => prev + (game?.xpReward || 10));
      }
      
      return { correct: isCorrect, explanation: question?.explanation };
    },
    onSuccess: (result) => {
      if (result.correct) {
        toast({
          title: "Correct! 🎉",
          description: `+${game?.xpReward || 10} XP`
        });
      } else {
        toast({
          title: "Try Again",
          description: result.explanation || "That's not quite right.",
          variant: "destructive"
        });
      }
    }
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !showResults) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, showResults]);

  const handleStartGame = () => {
    if (gameId) {
      startGameMutation.mutate(gameId);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!questions[currentQuestion]) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer
    }));

    submitAnswerMutation.mutate({
      questionId: questions[currentQuestion].id,
      answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeGameMutation.mutate();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
            <p className="text-gray-600 mb-4">The game you're looking for doesn't exist.</p>
            <Link href="/games">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const accuracy = questions.length > 0 ? Math.round((score / (questions.length * (game.xpReward || 10))) * 100) : 0;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Game Completed!</CardTitle>
            <CardDescription>Congratulations on finishing {game.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{score}</div>
                <div className="text-sm text-gray-600">XP Earned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{formatTime(timeElapsed)}</div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link href="/games" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Games
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.reload()} 
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/games">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img 
                src={game.thumbnailUrl || '/assets/games/default-game.png'} 
                alt={game.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                <p className="text-gray-600">{game.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{game.gameType}</Badge>
                <Badge variant="outline">{game.ageGroup}</Badge>
                <Badge className="bg-blue-100 text-blue-800">{game.difficultyLevel}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span>{game.estimatedDuration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>{game.xpReward} XP per correct answer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span>Skill Focus: {game.skillFocus}</span>
                </div>
              </div>

              <Button 
                onClick={handleStartGame}
                disabled={startGameMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                {startGameMutation.isPending ? 'Starting...' : 'Start Game'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{game.title}</h1>
            <Badge>{game.gameType}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {score} XP
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        {currentQ && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentQ.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {currentQ.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={userAnswers[currentQ.id] === option ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto p-4"
                      onClick={() => handleAnswerSelect(option)}
                      disabled={submitAnswerMutation.isPending}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {currentQ.type === 'true_false' && (
                <div className="flex gap-4">
                  <Button
                    variant={userAnswers[currentQ.id] === 'true' ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleAnswerSelect('true')}
                    disabled={submitAnswerMutation.isPending}
                  >
                    True
                  </Button>
                  <Button
                    variant={userAnswers[currentQ.id] === 'false' ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleAnswerSelect('false')}
                    disabled={submitAnswerMutation.isPending}
                  >
                    False
                  </Button>
                </div>
              )}

              {userAnswers[currentQ.id] && (
                <div className="flex justify-end">
                  <Button onClick={handleNextQuestion}>
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Game'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}