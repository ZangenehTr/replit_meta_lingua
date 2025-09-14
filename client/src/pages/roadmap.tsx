import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
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
  Globe
} from 'lucide-react';

interface PlacementResults {
  overallBand?: string;
  overallCEFRLevel?: string;
  scores?: {
    overall?: number;
    speaking?: number;
    listening?: number; 
    reading?: number;
    writing?: number;
  };
  levels?: {
    speaking?: string;
    listening?: string;
    reading?: string;
    writing?: string;
  };
  confidence?: {
    speaking?: number;
    listening?: number;
    reading?: number;
    writing?: number;
  };
  recommendations?: string[];
  sessionId?: number;
  // Support alternative structure from MST results
  speakingLevel?: string;
  listeningLevel?: string;
  readingLevel?: string;
  writingLevel?: string;
  speakingScore?: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
}

interface GeneratedRoadmap {
  id: number;
  title: string;
  description: string;
  estimatedWeeks: number;
  weeklyHours: number;
  milestones: Array<{
    id: number;
    title: string;
    description: string;
    weekNumber: number;
    primarySkill: string;
  }>;
  personalizedRecommendations: string[];
}

const LEARNING_GOALS = [
  { value: 'ielts', label: 'IELTS Academic', icon: '🎓' },
  { value: 'toefl', label: 'TOEFL iBT', icon: '🏛️' },
  { value: 'pte', label: 'PTE Academic', icon: '📚' },
  { value: 'conversation', label: 'General Conversation', icon: '💬' },
  { value: 'business', label: 'Business English', icon: '💼' },
  { value: 'academic', label: 'Academic Writing', icon: '✍️' }
];

const FOCUS_AREAS = [
  { value: 'speaking', label: 'Speaking Fluency', icon: '🗣️' },
  { value: 'listening', label: 'Listening Comprehension', icon: '👂' },
  { value: 'reading', label: 'Reading Skills', icon: '📖' },
  { value: 'writing', label: 'Writing Skills', icon: '✍️' },
  { value: 'grammar', label: 'Grammar & Structure', icon: '📝' },
  { value: 'vocabulary', label: 'Vocabulary Building', icon: '🔤' },
  { value: 'pronunciation', label: 'Pronunciation', icon: '🎯' },
  { value: 'confidence', label: 'Confidence Building', icon: '💪' }
];

export default function RoadmapPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [placementResults, setPlacementResults] = useState<PlacementResults | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [timeAvailability, setTimeAvailability] = useState<number>(5);
  const [preferredPace, setPreferredPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [showRoadmapGenerator, setShowRoadmapGenerator] = useState(false);

  // Load placement results from localStorage on mount
  useEffect(() => {
    const storedResults = localStorage.getItem('placementResults');
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults);
        setPlacementResults(results);
        setShowRoadmapGenerator(true);
      } catch (error) {
        console.error('Failed to parse placement results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load placement test results. Please take the test again.',
          variant: 'destructive'
        });
      }
    } else {
      // No placement results - redirect to placement test
      toast({
        title: 'Take Placement Test First',
        description: 'Complete your placement test to create your personalized roadmap.',
      });
      setLocation('/mst');
    }
  }, [toast, setLocation]);

  // Generate AI roadmap mutation
  const generateRoadmapMutation = useMutation({
    mutationFn: async (data: {
      learningGoals: string[];
      timeAvailability: number;
      preferredPace: 'slow' | 'normal' | 'fast';
      focusAreas?: string[];
    }) => {
      if (!placementResults?.sessionId) {
        throw new Error('No assessment session found');
      }

      // Check if this is MST session (from MST test) or placement test session
      const isMSTSession = placementResults.sessionType === 'mst' || 
                          (typeof placementResults.sessionId === 'string' && placementResults.sessionId.startsWith('mst_'));
      
      if (isMSTSession) {
        // Use MST-specific roadmap generation
        return apiRequest('/api/mst/generate-roadmap', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: placementResults.sessionId,
            learningGoals: data.learningGoals,
            timeAvailability: data.timeAvailability,
            preferredPace: data.preferredPace,
            focusAreas: data.focusAreas,
            placementResults
          })
        });
      } else {
        // Use original placement test roadmap generation
        return apiRequest(`/api/placement-test/sessions/${placementResults.sessionId}/generate-roadmap`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: (roadmapData) => {
      toast({
        title: 'Roadmap Generated!',
        description: 'Your personalized learning roadmap is ready.',
      });
      queryClient.setQueryData(['generated-roadmap'], roadmapData);
    },
    onError: (error: any) => {
      console.error('Failed to generate roadmap:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate your roadmap. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Get generated roadmap data
  const { data: generatedRoadmap } = useQuery<{ roadmap: GeneratedRoadmap }>({
    queryKey: ['generated-roadmap'],
    enabled: false // Only set via mutation success
  });

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleFocusAreaToggle = (area: string) => {
    setSelectedFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleGenerateRoadmap = () => {
    if (selectedGoals.length === 0) {
      toast({
        title: 'Select Learning Goals',
        description: 'Please select at least one learning goal.',
        variant: 'destructive'
      });
      return;
    }

    generateRoadmapMutation.mutate({
      learningGoals: selectedGoals,
      timeAvailability,
      preferredPace,
      focusAreas: selectedFocusAreas
    });
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'speaking': return '🗣️';
      case 'listening': return '👂';
      case 'reading': return '📖';
      case 'writing': return '✍️';
      default: return '📚';
    }
  };

  const getSkillColor = (level: string) => {
    switch (level) {
      case 'A1': return 'bg-red-100 text-red-800';
      case 'A2': return 'bg-orange-100 text-orange-800';
      case 'B1': return 'bg-yellow-100 text-yellow-800';
      case 'B2': return 'bg-blue-100 text-blue-800';
      case 'C1': return 'bg-purple-100 text-purple-800';
      case 'C2': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!placementResults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading your placement results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Your Personalized Learning Roadmap
          </h1>
          <p className="text-xl text-gray-600">
            Based on your placement test results, let's create your perfect learning journey
          </p>
        </div>

        {/* Placement Test Results Summary */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Your Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Band */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold mb-2">
                  {placementResults.overallBand || placementResults.overallCEFRLevel || 'B1'}
                </div>
                <p className="text-lg font-semibold">Overall Level</p>
                <p className="text-sm text-gray-600">
                  Score: {placementResults.scores?.overall || 75}/100
                </p>
              </div>

              {/* Individual Skills */}
              <div className="space-y-3">
                {['speaking', 'listening', 'reading', 'writing'].map((skill) => {
                  // Try different possible level sources
                  const level = placementResults.levels?.[skill as keyof typeof placementResults.levels] || 
                               placementResults[`${skill}Level` as keyof PlacementResults] || 'B1';
                  
                  // Try different possible confidence sources
                  const confidence = placementResults.confidence?.[skill as keyof typeof placementResults.confidence] || 0.7;
                  
                  return (
                    <div key={skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSkillIcon(skill)}</span>
                        <span className="capitalize font-medium">{skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSkillColor(level as string)}>
                          {level}
                        </Badge>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${(confidence as number) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            {placementResults.recommendations && placementResults.recommendations.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  AI Recommendations
                </h4>
                <ul className="space-y-1">
                  {placementResults.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roadmap Configuration */}
        {showRoadmapGenerator && !generatedRoadmap && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-green-500" />
                Customize Your Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Goals */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  What are your learning goals? (Select all that apply)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {LEARNING_GOALS.map((goal) => (
                    <div
                      key={goal.value}
                      onClick={() => handleGoalToggle(goal.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                        selectedGoals.includes(goal.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      data-testid={`goal-${goal.value}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <span className="font-medium">{goal.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Availability */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  How many hours per week can you study?
                </Label>
                <Select 
                  value={timeAvailability.toString()} 
                  onValueChange={(value) => setTimeAvailability(parseInt(value))}
                >
                  <SelectTrigger data-testid="select-time-availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2-3 hours/week (Casual)</SelectItem>
                    <SelectItem value="5">4-6 hours/week (Regular)</SelectItem>
                    <SelectItem value="10">8-12 hours/week (Intensive)</SelectItem>
                    <SelectItem value="20">15+ hours/week (Immersive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Learning Pace */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Preferred learning pace
                </Label>
                <Select 
                  value={preferredPace} 
                  onValueChange={(value: 'slow' | 'normal' | 'fast') => setPreferredPace(value)}
                >
                  <SelectTrigger data-testid="select-pace">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow & Steady (Extra practice)</SelectItem>
                    <SelectItem value="normal">Balanced (Recommended)</SelectItem>
                    <SelectItem value="fast">Fast Track (Challenge mode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Focus Areas */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Areas you want to focus on (Optional)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FOCUS_AREAS.map((area) => (
                    <label
                      key={area.value}
                      className="flex items-center space-x-3 cursor-pointer"
                      data-testid={`focus-${area.value}`}
                    >
                      <Checkbox
                        checked={selectedFocusAreas.includes(area.value)}
                        onCheckedChange={() => handleFocusAreaToggle(area.value)}
                      />
                      <div className="flex items-center gap-2">
                        <span>{area.icon}</span>
                        <span className="text-sm">{area.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateRoadmap}
                disabled={selectedGoals.length === 0 || generateRoadmapMutation.isPending}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                data-testid="button-generate-roadmap"
              >
                {generateRoadmapMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating Your Roadmap...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate AI-Powered Roadmap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated Roadmap Display */}
        {generatedRoadmap && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-purple-500" />
                {generatedRoadmap.roadmap.title}
              </CardTitle>
              <p className="text-gray-600">{generatedRoadmap.roadmap.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Roadmap Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {generatedRoadmap.roadmap.estimatedWeeks}
                  </div>
                  <div className="text-sm text-gray-600">Weeks</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {generatedRoadmap.roadmap.weeklyHours}
                  </div>
                  <div className="text-sm text-gray-600">Hours/Week</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {generatedRoadmap.roadmap.milestones.length}
                  </div>
                  <div className="text-sm text-gray-600">Milestones</div>
                </div>
              </div>

              {/* Milestones Preview */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Milestones
                </h4>
                <div className="space-y-3">
                  {generatedRoadmap.roadmap.milestones.slice(0, 4).map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{milestone.title}</h5>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">Week {milestone.weekNumber}</Badge>
                          <Badge variant="outline">
                            {getSkillIcon(milestone.primarySkill)} {milestone.primarySkill}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {generatedRoadmap.roadmap.milestones.length > 4 && (
                    <p className="text-center text-gray-500">
                      +{generatedRoadmap.roadmap.milestones.length - 4} more milestones...
                    </p>
                  )}
                </div>
              </div>

              {/* Personalized Recommendations */}
              {generatedRoadmap.roadmap.personalizedRecommendations?.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    AI Mentor Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {generatedRoadmap.roadmap.personalizedRecommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Start Journey Button */}
              <div className="flex gap-3">
                <Button 
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  onClick={() => setLocation('/student/dashboard')}
                  data-testid="button-start-journey"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Start Your Learning Journey
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-view-dashboard"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}