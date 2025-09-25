import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  UserPlus, 
  Phone, 
  Mail, 
  Languages, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Save, 
  Send, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { InsertFrontDeskOperation } from '@shared/schema';

// Iranian phone validation
const iranianPhoneRegex = /^(\+98|0)?9\d{9}$/;

// Comprehensive intake form schema
const intakeFormSchema = z.object({
  // Contact Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  middleName: z.string().optional(),
  visitorPhone: z.string().regex(iranianPhoneRegex, 'Please enter a valid Iranian mobile number'),
  secondaryPhone: z.string().regex(iranianPhoneRegex, 'Please enter a valid Iranian mobile number').optional().or(z.literal('')),
  visitorEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  preferredContactMethod: z.enum(['phone', 'email', 'sms']),
  
  // Language Learning Details
  targetLanguages: z.array(z.string()).min(1, 'Please select at least one target language'),
  proficiencyLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'intermediate', 'advanced']),
  learningGoals: z.array(z.enum(['conversation', 'business', 'academic', 'exam_prep', 'travel', 'other'])).min(1, 'Please select at least one learning goal'),
  previousExperience: z.string().optional(),
  urgencyLevel: z.enum(['immediate', 'within_month', 'flexible']),
  
  // Schedule Preferences
  preferredDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).min(1, 'Please select at least one preferred day'),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])).min(1, 'Please select at least one time slot'),
  frequencyPreference: z.enum(['1x_week', '2x_week', '3x_week', 'flexible']),
  classTypePreference: z.enum(['group', 'private', 'both']),
  budgetRange: z.string().min(1, 'Please specify a budget range'),
  
  // Additional Information
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().regex(iranianPhoneRegex, 'Please enter a valid Iranian mobile number'),
  howHeardAbout: z.string().min(1, 'Please specify how you heard about us'),
  specialRequirements: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  clerkObservations: z.string().optional(),
});

type IntakeFormData = z.infer<typeof intakeFormSchema>;

// Form sections for progress tracking
const FORM_SECTIONS = [
  { id: 'contact', label: 'Contact Information', icon: Phone },
  { id: 'language', label: 'Language Learning', icon: Languages },
  { id: 'schedule', label: 'Schedule Preferences', icon: Calendar },
  { id: 'additional', label: 'Additional Information', icon: MessageSquare },
];

// Options for form fields
const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'russian', label: 'Russian' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
];

const LEARNING_GOALS = [
  { value: 'conversation', label: 'General Conversation' },
  { value: 'business', label: 'Business Communication' },
  { value: 'academic', label: 'Academic Studies' },
  { value: 'exam_prep', label: 'Exam Preparation (IELTS, TOEFL, etc.)' },
  { value: 'travel', label: 'Travel & Tourism' },
  { value: 'other', label: 'Other' },
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (8:00 - 12:00)' },
  { value: 'afternoon', label: 'Afternoon (12:00 - 17:00)' },
  { value: 'evening', label: 'Evening (17:00 - 21:00)' },
];

const HOW_HEARD_OPTIONS = [
  'Google Search',
  'Social Media (Instagram, Telegram)',
  'Friend/Family Recommendation',
  'Walking by the Institute',
  'Online Advertisement',
  'Local Newspaper',
  'University/School Reference',
  'Previous Student',
  'Other',
];

export default function WalkInIntake() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftId, setDraftId] = useState<string | null>(null);

  // Initialize form with default values
  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      visitorPhone: '',
      secondaryPhone: '',
      visitorEmail: '',
      preferredContactMethod: 'phone',
      targetLanguages: [],
      proficiencyLevel: 'beginner',
      learningGoals: [],
      previousExperience: '',
      urgencyLevel: 'flexible',
      preferredDays: [],
      preferredTimeSlots: [],
      frequencyPreference: '2x_week',
      classTypePreference: 'both',
      budgetRange: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      howHeardAbout: '',
      specialRequirements: '',
      accessibilityNeeds: '',
      clerkObservations: '',
    },
  });

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Debounce auto-save
      const timeoutId = setTimeout(() => {
        if (Object.keys(form.formState.dirtyFields).length > 0) {
          handleAutoSave(value as IntakeFormData);
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Load draft from sessionStorage on mount (security fix: PII should not persist in localStorage)
  useEffect(() => {
    const savedDraft = sessionStorage.getItem('walkInIntakeDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        form.reset(draftData.formData);
        setDraftId(draftData.id);
        setAutoSaveStatus('saved');
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Clear draft on unmount for security
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('walkInIntakeDraft');
    };
  }, []);

  const handleAutoSave = async (formData: IntakeFormData) => {
    setAutoSaveStatus('saving');
    try {
      const draftData = {
        id: draftId || Date.now().toString(),
        formData,
        timestamp: new Date().toISOString(),
      };
      
      sessionStorage.setItem('walkInIntakeDraft', JSON.stringify(draftData));
      setDraftId(draftData.id);
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  };

  // Submit intake form mutation
  const submitIntakeMutation = useMutation({
    mutationFn: async (data: IntakeFormData) => {
      // Prepare data for API
      const visitorName = `${data.firstName} ${data.lastName}`.trim();
      
      const frontDeskOperation: Omit<InsertFrontDeskOperation, 'handledBy'> = {
        visitorName,
        visitorPhone: data.visitorPhone,
        visitorEmail: data.visitorEmail || null,
        visitType: 'inquiry',
        visitPurpose: 'New student walk-in intake and consultation',
        inquiryType: 'walk_in_intake',
        interestedLanguage: data.targetLanguages.join(', '),
        currentLevel: data.proficiencyLevel,
        preferredSchedule: `${data.preferredDays.join(', ')} - ${data.preferredTimeSlots.join(', ')}`,
        budget: data.budgetRange ? parseFloat(data.budgetRange.replace(/[^\d.]/g, '')) : null,
        status: 'pending',
        priority: data.urgencyLevel === 'immediate' ? 'high' : 'normal',
        needsFollowUp: true,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        tags: ['walk_in_intake', data.urgencyLevel, data.classTypePreference],
        intakeFormData: {
          middleName: data.middleName,
          secondaryPhone: data.secondaryPhone,
          preferredContactMethod: data.preferredContactMethod,
          targetLanguages: data.targetLanguages,
          proficiencyLevel: data.proficiencyLevel,
          learningGoals: data.learningGoals,
          previousExperience: data.previousExperience,
          urgencyLevel: data.urgencyLevel,
          preferredDays: data.preferredDays,
          preferredTimeSlots: data.preferredTimeSlots,
          frequencyPreference: data.frequencyPreference,
          classTypePreference: data.classTypePreference,
          budgetRange: data.budgetRange,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          howHeardAbout: data.howHeardAbout,
          specialRequirements: data.specialRequirements,
          accessibilityNeeds: data.accessibilityNeeds,
          clerkObservations: data.clerkObservations,
        },
      };

      // Submit the front desk operation (automatic task creation now handled on backend)
      const operationResult = await apiRequest('/api/front-desk/operations', {
        method: 'POST',
        body: JSON.stringify(frontDeskOperation),
      });

      return operationResult;
    },
    onSuccess: (data) => {
      // Clear draft from sessionStorage
      sessionStorage.removeItem('walkInIntakeDraft');
      setDraftId(null);
      setAutoSaveStatus('idle');
      
      // Invalidate both operations and tasks queries for real-time dashboard updates
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/tasks/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/tasks/overdue'] });
      
      toast({
        title: 'Intake Form Submitted Successfully',
        description: `Walk-in intake #${data.id} has been recorded and follow-up task automatically created.`,
      });
      
      // Navigate back to dashboard using wouter
      setLocation('/frontdesk');
    },
    onError: (error: any) => {
      console.error('Form submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit intake form. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: IntakeFormData) => {
    submitIntakeMutation.mutate(data);
  };

  const nextSection = () => {
    if (currentSection < FORM_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const clearForm = () => {
    form.reset();
    sessionStorage.removeItem('walkInIntakeDraft');
    setDraftId(null);
    setAutoSaveStatus('idle');
    toast({
      title: 'Form Cleared',
      description: 'All form data has been cleared.',
    });
  };

  const progress = ((currentSection + 1) / FORM_SECTIONS.length) * 100;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl" data-testid="walk-in-intake-form">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              Walk-in Student Intake
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive student information collection form</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/frontdesk')} data-testid="btn-back-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progress: Step {currentSection + 1} of {FORM_SECTIONS.length}</span>
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Saving...
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Draft saved
                </div>
              )}
              {autoSaveStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Save failed
                </div>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Section indicators */}
          <div className="flex justify-between">
            {FORM_SECTIONS.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className={`flex items-center gap-1 text-xs ${
                    index <= currentSection ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{section.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(FORM_SECTIONS[currentSection].icon, { className: "h-5 w-5" })}
                {FORM_SECTIONS[currentSection].label}
              </CardTitle>
              <CardDescription>
                {currentSection === 0 && 'Basic contact information and preferred communication method'}
                {currentSection === 1 && 'Language learning goals and current proficiency level'}
                {currentSection === 2 && 'Schedule preferences and class type requirements'}
                {currentSection === 3 && 'Emergency contact and additional requirements'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information Section */}
              {currentSection === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-middle-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visitorPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="09123456789"
                            data-testid="input-primary-phone"
                          />
                        </FormControl>
                        <FormDescription>Iranian mobile number format</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="09123456789"
                            data-testid="input-secondary-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visitorEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="example@email.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredContactMethod"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Preferred Contact Method *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                            data-testid="radio-contact-method"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="phone" id="phone" />
                              <Label htmlFor="phone">Phone Call</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="email" id="email" />
                              <Label htmlFor="email">Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sms" id="sms" />
                              <Label htmlFor="sms">SMS</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Language Learning Details Section */}
              {currentSection === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="targetLanguages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Language(s) to Learn *</FormLabel>
                        <FormDescription>Select all languages you want to learn</FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                          {LANGUAGE_OPTIONS.map((language) => (
                            <div key={language.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`language-${language.value}`}
                                checked={field.value?.includes(language.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, language.value]);
                                  } else {
                                    field.onChange(field.value?.filter((lang) => lang !== language.value));
                                  }
                                }}
                                data-testid={`checkbox-language-${language.value}`}
                              />
                              <Label 
                                htmlFor={`language-${language.value}`}
                                className="text-sm font-normal"
                              >
                                {language.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proficiencyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Proficiency Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-proficiency-level">
                              <SelectValue placeholder="Select current level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="A1">A1 - Beginner</SelectItem>
                            <SelectItem value="A2">A2 - Elementary</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="B1">B1 - Intermediate</SelectItem>
                            <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="C1">C1 - Advanced</SelectItem>
                            <SelectItem value="C2">C2 - Proficient</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="learningGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Goals *</FormLabel>
                        <FormDescription>What do you want to achieve with language learning?</FormDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {LEARNING_GOALS.map((goal) => (
                            <div key={goal.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`goal-${goal.value}`}
                                checked={field.value?.includes(goal.value as any)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, goal.value]);
                                  } else {
                                    field.onChange(field.value?.filter((g) => g !== goal.value));
                                  }
                                }}
                                data-testid={`checkbox-goal-${goal.value}`}
                              />
                              <Label 
                                htmlFor={`goal-${goal.value}`}
                                className="text-sm font-normal"
                              >
                                {goal.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Language Learning Experience</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe any previous language learning experience, courses taken, or self-study methods..."
                            rows={3}
                            data-testid="textarea-previous-experience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgencyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency Level *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                            data-testid="radio-urgency-level"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="immediate" id="immediate" />
                              <Label htmlFor="immediate">Immediate (start this week)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="within_month" id="within_month" />
                              <Label htmlFor="within_month">Within a month</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="flexible" id="flexible" />
                              <Label htmlFor="flexible">Flexible timing</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Schedule Preferences Section */}
              {currentSection === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="preferredDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Days of Week *</FormLabel>
                        <FormDescription>Select all days you're available for classes</FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`day-${day.value}`}
                                checked={field.value?.includes(day.value as any)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, day.value]);
                                  } else {
                                    field.onChange(field.value?.filter((d) => d !== day.value));
                                  }
                                }}
                                data-testid={`checkbox-day-${day.value}`}
                              />
                              <Label 
                                htmlFor={`day-${day.value}`}
                                className="text-sm font-normal"
                              >
                                {day.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredTimeSlots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time Slots *</FormLabel>
                        <FormDescription>Select all time periods that work for you</FormDescription>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                          {TIME_SLOTS.map((slot) => (
                            <div key={slot.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`time-${slot.value}`}
                                checked={field.value?.includes(slot.value as any)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, slot.value]);
                                  } else {
                                    field.onChange(field.value?.filter((t) => t !== slot.value));
                                  }
                                }}
                                data-testid={`checkbox-time-${slot.value}`}
                              />
                              <Label 
                                htmlFor={`time-${slot.value}`}
                                className="text-sm font-normal"
                              >
                                {slot.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="frequencyPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency Preference *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-frequency">
                                <SelectValue placeholder="How often per week?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1x_week">Once per week</SelectItem>
                              <SelectItem value="2x_week">Twice per week</SelectItem>
                              <SelectItem value="3x_week">Three times per week</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="classTypePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Type Preference *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-class-type">
                                <SelectValue placeholder="Select class type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="group">Group Classes</SelectItem>
                              <SelectItem value="private">Private Tutoring</SelectItem>
                              <SelectItem value="both">Both Group and Private</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range for Lessons *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., 2,000,000 - 3,000,000 IRR per month"
                            data-testid="input-budget-range"
                          />
                        </FormControl>
                        <FormDescription>Please specify your monthly budget for language lessons</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Additional Information Section */}
              {currentSection === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-emergency-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Phone *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="09123456789"
                              data-testid="input-emergency-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="howHeardAbout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about our institute? *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-how-heard">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HOW_HEARD_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any special requirements for your learning experience..."
                            rows={3}
                            data-testid="textarea-special-requirements"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessibilityNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accessibility Needs</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any accessibility requirements or accommodations needed..."
                            rows={3}
                            data-testid="textarea-accessibility-needs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clerkObservations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Front Desk Clerk Observations</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Notes about the student's demeanor, specific interests, concerns, or other observations..."
                            rows={4}
                            data-testid="textarea-clerk-observations"
                          />
                        </FormControl>
                        <FormDescription>
                          Internal notes about the walk-in interaction, student's attitude, specific needs mentioned, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentSection > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevSection}
                  data-testid="btn-previous-section"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearForm}
                data-testid="btn-clear-form"
              >
                Clear Form
              </Button>
            </div>

            <div className="flex gap-2">
              {currentSection < FORM_SECTIONS.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={nextSection}
                  data-testid="btn-next-section"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={submitIntakeMutation.isPending}
                  data-testid="btn-submit-intake"
                >
                  {submitIntakeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Intake Form
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}