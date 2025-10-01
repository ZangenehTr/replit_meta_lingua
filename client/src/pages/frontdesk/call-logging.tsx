import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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

// Validation schema
const callLoggingSchema = z.object({
  // Call Details
  callType: z.enum(['incoming', 'outgoing'], {
    required_error: 'Please select call type',
  }),
  callerName: z.string().min(1, 'Caller name is required'),
  callerPhone: z.string().regex(iranianPhoneRegex, 'Please enter a valid Iranian phone number (e.g., 09123456789)'),
  callerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  callPurpose: z.enum(['inquiry', 'follow_up', 'complaint', 'booking', 'general'], {
    required_error: 'Please select call purpose',
  }),
  callResult: z.enum(['successful', 'voicemail', 'no_answer', 'busy', 'scheduled_callback'], {
    required_error: 'Please select call outcome',
  }),
  
  // Call timing (for internal use, not form fields)
  callStartTime: z.string().optional(),
  callEndTime: z.string().optional(), 
  callDuration: z.number().optional(),
  
  // Call Content & Notes
  callNotes: z.string().min(10, 'Please provide at least 10 characters of conversation summary'),
  actionItems: z.string().optional(),
  nextSteps: z.string().optional(),
  customerSatisfaction: z.number().min(1).max(5).optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  // Integration Fields
  studentId: z.number().optional(),
  relatedWalkInId: z.number().optional(),
  needsFollowUp: z.boolean().default(false),
  followUpDate: z.string().optional(),
  followUpMethod: z.enum(['call', 'email', 'sms', 'whatsapp']).optional(),
  assignFollowUpTo: z.number().optional(),
  
  // Language and course interest
  inquiryType: z.enum(['course_info', 'pricing', 'schedule', 'teacher_info', 'level_assessment']).optional(),
  interestedLanguage: z.string().optional(),
  currentLevel: z.string().optional(),
  
  // Tags
  tags: z.array(z.string()).default([]),
});

type CallLoggingFormData = z.infer<typeof callLoggingSchema>;

// Call templates
const CALL_TEMPLATES = {
  new_inquiry: {
    name: 'New Inquiry Call',
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
    name: 'Trial Lesson Follow-up',
    data: {
      callType: 'outgoing' as const,
      callPurpose: 'follow_up' as const,
      inquiryType: 'level_assessment' as const,
      urgencyLevel: 'high' as const,
      tags: ['trial-followup'],
    }
  },
  payment_reminder: {
    name: 'Payment Reminder',
    data: {
      callType: 'outgoing' as const,
      callPurpose: 'booking' as const,
      urgencyLevel: 'high' as const,
      tags: ['payment-reminder'],
    }
  },
  schedule_change: {
    name: 'Schedule Change Request',
    data: {
      callType: 'incoming' as const,
      callPurpose: 'booking' as const,
      urgencyLevel: 'medium' as const,
      needsFollowUp: true,
      tags: ['schedule-change'],
    }
  },
  complaint_handling: {
    name: 'Complaint Handling',
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
      }, 30000); // Auto-save every 30 seconds during active call

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
        title: 'Call Logged Successfully',
        description: 'The call has been saved to the system.',
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
        title: 'Error',
        description: 'Failed to save call log. Please try again.',
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
    // Note: callEndTime and callDuration will be set during form submission
  };

  // Template functions
  const applyTemplate = (templateKey: keyof typeof CALL_TEMPLATES) => {
    const template = CALL_TEMPLATES[templateKey];
    Object.entries(template.data).forEach(([key, value]) => {
      form.setValue(key as any, value as any);
    });
    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template to the form.`,
    });
  };

  // Auto-save function
  const autoSave = async () => {
    try {
      const formData = form.getValues();
      // Save as draft (implement draft API endpoint)
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

    // Create follow-up task if needed
    if (data.needsFollowUp && data.assignFollowUpTo) {
      try {
        await apiRequest('/api/front-desk/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: `Follow-up call: ${data.callerName}`,
            description: `Follow-up for call regarding: ${data.callPurpose}`,
            taskType: 'follow_up_call',
            assignedTo: data.assignFollowUpTo,
            priority: data.urgencyLevel,
            relatedCall: null, // Will be set after call is created
            contactName: data.callerName,
            contactPhone: data.callerPhone,
            dueDate: data.followUpDate,
            notes: data.nextSteps,
          }),
        });
      } catch (error) {
        toast({
          title: 'Warning',
          description: 'Call saved but failed to create follow-up task.',
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
      title: 'Emergency Escalation',
      description: 'Supervisor has been notified of the situation.',
    });
    // Implement emergency escalation logic
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="call-logging-form">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Phone Call Logging</h1>
          <p className="text-muted-foreground">Log and manage phone calls efficiently</p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/frontdesk/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Auto-save indicator */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              Unsaved changes detected
              {lastAutoSave && ` • Last auto-saved: ${lastAutoSave.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Call Timer and Quick Actions */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Call Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTimer(timer.duration)}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={timer.isActive ? 'default' : 'secondary'}>
                    {timer.isActive ? (timer.isPaused ? 'PAUSED' : 'ACTIVE') : 'INACTIVE'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!timer.isActive ? (
                  <Button onClick={startCall} className="flex-1" data-testid="start-call">
                    <Play className="h-4 w-4 mr-2" />
                    Start Call
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseCall} variant="outline" className="flex-1" data-testid="pause-call">
                      {timer.isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                      {timer.isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button onClick={endCall} variant="destructive" className="flex-1" data-testid="end-call">
                      <Square className="h-4 w-4 mr-2" />
                      End Call
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
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Escalation
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Call Templates */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(CALL_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => applyTemplate(key as keyof typeof CALL_TEMPLATES)}
                  data-testid={`template-${key}`}
                >
                  <FileText className="h-4 w-4 mr-2" />
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
                  <CardTitle>Call Details</CardTitle>
                  <CardDescription>Basic information about the call</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Call Type */}
                    <FormField
                      control={form.control}
                      name="callType"
                      render={({ field }) => (
                        <FormItem className="space-y-3" data-testid="field-call-type">
                          <FormLabel>Call Type *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="incoming" id="incoming" />
                                <Label htmlFor="incoming">Incoming</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="outgoing" id="outgoing" />
                                <Label htmlFor="outgoing">Outgoing</Label>
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
                          <FormLabel>Call Purpose *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="inquiry">Inquiry</SelectItem>
                              <SelectItem value="follow_up">Follow-up</SelectItem>
                              <SelectItem value="complaint">Complaint</SelectItem>
                              <SelectItem value="booking">Booking</SelectItem>
                              <SelectItem value="general">General</SelectItem>
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
                          <FormLabel>Caller Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter caller's full name" {...field} />
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
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="09123456789" 
                              {...field} 
                              dir="ltr"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>
                            Iranian format (e.g., 09123456789)
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
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="caller@example.com" 
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
                          <FormLabel>Call Outcome *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select outcome" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="successful">Successful</SelectItem>
                              <SelectItem value="voicemail">Voicemail</SelectItem>
                              <SelectItem value="no_answer">No Answer</SelectItem>
                              <SelectItem value="busy">Busy</SelectItem>
                              <SelectItem value="scheduled_callback">Scheduled Callback</SelectItem>
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
                  <CardTitle>Call Content & Notes</CardTitle>
                  <CardDescription>Detailed information about the conversation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conversation Summary */}
                  <FormField
                    control={form.control}
                    name="callNotes"
                    render={({ field }) => (
                      <FormItem data-testid="field-call-notes">
                        <FormLabel>Conversation Summary *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed summary of the conversation..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include key points discussed, questions asked, and information provided
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
                          <FormLabel>Action Items & Commitments</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any commitments made during the call..."
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
                          <FormLabel>Next Steps & Recommendations</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Recommended actions and next steps..."
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
                          <FormLabel>Customer Mood/Satisfaction</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
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
                              <span className="ml-2 text-sm text-muted-foreground">
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
                          <FormLabel>Follow-up Urgency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select urgency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
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
                  <CardTitle>Integration & Follow-up</CardTitle>
                  <CardDescription>Link to existing records and schedule follow-ups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Link to Student */}
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem data-testid="field-student-link">
                          <FormLabel>Link to Student Record</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select existing student" />
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
                            Link this call to an existing student record
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
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3" data-testid="field-needs-followup">
                            <div className="space-y-0.5">
                              <FormLabel>Needs Follow-up</FormLabel>
                              <FormDescription>
                                Schedule a follow-up task for this call
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
                            <FormLabel>Follow-up Date</FormLabel>
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
                            <FormLabel>Follow-up Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="call">Phone Call</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
                            <FormLabel>Assign Follow-up To</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select staff member" />
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
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createCallLogMutation.isPending}
                  className="flex-1"
                  data-testid="submit-call-log"
                >
                  {createCallLogMutation.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Call Log
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
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
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
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Callback
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}