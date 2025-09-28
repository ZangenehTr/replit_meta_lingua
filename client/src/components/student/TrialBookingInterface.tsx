import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Star, 
  Check,
  ChevronLeft,
  ChevronRight,
  Languages
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import apiClient from "@/lib/apiClient";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  specializations: string[];
  experience: number;
  rating: number;
  languages: string[];
  bio: string;
  availability: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  date: string;
}

// Validation schema
const trialBookingSchema = z.object({
  firstName: z.string()
    .min(2, { message: 'First name must be at least 2 characters' })
    .max(50, { message: 'First name must be less than 50 characters' }),
  lastName: z.string()
    .min(2, { message: 'Last name must be at least 2 characters' })
    .max(50, { message: 'Last name must be less than 50 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' }),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^[+]?[(]?[\d\s\-\(\)]{10,}$/, { message: 'Please enter a valid phone number' }),
  learningGoals: z.string()
    .min(10, { message: 'Please tell us more about your learning goals (at least 10 characters)' })
    .max(500, { message: 'Learning goals must be less than 500 characters' }),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select your current level'
  }),
  preferredLanguage: z.string().min(1, { message: 'Please select your preferred language' })
});

type TrialBookingFormData = z.infer<typeof trialBookingSchema>;

interface Props {
  teachers: Teacher[];
}

export function TrialBookingInterface({ teachers }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get current user data
  
  const [step, setStep] = useState<'teacher' | 'datetime' | 'details' | 'confirmation'>('teacher');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Form setup with react-hook-form and zod validation
  const form = useForm<TrialBookingFormData>({
    resolver: zodResolver(trialBookingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      learningGoals: '',
      currentLevel: 'beginner',
      preferredLanguage: 'en'
    }
  });

  // Pre-populate form with user data when available
  useEffect(() => {
    if (user) {
      // Only pre-populate empty fields to avoid overwriting user edits
      const currentValues = form.getValues();
      
      if (!currentValues.firstName) {
        form.setValue('firstName', user.firstName || '');
      }
      if (!currentValues.lastName) {
        form.setValue('lastName', user.lastName || '');
      }
      if (!currentValues.email) {
        form.setValue('email', user.email || '');
      }
      // Try to get phone from user object (may exist even if not typed)
      if (!currentValues.phone && (user as any).phoneNumber) {
        form.setValue('phone', (user as any).phoneNumber);
      }
      // Only set language if user has a preferred language in preferences and field is empty
      if (!currentValues.preferredLanguage && user.preferences?.language) {
        form.setValue('preferredLanguage', user.preferences.language);
      }
    }
  }, [user, form]);

  // Generate next 7 days
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en', { month: 'short' })
      });
    }
    return dates;
  };

  // Fetch real time slots from API
  const { data: timeSlots = [], isLoading: timeSlotsLoading, error: timeSlotsError } = useQuery<TimeSlot[]>({
    queryKey: [`/api/trial/slots?teacherId=${selectedTeacher?.id}&date=${selectedDate}`],
    enabled: !!selectedTeacher?.id && !!selectedDate,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Book trial lesson mutation
  const bookTrialMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiClient.post('/student/book-trial', bookingData);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: t('student:trialBooked'),
        description: t('student:trialBookedDescription'),
      });
      setStep('confirmation');
      queryClient.invalidateQueries({ queryKey: ['/api/student/trial-bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.response?.data?.message || t('student:bookingFailed'),
        variant: 'destructive',
      });
    },
  });

  const handleBooking = () => {
    const formData = form.getValues();
    const bookingData = {
      teacherId: selectedTeacher?.id,
      date: selectedDate,
      time: selectedTime,
      studentDetails: formData,
      lessonType: 'trial'
    };
    
    bookTrialMutation.mutate(bookingData);
  };

  const availableDates = generateAvailableDates();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('student:bookTrialLesson')}
        </h2>
        <p className="text-gray-600">
          {t('student:freeTrialDescription')}
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[
              { key: 'teacher', label: t('student:selectTeacher') },
              { key: 'datetime', label: t('student:chooseDateTime') },
              { key: 'details', label: t('student:yourDetails') },
              { key: 'confirmation', label: t('student:confirmation') }
            ].map((stepItem, index) => (
              <div key={stepItem.key} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepItem.key 
                      ? 'bg-blue-600 text-white' 
                      : index < ['teacher', 'datetime', 'details', 'confirmation'].indexOf(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  data-testid={`step-indicator-${stepItem.key}`}
                >
                  {index < ['teacher', 'datetime', 'details', 'confirmation'].indexOf(step) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {stepItem.label}
                </span>
                {index < 3 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 'teacher' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('student:selectTeacher')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.slice(0, 6).map((teacher) => (
                <div
                  key={teacher.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTeacher?.id === teacher.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTeacher(teacher)}
                  data-testid={`teacher-option-${teacher.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={teacher.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {teacher.rating.toFixed(1)}
                        <span>• {teacher.experience}+ {t('student:years')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Languages className="h-3 w-3" />
                        {teacher.languages.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep('datetime')}
                disabled={!selectedTeacher}
                data-testid="button-next-to-datetime"
              >
                {t('common:next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'datetime' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('student:chooseDateTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Date Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                {t('student:selectDate')}
              </Label>
              <div className="grid grid-cols-7 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.date}
                    className={`p-3 text-center border rounded-lg transition-all ${
                      selectedDate === date.date
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDate(date.date)}
                    data-testid={`date-option-${date.date}`}
                  >
                    <div className="text-xs text-gray-500">{date.dayName}</div>
                    <div className="text-lg font-medium">{date.dayNumber}</div>
                    <div className="text-xs text-gray-500">{date.month}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  {t('student:selectTime')}
                </Label>
                {timeSlotsLoading ? (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div 
                        key={index} 
                        className="p-2 text-center border rounded-lg bg-gray-100 animate-pulse"
                        data-testid="loading-time-slot"
                      >
                        <div className="h-4 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : timeSlotsError ? (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-center">
                    <p className="text-red-600 text-sm">{t('common:errorLoadingTimeSlots')}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-sm text-red-700 underline"
                      data-testid="button-retry-time-slots"
                    >
                      {t('common:retry')}
                    </button>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500" data-testid="empty-time-slots">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>{t('student:noSlotsAvailable')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`p-2 text-center border rounded-lg transition-all ${
                          !slot.available
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedTime === slot.time
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        data-testid={`time-option-${slot.time}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('teacher')}
                data-testid="button-back-to-teacher"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('common:back')}
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedDate || !selectedTime}
                data-testid="button-next-to-details"
              >
                {t('common:next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('student:yourDetails')}</CardTitle>
            {user && (
              <p className="text-sm text-gray-600">
                {t('student:fieldsPrePopulated')}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(() => setStep('confirmation'))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student:firstName')}</FormLabel>
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
                        <FormLabel>{t('student:lastName')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student:email')}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student:phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student:currentLevel')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-current-level">
                              <SelectValue placeholder={t('student:selectLevel')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">{t('student:beginner')}</SelectItem>
                            <SelectItem value="intermediate">{t('student:intermediate')}</SelectItem>
                            <SelectItem value="advanced">{t('student:advanced')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student:preferredLanguage')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-preferred-language">
                              <SelectValue placeholder={t('student:selectLanguage')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fa">Persian/Farsi</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="learningGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('student:learningGoals')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder={t('student:learningGoalsPlaceholder')}
                          data-testid="textarea-learning-goals"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep('datetime')}
                    data-testid="button-back-to-datetime"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {t('common:back')}
                  </Button>
                  <Button
                    onClick={handleBooking}
                    disabled={!form.formState.isValid || bookTrialMutation.isPending}
                    data-testid="button-book-trial"
                  >
                    {bookTrialMutation.isPending ? t('common:booking') : t('student:bookTrialLesson')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'confirmation' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('student:trialBookedSuccess')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('student:trialBookedConfirmation')}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('student:teacher')}:</span>
                  <span className="font-medium">{selectedTeacher?.firstName} {selectedTeacher?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('student:date')}:</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('student:time')}:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setStep('teacher');
                setSelectedTeacher(null);
                setSelectedDate('');
                setSelectedTime('');
                form.reset();
              }}
              data-testid="button-book-another"
            >
              {t('student:bookAnother')}
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}