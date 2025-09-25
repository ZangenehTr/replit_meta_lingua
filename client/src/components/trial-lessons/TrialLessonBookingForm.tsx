import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { User, Phone, Mail, Clock, Video, MapPin, Languages, GraduationCap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const trialLessonBookingSchema = z.object({
  studentFirstName: z.string().min(1, "First name is required"),
  studentLastName: z.string().min(1, "Last name is required"),
  studentPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  studentEmail: z.string().email("Invalid email address"),
  studentAge: z.number().min(5).max(80),
  targetLanguage: z.enum(["english", "persian", "arabic", "french", "german", "spanish"]),
  currentProficiencyLevel: z.enum(["beginner", "elementary", "pre_intermediate", "intermediate", "upper_intermediate", "advanced"]),
  lessonType: z.enum(["in_person", "online", "phone"]),
  preferredDuration: z.enum(["30", "45", "60"]),
  assignedTeacherId: z.number().optional(),
  learningObjectives: z.string().optional(),
  previousExperience: z.string().optional(),
  availableTimeSlots: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
  genderPreference: z.enum(["any", "male", "female"]).optional(),
  isReturningStudent: z.boolean().default(false),
  existingStudentId: z.number().optional()
});

type TrialLessonBookingForm = z.infer<typeof trialLessonBookingSchema>;

interface Teacher {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  specializations: string[];
  languageExpertise: string[];
  experience: number;
  rating?: number;
  totalStudents?: number;
  isAvailable: boolean;
  preferredStudentTypes?: string[];
  teachingMethods?: string[];
}

interface TrialLessonBookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<TrialLessonBookingForm>;
}

export function TrialLessonBookingForm({
  selectedDate,
  selectedTime,
  onSuccess,
  onCancel,
  initialData
}: TrialLessonBookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TrialLessonBookingForm>({
    resolver: zodResolver(trialLessonBookingSchema),
    defaultValues: {
      studentFirstName: "",
      studentLastName: "",
      studentPhone: "",
      studentEmail: "",
      studentAge: 25,
      targetLanguage: "english",
      currentProficiencyLevel: "beginner",
      lessonType: "online",
      preferredDuration: "60",
      learningObjectives: "",
      previousExperience: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
      genderPreference: "any",
      isReturningStudent: false,
      ...initialData
    }
  });

  const { watch } = form;
  const watchedValues = watch();

  // Fetch available teachers based on selected criteria
  const { data: availableTeachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/available-slots', selectedDate, selectedTime, watchedValues.targetLanguage, watchedValues.genderPreference],
    queryFn: async () => {
      const params = new URLSearchParams({
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        language: watchedValues.targetLanguage,
        ...(watchedValues.genderPreference !== 'any' && { gender: watchedValues.genderPreference })
      });
      
      const response = await fetch(`/api/teachers/available-slots?${params}`);
      return response.json();
    },
    enabled: step === 2
  });

  // Check for existing student by phone/email
  const { data: existingStudent } = useQuery({
    queryKey: ['/api/students/search', watchedValues.studentPhone, watchedValues.studentEmail],
    queryFn: async () => {
      if (!watchedValues.studentPhone && !watchedValues.studentEmail) return null;
      
      const params = new URLSearchParams();
      if (watchedValues.studentPhone) params.append('phone', watchedValues.studentPhone);
      if (watchedValues.studentEmail) params.append('email', watchedValues.studentEmail);
      
      const response = await fetch(`/api/students/search?${params}`);
      if (response.status === 404) return null;
      return response.json();
    },
    enabled: !!watchedValues.studentPhone || !!watchedValues.studentEmail
  });

  // Update form when existing student is found
  useEffect(() => {
    if (existingStudent) {
      form.setValue('isReturningStudent', true);
      form.setValue('existingStudentId', existingStudent.id);
      const [firstName, ...lastNameParts] = (existingStudent.name || '').split(' ');
      form.setValue('studentFirstName', firstName || '');
      form.setValue('studentLastName', lastNameParts.join(' ') || '');
      form.setValue('studentEmail', existingStudent.email);
      form.setValue('studentPhone', existingStudent.phoneNumber);
      if (existingStudent.age) form.setValue('studentAge', existingStudent.age);
    }
  }, [existingStudent, form]);

  // Book trial lesson mutation
  const bookTrialLesson = useMutation({
    mutationFn: async (data: TrialLessonBookingForm) => {
      // Calculate end time based on duration
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + parseInt(data.preferredDuration));

      const requestData = {
        ...data,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledStartTime: selectedTime,
        scheduledEndTime: format(endTime, 'HH:mm'),
        assignedTeacherId: selectedTeacher?.id
      };

      return apiRequest('/api/trial-lessons', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Trial lesson booked successfully!",
        description: "Confirmation SMS and email have been sent to the student.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "There was an error booking the trial lesson.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: TrialLessonBookingForm) => {
    bookTrialLesson.mutate(data);
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate step 1 fields
      const step1Fields = ['studentFirstName', 'studentLastName', 'studentPhone', 'studentEmail', 'targetLanguage', 'lessonType'] as const;
      form.trigger(step1Fields).then((isValid) => {
        if (isValid) setStep(2);
      });
    } else if (step === 2 && selectedTeacher) {
      setStep(3);
    }
  };

  const previousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="space-y-6" data-testid="trial-lesson-booking-form">
      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepNumber 
                ? 'bg-blue-600 text-white' 
                : step > stepNumber 
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
            }`}>
              {step > stepNumber ? '✓' : stepNumber}
            </div>
            {stepNumber < 3 && <div className="w-8 h-px bg-gray-300 mx-2"></div>}
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Step {step} of 3: {
          step === 1 ? 'Student Information' : 
          step === 2 ? 'Teacher Selection' : 
          'Confirmation'
        }
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Step 1: Student Information */}
          {step === 1 && (
            <div className="space-y-6">
              {existingStudent && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-800 text-sm">
                      Returning Student Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-green-700">
                    Welcome back {existingStudent.name}! Your information has been pre-filled.
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="First name" data-testid="input-student-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Last name" data-testid="input-student-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <FormField
                  control={form.control}
                  name="studentAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-student-age" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+98 912 345 6789" data-testid="input-student-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="student@example.com" data-testid="input-student-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Language *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="persian">Persian/Farsi</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentProficiencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-proficiency-level">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="elementary">Elementary</SelectItem>
                          <SelectItem value="pre_intermediate">Pre-Intermediate</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="upper_intermediate">Upper-Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lessonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="online" id="online" data-testid="lesson-type-online" />
                          <Label htmlFor="online" className="flex items-center space-x-2 cursor-pointer">
                            <Video className="h-4 w-4 text-blue-600" />
                            <span>Online (Video call)</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="in_person" id="in_person" data-testid="lesson-type-in-person" />
                          <Label htmlFor="in_person" className="flex items-center space-x-2 cursor-pointer">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span>In-person (At our location)</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="phone" id="phone" data-testid="lesson-type-phone" />
                          <Label htmlFor="phone" className="flex items-center space-x-2 cursor-pointer">
                            <Phone className="h-4 w-4 text-orange-600" />
                            <span>Phone consultation</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learningObjectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Objectives</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What would you like to achieve in this trial lesson?"
                        rows={3}
                        data-testid="textarea-objectives"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Teacher Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Select a Teacher</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Available teachers for {watchedValues.targetLanguage} on {format(selectedDate, 'EEEE, MMMM d')} at {selectedTime}
                </p>
              </div>

              {teachersLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {availableTeachers.map((teacher) => (
                    <Card
                      key={teacher.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTeacher?.id === teacher.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTeacher(teacher)}
                      data-testid={`teacher-card-${teacher.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={teacher.profilePhoto} />
                            <AvatarFallback>
                              {teacher.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{teacher.name}</h4>
                              {teacher.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{teacher.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="h-3 w-3" />
                                <span>{teacher.experience} years exp.</span>
                              </div>
                              {teacher.totalStudents && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{teacher.totalStudents} students</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {teacher.languageExpertise.slice(0, 3).map(lang => (
                                <Badge key={lang} variant="secondary" className="text-xs">
                                  {lang}
                                </Badge>
                              ))}
                              {teacher.languageExpertise.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{teacher.languageExpertise.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {availableTeachers.length === 0 && !teachersLoading && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-yellow-800">
                      No teachers are available for the selected time slot.
                      Please choose a different time or contact administration.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedTeacher && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Booking Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  Please review the booking details before confirming
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Student:</span>
                    <span>{watchedValues.studentFirstName} {watchedValues.studentLastName}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Date & Time:</span>
                    <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Duration:</span>
                    <span>{watchedValues.preferredDuration} minutes</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Language:</span>
                    <span className="capitalize">{watchedValues.targetLanguage}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Type:</span>
                    <div className="flex items-center space-x-2">
                      {watchedValues.lessonType === 'online' && <Video className="h-4 w-4" />}
                      {watchedValues.lessonType === 'in_person' && <MapPin className="h-4 w-4" />}
                      {watchedValues.lessonType === 'phone' && <Phone className="h-4 w-4" />}
                      <span className="capitalize">{watchedValues.lessonType.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedTeacher.profilePhoto} />
                      <AvatarFallback>
                        {selectedTeacher.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">Teacher: </span>
                      <span>{selectedTeacher.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
                <p><strong>What happens next:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>SMS confirmation will be sent to the student</li>
                  <li>Email with lesson details and preparation materials</li>
                  <li>Teacher will be notified of the assignment</li>
                  <li>Calendar invite will be created for all participants</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  data-testid="button-previous"
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 2 && !selectedTeacher}
                  data-testid="button-next"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={bookTrialLesson.isPending}
                  data-testid="button-confirm-booking"
                >
                  {bookTrialLesson.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}