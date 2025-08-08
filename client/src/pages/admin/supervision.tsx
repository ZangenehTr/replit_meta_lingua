import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Star, Clock, TrendingUp, Users, Video, Calendar, FileText, Bell, Plus, Play, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema definitions
const observationSchema = z.object({
  sessionId: z.number(),
  teacherId: z.number(),
  observationType: z.enum(['live_online', 'live_in_person', 'recorded']),
  scores: z.object({
    teachingMethodology: z.number().min(1).max(5),
    classroomManagement: z.number().min(1).max(5),
    studentEngagement: z.number().min(1).max(5),
    contentDelivery: z.number().min(1).max(5),
    languageSkills: z.number().min(1).max(5),
    timeManagement: z.number().min(1).max(5),
    technologyUse: z.number().min(1).max(5).optional(),
  }),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  actionItems: z.string().optional(),
});

const questionnaireSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.number().optional(),
  triggerSessionNumber: z.number().min(1),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    type: z.enum(['rating', 'text', 'multiple_choice']),
    options: z.array(z.string()).optional(),
    required: z.boolean(),
  })),
});

export default function Supervision() {
  const { t } = useTranslation(['admin', 'common']);
  const { language, isRTL, direction } = useLanguage();
  const [activeTab, setActiveTab] = useState("live");
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [questionnaireDialogOpen, setQuestionnaireDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch quality assurance stats
  const { data: qaStats } = useQuery({
    queryKey: ['/api/supervision/stats'],
  });

  // Fetch live sessions
  const { data: liveSessions } = useQuery({
    queryKey: ['/api/supervision/live-sessions'],
  });

  // Fetch recorded sessions (completed sessions)
  const { data: recordedSessions } = useQuery({
    queryKey: ['/api/supervision/live-sessions', 'completed'],
  });

  // Fetch observations
  const { data: observations } = useQuery({
    queryKey: ['/api/supervision/observations'],
  });

  // Fetch retention data
  const { data: retentionData } = useQuery({
    queryKey: ['/api/supervision/retention'],
  });

  // Fetch questionnaires
  const { data: questionnaires } = useQuery({
    queryKey: ['/api/supervision/questionnaires'],
  });

  // Observation form
  const observationForm = useForm({
    resolver: zodResolver(observationSchema),
  });

  // Questionnaire form
  const questionnaireForm = useForm({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      questions: [{
        id: '1',
        text: 'How would you rate your teacher\'s performance?',
        type: 'rating' as const,
        required: true,
      }],
    },
  });

  // Create observation mutation
  const createObservationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supervision/observations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/stats'] });
      setObservationDialogOpen(false);
      observationForm.reset();
      toast({ title: t('common:toast.success'), description: t('common:toast.observationCreated') });
    },
    onError: () => {
      toast({ title: t('common:toast.error'), description: t('common:toast.observationFailed'), variant: "destructive" });
    },
  });

  // Create questionnaire mutation
  const createQuestionnaireMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supervision/questionnaires', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/questionnaires'] });
      setQuestionnaireDialogOpen(false);
      questionnaireForm.reset();
      toast({ title: t('common:toast.success'), description: t('common:toast.questionnaireCreated') });
    },
    onError: () => {
      toast({ title: t('common:toast.error'), description: t('common:toast.questionnaireFailed'), variant: "destructive" });
    },
  });

  const onObservationSubmit = (data: any) => {
    const overallScore = Object.values(data.scores).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(data.scores).length;
    createObservationMutation.mutate({
      ...data,
      overallScore: Math.round(overallScore * 100) / 100,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {t('admin:supervision.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('admin:supervision.qualityAssurance')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setObservationDialogOpen(true)} className="border-green-200 hover:bg-green-50">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin:supervision.createObservation')}
          </Button>
          <Button variant="outline" onClick={() => setQuestionnaireDialogOpen(true)} className="border-teal-200 hover:bg-teal-50">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin:supervision.questionnaires')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:supervision.liveObservations')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats?.liveClasses || 0}</div>
            <p className="text-xs text-muted-foreground">{t('common:currentlyInSession')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:supervision.score')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats?.averageQualityScore || 0}</div>
            <p className="text-xs text-muted-foreground">{t('common:outOfFive')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('common:retention')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">{qaStats?.retentionTrend || '↗ +3.2%'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('common:teachersSupervised')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats?.teachersUnderSupervision || 0}</div>
            <p className="text-xs text-muted-foreground">{t('common:activeThisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="live">{t('admin:supervision.liveObservations')}</TabsTrigger>
          <TabsTrigger value="recorded">{t('admin:supervision.recordedSessions')}</TabsTrigger>
          <TabsTrigger value="evaluations">{t('common:evaluations')}</TabsTrigger>
          <TabsTrigger value="retention">{t('common:retention')}</TabsTrigger>
          <TabsTrigger value="questionnaires">{t('admin:supervision.questionnaires')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('common:notifications')}</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t('admin:supervision.liveClassesMonitoring')}
              </CardTitle>
              <Badge variant="secondary">{liveSessions?.length || 0} {t('admin:supervision.live')}</Badge>
            </CardHeader>
            <CardContent>
              {liveSessions && liveSessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:supervision.classTitle')}</TableHead>
                      <TableHead>{t('admin:supervision.teacher')}</TableHead>
                      <TableHead>{t('admin:supervision.type')}</TableHead>
                      <TableHead>{t('admin:supervision.startTime')}</TableHead>
                      <TableHead>{t('admin:supervision.status')}</TableHead>
                      <TableHead>{t('admin:supervision.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveSessions.map((session: any) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.classTitle}</TableCell>
                        <TableCell>{session.teacherName}</TableCell>
                        <TableCell>
                          <Badge variant={session.classType === 'online' ? 'default' : 'secondary'}>
                            {session.classType}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(session.startTime).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <Badge variant={session.status === 'live' ? 'destructive' : 'outline'}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {session.meetingUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                  {t('common:join')}
                                </a>
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                              {t('common:observe')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin:supervision.noLiveClasses')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recorded" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {t('admin:supervision.recordedSessions')}
              </CardTitle>
              <Badge variant="outline">{recordedSessions?.length || 0} {t('common:archived')}</Badge>
            </CardHeader>
            <CardContent>
              {recordedSessions && recordedSessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:supervision.classTitle')}</TableHead>
                      <TableHead>{t('admin:supervision.teacher')}</TableHead>
                      <TableHead>{t('admin:supervision.date')}</TableHead>
                      <TableHead>{t('common:duration')}</TableHead>
                      <TableHead>{t('admin:supervision.qualityAssurance')}</TableHead>
                      <TableHead>{t('admin:supervision.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordedSessions.map((session: any) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.classTitle}</TableCell>
                        <TableCell>{session.teacherName}</TableCell>
                        <TableCell>{new Date(session.startTime).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {session.endTime 
                            ? `${Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {session.qualityScore ? (
                            <Badge variant={session.qualityScore >= 4 ? 'default' : session.qualityScore >= 3 ? 'secondary' : 'destructive'}>
                              {session.qualityScore}/5
                            </Badge>
                          ) : (
                            <Badge variant="outline">{t('common:notRated')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {session.recordingUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
                                  <Play className="h-4 w-4" />
                                  {t('common:watch')}
                                </a>
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                              {t('common:review')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin:supervision.noRecordedClasses')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('admin:supervision.teacherEvaluations')}
              </CardTitle>
              <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin:supervision.createTeacherEvaluation')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{t('admin:supervision.createTeacherEvaluation')}</DialogTitle>
                  </DialogHeader>
                  <Form {...observationForm}>
                    <form onSubmit={observationForm.handleSubmit(onObservationSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={observationForm.control}
                          name="sessionId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.session')}</FormLabel>
                              <Select onValueChange={value => field.onChange(+value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('admin:supervision.session')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {recordedSessions?.map((session: any) => (
                                    <SelectItem key={session.id} value={session.id.toString()}>
                                      {session.classTitle}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="observationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.observationType')}</FormLabel>
                              <Select onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('admin:supervision.selectObservationType')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="live_in_person">{t('admin:supervision.liveInPerson')}</SelectItem>
                                  <SelectItem value="live_online">{t('admin:supervision.liveOnline')}</SelectItem>
                                  <SelectItem value="recorded">{t('admin:supervision.recorded')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={observationForm.control}
                          name="scores.teachingMethodology"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.teachingMethodology')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="scores.classroomManagement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.classroomManagement')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="scores.studentEngagement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.studentEngagement')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="scores.contentDelivery"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.contentDelivery')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="scores.languageSkills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.languageSkills')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="scores.timeManagement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.timeManagement')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={observationForm.control}
                          name="strengths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.strengths')}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={t('admin:supervision.noteTeacherStrengths')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="areasForImprovement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.areasForImprovement')}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={t('admin:supervision.identifyAreasForImprovement')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={observationForm.control}
                          name="actionItems"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:supervision.actionItems')}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={t('admin:supervision.specificActionItems')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setObservationDialogOpen(false)}>
                          {t('admin:supervision.cancel')}
                        </Button>
                        <Button type="submit" disabled={createObservationMutation.isPending}>
                          {createObservationMutation.isPending ? t('admin:supervision.creatingEvaluation') : t('admin:supervision.createEvaluation')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {observations && observations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:supervision.teacher')}</TableHead>
                      <TableHead>{t('admin:supervision.type')}</TableHead>
                      <TableHead>{t('admin:supervision.overallScore')}</TableHead>
                      <TableHead>{t('admin:supervision.date')}</TableHead>
                      <TableHead>{t('admin:supervision.followUpRequired')}</TableHead>
                      <TableHead>{t('admin:supervision.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((observation: any) => (
                      <TableRow key={observation.id}>
                        <TableCell className="font-medium">{observation.teacherName || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {observation.observationType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={observation.overallScore >= 4 ? 'default' : observation.overallScore >= 3 ? 'secondary' : 'destructive'}>
                            {observation.overallScore}/5
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(observation.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {observation.followUpRequired ? (
                            <Badge variant="destructive">{t('admin:supervision.required')}</Badge>
                          ) : (
                            <Badge variant="outline">{t('admin:supervision.no')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                            {t('admin:supervision.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin:supervision.noTeacherEvaluations')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Term-by-Term Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {retentionData && retentionData.length > 0 ? (
                  <div className="space-y-4">
                    {retentionData.map((term: any) => (
                      <div key={term.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{term.termName}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(term.termStartDate).toLocaleDateString()} - {new Date(term.termEndDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{term.retentionRate}%</div>
                          <div className="text-sm text-red-600">Attrition: {term.attritionRate}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No retention data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Overall Teacher Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">87.3%</div>
                    <div className="text-sm text-muted-foreground">Overall Retention Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">12.7%</div>
                    <div className="text-sm text-muted-foreground">Overall Attrition Rate</div>
                  </div>
                  <div className="text-center pt-4">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      ↗ Improving Trend
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questionnaires" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('admin:supervision.automatedQuestionnaires')}
              </CardTitle>
              <Dialog open={questionnaireDialogOpen} onOpenChange={setQuestionnaireDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Questionnaire
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Student Questionnaire</DialogTitle>
                  </DialogHeader>
                  <Form {...questionnaireForm}>
                    <form onSubmit={questionnaireForm.handleSubmit((data) => createQuestionnaireMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={questionnaireForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Questionnaire Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Mid-term Teacher Feedback" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionnaireForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Brief description of the questionnaire purpose..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionnaireForm.control}
                        name="triggerSessionNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trigger at Session Number</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="e.g., 4" {...field} onChange={e => field.onChange(+e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setQuestionnaireDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createQuestionnaireMutation.isPending}>
                          {createQuestionnaireMutation.isPending ? "Creating..." : "Create Questionnaire"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {questionnaires && questionnaires.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Trigger Session</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionnaires.map((questionnaire: any) => (
                      <TableRow key={questionnaire.id}>
                        <TableCell className="font-medium">{questionnaire.title}</TableCell>
                        <TableCell>Session {questionnaire.triggerSessionNumber}</TableCell>
                        <TableCell>
                          <Badge variant={questionnaire.isActive ? 'default' : 'secondary'}>
                            {questionnaire.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(questionnaire.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4" />
                              Responses
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No questionnaires have been created yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notifications for Questionnaire Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Send SMS via Kavenegar to students when questionnaires are due
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Send email reminders for pending questionnaires
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">In-app Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Display notification badges in student dashboard
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Notification Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">{qaStats?.pendingQuestionnaires || 0}</div>
                      <div className="text-sm text-muted-foreground">Pending Questionnaires</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">156</div>
                      <div className="text-sm text-muted-foreground">SMS Sent This Month</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">89%</div>
                      <div className="text-sm text-muted-foreground">Response Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}