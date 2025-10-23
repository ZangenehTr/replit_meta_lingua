import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { cn } from '@/lib/utils';
import type { InsertFrontDeskOperation } from '@shared/schema';

// Iranian phone validation
const iranianPhoneRegex = /^(\+98|0)?9\d{9}$/;

// Type definition for intake form data (for type inference)
// The actual schema with validation messages is created inside the component
const baseIntakeFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  visitorPhone: z.string(),
  secondaryPhone: z.string().optional().or(z.literal('')),
  visitorEmail: z.string().optional().or(z.literal('')),
  preferredContactMethod: z.enum(['phone', 'email', 'sms']),
  targetLanguages: z.array(z.string()),
  proficiencyLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'intermediate', 'advanced']),
  learningGoals: z.array(z.enum(['conversation', 'business', 'academic', 'exam_prep', 'travel', 'other'])),
  previousExperience: z.string().optional(),
  urgencyLevel: z.enum(['immediate', 'within_month', 'flexible']),
  preferredDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])),
  frequencyPreference: z.enum(['1x_week', '2x_week', '3x_week', 'flexible']),
  classTypePreference: z.enum(['group', 'private', 'both']),
  budgetRange: z.string(),
  emergencyContactName: z.string(),
  emergencyContactPhone: z.string(),
  howHeardAbout: z.string(),
  specialRequirements: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  clerkObservations: z.string().optional(),
});

type IntakeFormData = z.infer<typeof baseIntakeFormSchema>;

export default function WalkInIntake() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['frontdesk', 'common']);
  const isRTL = i18n.dir() === 'rtl';

  // Memoized schema with internationalized validation messages
  const intakeFormSchema = useMemo(() => z.object({
    // Contact Information
    firstName: z.string().min(2, t('frontdesk:walkIn.intake.validations.firstNameMin')),
    lastName: z.string().min(2, t('frontdesk:walkIn.intake.validations.lastNameMin')),
    middleName: z.string().optional(),
    visitorPhone: z.string().regex(iranianPhoneRegex, t('frontdesk:walkIn.intake.validations.invalidPhone')),
    secondaryPhone: z.string().regex(iranianPhoneRegex, t('frontdesk:walkIn.intake.validations.invalidPhone')).optional().or(z.literal('')),
    visitorEmail: z.string().email(t('frontdesk:walkIn.intake.validations.invalidEmail')).optional().or(z.literal('')),
    preferredContactMethod: z.enum(['phone', 'email', 'sms']),
    
    // Language Learning Details
    targetLanguages: z.array(z.string()).min(1, t('frontdesk:walkIn.intake.validations.targetLanguagesMin')),
    proficiencyLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'intermediate', 'advanced']),
    learningGoals: z.array(z.enum(['conversation', 'business', 'academic', 'exam_prep', 'travel', 'other'])).min(1, t('frontdesk:walkIn.intake.validations.learningGoalsMin')),
    previousExperience: z.string().optional(),
    urgencyLevel: z.enum(['immediate', 'within_month', 'flexible']),
    
    // Schedule Preferences
    preferredDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).min(1, t('frontdesk:walkIn.intake.validations.preferredDaysMin')),
    preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])).min(1, t('frontdesk:walkIn.intake.validations.preferredTimeSlotsMin')),
    frequencyPreference: z.enum(['1x_week', '2x_week', '3x_week', 'flexible']),
    classTypePreference: z.enum(['group', 'private', 'both']),
    budgetRange: z.string().min(1, t('frontdesk:walkIn.intake.validations.budgetRequired')),
    
    // Additional Information
    emergencyContactName: z.string().min(2, t('frontdesk:walkIn.intake.validations.emergencyContactNameRequired')),
    emergencyContactPhone: z.string().regex(iranianPhoneRegex, t('frontdesk:walkIn.intake.validations.emergencyContactPhoneInvalid')),
    howHeardAbout: z.string().min(1, t('frontdesk:walkIn.intake.validations.howHeardRequired')),
    specialRequirements: z.string().optional(),
    accessibilityNeeds: z.string().optional(),
    clerkObservations: z.string().optional(),
  }), [t]);

  // Form sections for progress tracking
  const FORM_SECTIONS = [
    { id: 'contact', label: t('frontdesk:walkIn.intake.contactInfo'), icon: Phone },
    { id: 'language', label: t('frontdesk:walkIn.intake.languageLearning'), icon: Languages },
    { id: 'schedule', label: t('frontdesk:walkIn.intake.schedulePrefs'), icon: Calendar },
    { id: 'additional', label: t('frontdesk:walkIn.intake.additionalInfo'), icon: MessageSquare },
  ];

  // Options for form fields
  const LANGUAGE_OPTIONS = [
    { value: 'english', label: t('frontdesk:walkIn.intake.english') },
    { value: 'french', label: t('frontdesk:walkIn.intake.french') },
    { value: 'german', label: t('frontdesk:walkIn.intake.german') },
    { value: 'spanish', label: t('frontdesk:walkIn.intake.spanish') },
    { value: 'italian', label: t('frontdesk:walkIn.intake.italian') },
    { value: 'portuguese', label: t('frontdesk:walkIn.intake.portuguese') },
    { value: 'russian', label: t('frontdesk:walkIn.intake.russian') },
    { value: 'arabic', label: t('frontdesk:walkIn.intake.arabic') },
    { value: 'chinese', label: t('frontdesk:walkIn.intake.chinese') },
    { value: 'japanese', label: t('frontdesk:walkIn.intake.japanese') },
    { value: 'korean', label: t('frontdesk:walkIn.intake.korean') },
  ];

  const LEARNING_GOALS = [
    { value: 'conversation', label: t('frontdesk:walkIn.intake.goalConversation') },
    { value: 'business', label: t('frontdesk:walkIn.intake.goalBusiness') },
    { value: 'academic', label: t('frontdesk:walkIn.intake.goalAcademic') },
    { value: 'exam_prep', label: t('frontdesk:walkIn.intake.goalExamPrep') },
    { value: 'travel', label: t('frontdesk:walkIn.intake.goalTravel') },
    { value: 'other', label: t('frontdesk:walkIn.intake.goalOther') },
  ];

  const DAYS_OF_WEEK = [
    { value: 'monday', label: t('frontdesk:walkIn.intake.monday') },
    { value: 'tuesday', label: t('frontdesk:walkIn.intake.tuesday') },
    { value: 'wednesday', label: t('frontdesk:walkIn.intake.wednesday') },
    { value: 'thursday', label: t('frontdesk:walkIn.intake.thursday') },
    { value: 'friday', label: t('frontdesk:walkIn.intake.friday') },
    { value: 'saturday', label: t('frontdesk:walkIn.intake.saturday') },
    { value: 'sunday', label: t('frontdesk:walkIn.intake.sunday') },
  ];

  const TIME_SLOTS = [
    { value: 'morning', label: t('frontdesk:walkIn.intake.morning') },
    { value: 'afternoon', label: t('frontdesk:walkIn.intake.afternoon') },
    { value: 'evening', label: t('frontdesk:walkIn.intake.evening') },
  ];

  const HOW_HEARD_OPTIONS = [
    t('frontdesk:walkIn.intake.howHeardGoogle'),
    t('frontdesk:walkIn.intake.howHeardSocial'),
    t('frontdesk:walkIn.intake.howHeardFriend'),
    t('frontdesk:walkIn.intake.howHeardWalkBy'),
    t('frontdesk:walkIn.intake.howHeardAd'),
    t('frontdesk:walkIn.intake.howHeardNewspaper'),
    t('frontdesk:walkIn.intake.howHeardSchool'),
    t('frontdesk:walkIn.intake.howHeardStudent'),
    t('frontdesk:walkIn.intake.howHeardOther'),
  ];
  
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
        title: t('frontdesk:walkIn.intake.submissionSuccess'),
        description: t('frontdesk:walkIn.intake.submissionSuccessDesc', { id: data.id }),
      });
      
      // Navigate back to dashboard using wouter
      setLocation('/frontdesk');
    },
    onError: (error: any) => {
      console.error('Form submission error:', error);
      toast({
        title: t('frontdesk:walkIn.intake.submissionFailed'),
        description: error?.message || t('frontdesk:walkIn.intake.submissionFailedDesc'),
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
      title: t('frontdesk:walkIn.intake.formCleared'),
      description: t('frontdesk:walkIn.intake.formClearedDesc'),
    });
  };

  const progress = ((currentSection + 1) / FORM_SECTIONS.length) * 100;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl" data-testid="walk-in-intake-form">
      {/* Header */}
      <div className="mb-6">
        <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
          <div>
            <h1 className={cn("text-3xl font-bold text-gray-900 flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <UserPlus className="h-8 w-8 text-blue-600" />
              {t('frontdesk:walkIn.intake.pageTitle')}
            </h1>
            <p className="text-gray-600 mt-1">{t('frontdesk:walkIn.intake.pageSubtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/frontdesk')} data-testid="btn-back-dashboard">
            <ArrowLeft className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('frontdesk:walkIn.intake.backToDashboard')}
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{t('frontdesk:walkIn.intake.progressStep', { current: currentSection + 1, total: FORM_SECTIONS.length })}</span>
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className={cn("h-3 w-3 animate-spin", isRTL ? "ml-1" : "mr-1")} />
                  {t('frontdesk:walkIn.intake.saving')}
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
                  {t('frontdesk:walkIn.intake.draftSaved')}
                </div>
              )}
              {autoSaveStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
                  {t('frontdesk:walkIn.intake.saveFailed')}
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
                {currentSection === 0 && t('frontdesk:walkIn.intake.contactInfoDesc')}
                {currentSection === 1 && t('frontdesk:walkIn.intake.languageLearningDesc')}
                {currentSection === 2 && t('frontdesk:walkIn.intake.schedulePrefsDesc')}
                {currentSection === 3 && t('frontdesk:walkIn.intake.additionalInfoDesc')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.firstName')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.lastName')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.middleName')}</FormLabel>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.primaryPhone')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t('frontdesk:walkIn.intake.phonePlaceholder')}
                            data-testid="input-primary-phone"
                          />
                        </FormControl>
                        <FormDescription>{t('frontdesk:walkIn.intake.phoneFormat')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('frontdesk:walkIn.intake.secondaryPhone')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t('frontdesk:walkIn.intake.phonePlaceholder')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.emailAddress')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder={t('frontdesk:walkIn.intake.emailPlaceholder')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.preferredContact')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                            data-testid="radio-contact-method"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="phone" id="phone" />
                              <Label htmlFor="phone">{t('frontdesk:walkIn.intake.phoneCall')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="email" id="email" />
                              <Label htmlFor="email">{t('frontdesk:walkIn.intake.email')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sms" id="sms" />
                              <Label htmlFor="sms">{t('frontdesk:walkIn.intake.sms')}</Label>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.targetLanguages')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormDescription>{t('frontdesk:walkIn.intake.targetLanguagesDesc')}</FormDescription>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.proficiencyLevel')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-proficiency-level">
                              <SelectValue placeholder={t('frontdesk:walkIn.intake.proficiencyLevel')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">{t('frontdesk:walkIn.intake.beginner')}</SelectItem>
                            <SelectItem value="A1">{t('frontdesk:walkIn.intake.proficiencyA1')}</SelectItem>
                            <SelectItem value="A2">{t('frontdesk:walkIn.intake.proficiencyA2')}</SelectItem>
                            <SelectItem value="intermediate">{t('frontdesk:walkIn.intake.intermediate')}</SelectItem>
                            <SelectItem value="B1">{t('frontdesk:walkIn.intake.proficiencyB1')}</SelectItem>
                            <SelectItem value="B2">{t('frontdesk:walkIn.intake.proficiencyB2')}</SelectItem>
                            <SelectItem value="advanced">{t('frontdesk:walkIn.intake.advanced')}</SelectItem>
                            <SelectItem value="C1">{t('frontdesk:walkIn.intake.proficiencyC1')}</SelectItem>
                            <SelectItem value="C2">{t('frontdesk:walkIn.intake.proficiencyC2')}</SelectItem>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.learningGoals')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormDescription>{t('frontdesk:walkIn.intake.learningGoalsDesc')}</FormDescription>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.previousExperience')}</FormLabel>
                        <FormDescription>{t('frontdesk:walkIn.intake.previousExperienceDesc')}</FormDescription>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('frontdesk:walkIn.intake.previousExperiencePlaceholder')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.urgencyLevel')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                            data-testid="radio-urgency-level"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="immediate" id="immediate" />
                              <Label htmlFor="immediate">{t('frontdesk:walkIn.intake.urgencyImmediate')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="within_month" id="within_month" />
                              <Label htmlFor="within_month">{t('frontdesk:walkIn.intake.urgencyMonth')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="flexible" id="flexible" />
                              <Label htmlFor="flexible">{t('frontdesk:walkIn.intake.urgencyFlexible')}</Label>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.preferredDays')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormDescription>{t('frontdesk:walkIn.intake.preferredDaysDesc')}</FormDescription>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.preferredTime')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormDescription>{t('frontdesk:walkIn.intake.preferredTimeDesc')}</FormDescription>
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
                          <FormLabel>{t('frontdesk:walkIn.intake.frequency')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-frequency">
                                <SelectValue placeholder={t('frontdesk:walkIn.intake.frequency')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1x_week">{t('frontdesk:walkIn.intake.frequency1x')}</SelectItem>
                              <SelectItem value="2x_week">{t('frontdesk:walkIn.intake.frequency2x')}</SelectItem>
                              <SelectItem value="3x_week">{t('frontdesk:walkIn.intake.frequency3x')}</SelectItem>
                              <SelectItem value="flexible">{t('frontdesk:walkIn.intake.frequencyFlexible')}</SelectItem>
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
                          <FormLabel>{t('frontdesk:walkIn.intake.classType')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-class-type">
                                <SelectValue placeholder={t('frontdesk:walkIn.intake.classType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="group">{t('frontdesk:walkIn.intake.classGroup')}</SelectItem>
                              <SelectItem value="private">{t('frontdesk:walkIn.intake.classPrivate')}</SelectItem>
                              <SelectItem value="both">{t('frontdesk:walkIn.intake.classBoth')}</SelectItem>
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
                        <FormLabel>{t('frontdesk:walkIn.intake.budgetRange')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t('frontdesk:walkIn.intake.budgetPlaceholder')}
                            data-testid="input-budget-range"
                          />
                        </FormControl>
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
                          <FormLabel>{t('frontdesk:walkIn.intake.emergencyContact')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
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
                          <FormLabel>{t('frontdesk:walkIn.intake.emergencyPhone')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={t('frontdesk:walkIn.intake.phonePlaceholder')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.howHeard')} {t('frontdesk:walkIn.intake.required')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-how-heard">
                              <SelectValue placeholder={t('frontdesk:walkIn.intake.howHeardPlaceholder')} />
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
                        <FormLabel>{t('frontdesk:walkIn.intake.specialRequirements')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('frontdesk:walkIn.intake.specialRequirementsPlaceholder')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.accessibilityNeeds')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('frontdesk:walkIn.intake.accessibilityPlaceholder')}
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
                        <FormLabel>{t('frontdesk:walkIn.intake.clerkObservations')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('frontdesk:walkIn.intake.clerkObservationsPlaceholder')}
                            rows={4}
                            data-testid="textarea-clerk-observations"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('frontdesk:walkIn.intake.clerkObservationsDesc')}
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
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <div className="flex gap-2">
              {currentSection > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevSection}
                  data-testid="btn-previous-section"
                >
                  <ArrowLeft className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t('frontdesk:walkIn.intake.previous')}
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearForm}
                data-testid="btn-clear-form"
              >
                {t('frontdesk:walkIn.intake.clearForm')}
              </Button>
            </div>

            <div className="flex gap-2">
              {currentSection < FORM_SECTIONS.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={nextSection}
                  data-testid="btn-next-section"
                >
                  {t('frontdesk:walkIn.intake.next')}
                  <ArrowRight className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={submitIntakeMutation.isPending}
                  data-testid="btn-submit-intake"
                >
                  {submitIntakeMutation.isPending ? (
                    <>
                      <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                      {t('frontdesk:walkIn.intake.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                      {t('frontdesk:walkIn.intake.submitForm')}
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