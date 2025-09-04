import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, Globe, BookOpen, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BackButton } from "@/components/ui/back-button";
import { useTranslation } from "react-i18next";

const profileSchema = z.object({
  culturalBackground: z.string().optional(),
  nativeLanguage: z.string().min(1, "Native language is required"),
  targetLanguages: z.array(z.string()).default([]),
  proficiencyLevel: z.string().default("beginner"),
  learningGoals: z.array(z.string()).default([]),
  learningStyle: z.string().optional(),
  timezone: z.string().default("UTC"),
  preferredStudyTime: z.string().optional(),
  weeklyStudyHours: z.number().min(1).max(168).default(5),
  personalityType: z.string().optional(),
  motivationFactors: z.array(z.string()).default([]),
  learningChallenges: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  bio: z.string().optional()
});

const userUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  avatar: z.string().optional(),
  preferences: z.object({
    theme: z.string().default("light"),
    language: z.string().default("en"),
    notifications: z.boolean().default(true)
  }).optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;
type UserFormData = z.infer<typeof userUpdateSchema>;

const culturalBackgrounds = [
  { value: "iranian", label: "Iranian" },
  { value: "arabic", label: "Arabic" },
  { value: "western", label: "Western" },
  { value: "east_asian", label: "East Asian" },
  { value: "south_asian", label: "South Asian" },
  { value: "african", label: "African" },
  { value: "latin_american", label: "Latin American" },
  { value: "other", label: "Other" }
];

const languages = [
  { value: "en", label: "English" },
  { value: "fa", label: "Persian/Farsi" },
  { value: "ar", label: "Arabic" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" }
];

const proficiencyLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "elementary", label: "Elementary" },
  { value: "intermediate", label: "Intermediate" },
  { value: "upper_intermediate", label: "Upper Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "proficient", label: "Proficient" }
];

const learningStyles = [
  { value: "visual", label: "Visual" },
  { value: "auditory", label: "Auditory" },
  { value: "kinesthetic", label: "Kinesthetic" },
  { value: "reading_writing", label: "Reading/Writing" }
];

const studyTimes = [
  { value: "morning", label: "Morning (6AM - 12PM)" },
  { value: "afternoon", label: "Afternoon (12PM - 6PM)" },
  { value: "evening", label: "Evening (6PM - 10PM)" },
  { value: "night", label: "Night (10PM - 6AM)" }
];

const personalityTypes = [
  { value: "introvert", label: "Introvert" },
  { value: "extrovert", label: "Extrovert" },
  { value: "ambivert", label: "Ambivert" }
];

const availableGoals = [
  "Conversational fluency",
  "Business communication",
  "Academic study",
  "Travel preparation",
  "Cultural understanding",
  "Professional certification",
  "Personal enrichment",
  "Family communication"
];

const motivationFactors = [
  "career", "travel", "education", "family", "hobby", "business", "culture", "personal_growth"
];

const learningChallenges = [
  "pronunciation", "grammar", "vocabulary", "listening", "speaking", "reading", "writing", "confidence"
];

const strengths = [
  "memory", "pattern_recognition", "analytical", "creative", "logical", "intuitive", "detail_oriented", "big_picture"
];

const interests = [
  "business", "travel", "culture", "technology", "arts", "sports", "music", "cooking", "literature", "science"
];

export default function UserProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  // Fetch current user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user
  });

  // User update form
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phoneNumber: user?.phoneNumber || "",
      avatar: user?.avatar || "",
      preferences: user?.preferences || {
        theme: "light",
        language: "en",
        notifications: true
      }
    }
  });

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      culturalBackground: profile?.culturalBackground || "",
      nativeLanguage: profile?.nativeLanguage || "en",
      targetLanguages: profile?.targetLanguages || [],
      proficiencyLevel: profile?.proficiencyLevel || "beginner",
      learningGoals: profile?.learningGoals || [],
      learningStyle: profile?.learningStyle || "",
      timezone: profile?.timezone || "UTC",
      preferredStudyTime: profile?.preferredStudyTime || "",
      weeklyStudyHours: profile?.weeklyStudyHours || 5,
      personalityType: profile?.personalityType || "",
      motivationFactors: profile?.motivationFactors || [],
      learningChallenges: profile?.learningChallenges || [],
      strengths: profile?.strengths || [],
      interests: profile?.interests || [],
      bio: profile?.bio || ""
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (userData: UserFormData) => 
      apiRequest(`/api/users/${user?.id}`, {
        method: 'PATCH',
        body: userData
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your basic information has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: ProfileFormData) => 
      apiRequest("/api/profile", {
        method: profile ? 'PATCH' : 'POST',
        body: profileData
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Learning Profile Updated",
        description: "Your learning preferences have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update learning profile.",
        variant: "destructive"
      });
    }
  });

  const onUserSubmit = (data: UserFormData) => {
    updateUserMutation.mutate(data);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`container max-w-4xl mx-auto p-6 space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BackButton href="/dashboard" />
        </div>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {t('profileSettings')}
            </h1>
            <p className="text-muted-foreground">
              {t('manageAccount')}
            </p>
            <Badge variant="secondary" className="mt-2">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('basicInfo')}
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('learning')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('preferences')}
          </TabsTrigger>
          <TabsTrigger value="cultural" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('cultural')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo')}</CardTitle>
              <CardDescription>
                {t('student:updatePersonalDetails', 'Update your personal details and contact information')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={userForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('firstName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('lastName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('phoneNumber')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1234567890" />
                        </FormControl>
                        <FormDescription>
                          {t('optionalForSMS')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateUserMutation.isPending ? t('updating') : t('updateBasicInfo')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle>{t('learningProfile')}</CardTitle>
              <CardDescription>
                {t('tellUsAbout')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="nativeLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('nativeLanguage')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('student:selectNativeLanguage', 'Select your native language')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="proficiencyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('currentProficiency')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('student:selectYourLevel', 'Select your level')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {proficiencyLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="learningStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('preferredLearningStyle')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('student:howLearnBest', 'How do you learn best?')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {learningStyles.map((style) => (
                              <SelectItem key={style.value} value={style.value}>
                                {style.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="preferredStudyTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('preferredStudyTime')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('student:whenStudyBest', 'When do you study best?')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {studyTimes.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="weeklyStudyHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('weeklyStudyHours')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="168"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('student:hoursPerWeek', 'How many hours per week can you dedicate to learning?')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('aboutMe')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder={t('student:tellUsAboutYourself', 'Tell us about yourself, your learning journey, and what motivates you...')}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateProfileMutation.isPending ? t('updating') : t('updateLearningProfile')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('student:systemPreferences', 'System Preferences')}</CardTitle>
                <CardDescription>
                  {t('student:configureAppPreferences', 'Configure your app preferences and notifications')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('student:theme', 'Theme')}</Label>
                    <Select defaultValue={user?.preferences?.theme || "light"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('student:light', 'Light')}</SelectItem>
                        <SelectItem value="dark">{t('student:dark', 'Dark')}</SelectItem>
                        <SelectItem value="system">{t('student:system', 'System')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('student:interfaceLanguage', 'Interface Language')}</Label>
                    <Select defaultValue={user?.preferences?.language || "en"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('student:english', 'English')}</SelectItem>
                        <SelectItem value="fa">{t('student:persianFarsi', 'Persian/Farsi')}</SelectItem>
                        <SelectItem value="ar">{t('student:arabic', 'Arabic')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notifications" 
                      defaultChecked={user?.preferences?.notifications !== false}
                    />
                    <Label htmlFor="notifications">
                      {t('student:enableNotifications', 'Enable push notifications')}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cultural">
          <Card>
            <CardHeader>
              <CardTitle>Cultural Background</CardTitle>
              <CardDescription>
                Help us provide culturally relevant content and learning materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Cultural Background</Label>
                  <Select defaultValue={profile?.culturalBackground}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your cultural background" />
                    </SelectTrigger>
                    <SelectContent>
                      {culturalBackgrounds.map((bg) => (
                        <SelectItem key={bg.value} value={bg.value}>
                          {bg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Personality Type</Label>
                  <Select defaultValue={profile?.personalityType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="How would you describe yourself?" />
                    </SelectTrigger>
                    <SelectContent>
                      {personalityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Learning Goals</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableGoals.map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox 
                          id={goal}
                          defaultChecked={profile?.learningGoals?.includes(goal)}
                        />
                        <Label htmlFor={goal} className="text-sm">
                          {goal}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest) => (
                      <Badge 
                        key={interest}
                        variant={profile?.interests?.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                      >
                        {typeof interest === 'string' ? interest.charAt(0).toUpperCase() + interest.slice(1) : String(interest)}
                      </Badge>
                    ))}
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