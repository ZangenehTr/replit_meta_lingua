import { useState, useEffect, FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Mic, PenTool, Headphones, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLocation } from 'wouter';

interface PlacementTestSession {
  id: number;
  status: 'in_progress' | 'completed';
  currentSkill: 'speaking' | 'listening' | 'reading' | 'writing';
  startedAt: string;
  maxDurationMinutes: number;
}

interface PlacementTestQuestion {
  id: number;
  skill: string;
  cefrLevel: string;
  questionType: string;
  title: string;
  prompt: string;
  content: any;
  responseType: 'audio' | 'text' | 'multiple_choice';
  expectedDurationSeconds: number;
}

interface PlacementTestResults {
  overallLevel: string;
  skillLevels: {
    speaking: string;
    listening: string;
    reading: string;
    writing: string;
  };
  scores: {
    overall: number;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  strengths: string[];
  recommendations: string[];
  confidence: number;
}

const skillIcons = {
  speaking: Mic,
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool
};

export default function TakeTestPage() {
  const [currentSession, setCurrentSession] = useState<PlacementTestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PlacementTestQuestion | null>(null);
  const [userResponse, setUserResponse] = useState<any>('');
  const [testResults, setTestResults] = useState<PlacementTestResults | null>(null);
  const [testStep, setTestStep] = useState<'intro' | 'testing' | 'contact' | 'roadmap' | 'results'>('intro');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [personalizedRoadmap, setPersonalizedRoadmap] = useState<any | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('guest_placement_session_id');
    if (savedSessionId && testStep === 'intro') {
      const sessionId = parseInt(savedSessionId);
      // Hydrate session object
      setCurrentSession({
        id: sessionId,
        status: 'in_progress',
        currentSkill: 'speaking',
        startedAt: new Date().toISOString(),
        maxDurationMinutes: 10
      });
      
      // Resume session
      fetch(`/api/placement-test/guest/sessions/${savedSessionId}/next-question`)
        .then(res => res.json())
        .then(data => {
          if (data.success && !data.testCompleted) {
            setTestStep('testing');
            setCurrentQuestion(data.question);
          } else if (data.testCompleted) {
            setTestResults(data.results);
            setShowContactModal(true);
            setTestStep('contact');
            localStorage.removeItem('guest_placement_session_id');
          }
        })
        .catch(err => {
          console.error('Failed to resume session:', err);
          localStorage.removeItem('guest_placement_session_id');
        });
    }
  }, [testStep]);

  // Start placement test mutation
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/placement-test/guest/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: 'english',
          learningGoal: 'general'
        })
      });
      if (!response.ok) throw new Error('Failed to start test');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      localStorage.setItem('guest_placement_session_id', data.session.id.toString());
      setTestStep('testing');
      fetchNextQuestion(data.session.id);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start placement test. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const fetchNextQuestion = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/placement-test/guest/sessions/${sessionId}/next-question`);
      const data = await response.json();
      
      if (data.testCompleted) {
        setTestResults(data.results);
        setShowContactModal(true);
        setTestStep('contact');
      } else if (data.success && data.question) {
        setCurrentQuestion(data.question);
        setUserResponse('');
      }
    } catch (error) {
      console.error('Failed to fetch next question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load next question',
        variant: 'destructive'
      });
    }
  };

  const submitResponseMutation = useMutation({
    mutationFn: async ({ sessionId, questionId, response }: any) => {
      const res = await fetch(`/api/placement-test/guest/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, userResponse: response })
      });
      if (!res.ok) throw new Error('Failed to submit response');
      return res.json();
    },
    onSuccess: () => {
      if (currentSession) {
        fetchNextQuestion(currentSession.id);
      }
    }
  });

  const submitContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      // Use the secure guest placement submission endpoint
      const response = await fetch('/api/prospect-lifecycle/guest-placement-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          placementSessionId: currentSession?.id,
          testResults: testResults
        })
      });
      if (!response.ok) throw new Error('Failed to save contact');
      return response.json();
    },
    onSuccess: async (data, variables) => {
      localStorage.removeItem('guest_placement_session_id');
      setShowContactModal(false);
      
      // Generate AI-powered personalized roadmap
      setTestStep('roadmap');
      setIsGeneratingRoadmap(true);
      
      try {
        const roadmapResponse = await fetch('/api/roadmaps/generate-from-placement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testResults: testResults,
            contactInfo: variables
          })
        });
        
        if (roadmapResponse.ok) {
          const roadmapData = await roadmapResponse.json();
          
          // Validate roadmap has actual content
          if (roadmapData.success && roadmapData.roadmap && 
              roadmapData.roadmap.milestones && roadmapData.roadmap.milestones.length > 0) {
            setPersonalizedRoadmap(roadmapData.roadmap);
            toast({
              title: 'Roadmap Generated!',
              description: 'Your personalized learning path is ready based on your test results.'
            });
          } else {
            console.error('Roadmap data is invalid:', roadmapData);
            throw new Error('Invalid roadmap data');
          }
        } else {
          throw new Error('Failed to generate roadmap');
        }
      } catch (error) {
        console.error('Roadmap generation error:', error);
        toast({
          title: 'Note',
          description: 'Your results are ready. Personalized roadmap will be available soon.',
          variant: 'default'
        });
      } finally {
        setIsGeneratingRoadmap(false);
        setTestStep('results');
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save your contact information',
        variant: 'destructive'
      });
    }
  });

  const handleSubmitResponse = () => {
    if (!currentQuestion || !currentSession || !userResponse) return;

    submitResponseMutation.mutate({
      sessionId: currentSession.id,
      questionId: currentQuestion.id,
      response: userResponse
    });
  };

  const handleSubmitContact = (e: FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) {
      toast({
        title: 'Missing information',
        description: 'Please provide your name and email',
        variant: 'destructive'
      });
      return;
    }
    submitContactMutation.mutate(contactForm);
  };

  const handleSkipContact = () => {
    localStorage.removeItem('guest_placement_session_id');
    setShowContactModal(false);
    setTestStep('results');
  };

  // Intro Screen
  if (testStep === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl border-2">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Brain className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Free English Placement Test</CardTitle>
              <CardDescription className="text-lg">
                Discover your English proficiency level in just 10 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>What you'll get:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>CEFR level assessment (A1-C2)</li>
                    <li>Personalized curriculum recommendations</li>
                    <li>Detailed skill breakdown (Speaking, Listening, Reading, Writing)</li>
                    <li>No registration required to start!</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(skillIcons).map(([skill, Icon]) => (
                  <Card key={skill} className="text-center p-4">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium capitalize">{skill}</p>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated time: 10 minutes</span>
              </div>

              <Button 
                size="lg" 
                className="w-full"
                onClick={() => startTestMutation.mutate()}
                disabled={startTestMutation.isPending}
                data-testid="button-start-test"
              >
                {startTestMutation.isPending ? 'Starting...' : 'Start Free Test'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By starting this test, you agree to provide your contact information at the end to receive your results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Testing Screen
  if (testStep === 'testing' && currentQuestion) {
    const SkillIcon = skillIcons[currentQuestion.skill as keyof typeof skillIcons] || Brain;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkillIcon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl capitalize">{currentQuestion.skill}</CardTitle>
                    <CardDescription>CEFR Level: {currentQuestion.cefrLevel}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{currentQuestion.questionType}</Badge>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{currentQuestion.title}</CardTitle>
              <CardDescription className="whitespace-pre-wrap">{currentQuestion.prompt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.responseType === 'text' && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  rows={6}
                  data-testid="input-answer-text"
                />
              )}

              {currentQuestion.responseType === 'multiple_choice' && currentQuestion.content?.options && (
                <RadioGroup value={userResponse} onValueChange={setUserResponse}>
                  {currentQuestion.content.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.responseType === 'audio' && (
                <Alert>
                  <AlertDescription>
                    Audio recording is not available in the guest test. Please describe your answer in text instead.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                onClick={handleSubmitResponse}
                disabled={!userResponse || submitResponseMutation.isPending}
                data-testid="button-submit-answer"
              >
                {submitResponseMutation.isPending ? 'Submitting...' : 'Submit Answer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Contact Modal
  if (showContactModal && testResults) {
    return (
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Great job! You've completed the test</DialogTitle>
            <DialogDescription>
              Please provide your contact information to view your detailed results and receive personalized recommendations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitContact} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                data-testid="input-contact-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
                data-testid="input-contact-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                data-testid="input-contact-phone"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitContactMutation.isPending} data-testid="button-submit-contact">
                {submitContactMutation.isPending ? 'Saving...' : 'View Results'}
              </Button>
              <Button type="button" variant="outline" onClick={handleSkipContact} data-testid="button-skip-contact">
                Skip
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Roadmap Generation Loading Screen
  if (testStep === 'roadmap' && isGeneratingRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center p-8">
          <Brain className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
          <CardTitle className="text-2xl mb-2">Generating Your Personalized Roadmap</CardTitle>
          <CardDescription className="mb-6">
            Our AI is creating a customized learning path based on your test results...
          </CardDescription>
          <Progress value={66} className="w-full" />
        </Card>
      </div>
    );
  }

  // Results Screen
  if (testStep === 'results' && testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-3xl">Your English Level</CardTitle>
              <div className="text-5xl font-bold text-primary mt-4">{testResults.overallLevel}</div>
              <CardDescription className="text-lg mt-2">
                Overall Score: {testResults.scores.overall?.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(testResults.skillLevels).map(([skill, level]) => {
                  const Icon = skillIcons[skill as keyof typeof skillIcons];
                  const score = testResults.scores[skill as keyof typeof testResults.scores];
                  return (
                    <Card key={skill} className="text-center p-4">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium capitalize mb-1">{skill}</p>
                      <p className="text-2xl font-bold">{level}</p>
                      <p className="text-xs text-muted-foreground">{score?.toFixed(0)}%</p>
                    </Card>
                  );
                })}
              </div>

              {testResults.strengths && testResults.strengths.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Your Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {testResults.strengths.map((strength, i) => (
                      <li key={i} className="text-sm">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResults.recommendations && testResults.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {testResults.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-Generated Personalized Roadmap */}
          {personalizedRoadmap && personalizedRoadmap.milestones && (
            <Card className="shadow-xl border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Your Personalized Learning Roadmap</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {personalizedRoadmap.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit mt-2">
                  {personalizedRoadmap.estimatedWeeks} weeks • AI-Generated
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {personalizedRoadmap.milestones.map((milestone: any, index: number) => (
                  <Card key={milestone.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Badge className="mt-1">Week {(index * 3) + 1}-{(index + 1) * 3}</Badge>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {milestone.steps && milestone.steps.map((step: any) => (
                          <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{step.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {step.estimatedHours}h
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {step.resourceType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="pt-4 space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate('/curriculum')} data-testid="button-explore-courses">
              Explore Our Courses
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth?tab=register')} data-testid="button-register">
              Create Account to Start Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
