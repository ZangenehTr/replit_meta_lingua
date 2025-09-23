import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Clock, 
  Users, 
  MapPin, 
  Calendar, 
  Globe,
  TrendingUp,
  Target,
  CheckCircle,
  ArrowRight,
  Star,
  Award
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CurriculumLevel {
  id: number;
  curriculumId: number;
  code: string;
  name: string;
  orderIndex: number;
  cefrBand?: string;
  description?: string;
  estimatedWeeks?: number;
  isActive: boolean;
}

interface StudentProgress {
  id: number;
  studentId: number;
  curriculumId: number;
  currentLevelId?: number;
  status: string;
  progressPercentage: number;
  enrolledAt: string;
  currentLevel?: CurriculumLevel;
  curriculum?: {
    id: number;
    key: string;
    name: string;
    language: string;
  };
}

interface LevelCourse {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  deliveryMode: string;
  classFormat: string;
  targetLanguage: string;
  targetLevel: string[];
  maxStudents: number;
  currentStudents: number;
  price: number;
  weekdays: string[];
  startTime: string;
  endTime: string;
  instructorName: string;
  duration: string;
  isActive: boolean;
  levelId: number;
  isRequired: boolean;
  orderIndex: number;
}

export function LevelBasedCourseDiscovery() {
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'student']);
  const [selectedTab, setSelectedTab] = useState<string>('current');

  // Get student's current level and progress
  const { data: studentLevel, isLoading: levelLoading } = useQuery<StudentProgress>({
    queryKey: ['/api/curriculum/student-level'],
  });

  // Get courses for student's current level
  const { data: levelCourses, isLoading: coursesLoading } = useQuery<LevelCourse[]>({
    queryKey: ['/api/curriculum/level-courses'],
    enabled: !!studentLevel?.currentLevelId,
  });

  // Get all curriculum levels for progression view
  const { data: allLevels, isLoading: levelsLoading } = useQuery<CurriculumLevel[]>({
    queryKey: ['/api/admin/curriculum-levels'],
  });

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async ({ courseId, levelId }: { courseId: number; levelId: number }) => {
      const response = await fetch('/api/curriculum/enroll-course', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId, levelId }),
      });
      if (!response.ok) throw new Error('Failed to enroll in course');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:enrollmentSuccessful'),
        description: t('student:enrollmentSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum/level-courses'] });
    },
    onError: (error: any) => {
      toast({
        title: t('student:enrollmentFailed'),
        description: error.message || t('student:enrollmentFailedDescription'),
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDayName = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'monday': 'دوشنبه',
      'tuesday': 'سه‌شنبه', 
      'wednesday': 'چهارشنبه',
      'thursday': 'پنج‌شنبه',
      'friday': 'جمعه',
      'saturday': 'شنبه',
      'sunday': 'یکشنبه'
    };
    return dayMap[day] || day;
  };

  if (levelLoading || coursesLoading || levelsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>کشف کلاس‌های سطحی</CardTitle>
          <CardDescription>در حال بارگذاری...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentLevel) {
    return (
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          شما هنوز در هیچ برنامه درسی ثبت‌نام نکرده‌اید. لطفاً ابتدا آزمون تعیین سطح خود را انجام دهید.
        </AlertDescription>
      </Alert>
    );
  }

  const currentLevelCourses = levelCourses?.filter(course => course.levelId === studentLevel.currentLevelId) || [];
  const requiredCourses = currentLevelCourses.filter(course => course.isRequired);
  const optionalCourses = currentLevelCourses.filter(course => !course.isRequired);

  // Get next level for progression
  const currentLevelIndex = allLevels?.findIndex(level => level.id === studentLevel.currentLevelId) || 0;
  const nextLevel = allLevels?.[currentLevelIndex + 1];

  return (
    <div className="space-y-6">
      {/* Student Level Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            سطح فعلی شما
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{studentLevel.currentLevel?.name || 'نامشخص'}</h3>
                <p className="text-muted-foreground">
                  {studentLevel.curriculum?.name} - {studentLevel.currentLevel?.cefrBand || studentLevel.currentLevel?.code}
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                {studentLevel.status === 'active' ? 'فعال' : studentLevel.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>پیشرفت سطح</span>
                <span>{studentLevel.progressPercentage}%</span>
              </div>
              <Progress value={studentLevel.progressPercentage} className="h-2" />
            </div>

            {nextLevel && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">سطح بعدی: {nextLevel.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course Discovery */}
      <Card>
        <CardHeader>
          <CardTitle>کلاس‌های موجود برای سطح شما</CardTitle>
          <CardDescription>
            کلاس‌هایی که مطابق با سطح فعلی شما ({studentLevel.currentLevel?.name}) هستند
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">کلاس‌های الزامی ({requiredCourses.length})</TabsTrigger>
              <TabsTrigger value="optional">کلاس‌های اختیاری ({optionalCourses.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4">
              {requiredCourses.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    تمام کلاس‌های الزامی این سطح را گذرانده‌اید!
                  </p>
                </div>
              ) : (
                requiredCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onEnroll={(courseId) => enrollMutation.mutate({ 
                      courseId, 
                      levelId: course.levelId 
                    })}
                    isEnrolling={enrollMutation.isPending}
                    formatPrice={formatPrice}
                    formatDayName={formatDayName}
                    isRequired={true}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="optional" className="space-y-4">
              {optionalCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    در حال حاضر کلاس اختیاری‌ای برای این سطح وجود ندارد.
                  </p>
                </div>
              ) : (
                optionalCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onEnroll={(courseId) => enrollMutation.mutate({ 
                      courseId, 
                      levelId: course.levelId 
                    })}
                    isEnrolling={enrollMutation.isPending}
                    formatPrice={formatPrice}
                    formatDayName={formatDayName}
                    isRequired={false}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface CourseCardProps {
  course: LevelCourse;
  onEnroll: (courseId: number) => void;
  isEnrolling: boolean;
  formatPrice: (price: number) => string;
  formatDayName: (day: string) => string;
  isRequired: boolean;
}

function CourseCard({ course, onEnroll, isEnrolling, formatPrice, formatDayName, isRequired }: CourseCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{course.title}</h3>
            <Badge variant={course.deliveryMode === 'online' ? 'default' : 'secondary'}>
              {course.deliveryMode === 'online' ? (
                <><Globe className="w-3 h-3 mr-1" /> آنلاین</>
              ) : (
                <><MapPin className="w-3 h-3 mr-1" /> حضوری</>
              )}
            </Badge>
            {isRequired && (
              <Badge variant="destructive" className="text-xs">
                الزامی
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-3">{course.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{course.currentStudents}/{course.maxStudents} دانشجو</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{course.startTime} - {course.endTime}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{course.weekdays.map(formatDayName).join(', ')}</span>
            </div>
            
            <div className="font-medium">
              مدت: {course.duration}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-sm text-muted-foreground">مدرس: {course.instructorName}</p>
              <p className="font-semibold text-lg">{formatPrice(course.price)}</p>
            </div>
            
            <Button 
              onClick={() => onEnroll(course.id)}
              disabled={course.currentStudents >= course.maxStudents || isEnrolling}
              className="px-6"
              data-testid={`button-enroll-${course.id}`}
            >
              {course.currentStudents >= course.maxStudents ? 'تکمیل ظرفیت' : 'ثبت‌نام'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}