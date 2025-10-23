import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Phone, 
  PhoneCall,
  Play,
  Pause,
  Square,
  Clock,
  Star,
  Save,
  Send,
  Calendar,
  User,
  AlertTriangle,
  FileText,
  CheckCircle,
  Timer,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Iranian phone number validation
const iranianPhoneRegex = /^(\+98|0098|98|0)?9\d{9}$/;

interface CallTimer {
  isActive: boolean;
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  isPaused: boolean;
}

export default function CallLogging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['frontdesk', 'common']);
  const isRTL = i18n.dir() === 'rtl';

  // Validation schema with i18n
  const callLoggingSchema = z.object({
    callType: z.enum(['incoming', 'outgoing'], {
      required_error: t('frontdesk:callLogging.validations.selectCallType'),
    }),
    callerName: z.string().min(1, t('frontdesk:callLogging.validations.callerNameRequired')),
    callerPhone: z.string().regex(iranianPhoneRegex, t('frontdesk:callLogging.validations.phoneInvalid')),
    callerEmail: z.string().email(t('frontdesk:callLogging.validations.emailInvalid')).optional().or(z.literal('')),
    callPurpose: z.enum(['inquiry', 'follow_up', 'complaint', 'booking', 'general'], {
      required_error: t('frontdesk:callLogging.validations.selectCallPurpose'),
    }),
    callResult: z.enum(['successful', 'voicemail', 'no_answer', 'busy', 'scheduled_callback'], {
      required_error: t('frontdesk:callLogging.validations.selectCallOutcome'),
    }),
    callStartTime: z.string().optional(),
    callEndTime: z.string().optional(), 
    callDuration: z.number().optional(),
    callNotes: z.string().min(10, t('frontdesk:callLogging.validations.notesMinLength')),
    actionItems: z.string().optional(),
    nextSteps: z.string().optional(),
    customerSatisfaction: z.number().min(1).max(5).optional(),
    urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    studentId: z.number().optional(),
    relatedWalkInId: z.number().optional(),
    needsFollowUp: z.boolean().default(false),
    followUpDate: z.string().optional(),
    followUpMethod: z.enum(['call', 'email', 'sms', 'whatsapp']).optional(),
    assignFollowUpTo: z.number().optional(),
    inquiryType: z.enum(['course_info', 'pricing', 'schedule', 'teacher_info', 'level_assessment']).optional(),
    interestedLanguage: z.string().optional(),
    currentLevel: z.string().optional(),
    tags: z.array(z.string()).default([]),
  });

  type CallLoggingFormData = z.infer<typeof callLoggingSchema>;

  // Call templates
  const CALL_TEMPLATES = {
    new_inquiry: {
      name: t('frontdesk:callLogging.templateNewInquiry'),
      data: {
        callType: 'incoming' as const,
        callPurpose: 'inquiry' as const,
        inquiryType: 'course_info' as const,
        urgencyLevel: 'medium' as const,
        needsFollowUp: true,
        followUpMethod: 'call' as const,
        tags: ['new-inquiry'],
      }
    },
    trial_followup: {
      name: t('frontdesk:callLogging.templateTrialFollowup'),
      data: {
        callType: 'outgoing' as const,
        callPurpose: 'follow_up' as const,
        inquiryType: 'level_assessment' as const,
        urgencyLevel: 'high' as const,
        tags: ['trial-followup'],
      }
    },
    payment_reminder: {
      name: t('frontdesk:callLogging.templatePaymentReminder'),
      data: {
        callType: 'outgoing' as const,
        callPurpose: 'booking' as const,
        urgencyLevel: 'high' as const,
        tags: ['payment-reminder'],
      }
    },
    schedule_change: {
      name: t('frontdesk:callLogging.templateScheduleChange'),
      data: {
        callType: 'incoming' as const,
        callPurpose: 'booking' as const,
        urgencyLevel: 'medium' as const,
        needsFollowUp: true,
        tags: ['schedule-change'],
      }
    },
    complaint_handling: {
      name: t('frontdesk:callLogging.templateComplaintHandling'),
      data: {
        callType: 'incoming' as const,
        callPurpose: 'complaint' as const,
        urgencyLevel: 'urgent' as const,
        needsFollowUp: true,
        followUpMethod: 'call' as const,
        tags: ['complaint'],
      }
    }
  };

  // Call timer state
  const [timer, setTimer] = useState<CallTimer>({
    isActive: false,
    startTime: null,
    endTime: null,
    duration: 0,
    isPaused: false
  });

  // Auto-save state
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form setup
  const form = useForm<CallLoggingFormData>({
    resolver: zodResolver(callLoggingSchema),
    defaultValues: {
      callType: 'incoming',
      callPurpose: 'inquiry',
      callResult: 'successful',
      urgencyLevel: 'medium',
      needsFollowUp: false,
      customerSatisfaction: 3,
      tags: [],
    }
  });

  // Watch form changes for auto-save
  const watchedValues = form.watch();
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [watchedValues]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isActive && !timer.isPaused && timer.startTime) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          duration: Math.floor((new Date().getTime() - (prev.startTime?.getTime() || 0)) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isActive, timer.isPaused, timer.startTime]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && timer.isActive) {
      const autoSaveTimer = setTimeout(() => {
        autoSave();
      }, 30000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, timer.isActive]);

  // Fetch students for linking
  const { data: students = [] } = useQuery({
    queryKey: ['/api/admin/students'],
    queryFn: () => fetch('/api/admin/students', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json()),
  });

  // Fetch staff for follow-up assignment
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/admin/staff'],
    queryFn: () => fetch('/api/admin/staff', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json()),
  });

  // Create call log mutation
  const createCallLogMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/front-desk/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: t('frontdesk:callLogging.callLoggedSuccess'),
        description: t('frontdesk:callLogging.callLoggedSuccessDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/calls'] });
      setHasUnsavedChanges(false);
      form.reset();
      setTimer({
        isActive: false,
        startTime: null,
        endTime: null,
        duration: 0,
        isPaused: false
      });
    },
    onError: (error) => {
      toast({
        title: t('frontdesk:callLogging.error'),
        description: t('frontdesk:callLogging.saveError'),
        variant: 'destructive',
      });
    },
  });

  // Timer functions
  const startCall = () => {
    const now = new Date();
    setTimer({
      isActive: true,
      startTime: now,
      endTime: null,
      duration: 0,
      isPaused: false
    });
    form.setValue('callStartTime', now.toISOString());
  };

  const pauseCall = () => {
    setTimer(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const endCall = () => {
    const now = new Date();
    setTimer(prev => ({
      ...prev,
      isActive: false,
      endTime: now,
      isPaused: false
    }));
  };

  // Template functions
  const applyTemplate = (templateKey: keyof typeof CALL_TEMPLATES) => {
    const template = CALL_TEMPLATES[templateKey];
    Object.entries(template.data).forEach(([key, value]) => {
      form.setValue(key as any, value as any);
    });
    toast({
      title: t('frontdesk:callLogging.templateApplied'),
      description: t('frontdesk:callLogging.templateAppliedDesc', { name: template.name }),
    });
  };

  // Auto-save function
  const autoSave = async () => {
    try {
      const formData = form.getValues();
      await apiRequest('/api/front-desk/calls/draft', {
        method: 'POST',
        body: JSON.stringify({ ...formData, isDraft: true }),
      });
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Form submission
  const onSubmit = async (data: CallLoggingFormData) => {
    const submitData = {
      ...data,
      handledBy: user?.id,
      callStartTime: timer.startTime?.toISOString(),
      callEndTime: timer.endTime?.toISOString(),
      callDuration: timer.duration,
      callTime: new Date().toISOString(),
    };

    createCallLogMutation.mutate(submitData);

    if (data.needsFollowUp && data.assignFollowUpTo) {
      try {
        await apiRequest('/api/front-desk/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: `${t('frontdesk:callLogging.followUp')}: ${data.callerName}`,
            description: `${t('frontdesk:callLogging.followUp')} for call regarding: ${data.callPurpose}`,
            taskType: 'follow_up_call',
            assignedTo: data.assignFollowUpTo,
            priority: data.urgencyLevel,
            relatedCall: null,
            contactName: data.callerName,
            contactPhone: data.callerPhone,
            dueDate: data.followUpDate,
            notes: data.nextSteps,
          }),
        });
      } catch (error) {
        toast({
          title: t('frontdesk:callLogging.warning'),
          description: t('frontdesk:callLogging.followUpTaskError'),
          variant: 'destructive',
        });
      }
    }
  };

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Emergency escalation
  const handleEmergencyEscalation = () => {
    toast({
      title: t('frontdesk:callLogging.emergencyNotification'),
      description: t('frontdesk:callLogging.supervisorNotified'),
    });
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} data-testid="call-logging-form">
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold">{t('frontdesk:callLogging.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('frontdesk:callLogging.pageSubtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/frontdesk/dashboard')}>
          {t('frontdesk:callLogging.backToDashboard')}
        </Button>
      </div>

      {hasUnsavedChanges && (
        <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${isRTL ? 'border-r-4 border-l-0' : ''}`}>
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className={`h-4 w-4 text-yellow-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <p className="text-sm text-yellow-700">
              {t('frontdesk:callLogging.unsavedChanges')}
              {lastAutoSave && ` • ${t('frontdesk:callLogging.lastAutoSaved')}: ${lastAutoSave.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Call Timer and Quick Actions */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Timer className="h-5 w-5" />
                {t('frontdesk:callLogging.callTimer')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTimer(timer.duration)}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={timer.isActive ? 'default' : 'secondary'}>
                    {timer.isActive ? (timer.isPaused ? t('frontdesk:callLogging.timerPaused') : t('frontdesk:callLogging.timerActive')) : t('frontdesk:callLogging.timerInactive')}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!timer.isActive ? (
                  <Button onClick={startCall} className="flex-1" data-testid="start-call">
                    <Play className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('frontdesk:callLogging.startCall')}
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseCall} variant="outline" className="flex-1" data-testid="pause-call">
                      {timer.isPaused ? <Play className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> : <Pause className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />}
                      {timer.isPaused ? t('frontdesk:callLogging.resumeCall') : t('frontdesk:callLogging.pauseCall')}
                    </Button>
                    <Button onClick={endCall} variant="destructive" className="flex-1" data-testid="end-call">
                      <Square className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('frontdesk:callLogging.endCall')}
                    </Button>
                  </>
                )}
              </div>

              {timer.isActive && (
                <Button 
                  onClick={handleEmergencyEscalation} 
                  variant="outline" 
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  data-testid="emergency-escalation"
                >
                  <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('frontdesk:callLogging.emergencyEscalation')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Call Templates */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Zap className="h-5 w-5" />
                {t('frontdesk:callLogging.quickTemplates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(CALL_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className={`w-full ${isRTL ? 'justify-end' : 'justify-start'}`}
                  onClick={() => applyTemplate(key as keyof typeof CALL_TEMPLATES)}
                  data-testid={`template-${key}`}
                >
                  <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {template.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('frontdesk:callLogging.callDetails')}</CardTitle>
                  <CardDescription>{t('frontdesk:callLogging.callDetailsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Call Type */}
                    <FormField
                      control={form.control}
                      name="callType"
                      render={({ field }) => (
                        <FormItem className="space-y-3" data-testid="field-call-type">
                          <FormLabel>{t('frontdesk:callLogging.callType')} {t('frontdesk:callLogging.required')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <RadioGroupItem value="incoming" id="incoming" />
                                <Label htmlFor="incoming">{t('frontdesk:callLogging.incoming')}</Label>
                              </div>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <RadioGroupItem value="outgoing" id="outgoing" />
                                <Label htmlFor="outgoing">{t('frontdesk:callLogging.outgoing')}</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Call Purpose */}
                    <FormField
                      control={form.control}
                      name="callPurpose"
                      render={({ field }) => (
                        <FormItem data-testid="field-call-purpose">
                          <FormLabel>{t('frontdesk:callLogging.callPurpose')} {t('frontdesk:callLogging.required')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('frontdesk:callLogging.selectPurpose')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="inquiry">{t('frontdesk:callLogging.inquiry')}</SelectItem>
                              <SelectItem value="follow_up">{t('frontdesk:callLogging.followUp')}</SelectItem>
                              <SelectItem value="complaint">{t('frontdesk:callLogging.complaint')}</SelectItem>
                              <SelectItem value="booking">{t('frontdesk:callLogging.booking')}</SelectItem>
                              <SelectItem value="general">{t('frontdesk:callLogging.general')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Caller Name */}
                    <FormField
                      control={form.control}
                      name="callerName"
                      render={({ field }) => (
                        <FormItem data-testid="field-caller-name">
                          <FormLabel>{t('frontdesk:callLogging.callerName')} {t('frontdesk:callLogging.required')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('frontdesk:callLogging.callerNamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Caller Phone */}
                    <FormField
                      control={form.control}
                      name="callerPhone"
                      render={({ field }) => (
                        <FormItem data-testid="field-caller-phone">
                          <FormLabel>{t('frontdesk:callLogging.callerPhone')} {t('frontdesk:callLogging.required')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('frontdesk:callLogging.callerPhonePlaceholder')} 
                              {...field} 
                              dir="ltr"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            {t('frontdesk:callLogging.phoneFormat')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Caller Email */}
                    <FormField
                      control={form.control}
                      name="callerEmail"
                      render={({ field }) => (
                        <FormItem data-testid="field-caller-email">
                          <FormLabel>{t('frontdesk:callLogging.callerEmail')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder={t('frontdesk:callLogging.callerEmailPlaceholder')} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Call Outcome */}
                    <FormField
                      control={form.control}
                      name="callResult"
                      render={({ field }) => (
                        <FormItem data-testid="field-call-result">
                          <FormLabel>{t('frontdesk:callLogging.callOutcome')} {t('frontdesk:callLogging.required')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('frontdesk:callLogging.selectOutcome')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="successful">{t('frontdesk:callLogging.successful')}</SelectItem>
                              <SelectItem value="voicemail">{t('frontdesk:callLogging.voicemail')}</SelectItem>
                              <SelectItem value="no_answer">{t('frontdesk:callLogging.noAnswer')}</SelectItem>
                              <SelectItem value="busy">{t('frontdesk:callLogging.busy')}</SelectItem>
                              <SelectItem value="scheduled_callback">{t('frontdesk:callLogging.scheduledCallback')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('frontdesk:callLogging.callContentNotes')}</CardTitle>
                  <CardDescription>{t('frontdesk:callLogging.callContentDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conversation Summary */}
                  <FormField
                    control={form.control}
                    name="callNotes"
                    render={({ field }) => (
                      <FormItem data-testid="field-call-notes">
                        <FormLabel>{t('frontdesk:callLogging.conversationSummary')} {t('frontdesk:callLogging.required')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('frontdesk:callLogging.conversationPlaceholder')}
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('frontdesk:callLogging.conversationDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Action Items */}
                    <FormField
                      control={form.control}
                      name="actionItems"
                      render={({ field }) => (
                        <FormItem data-testid="field-action-items">
                          <FormLabel>{t('frontdesk:callLogging.actionItems')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('frontdesk:callLogging.actionItemsPlaceholder')}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Next Steps */}
                    <FormField
                      control={form.control}
                      name="nextSteps"
                      render={({ field }) => (
                        <FormItem data-testid="field-next-steps">
                          <FormLabel>{t('frontdesk:callLogging.nextSteps')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('frontdesk:callLogging.nextStepsPlaceholder')}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Satisfaction */}
                    <FormField
                      control={form.control}
                      name="customerSatisfaction"
                      render={({ field }) => (
                        <FormItem data-testid="field-customer-satisfaction">
                          <FormLabel>{t('frontdesk:callLogging.customerSatisfaction')}</FormLabel>
                          <FormControl>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => field.onChange(star)}
                                  className={`p-1 ${star <= (field.value || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  <Star className="h-6 w-6 fill-current" />
                                </button>
                              ))}
                              <span className={`text-sm text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
                                {field.value || 0}/5
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Urgency Level */}
                    <FormField
                      control={form.control}
                      name="urgencyLevel"
                      render={({ field }) => (
                        <FormItem data-testid="field-urgency-level">
                          <FormLabel>{t('frontdesk:callLogging.urgencyLevel')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('frontdesk:callLogging.selectUrgency')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t('frontdesk:callLogging.urgencyLow')}</SelectItem>
                              <SelectItem value="medium">{t('frontdesk:callLogging.urgencyMedium')}</SelectItem>
                              <SelectItem value="high">{t('frontdesk:callLogging.urgencyHigh')}</SelectItem>
                              <SelectItem value="urgent">{t('frontdesk:callLogging.urgencyUrgent')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('frontdesk:callLogging.integrationFollowUp')}</CardTitle>
                  <CardDescription>{t('frontdesk:callLogging.integrationDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Link to Student */}
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem data-testid="field-student-link">
                          <FormLabel>{t('frontdesk:callLogging.linkToStudent')}</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('frontdesk:callLogging.selectStudent')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(students) && students.map((student: any) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.firstName} {student.lastName} - {student.phoneNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t('frontdesk:callLogging.linkDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Needs Follow-up */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="needsFollowUp"
                        render={({ field }) => (
                          <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-3 ${isRTL ? 'flex-row-reverse' : ''}`} data-testid="field-needs-followup">
                            <div className="space-y-0.5">
                              <FormLabel>{t('frontdesk:callLogging.needsFollowUp')}</FormLabel>
                              <FormDescription>
                                {t('frontdesk:callLogging.scheduleFollowUp')}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {form.watch('needsFollowUp') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                      {/* Follow-up Date */}
                      <FormField
                        control={form.control}
                        name="followUpDate"
                        render={({ field }) => (
                          <FormItem data-testid="field-followup-date">
                            <FormLabel>{t('frontdesk:callLogging.followUpDate')}</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Follow-up Method */}
                      <FormField
                        control={form.control}
                        name="followUpMethod"
                        render={({ field }) => (
                          <FormItem data-testid="field-followup-method">
                            <FormLabel>{t('frontdesk:callLogging.followUpMethod')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('frontdesk:callLogging.selectMethod')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="call">{t('frontdesk:callLogging.methodCall')}</SelectItem>
                                <SelectItem value="email">{t('frontdesk:callLogging.methodEmail')}</SelectItem>
                                <SelectItem value="sms">{t('frontdesk:callLogging.methodSMS')}</SelectItem>
                                <SelectItem value="whatsapp">{t('frontdesk:callLogging.methodWhatsApp')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Assign Follow-up To */}
                      <FormField
                        control={form.control}
                        name="assignFollowUpTo"
                        render={({ field }) => (
                          <FormItem data-testid="field-followup-assignee">
                            <FormLabel>{t('frontdesk:callLogging.assignFollowUpTo')}</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('frontdesk:callLogging.selectStaff')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(staff) && staff.map((member: any) => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.firstName} {member.lastName} ({member.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Actions */}
              <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  type="submit"
                  disabled={createCallLogMutation.isPending}
                  className="flex-1"
                  data-testid="submit-call-log"
                >
                  {createCallLogMutation.isPending ? (
                    t('frontdesk:callLogging.saving')
                  ) : (
                    <>
                      <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('frontdesk:callLogging.completeCallLog')}
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => autoSave()}
                  disabled={!hasUnsavedChanges}
                  data-testid="save-draft"
                >
                  <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('frontdesk:callLogging.saveDraft')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue('callResult', 'scheduled_callback');
                    form.setValue('needsFollowUp', true);
                  }}
                  data-testid="schedule-callback"
                >
                  <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('frontdesk:callLogging.scheduleCallback')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
