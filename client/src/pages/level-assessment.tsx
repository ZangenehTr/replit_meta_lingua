import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  level: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: "Choose the correct sentence:",
    options: [
      "I am go to school.",
      "I goes to school.",
      "I go to school.",
      "I going to school."
    ],
    correctAnswer: 2,
    level: "A1"
  },
  {
    id: 2,
    text: "What is the past tense of 'eat'?",
    options: ["eated", "ate", "eaten", "eating"],
    correctAnswer: 1,
    level: "A1"
  },
  {
    id: 3,
    text: "Choose the correct form: 'She _____ been working here for five years.'",
    options: ["have", "has", "had", "having"],
    correctAnswer: 1,
    level: "A2"
  },
  {
    id: 4,
    text: "If I _____ rich, I would travel the world.",
    options: ["am", "was", "were", "be"],
    correctAnswer: 2,
    level: "B1"
  },
  {
    id: 5,
    text: "The book _____ by Shakespeare is still popular today.",
    options: ["writing", "written", "wrote", "writes"],
    correctAnswer: 1,
    level: "B2"
  },
  {
    id: 6,
    text: "Had I known about the traffic, I _____ earlier.",
    options: ["would left", "would have left", "will leave", "had left"],
    correctAnswer: 1,
    level: "C1"
  }
];

export default function LevelAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  React.useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      completeTest();
    }
  }, [timeLeft, isCompleted]);

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        completeTest(newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] ?? null);
    }
  };

  const completeTest = (finalAnswers = answers) => {
    let correctCount = 0;
    finalAnswers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });

    const percentage = (correctCount / questions.length) * 100;
    setScore(percentage);

    // Determine level based on score
    if (percentage >= 90) setLevel('C1');
    else if (percentage >= 75) setLevel('B2');
    else if (percentage >= 60) setLevel('B1');
    else if (percentage >= 45) setLevel('A2');
    else setLevel('A1');

    setIsCompleted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A1': return 'bg-red-100 text-red-800';
      case 'A2': return 'bg-orange-100 text-orange-800';
      case 'B1': return 'bg-yellow-100 text-yellow-800';
      case 'B2': return 'bg-blue-100 text-blue-800';
      case 'C1': return 'bg-green-100 text-green-800';
      case 'C2': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isCompleted) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
              <CardDescription>
                Here are your English proficiency results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-3xl font-bold text-blue-600">{Math.round(score)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">English Level</p>
                  <Badge className={getLevelColor(level)} variant="secondary">
                    {level}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Level Description</p>
                <div className="text-left space-y-2">
                  {level === 'A1' && (
                    <p className="text-sm">You can understand basic phrases and express simple needs. Great start!</p>
                  )}
                  {level === 'A2' && (
                    <p className="text-sm">You can communicate in simple tasks and describe familiar topics.</p>
                  )}
                  {level === 'B1' && (
                    <p className="text-sm">You can handle most situations and express opinions on familiar topics.</p>
                  )}
                  {level === 'B2' && (
                    <p className="text-sm">You can interact fluently and understand complex texts.</p>
                  )}
                  {level === 'C1' && (
                    <p className="text-sm">You can express yourself fluently and understand virtually everything.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button>View Recommended Courses</Button>
                <Button variant="outline">Retake Test</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  English Level Assessment
                </CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {questions.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={((currentQuestion) / questions.length) * 100} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {questions[currentQuestion].text}
              </h3>
              
              <RadioGroup value={selectedAnswer?.toString()} onValueChange={(value) => setSelectedAnswer(parseInt(value))}>
                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                onClick={handleNext}
                disabled={selectedAnswer === null}
              >
                {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}