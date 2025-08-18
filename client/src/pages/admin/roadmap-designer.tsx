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
  const [editingStep, setEditingStep] = useState<any>(null);
  const [isEditStepDialogOpen, setIsEditStepDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  
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
    stepNumber: 1,
    estimatedMinutes: 30,
    skillFocus: 'speaking',
    objectives: '',
    teacherAiTips: '',
    materials: {} as any,
    assessmentCriteria: ''
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
    mutationFn: (data: typeof roadmapForm) => apiRequest('/api/roadmaps', {
      method: 'POST',
      body: JSON.stringify({
        roadmapName: data.title,
        description: data.description,
        totalSteps: 0,
        estimatedHours: data.estimatedWeeks * data.weeklyHours
      })
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

  // Add step mutation
  const addStep = useMutation({
    mutationFn: (data: typeof stepForm) => 
      apiRequest(`/api/roadmaps/${selectedRoadmap?.id}/steps`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Step added successfully" });
      refetchDetails();
      setStepForm({
        title: '',
        description: '',
        stepNumber: ((roadmapDetails as any)?.steps?.length || 0) + 1,
        estimatedMinutes: 30,
        skillFocus: 'speaking',
        objectives: '',
        teacherAiTips: '',
        materials: {},
        assessmentCriteria: ''
      });
    },
    onError: () => {
      toast({ title: "Failed to add step", variant: "destructive" });
    }
  });

  // Update step mutation
  const updateStep = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/roadmaps/${selectedRoadmap?.id}/steps/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Step updated successfully" });
      refetchDetails();
      setIsEditStepDialogOpen(false);
      setEditingStep(null);
    },
    onError: () => {
      toast({ title: "Failed to update step", variant: "destructive" });
    }
  });

  // Delete step mutation
  const deleteStep = useMutation({
    mutationFn: (stepId: number) => 
      apiRequest(`/api/roadmaps/${selectedRoadmap?.id}/steps/${stepId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({ title: "Step deleted successfully" });
      refetchDetails();
      setStepToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete step", variant: "destructive" });
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
        <div className="col-span-12 md:col-span-4 space-y-4">
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
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
                    className={`cursor-pointer transition-all backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 hover:bg-white/70 dark:hover:bg-gray-900/70 ${
                      selectedRoadmap?.id === roadmap.id ? 'border-primary ring-2 ring-primary/20' : 'border-white/10'
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
        <div className="col-span-12 md:col-span-8">
          {selectedRoadmap ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{selectedRoadmap.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      {t('common:edit')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-1" />
                      Enrollments
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="milestones">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="milestones">Steps</TabsTrigger>
                    <TabsTrigger value="analytics">{t('admin:roadmap.analytics')}</TabsTrigger>
                    <TabsTrigger value="settings">{t('admin:roadmap.settings')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="milestones" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Roadmap Steps ({roadmapDetails?.steps?.length || 0}) • Total: {Math.round((roadmapDetails?.steps?.reduce((sum: number, step: any) => sum + (step.estimatedMinutes || 0), 0) || 0) / 60 * 10) / 10} hours
                      </h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Add Step
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Roadmap Step</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={stepForm.title}
                                onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                                placeholder="e.g. Introduction to Speaking"
                              />
                            </div>
                            
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={stepForm.description}
                                onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                                placeholder="Detailed description of what this step covers"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Step Number</Label>
                                <Input
                                  type="number"
                                  value={stepForm.stepNumber}
                                  onChange={(e) => setStepForm({ ...stepForm, stepNumber: parseInt(e.target.value) })}
                                />
                              </div>
                              
                              <div>
                                <Label>Estimated Minutes</Label>
                                <Input
                                  type="number"
                                  value={stepForm.estimatedMinutes}
                                  onChange={(e) => setStepForm({ ...stepForm, estimatedMinutes: parseInt(e.target.value) })}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label>Skill Focus</Label>
                              <Select
                                value={stepForm.skillFocus}
                                onValueChange={(v) => setStepForm({ ...stepForm, skillFocus: v })}
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
                            
                            <div>
                              <Label>Learning Objectives</Label>
                              <Textarea
                                value={stepForm.objectives}
                                onChange={(e) => setStepForm({ ...stepForm, objectives: e.target.value })}
                                placeholder="What will the student learn in this step?"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-blue-600">Teacher AI Tips</Label>
                              <Textarea
                                value={stepForm.teacherAiTips}
                                onChange={(e) => setStepForm({ ...stepForm, teacherAiTips: e.target.value })}
                                placeholder="AI guidance for teachers: key points to cover, common mistakes to avoid, suggested activities..."
                                className="border-blue-200 focus:border-blue-400"
                              />
                            </div>
                            
                            <div>
                              <Label>Assessment Criteria</Label>
                              <Textarea
                                value={stepForm.assessmentCriteria}
                                onChange={(e) => setStepForm({ ...stepForm, assessmentCriteria: e.target.value })}
                                placeholder="How to assess if the student has mastered this step"
                              />
                            </div>
                            
                            <Button
                              className="w-full"
                              onClick={() => addStep.mutate(stepForm)}
                              disabled={addStep.isPending}
                            >
                              Add Step
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Steps Timeline */}
                    <div className="space-y-4">
                      {roadmapDetails?.steps?.map((step: any, index: number) => (
                        <Card key={step.id} className="backdrop-blur-md bg-white/60 dark:bg-gray-900/60 border-white/10 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="font-semibold">{step.stepNumber}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{step.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {step.estimatedMinutes} {t('admin:roadmap.minutes')} • {step.skillFocus}
                                    </p>
                                    {step.description && (
                                      <p className="text-sm mt-2">{step.description}</p>
                                    )}
                                    {step.objectives && (
                                      <div className="mt-2">
                                        <span className="text-sm font-medium">Objectives:</span>
                                        <p className="text-sm text-muted-foreground">{step.objectives}</p>
                                      </div>
                                    )}
                                    {step.teacherAiTips && (
                                      <div className="mt-2">
                                        <span className="text-sm font-medium text-blue-600">AI Tips for Teachers:</span>
                                        <p className="text-sm text-blue-600/80">{step.teacherAiTips}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingStep(step);
                                        setStepForm({
                                          title: step.title || '',
                                          description: step.description || '',
                                          stepNumber: step.stepNumber || 1,
                                          estimatedMinutes: step.estimatedMinutes || 30,
                                          skillFocus: step.skillFocus || 'speaking',
                                          objectives: step.objectives || '',
                                          teacherAiTips: step.teacherAiTips || '',
                                          materials: step.materials || {},
                                          assessmentCriteria: step.assessmentCriteria || ''
                                        });
                                        setIsEditStepDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setStepToDelete(step.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
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


      </div>

      {/* Edit Step Dialog */}
      <Dialog open={isEditStepDialogOpen} onOpenChange={setIsEditStepDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
          <DialogHeader>
            <DialogTitle>Edit Roadmap Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={stepForm.title}
                onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                placeholder="e.g. Introduction to Speaking"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={stepForm.description}
                onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                placeholder="Detailed description of what this step covers"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Step Number</Label>
                <Input
                  type="number"
                  value={stepForm.stepNumber}
                  onChange={(e) => setStepForm({ ...stepForm, stepNumber: parseInt(e.target.value) })}
                />
              </div>
              
              <div>
                <Label>Estimated Minutes</Label>
                <Input
                  type="number"
                  value={stepForm.estimatedMinutes}
                  onChange={(e) => setStepForm({ ...stepForm, estimatedMinutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div>
              <Label>Skill Focus</Label>
              <Select
                value={stepForm.skillFocus}
                onValueChange={(v) => setStepForm({ ...stepForm, skillFocus: v })}
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
            
            <div>
              <Label>Learning Objectives</Label>
              <Textarea
                value={stepForm.objectives}
                onChange={(e) => setStepForm({ ...stepForm, objectives: e.target.value })}
                placeholder="What will the student learn in this step?"
              />
            </div>
            
            <div>
              <Label className="text-blue-600">Teacher AI Tips</Label>
              <Textarea
                value={stepForm.teacherAiTips}
                onChange={(e) => setStepForm({ ...stepForm, teacherAiTips: e.target.value })}
                placeholder="AI guidance for teachers: key points to cover, common mistakes to avoid, suggested activities..."
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            
            <div>
              <Label>Assessment Criteria</Label>
              <Textarea
                value={stepForm.assessmentCriteria}
                onChange={(e) => setStepForm({ ...stepForm, assessmentCriteria: e.target.value })}
                placeholder="How to assess if the student has mastered this step"
              />
            </div>
            
            <Button
              className="w-full"
              onClick={() => {
                if (editingStep) {
                  updateStep.mutate({
                    id: editingStep.id,
                    ...stepForm
                  });
                }
              }}
              disabled={updateStep.isPending}
            >
              Update Step
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={stepToDelete !== null} onOpenChange={(open) => !open && setStepToDelete(null)}>
        <DialogContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
          <DialogHeader>
            <DialogTitle>Delete Step</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this step? This action cannot be undone.</p>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={() => setStepToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (stepToDelete) {
                  deleteStep.mutate(stepToDelete);
                }
              }}
              disabled={deleteStep.isPending}
            >
              Delete Step
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}