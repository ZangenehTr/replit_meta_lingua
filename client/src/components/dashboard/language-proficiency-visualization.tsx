import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  Headphones, 
  PenTool,
  ChevronRight,
  Award,
  Zap,
  Brain,
  Users
} from "lucide-react";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface SkillLevel {
  skill: string;
  current: number;
  target: number;
  improvement: number;
}

interface ProgressPath {
  id: string;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  nextMilestone: string;
  estimatedTime: string;
  recommended: boolean;
}

interface LearningInsight {
  type: 'strength' | 'weakness' | 'opportunity';
  title: string;
  description: string;
  action: string;
}

export function LanguageProficiencyVisualization() {
  const { t } = useTranslation(['student', 'common']);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Fetch proficiency data
  const { data: proficiencyData, isLoading } = useQuery({
    queryKey: ['/api/student/proficiency'],
    queryFn: async () => {
      // Simulated data for now
      return {
        overallLevel: 'B1',
        nextLevel: 'B2',
        progressToNext: 65,
        skills: [
          { skill: 'Speaking', current: 70, target: 85, improvement: 15 },
          { skill: 'Listening', current: 75, target: 85, improvement: 12 },
          { skill: 'Reading', current: 80, target: 90, improvement: 8 },
          { skill: 'Writing', current: 65, target: 80, improvement: 18 },
          { skill: 'Grammar', current: 72, target: 85, improvement: 10 },
          { skill: 'Vocabulary', current: 68, target: 85, improvement: 20 }
        ],
        progressHistory: [
          { date: '2024-01', overall: 58 },
          { date: '2024-02', overall: 62 },
          { date: '2024-03', overall: 65 },
          { date: '2024-04', overall: 68 },
          { date: '2024-05', overall: 71 },
          { date: '2024-06', overall: 73 }
        ],
        recommendedPaths: [
          {
            id: '1',
            title: 'Business Communication Mastery',
            description: 'Focus on professional vocabulary and formal writing',
            currentStep: 3,
            totalSteps: 8,
            nextMilestone: 'Email Writing Workshop',
            estimatedTime: '2 weeks',
            recommended: true
          },
          {
            id: '2',
            title: 'Conversational Fluency',
            description: 'Improve speaking confidence through daily practice',
            currentStep: 5,
            totalSteps: 10,
            nextMilestone: 'Advanced Idioms',
            estimatedTime: '3 weeks',
            recommended: false
          }
        ],
        insights: [
          {
            type: 'strength',
            title: 'Strong Reading Comprehension',
            description: t('student:proficiency.readingAboveAverage'),
            action: 'Challenge yourself with native-level content'
          },
          {
            type: 'weakness',
            title: 'Writing Needs Attention',
            description: t('student:proficiency.writingBelowAverage'),
            action: 'Practice daily journal writing'
          },
          {
            type: 'opportunity',
            title: 'Vocabulary Growth Potential',
            description: 'Rapid improvement detected in vocabulary acquisition',
            action: 'Add 10 new words daily to maximize growth'
          }
        ]
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { skills, overallLevel, nextLevel, progressToNext, progressHistory, recommendedPaths, insights } = proficiencyData || {};

  // Transform data for radar chart
  const radarData = skills?.map(skill => ({
    skill: skill.skill,
    current: skill.current,
    target: skill.target
  }));

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Language Proficiency Overview</CardTitle>
              <CardDescription>{t('student:proficiency.currentLevelDescription')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-lg px-4 py-2">
                {overallLevel}
              </Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline" className="text-lg px-4 py-2">
                {nextLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {nextLevel}</span>
              <span className="font-semibold">{progressToNext}%</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Keep up the great work! You're making steady progress towards {nextLevel} level.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skills Visualization */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Breakdown</CardTitle>
            <CardDescription>Visual comparison of your language skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar 
                    name="Current Level" 
                    dataKey="current" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Target Level" 
                    dataKey="target" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progress Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Timeline</CardTitle>
            <CardDescription>{t('student:proficiency.improvementOverTime')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="overall" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Details */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Analysis</CardTitle>
          <CardDescription>Detailed breakdown of each language skill</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills?.map((skill) => (
              <div
                key={skill.skill}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedSkill === skill.skill ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedSkill(skill.skill)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {skill.skill === 'Speaking' && <MessageSquare className="h-4 w-4" />}
                    {skill.skill === 'Listening' && <Headphones className="h-4 w-4" />}
                    {skill.skill === 'Reading' && <BookOpen className="h-4 w-4" />}
                    {skill.skill === 'Writing' && <PenTool className="h-4 w-4" />}
                    {skill.skill === 'Grammar' && <Brain className="h-4 w-4" />}
                    {skill.skill === 'Vocabulary' && <Zap className="h-4 w-4" />}
                    <span className="font-medium">{skill.skill}</span>
                  </div>
                  <Badge variant={skill.improvement > 15 ? 'default' : 'secondary'} className="text-xs">
                    +{skill.improvement}%
                  </Badge>
                </div>
                <Progress value={skill.current} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {skill.current}%</span>
                  <span>Target: {skill.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Learning Paths */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Learning Paths</CardTitle>
          <CardDescription>Personalized paths based on your progress and goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendedPaths?.map((path) => (
            <div
              key={path.id}
              className={`p-4 rounded-lg border ${
                path.recommended ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{path.title}</h4>
                    {path.recommended && (
                      <Badge variant="default" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{path.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Step {path.currentStep}/{path.totalSteps}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {path.estimatedTime}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Next milestone: </span>
                    <span className="text-xs font-medium">{path.nextMilestone}</span>
                  </div>
                </div>
                <Button variant={path.recommended ? "default" : "outline"} size="sm">
                  Start Path
                </Button>
              </div>
              <Progress value={(path.currentStep / path.totalSteps) * 100} className="h-1 mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
          <CardDescription>Personalized recommendations based on your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {insights?.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'strength' ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' :
                  insight.type === 'weakness' ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/20' :
                  'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    insight.type === 'strength' ? 'bg-green-500/20' :
                    insight.type === 'weakness' ? 'bg-orange-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {insight.type === 'strength' && <Award className="h-4 w-4 text-green-600" />}
                    {insight.type === 'weakness' && <Target className="h-4 w-4 text-orange-600" />}
                    {insight.type === 'opportunity' && <Zap className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    <p className="text-xs font-medium mt-2">{insight.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}