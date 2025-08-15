import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from '@/components/layout/sidebar';
import VideoPlayer from '@/components/video/VideoPlayer';
import { apiRequest } from '@/lib/queryClient';
import {
  Play,
  Clock,
  CheckCircle,
  Lock,
  Search,
  BookOpen,
  Video,
  FileText,
  Download,
  ChevronRight,
  Star,
  Users,
  Calendar,
  Globe
} from 'lucide-react';

interface VideoCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  duration: number;
  level: string;
  language: string;
  instructor: string;
  rating: number;
  enrolledStudents: number;
  progress: number;
}

interface VideoLesson {
  id: number;
  courseId: number;
  title: string;
  description: string;
  duration: number;
  orderIndex: number;
  isFree: boolean;
  isPublished: boolean;
  completed: boolean;
  watchTime: number;
  moduleId?: number;
  moduleName?: string;
}

export default function StudentVideoCourses() {
  const { t } = useTranslation(['student', 'common']);
  const [, navigate] = useLocation();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch enrolled video courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/student/video-courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/video-courses');
      return response as VideoCourse[];
    }
  });

  // Fetch lessons for selected course
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['/api/courses', selectedCourse, 'video-lessons'],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await apiRequest(`/api/courses/${selectedCourse}/video-lessons`);
      return response as VideoLesson[];
    },
    enabled: !!selectedCourse
  });

  // Filter courses based on search and tab
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'in-progress') {
      return matchesSearch && course.progress > 0 && course.progress < 100;
    } else if (activeTab === 'completed') {
      return matchesSearch && course.progress === 100;
    }
    return matchesSearch;
  });

  // Group lessons by module
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const moduleKey = lesson.moduleName || t('student:videoCourses.generalModule');
    if (!acc[moduleKey]) {
      acc[moduleKey] = [];
    }
    acc[moduleKey].push(lesson);
    return acc;
  }, {} as Record<string, VideoLesson[]>);

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourse(courseId);
    setSelectedLesson(null);
  };

  const handleLessonSelect = (lessonId: number) => {
    setSelectedLesson(lessonId);
  };

  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === selectedLesson);
    if (currentIndex < lessons.length - 1) {
      setSelectedLesson(lessons[currentIndex + 1].id);
    }
  };

  const handlePreviousLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === selectedLesson);
    if (currentIndex > 0) {
      setSelectedLesson(lessons[currentIndex - 1].id);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // If a lesson is selected, show the video player
  if (selectedLesson) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLesson(null)}
              >
                {t('student:videoCourses.backToCourse')}
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span>{lessons.find(l => l.id === selectedLesson)?.title}</span>
            </div>

            <VideoPlayer
              lessonId={selectedLesson}
              courseId={selectedCourse || undefined}
              onNext={handleNextLesson}
              onPrevious={handlePreviousLesson}
              onComplete={() => {
                // Refresh course progress
                // queryClient.invalidateQueries({ queryKey: ['/api/student/video-courses'] });
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  // If a course is selected, show lessons list
  if (selectedCourse) {
    const course = courses.find(c => c.id === selectedCourse);
    
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Course Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCourse(null)}
                className="mb-4"
              >
                ← {t('student:videoCourses.backToCourses')}
              </Button>
              
              {course && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">{course.title}</CardTitle>
                        <CardDescription className="mt-2">{course.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        {course.totalLessons} {t('student:videoCourses.lessons')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(course.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrolledStudents} {t('student:videoCourses.students')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {course.rating}/5
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t('student:videoCourses.progress')}</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  </CardHeader>
                </Card>
              )}
            </div>

            {/* Lessons List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('student:videoCourses.courseLessons')}</CardTitle>
              </CardHeader>
              <CardContent>
                {lessonsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-6">
                      {Object.entries(groupedLessons).map(([moduleName, moduleLessons]) => (
                        <div key={moduleName}>
                          <h3 className="font-semibold text-lg mb-3">{moduleName}</h3>
                          <div className="space-y-2">
                            {moduleLessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer
                                  ${lesson.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
                                    'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                onClick={() => handleLessonSelect(lesson.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                    ${lesson.completed ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    {lesson.completed ? (
                                      <CheckCircle className="h-5 w-5" />
                                    ) : lesson.isFree || index === 0 ? (
                                      <Play className="h-5 w-5" />
                                    ) : (
                                      <Lock className="h-5 w-5" />
                                    )}
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium">{lesson.title}</h4>
                                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                    {lesson.watchTime > 0 && !lesson.completed && (
                                      <div className="mt-1">
                                        <Progress 
                                          value={(lesson.watchTime / lesson.duration) * 100} 
                                          className="h-1 w-32"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    {formatDuration(lesson.duration)}
                                  </span>
                                  {lesson.isFree && (
                                    <Badge variant="secondary">{t('student:videoCourses.free')}</Badge>
                                  )}
                                  <Button size="sm" variant={lesson.completed ? "outline" : "default"}>
                                    {lesson.completed ? t('student:videoCourses.review') : t('student:videoCourses.watch')}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Course listing view
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('student:videoCourses.title')}</h1>
            <p className="text-muted-foreground">{t('student:videoCourses.subtitle')}</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('student:videoCourses.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">{t('student:videoCourses.allCourses')}</TabsTrigger>
                <TabsTrigger value="in-progress">{t('student:videoCourses.inProgress')}</TabsTrigger>
                <TabsTrigger value="completed">{t('student:videoCourses.completed')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Courses Grid */}
          {coursesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('student:videoCourses.noCourses')}</h3>
              <p className="text-muted-foreground">{t('student:videoCourses.noCoursesDescription')}</p>
              <Button className="mt-4" onClick={() => navigate('/courses')}>
                {t('student:videoCourses.browseCourses')}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCourseSelect(course.id)}
                >
                  {/* Course Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 relative">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                    {course.progress > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black/50 text-white">
                          {course.progress}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Course Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {course.totalLessons}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(course.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {course.language}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {course.progress > 0 && (
                      <div className="mb-3">
                        <Progress value={course.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {course.completedLessons}/{course.totalLessons} {t('student:videoCourses.lessonsCompleted')}
                        </p>
                      </div>
                    )}

                    {/* Instructor and Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{course.instructor}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{course.rating}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}