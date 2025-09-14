import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Trophy, 
  Target, 
  Clock, 
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Users,
  Globe,
  GraduationCap,
  Calendar,
  AlertTriangle,
  PlayCircle,
  FileText,
  PenTool,
  Mic,
  Headphones,
  Star,
  Check
} from 'lucide-react';

// Exam Types and Configurations
const ExamType = {
  IELTS_ACADEMIC: 'ielts_academic',
  IELTS_GENERAL: 'ielts_general', 
  TOEFL_IBT: 'toefl_ibt',
  PTE_ACADEMIC: 'pte_academic',
  PTE_CORE: 'pte_core'
} as const;

type ExamTypeValues = typeof ExamType[keyof typeof ExamType];

// Form validation schemas
const examConfigSchema = z.discriminatedUnion('exam', [
  z.object({
    exam: z.literal(ExamType.IELTS_ACADEMIC),
    targetScore: z.number().min(1).max(9, 'IELTS target score must be between 1 and 9'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(z.string()).default([]),
    preferredPace: z.enum(['slow', 'normal', 'fast']).default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.IELTS_GENERAL),
    targetScore: z.number().min(1).max(9, 'IELTS target score must be between 1 and 9'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(z.string()).default([]),
    preferredPace: z.enum(['slow', 'normal', 'fast']).default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.TOEFL_IBT),
    targetScore: z.number().min(0).max(120, 'TOEFL target score must be between 0 and 120'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(z.string()).default([]),
    preferredPace: z.enum(['slow', 'normal', 'fast']).default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.PTE_ACADEMIC),
    targetScore: z.number().min(10).max(90, 'PTE target score must be between 10 and 90'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(z.string()).default([]),
    preferredPace: z.enum(['slow', 'normal', 'fast']).default('normal')
  }),
  z.object({
    exam: z.literal(ExamType.PTE_CORE),
    targetScore: z.number().min(10).max(90, 'PTE target score must be between 10 and 90'),
    examDate: z.string().optional(),
    weeklyHours: z.number().min(1).max(40, 'Weekly hours must be between 1 and 40'),
    focusAreas: z.array(z.string()).default([]),
    preferredPace: z.enum(['slow', 'normal', 'fast']).default('normal')
  })
]);

type ExamConfigForm = z.infer<typeof examConfigSchema>;

// MST Results Interface
interface MSTResults {
  sessionId: string;
  overallLevel?: string;
  skills?: Array<{
    skill: string;
    band: string;
    score: number;
    confidence: number;
  }>;
  sessionType?: string;
}

// Study Plan Interfaces
interface StudyPlan {
  planId: number;
  exam: ExamTypeValues;
  targetScore: number;
  currentLevel: Record<string, string>;
  targetLevel: string;
  totalSessions: number;
  weeksToExam: number;
  sessionsPerWeek: number;
  totalHours: number;
  progressPercentage?: number;
  completedSessions?: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface RoadmapSession {
  id: number;
  planId: number;
  weekNumber: number;
  sessionNumber: number;
  title: string;
  description: string;
  primarySkill: string;
  objectives: string[];
  activities: string[];
  grammarFocus?: string;
  vocabularyTheme?: string;
  duration: number;
  sessionType: 'foundation' | 'skill_building' | 'exam_strategy' | 'mock_test';
  completed: boolean;
  score?: number;
  notes?: string;
  timeSpent?: number;
  createdAt: string;
}

// Exam Configuration Options
const EXAM_OPTIONS = [
  { 
    value: ExamType.IELTS_ACADEMIC, 
    label: 'IELTS Academic', 
    icon: GraduationCap,
    scoreRange: { min: 1, max: 9, step: 0.5 },
    description: 'For university admission and professional registration'
  },
  { 
    value: ExamType.IELTS_GENERAL, 
    label: 'IELTS General Training', 
    icon: Globe,
    scoreRange: { min: 1, max: 9, step: 0.5 },
    description: 'For migration and work purposes'
  },
  { 
    value: ExamType.TOEFL_IBT, 
    label: 'TOEFL iBT', 
    icon: BookOpen,
    scoreRange: { min: 0, max: 120, step: 1 },
    description: 'Internet-based test for North American universities'
  },
  { 
    value: ExamType.PTE_ACADEMIC, 
    label: 'PTE Academic', 
    icon: Target,
    scoreRange: { min: 10, max: 90, step: 1 },
    description: 'Computer-based test for academic purposes'
  },
  { 
    value: ExamType.PTE_CORE, 
    label: 'PTE Core', 
    icon: Award,
    scoreRange: { min: 10, max: 90, step: 1 },
    description: 'For Canadian immigration and professional licensing'
  }
];

const FOCUS_AREAS = [
  { value: 'reading', label: 'Reading Comprehension', icon: BookOpen },
  { value: 'writing', label: 'Academic Writing', icon: PenTool },
  { value: 'listening', label: 'Listening Skills', icon: Headphones },
  { value: 'speaking', label: 'Speaking Fluency', icon: Mic },
  { value: 'grammar', label: 'Grammar & Structure', icon: FileText },
  { value: 'vocabulary', label: 'Vocabulary Building', icon: Star },
  { value: 'pronunciation', label: 'Pronunciation', icon: PlayCircle },
  { value: 'exam_strategy', label: 'Exam Strategy', icon: Target }
];

const PACE_OPTIONS = [
  { value: 'slow', label: 'Relaxed', description: 'Steady progress with extra practice time', multiplier: 1.5 },
  { value: 'normal', label: 'Regular', description: 'Balanced approach with good pacing', multiplier: 1.0 },
  { value: 'fast', label: 'Intensive', description: 'Accelerated learning for quick results', multiplier: 0.75 }
];

export default function RoadmapPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [mstResults, setMstResults] = useState<MSTResults | null>(null);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'configure' | 'plan' | 'sessions'>('configure');
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);

  // Form setup
  const form = useForm<ExamConfigForm>({
    resolver: zodResolver(examConfigSchema),
    defaultValues: {
      exam: ExamType.IELTS_ACADEMIC,
      targetScore: 7.0,
      weeklyHours: 8,
      focusAreas: [],
      preferredPace: 'normal'
    }
  });

  const selectedExam = form.watch('exam');

  // Load MST results from localStorage on mount
  useEffect(() => {
    const storedResults = localStorage.getItem('placementResults');
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults);
        setMstResults(results);
      } catch (error) {
        console.error('Failed to parse MST results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assessment results. Please take the test again.',
          variant: 'destructive'
        });
        setLocation('/mst');
      }
    } else {
      toast({
        title: 'Take Assessment First',
        description: 'Complete your placement test to create your personalized roadmap.',
      });
      setLocation('/mst');
    }
  }, [toast, setLocation]);

  // Calculate study plan mutation
  const calculatePlanMutation = useMutation({
    mutationFn: async (data: ExamConfigForm) => {
      if (!mstResults?.sessionId) {
        throw new Error('No MST session found');
      }

      return apiRequest('/api/roadmap/calculate-plan', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          sessionId: mstResults.sessionId
        })
      });
    },
    onSuccess: (response) => {
      setStudyPlan(response.data);
      setCurrentStep('plan');
      toast({
        title: 'Study Plan Calculated!',
        description: 'Your personalized study plan is ready.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to calculate plan:', error);
      toast({
        title: 'Calculation Failed',
        description: 'Failed to calculate your study plan. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Generate sessions mutation
  const generateSessionsMutation = useMutation({
    mutationFn: async () => {
      if (!studyPlan || !mstResults?.sessionId) {
        throw new Error('Missing plan or session data');
      }

      return apiRequest('/api/roadmap/generate-sessions', {
        method: 'POST',
        body: JSON.stringify({
          planId: studyPlan.planId,
          sessionId: mstResults.sessionId,
          exam: studyPlan.exam,
          focusAreas: selectedFocusAreas,
          totalSessions: studyPlan.totalSessions
        })
      });
    },
    onSuccess: (response) => {
      setCurrentStep('sessions');
      queryClient.setQueryData(['roadmap-sessions', studyPlan?.planId], response.data);
      toast({
        title: 'Sessions Generated!',
        description: `Created ${response.data.totalSessions} personalized learning sessions.`,
      });
    },
    onError: (error: any) => {
      console.error('Failed to generate sessions:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate learning sessions. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Get roadmap sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['roadmap-sessions', studyPlan?.planId],
    queryFn: () => apiRequest(`/api/roadmap/${studyPlan?.planId}`).then(r => r.data),
    enabled: !!studyPlan?.planId && currentStep === 'sessions'
  });

  // Update session progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ sessionId, completed, score, notes }: {
      sessionId: number;
      completed: boolean;
      score?: number;
      notes?: string;
    }) => {
      if (!studyPlan?.planId) throw new Error('No plan ID');

      return apiRequest(`/api/roadmap/${studyPlan.planId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          sessionId,
          completed,
          score,
          notes
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap-sessions', studyPlan?.planId] });
      toast({
        title: 'Progress Updated',
        description: 'Your learning progress has been saved.',
      });
    }
  });

  const handleFocusAreaToggle = (area: string) => {
    setSelectedFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const onSubmitExamConfig = (data: ExamConfigForm) => {
    const updatedData = { ...data, focusAreas: selectedFocusAreas };
    calculatePlanMutation.mutate(updatedData);
  };

  const getSelectedExamOption = () => {
    return EXAM_OPTIONS.find(option => option.value === selectedExam);
  };

  const getScoreRange = () => {
    const option = getSelectedExamOption();
    return option ? option.scoreRange : { min: 1, max: 9, step: 0.5 };
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'speaking': return Mic;
      case 'listening': return Headphones;
      case 'reading': return BookOpen;
      case 'writing': return PenTool;
      default: return FileText;
    }
  };

  const getSkillColor = (level: string) => {
    switch (level) {
      case 'A1': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'A2': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'B1': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'B2': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'C1': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'C2': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'foundation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'skill_building': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'exam_strategy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'mock_test': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!mstResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading your assessment results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Exam-Focused Learning Roadmap
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Transform your MST results into a personalized exam preparation plan
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === 'configure' ? 'bg-blue-500 text-white' : 
              currentStep === 'plan' || currentStep === 'sessions' ? 'bg-green-500 text-white' : 
              'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              1
            </div>
            <span className={`font-medium ${
              currentStep === 'configure' ? 'text-blue-600 dark:text-blue-400' : 
              currentStep === 'plan' || currentStep === 'sessions' ? 'text-green-600 dark:text-green-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>Configure</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === 'plan' ? 'bg-blue-500 text-white' : 
              currentStep === 'sessions' ? 'bg-green-500 text-white' : 
              'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              2
            </div>
            <span className={`font-medium ${
              currentStep === 'plan' ? 'text-blue-600 dark:text-blue-400' : 
              currentStep === 'sessions' ? 'text-green-600 dark:text-green-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>Plan</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === 'sessions' ? 'bg-blue-500 text-white' : 
              'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              3
            </div>
            <span className={`font-medium ${
              currentStep === 'sessions' ? 'text-blue-600 dark:text-blue-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>Sessions</span>
          </div>
        </div>

        {/* MST Results Summary */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Your Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Level */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold mb-2">
                  {mstResults.overallLevel || 'B1'}
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Overall Level</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  MST Session: {mstResults.sessionId}
                </p>
              </div>

              {/* Individual Skills */}
              <div className="space-y-3">
                {mstResults.skills?.map((skill) => {
                  const IconComponent = getSkillIcon(skill.skill);
                  return (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{skill.skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSkillColor(skill.band)}>
                          {skill.band}
                        </Badge>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${skill.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Exam Configuration Form */}
        {currentStep === 'configure' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-green-500" />
                Configure Your Exam Preparation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitExamConfig)} className="space-y-6">
                  {/* Exam Type Selection */}
                  <FormField
                    control={form.control}
                    name="exam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Select Your Target Exam</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {EXAM_OPTIONS.map((option) => {
                            const IconComponent = option.icon;
                            return (
                              <div
                                key={option.value}
                                onClick={() => field.onChange(option.value)}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                                  field.value === option.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                }`}
                                data-testid={`exam-${option.value}`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <IconComponent className="h-6 w-6 text-blue-500" />
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Score */}
                  <FormField
                    control={form.control}
                    name="targetScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Target Score ({getScoreRange().min}-{getScoreRange().max})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={getScoreRange().min}
                            max={getScoreRange().max}
                            step={getScoreRange().step}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-target-score"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Exam Date */}
                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Exam Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={new Date().toISOString().split('T')[0]}
                            data-testid="input-exam-date"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Weekly Hours */}
                  <FormField
                    control={form.control}
                    name="weeklyHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Weekly Study Hours</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <SelectTrigger data-testid="select-weekly-hours">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3-4 hours/week (Light)</SelectItem>
                              <SelectItem value="6">5-7 hours/week (Regular)</SelectItem>
                              <SelectItem value="10">8-12 hours/week (Intensive)</SelectItem>
                              <SelectItem value="15">13-20 hours/week (Very Intensive)</SelectItem>
                              <SelectItem value="25">20+ hours/week (Full-time)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preferred Pace */}
                  <FormField
                    control={form.control}
                    name="preferredPace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Preferred Learning Pace</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {PACE_OPTIONS.map((option) => (
                            <div
                              key={option.value}
                              onClick={() => field.onChange(option.value)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                field.value === option.value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                              }`}
                              data-testid={`pace-${option.value}`}
                            >
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{option.label}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Focus Areas */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Focus Areas (Select areas you want to prioritize)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {FOCUS_AREAS.map((area) => {
                        const IconComponent = area.icon;
                        return (
                          <label
                            key={area.value}
                            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            data-testid={`focus-${area.value}`}
                          >
                            <Checkbox
                              checked={selectedFocusAreas.includes(area.value)}
                              onCheckedChange={() => handleFocusAreaToggle(area.value)}
                            />
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-gray-100">{area.label}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={calculatePlanMutation.isPending}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    data-testid="button-calculate-plan"
                  >
                    {calculatePlanMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Calculating Study Plan...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Calculate Study Plan
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Study Plan Summary */}
        {currentStep === 'plan' && studyPlan && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Your Personalized Study Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {studyPlan.weeksToExam}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Weeks</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {studyPlan.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {studyPlan.sessionsPerWeek}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sessions/Week</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {studyPlan.totalHours}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                </div>
              </div>

              {/* Level Progression */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Level Progression</h4>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current</div>
                    <div className="space-y-1">
                      {Object.entries(studyPlan.currentLevel).map(([skill, level]) => (
                        <Badge key={skill} className={getSkillColor(level)}>
                          {skill}: {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target</div>
                    <Badge className={getSkillColor(studyPlan.targetLevel)}>
                      {studyPlan.targetLevel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Validation Warnings */}
              {studyPlan.weeksToExam < 8 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your timeline is quite ambitious! Consider extending your study period for better results.
                  </AlertDescription>
                </Alert>
              )}

              {/* Generate Sessions Button */}
              <Button
                onClick={() => generateSessionsMutation.mutate()}
                disabled={generateSessionsMutation.isPending}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                data-testid="button-generate-sessions"
              >
                {generateSessionsMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating Learning Sessions...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Learning Sessions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generated Sessions Display */}
        {currentStep === 'sessions' && sessionsData && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-purple-500" />
                Your Learning Sessions
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Progress value={sessionsData.stats.progressPercentage} className="w-32" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {sessionsData.stats.progressPercentage}% Complete
                  </span>
                </div>
                <Badge variant="outline">
                  {sessionsData.stats.completedSessions}/{sessionsData.stats.totalSessions} Sessions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionsData.sessions?.map((session: RoadmapSession) => {
                  const IconComponent = getSkillIcon(session.primarySkill);
                  return (
                    <div 
                      key={session.id} 
                      className={`p-6 border rounded-lg transition-all ${
                        session.completed 
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                          : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-600'
                      }`}
                      data-testid={`session-${session.id}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            session.completed ? 'bg-green-500' : 'bg-blue-500'
                          } text-white font-bold`}>
                            {session.completed ? <Check className="h-5 w-5" /> : session.sessionNumber}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{session.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{session.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSessionTypeColor(session.sessionType)}>
                            {session.sessionType.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            <IconComponent className="h-3 w-3 mr-1" />
                            {session.primarySkill}
                          </Badge>
                          <Badge variant="outline">
                            Week {session.weekNumber}
                          </Badge>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Learning Objectives</h5>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {session.objectives.map((objective, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Target className="h-3 w-3 mt-1 flex-shrink-0" />
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Activities</h5>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {session.activities.map((activity, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <PlayCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Additional Details */}
                      {(session.grammarFocus || session.vocabularyTheme) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {session.grammarFocus && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <h6 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Grammar Focus</h6>
                              <p className="text-sm text-blue-600 dark:text-blue-400">{session.grammarFocus}</p>
                            </div>
                          )}
                          {session.vocabularyTheme && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                              <h6 className="font-medium text-purple-800 dark:text-purple-200 mb-1">Vocabulary Theme</h6>
                              <p className="text-sm text-purple-600 dark:text-purple-400">{session.vocabularyTheme}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Session Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {session.duration} minutes
                          {session.completed && session.score && (
                            <>
                              <span className="mx-2">•</span>
                              <Star className="h-4 w-4" />
                              Score: {session.score}%
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {session.primarySkill === 'speaking' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation('/callern')}
                              data-testid={`button-callern-${session.id}`}
                            >
                              <Mic className="h-4 w-4 mr-1" />
                              Practice with CallerN
                            </Button>
                          )}
                          <Button
                            variant={session.completed ? "secondary" : "default"}
                            size="sm"
                            onClick={() => updateProgressMutation.mutate({
                              sessionId: session.id,
                              completed: !session.completed
                            })}
                            data-testid={`button-complete-${session.id}`}
                          >
                            {session.completed ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Completed
                              </>
                            ) : (
                              'Mark Complete'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep('configure')}
                  className="flex-1"
                  data-testid="button-create-new-plan"
                >
                  Create New Plan
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  onClick={() => setLocation('/student/dashboard')}
                  data-testid="button-go-to-dashboard"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}