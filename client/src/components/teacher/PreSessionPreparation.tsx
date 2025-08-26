// Pre-Session Preparation View for Teachers
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  User, 
  BookOpen, 
  Target,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Video,
  FileText,
  Brain,
  ListChecks,
  Timer,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { format, differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';

interface SessionDetails {
  id: number;
  studentName: string;
  studentLevel: string;
  topic: string;
  duration: number;
  scheduledTime: Date;
  lessonKit?: any;
  previousSessions?: any[];
  studentProfile?: {
    weakAreas: string[];
    strengths: string[];
    preferences: string[];
    totalSessions: number;
    averageScore: number;
  };
}

interface PreSessionProps {
  sessionId: number;
  onStartSession?: () => void;
}

export function PreSessionPreparation({ sessionId, onStartSession }: PreSessionProps) {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState({
    lessonPlan: false,
    materials: false,
    techCheck: false,
    warmup: false,
    objectives: false
  });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isReady, setIsReady] = useState(false);

  // Fetch session details
  const { data: sessionDetails, isLoading } = useQuery({
    queryKey: [`/api/teacher/session/${sessionId}/details`],
    queryFn: () => apiRequest(`/api/teacher/session/${sessionId}/details`, 'GET'),
    enabled: !!sessionId
  });

  // Calculate readiness
  useEffect(() => {
    const checklistComplete = Object.values(checklist).every(v => v);
    setIsReady(checklistComplete);
  }, [checklist]);

  // Calculate time until session
  const getTimeUntilSession = () => {
    if (!sessionDetails?.scheduledTime) return null;
    const minutes = differenceInMinutes(new Date(sessionDetails.scheduledTime), new Date());
    
    if (minutes < 0) return 'Session started';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minutes`;
  };

  const handleChecklistChange = (item: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const startSession = () => {
    if (!isReady) {
      toast({
        title: "Not Ready",
        description: "Please complete all preparation steps before starting the session",
        variant: "destructive"
      });
      return;
    }
    
    if (onStartSession) {
      onStartSession();
    } else {
      // Navigate to video session
      window.location.href = `/teacher/callern/${sessionId}`;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading session details...</p>
      </div>
    );
  }

  if (!sessionDetails) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Session details not found</AlertDescription>
      </Alert>
    );
  }

  const completionPercentage = (Object.values(checklist).filter(v => v).length / Object.keys(checklist).length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Pre-Session Preparation</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Get ready for your upcoming session
        </p>
      </div>

      {/* Time Alert */}
      <Alert className={getTimeUntilSession()?.includes('minutes') ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}>
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Session starts in: <strong>{getTimeUntilSession()}</strong>
          </span>
          <span className="text-sm">
            {format(new Date(sessionDetails.scheduledTime), 'MMM dd, yyyy at h:mm a')}
          </span>
        </AlertDescription>
      </Alert>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Preparation Progress</CardTitle>
          <CardDescription>Complete all steps to ensure a successful session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Readiness</span>
              <span className="font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {isReady && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 dark:text-green-400 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">You're ready to start the session!</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info & Checklist */}
        <div className="space-y-6">
          {/* Student Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{sessionDetails.studentName}</p>
                <Badge variant="outline" className="mt-1">{sessionDetails.studentLevel}</Badge>
              </div>
              
              {sessionDetails.studentProfile && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {sessionDetails.studentProfile.weakAreas.map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Sessions</p>
                      <p className="font-semibold">{sessionDetails.studentProfile.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Avg Score</p>
                      <p className="font-semibold">{sessionDetails.studentProfile.averageScore}%</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preparation Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Preparation Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={checklist.lessonPlan}
                  onCheckedChange={() => handleChecklistChange('lessonPlan')}
                />
                <label className="text-sm font-medium cursor-pointer flex-1">
                  Review lesson plan & objectives
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={checklist.materials}
                  onCheckedChange={() => handleChecklistChange('materials')}
                />
                <label className="text-sm font-medium cursor-pointer flex-1">
                  Prepare teaching materials
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={checklist.techCheck}
                  onCheckedChange={() => handleChecklistChange('techCheck')}
                />
                <label className="text-sm font-medium cursor-pointer flex-1">
                  Test camera & microphone
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={checklist.warmup}
                  onCheckedChange={() => handleChecklistChange('warmup')}
                />
                <label className="text-sm font-medium cursor-pointer flex-1">
                  Prepare warm-up activities
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={checklist.objectives}
                  onCheckedChange={() => handleChecklistChange('objectives')}
                />
                <label className="text-sm font-medium cursor-pointer flex-1">
                  Set clear session goals
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full" 
                onClick={startSession}
                disabled={!isReady}
              >
                <Video className="w-4 h-4 mr-2" />
                Start Session
                {isReady && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => window.open(`/teacher/lesson-kit/${sessionDetails.lessonKit?.id}`, '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Full Lesson Kit
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Lesson Content */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Session Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge>{sessionDetails.topic}</Badge>
                  <Badge variant="outline">
                    <Timer className="w-3 h-3 mr-1" />
                    {sessionDetails.duration} min
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="objectives">Objectives</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                  <TabsTrigger value="homework">Homework</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px] mt-4">
                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Session Summary</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This session focuses on {sessionDetails.topic} for a {sessionDetails.studentLevel} level student.
                        The session will include vocabulary practice, speaking exercises, and assessment activities.
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Key Vocabulary</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {sessionDetails.lessonKit?.vocabulary?.slice(0, 6).map((item: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                            <strong>{item.word}</strong>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{item.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Session Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Warm-up & Introduction</span>
                          <span className="text-gray-600 dark:text-gray-400">5 min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vocabulary Review</span>
                          <span className="text-gray-600 dark:text-gray-400">10 min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Main Activity</span>
                          <span className="text-gray-600 dark:text-gray-400">25 min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speaking Practice</span>
                          <span className="text-gray-600 dark:text-gray-400">15 min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wrap-up & Homework</span>
                          <span className="text-gray-600 dark:text-gray-400">5 min</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="objectives" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Learning Objectives</h4>
                      <div className="space-y-2">
                        {sessionDetails.lessonKit?.objectives?.map((obj: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{obj}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Success Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span>Student can use 80% of target vocabulary correctly</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span>Complete at least 3 speaking prompts fluently</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span>Score 70% or higher on assessment questions</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activities" className="space-y-4">
                    {sessionDetails.lessonKit?.exercises?.map((exercise: any, idx: number) => (
                      <Card key={idx}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md">{exercise.title}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{exercise.type}</Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {exercise.duration} min
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-2">{exercise.instructions}</p>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                            <pre className="whitespace-pre-wrap">{exercise.content}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="mt-4">
                      <h4 className="font-semibold mb-3">Speaking Discussion Prompts</h4>
                      <div className="space-y-2">
                        {sessionDetails.lessonKit?.speakingPrompts?.map((prompt: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="homework" className="space-y-4">
                    {sessionDetails.lessonKit?.homework?.map((hw: any, idx: number) => (
                      <Card key={idx}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md">{hw.title}</CardTitle>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {hw.estimatedTime} min
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-3">{hw.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {hw.resources.map((resource: string, resIdx: number) => (
                              <Badge key={resIdx} variant="outline">
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        Remember to assign homework at the end of the session and set clear expectations for completion.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}