import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  Target, 
  Clock, 
  BookOpen,
  ChevronRight,
  Users,
  TrendingUp,
  Award,
  Map,
  Milestone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Roadmap {
  id: number;
  title: string;
  description: string;
  targetLanguage: string;
  targetLevel: string;
  estimatedWeeks: number;
  weeklyHours: number;
  difficulty: string;
  prerequisites: string[];
  isPublic: boolean;
  isActive: boolean;
  milestones?: RoadmapMilestone[];
}

interface RoadmapMilestone {
  id: number;
  roadmapId: number;
  title: string;
  description: string;
  orderIndex: number;
  weekNumber: number;
  primarySkill: string;
  secondarySkills: string[];
  assessmentType: string;
  passingScore: number;
  steps?: RoadmapStep[];
}

interface RoadmapStep {
  id: number;
  milestoneId: number;
  title: string;
  description: string;
  orderIndex: number;
  estimatedMinutes: number;
  contentType: string;
  courseId?: number;
  contentUrl?: string;
  isRequired: boolean;
  objectives: string[];
}

export default function RoadmapDesigner() {
  const { t } = useTranslation(['admin']);
  const { toast } = useToast();
  
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestone | null>(null);
  const [editingStep, setEditingStep] = useState<RoadmapStep | null>(null);
  
  // Form states
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    targetLanguage: 'english',
    targetLevel: 'B1',
    estimatedWeeks: 12,
    weeklyHours: 10,
    difficulty: 'intermediate',
    prerequisites: [] as string[],
    isPublic: true
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    weekNumber: 1,
    primarySkill: 'speaking',
    secondarySkills: [] as string[],
    assessmentType: 'quiz',
    passingScore: 70
  });

  const [stepForm, setStepForm] = useState({
    title: '',
    description: '',
    orderIndex: 1,
    estimatedMinutes: 30,
    contentType: 'lesson',
    courseId: undefined as number | undefined,
    contentUrl: '',
    isRequired: true,
    objectives: [] as string[]
  });

  // Fetch roadmaps
  const { data: roadmaps = [], isLoading: loadingRoadmaps } = useQuery<Roadmap[]>({
    queryKey: ['/api/roadmaps'],
    enabled: true
  });

  // Fetch selected roadmap details
  const { data: roadmapDetails, refetch: refetchDetails } = useQuery<Roadmap & { milestones?: RoadmapMilestone[] }>({
    queryKey: selectedRoadmap ? [`/api/roadmaps/${selectedRoadmap.id}`] : [''],
    enabled: !!selectedRoadmap
  });

  // Fetch courses for content linking
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['/api/courses']
  });

  // Create roadmap mutation
  const createRoadmap = useMutation({
    mutationFn: (data: typeof roadmapForm) => apiRequest('/api/admin/roadmaps', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Roadmap created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/roadmaps'] });
      setIsCreatingRoadmap(false);
      setRoadmapForm({
        title: '',
        description: '',
        targetLanguage: 'english',
        targetLevel: 'B1',
        estimatedWeeks: 12,
        weeklyHours: 10,
        difficulty: 'intermediate',
        prerequisites: [],
        isPublic: true
      });
    },
    onError: () => {
      toast({ title: "Failed to create roadmap", variant: "destructive" });
    }
  });

  // Add milestone mutation
  const addMilestone = useMutation({
    mutationFn: (data: typeof milestoneForm) => 
      apiRequest(`/api/roadmaps/${selectedRoadmap?.id}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Milestone added successfully" });
      refetchDetails();
      setMilestoneForm({
        title: '',
        description: '',
        orderIndex: ((roadmapDetails as any)?.milestones?.length || 0) + 1,
        weekNumber: 1,
        primarySkill: 'speaking',
        secondarySkills: [],
        assessmentType: 'quiz',
        passingScore: 70
      });
    },
    onError: () => {
      toast({ title: "Failed to add milestone", variant: "destructive" });
    }
  });

  // Add step mutation
  const addStep = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: number; data: typeof stepForm }) => 
      apiRequest(`/api/milestones/${milestoneId}/steps`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Step added successfully" });
      refetchDetails();
      setStepForm({
        title: '',
        description: '',
        orderIndex: 1,
        estimatedMinutes: 30,
        contentType: 'lesson',
        courseId: undefined,
        contentUrl: '',
        isRequired: true,
        objectives: []
      });
    },
    onError: () => {
      toast({ title: "Failed to add step", variant: "destructive" });
    }
  });

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'persian', label: 'Persian' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' }
  ];

  const levelOptions = [
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Proficient' }
  ];

  const skillOptions = [
    { value: 'speaking', label: 'Speaking' },
    { value: 'listening', label: 'Listening' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'grammar', label: 'Grammar' },
    { value: 'vocabulary', label: 'Vocabulary' }
  ];

  const contentTypes = [
    { value: 'lesson', label: 'Lesson' },
    { value: 'video', label: 'Video' },
    { value: 'exercise', label: 'Exercise' },
    { value: 'reading', label: 'Reading' },
    { value: 'project', label: 'Project' },
    { value: 'quiz', label: 'Quiz' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Mobile First */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Map className="w-6 h-6 sm:w-8 sm:h-8" />
              {t('admin:roadmap.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
              {t('admin:roadmap.subtitle')}
            </p>
          </div>
          
          <Dialog open={isCreatingRoadmap} onOpenChange={setIsCreatingRoadmap}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('admin:roadmap.createNew')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin:roadmap.createNew')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('admin:roadmap.fields.title')}</Label>
                <Input
                  value={roadmapForm.title}
                  onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
                  placeholder={t('admin:roadmap.titlePlaceholder')}
                />
              </div>
              
              <div>
                <Label>{t('admin:roadmap.fields.description')}</Label>
                <Textarea
                  value={roadmapForm.description}
                  onChange={(e) => setRoadmapForm({ ...roadmapForm, description: e.target.value })}
                  placeholder={t('admin:roadmap.descriptionPlaceholder')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('admin:roadmap.targetLanguage')}</Label>
                  <Select
                    value={roadmapForm.targetLanguage}
                    onValueChange={(v) => setRoadmapForm({ ...roadmapForm, targetLanguage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{t('admin:roadmap.targetLevel')}</Label>
                  <Select
                    value={roadmapForm.targetLevel}
                    onValueChange={(v) => setRoadmapForm({ ...roadmapForm, targetLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{t('admin:roadmap.estimatedWeeks')}</Label>
                  <Input
                    type="number"
                    value={roadmapForm.estimatedWeeks}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, estimatedWeeks: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <Label>{t('admin:roadmap.weeklyHours')}</Label>
                  <Input
                    type="number"
                    value={roadmapForm.weeklyHours}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, weeklyHours: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => createRoadmap.mutate(roadmapForm)}
                disabled={createRoadmap.isPending}
              >
                <Save className="mr-2" />
                Create Roadmap
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Roadmap List */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:roadmap.availableRoadmaps')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingRoadmaps ? (
                <p>Loading roadmaps...</p>
              ) : roadmaps.length === 0 ? (
                <p className="text-muted-foreground">{t('admin:roadmap.noRoadmaps')}</p>
              ) : (
                roadmaps.map((roadmap: Roadmap) => (
                  <Card
                    key={roadmap.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRoadmap?.id === roadmap.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedRoadmap(roadmap)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{roadmap.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {roadmap.targetLanguage} • {roadmap.targetLevel}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {roadmap.estimatedWeeks} {t('admin:roadmap.weeks')}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {roadmap.weeklyHours}{t('admin:roadmap.hoursPerWeek')}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Roadmap Details */}
        <div className="col-span-8">
          {selectedRoadmap ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{selectedRoadmap.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      {t('admin:roadmap.edit')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-1" />
                      {t('admin:roadmap.enrollments')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="milestones">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="milestones">{t('admin:roadmap.milestones')}</TabsTrigger>
                    <TabsTrigger value="analytics">{t('admin:roadmap.analytics')}</TabsTrigger>
                    <TabsTrigger value="settings">{t('admin:roadmap.settings')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="milestones" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{t('admin:roadmap.learningMilestones')}</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            {t('admin:roadmap.addMilestone')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('admin:roadmap.addMilestone')}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('admin:roadmap.fields.title')}</Label>
                              <Input
                                value={milestoneForm.title}
                                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                placeholder={t('admin:roadmap.milestoneTitlePlaceholder')}
                              />
                            </div>
                            
                            <div>
                              <Label>{t('admin:roadmap.weekNumber')}</Label>
                              <Input
                                type="number"
                                value={milestoneForm.weekNumber}
                                onChange={(e) => setMilestoneForm({ ...milestoneForm, weekNumber: parseInt(e.target.value) })}
                              />
                            </div>
                            
                            <div>
                              <Label>{t('admin:roadmap.primarySkill')}</Label>
                              <Select
                                value={milestoneForm.primarySkill}
                                onValueChange={(v) => setMilestoneForm({ ...milestoneForm, primarySkill: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {skillOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              className="w-full"
                              onClick={() => addMilestone.mutate(milestoneForm)}
                              disabled={addMilestone.isPending}
                            >
                              {t('admin:roadmap.addMilestone')}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Milestones Timeline */}
                    <div className="space-y-4">
                      {roadmapDetails?.milestones?.map((milestone: RoadmapMilestone, index: number) => (
                        <Card key={milestone.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Milestone className="w-5 h-5 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{milestone.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {t('admin:roadmap.week')} {milestone.weekNumber} • {milestone.primarySkill}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingMilestone(milestone)}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Step
                                  </Button>
                                </div>
                                
                                {/* Steps */}
                                {milestone.steps && milestone.steps.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    {milestone.steps.map((step: RoadmapStep) => (
                                      <div key={step.id} className="flex items-center gap-2 pl-4 py-2 bg-muted/50 rounded">
                                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{step.title}</span>
                                        <span className="text-xs text-muted-foreground ml-auto mr-2">
                                          {step.estimatedMinutes} {t('admin:roadmap.minutes')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analytics">
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>{t('admin:roadmap.analyticsAvailable')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="settings">
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{t('admin:roadmap.publicRoadmap')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('admin:roadmap.allowAllStudents')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            {selectedRoadmap.isPublic ? t('admin:roadmap.public') : t('admin:roadmap.private')}
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{t('admin:roadmap.activeStatus')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('admin:roadmap.enableDisableEnrollments')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            {selectedRoadmap.isActive ? t('admin:roadmap.active') : t('admin:roadmap.inactive')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t('admin:roadmap.selectRoadmap')}</h3>
                <p className="text-muted-foreground">
                  {t('admin:roadmap.chooseRoadmap')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Step Dialog */}
      {editingMilestone && (
        <Dialog open={!!editingMilestone} onOpenChange={() => setEditingMilestone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Step to {editingMilestone.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Step Title</Label>
                <Input
                  value={stepForm.title}
                  onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Business Vocabulary"
                />
              </div>
              
              <div>
                <Label>Content Type</Label>
                <Select
                  value={stepForm.contentType}
                  onValueChange={(v) => setStepForm({ ...stepForm, contentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Estimated Duration (minutes)</Label>
                <Input
                  type="number"
                  value={stepForm.estimatedMinutes}
                  onChange={(e) => setStepForm({ ...stepForm, estimatedMinutes: parseInt(e.target.value) })}
                />
              </div>
              
              {stepForm.contentType === 'lesson' && (
                <div>
                  <Label>Link to Course (Optional)</Label>
                  <Select
                    value={stepForm.courseId?.toString() || ''}
                    onValueChange={(v) => setStepForm({ ...stepForm, courseId: v ? parseInt(v) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={() => addStep.mutate({ 
                  milestoneId: editingMilestone.id, 
                  data: stepForm 
                })}
                disabled={addStep.isPending}
              >
                Add Step
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
}