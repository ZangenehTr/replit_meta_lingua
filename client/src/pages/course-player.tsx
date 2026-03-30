import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  Circle,
  Bookmark,
  Download,
  Share,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import CourseReviews from "@/components/courses/CourseReviews";

interface CoursePlayerProps {
  courseId: string;
  lessonId?: string;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  transcript: string;
  notes: string;
  resources: string[];
  isPreview: boolean;
  isCompleted: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  level: string;
  language: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons: Lesson[];
}

export default function CoursePlayer({ courseId, lessonId }: CoursePlayerProps) {
  const [currentLessonId, setCurrentLessonId] = useState<number>(
    lessonId ? parseInt(lessonId) : 0
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [notes, setNotes] = useState("");
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const initialTab = new URLSearchParams(window.location.search).get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  // Fetch course data
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}/player`],
  });

  // Check if current user has a completed enrollment (for review eligibility)
  const { data: enrollmentStatus } = useQuery<{ canReview: boolean }>({
    queryKey: [`/api/courses/${courseId}/my-enrollment-status`],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return { canReview: false };
      const res = await fetch(`/api/courses/${courseId}/my-enrollment-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { canReview: false };
      return res.json();
    },
    retry: false,
  });

  // Get current lesson (only after course is loaded)
  const currentLesson = course?.lessons?.find(lesson => 
    currentLessonId ? lesson.id === currentLessonId : lesson.order === 1
  ) || course?.lessons?.[0];

  // Update progress mutation
  const updateProgress = useMutation({
    mutationFn: async (data: { 
      lessonId: number; 
      watchTime: number; 
      progress: number; 
      notes?: string;
      bookmarks?: number[];
    }) => {
      return apiRequest(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/player`] });
    },
  });

  // Mark lesson complete mutation
  const markComplete = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/player`] });
      toast({
        title: t('coursePlayer:lessonCompleted'),
        description: t('coursePlayer:progressSaved'),
      });
    },
  });

  // Video event handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // Auto-save progress every 30 seconds
      if (current % 30 < 1 && currentLesson) {
        const progressPercent = (current / videoRef.current.duration) * 100;
        updateProgress.mutate({
          lessonId: currentLesson.id,
          watchTime: current,
          progress: progressPercent,
          notes,
          bookmarks,
        });
      }
    }
  };

  const handleLessonComplete = () => {
    if (currentLesson && currentTime >= duration * 0.9) {
      markComplete.mutate(currentLesson.id);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const addBookmark = () => {
    const newBookmarks = [...bookmarks, currentTime];
    setBookmarks(newBookmarks);
    toast({
      title: t('coursePlayer:bookmarkAdded'),
      description: `${t('coursePlayer:atTime')} ${formatTime(currentTime)}`,
    });
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    if (!course) return;
    
    const currentIndex = course.lessons.findIndex(l => l.id === currentLesson?.id);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentLessonId(course.lessons[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < course.lessons.length - 1) {
      setCurrentLessonId(course.lessons[currentIndex + 1].id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('coursePlayer:loadingCourse')}</p>
        </div>
      </div>
    );
  }

  if (!currentLesson || course.lessons.length === 0) {
    return (
      <div className={`min-h-screen bg-background flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="border-b p-2 sm:p-3 md:p-4 flex-shrink-0">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <BackButton 
                href="/dashboard" 
                label={t('coursePlayer:backToCourse')}
              />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">{course.title}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8 px-3 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 text-center">
              <BookOpen className="h-10 sm:h-12 md:h-14 lg:h-16 w-10 sm:w-12 md:w-14 lg:w-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2">{t('coursePlayer:noLessons')}</h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                {t('coursePlayer:noLessonsDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="border-b p-2 sm:p-3 md:p-4 flex-shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <BackButton 
              href="/dashboard" 
              label={t('coursePlayer:backToCourse')}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">{course.title}</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {currentLesson.title}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center text-xs sm:text-sm flex-shrink-0 w-full sm:w-auto">
            <Badge variant="secondary" className="whitespace-nowrap w-fit">
              {course.completedLessons} / {course.totalLessons} {t('coursePlayer:lessons')}
            </Badge>
            <Progress value={course.progress} className="w-full sm:w-32 md:w-40" />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8 px-3 sm:px-6 lg:px-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    src={currentLesson.videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                    onEnded={handleLessonComplete}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      {/* Progress Bar */}
                      <div className="relative">
                        <Progress 
                          value={(currentTime / duration) * 100} 
                          className="h-1 sm:h-2 cursor-pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - rect.left) / rect.width;
                            handleSeek(percent * duration);
                          }}
                        />
                        {bookmarks.map((bookmark, index) => (
                          <div
                            key={index}
                            className="absolute top-0 w-1 h-1 sm:h-2 bg-yellow-400 cursor-pointer"
                            style={{ left: `${(bookmark / duration) * 100}%` }}
                            onClick={() => handleSeek(bookmark)}
                          />
                        ))}
                      </div>
                      
                      {/* Control Buttons */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-white text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-4 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateLesson('prev')}
                            className="text-white hover:bg-white/20 h-7 sm:h-8 w-7 sm:w-8 p-0"
                          >
                            <SkipBack className="h-3 sm:h-4 w-3 sm:w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePlayPause}
                            className="text-white hover:bg-white/20 h-7 sm:h-8 w-7 sm:w-8 p-0"
                          >
                            {isPlaying ? <Pause className="h-3 sm:h-4 w-3 sm:w-4" /> : <Play className="h-3 sm:h-4 w-3 sm:w-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateLesson('next')}
                            className="text-white hover:bg-white/20 h-7 sm:h-8 w-7 sm:w-8 p-0"
                          >
                            <SkipForward className="h-3 sm:h-4 w-3 sm:w-4" />
                          </Button>
                          
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="text-white hover:bg-white/20 h-7 sm:h-8 w-7 sm:w-8 p-0"
                            >
                              {isMuted ? <VolumeX className="h-3 sm:h-4 w-3 sm:w-4" /> : <Volume2 className="h-3 sm:h-4 w-3 sm:w-4" />}
                            </Button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-12 sm:w-20 h-1"
                            />
                          </div>
                          
                          <span className="text-xs sm:text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2">
                          <select
                            value={playbackSpeed}
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            className="bg-black/50 text-white border border-white/20 rounded px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm h-7 sm:h-8"
                          >
                            <option value={0.5}>0.5x</option>
                            <option value={0.75}>0.75x</option>
                            <option value={1}>1x</option>
                            <option value={1.25}>1.25x</option>
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2x</option>
                          </select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addBookmark}
                            className="text-white hover:bg-white/20 h-7 sm:h-8 w-7 sm:w-8 p-0"
                          >
                            <Bookmark className="h-3 sm:h-4 w-3 sm:w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 h-7 sm:h-8 w-7 sm:w-8 p-0"
                          >
                            <Maximize className="h-3 sm:h-4 w-3 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">{t('coursePlayer:overview')}</TabsTrigger>
                <TabsTrigger value="transcript" className="text-xs sm:text-sm">{t('coursePlayer:transcript')}</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs sm:text-sm">{t('coursePlayer:notes')}</TabsTrigger>
                <TabsTrigger value="resources" className="text-xs sm:text-sm">{t('coursePlayer:resources')}</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs sm:text-sm flex items-center gap-1">
                  <Star className="h-3 w-3" />{t('coursePlayer:reviews') || 'نظرات'}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{currentLesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {currentLesson.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.floor(currentLesson.duration / 60)} {t('coursePlayer:minutes')}
                      </div>
                      <div className="flex items-center">
                        {currentLesson.isCompleted ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 mr-1" />
                        )}
                        {currentLesson.isCompleted ? t('coursePlayer:completed') : t('coursePlayer:inProgress')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transcript">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('coursePlayer:lessonTranscript')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      {currentLesson.transcript ? (
                        <p className="whitespace-pre-wrap">{currentLesson.transcript}</p>
                      ) : (
                        <p className="text-gray-500">{t('coursePlayer:transcriptNotAvailable')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('coursePlayer:personalNotes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={t('coursePlayer:writeNotesHere')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={10}
                    />
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">{t('coursePlayer:bookmarks')}</h4>
                      <div className="space-y-2">
                        {bookmarks.map((bookmark, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span onClick={() => handleSeek(bookmark)} className="cursor-pointer hover:text-blue-600">
                              {t('coursePlayer:time')} {formatTime(bookmark)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBookmarks(bookmarks.filter((_, i) => i !== index))}
                            >
                              {t('coursePlayer:remove')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('coursePlayer:resourcesAndFiles')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentLesson.resources?.length > 0 ? (
                        currentLesson.resources.map((resource, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>{resource}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              {t('coursePlayer:download')}
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">{t('coursePlayer:noResourcesAvailable')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <CourseReviews
                  courseId={parseInt(courseId)}
                  isEnrolled={enrollmentStatus?.canReview ?? false}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Course Sidebar */}
          <div className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg">{t('coursePlayer:courseLessons')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`p-2 sm:p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        lesson.id === currentLesson.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => setCurrentLessonId(lesson.id)}
                    >
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {lesson.isCompleted ? (
                              <CheckCircle className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">
                              {index + 1}. {lesson.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {Math.floor(lesson.duration / 60)} {t('coursePlayer:minutes')}
                            </p>
                          </div>
                        </div>
                        {lesson.isPreview && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0 whitespace-nowrap">
                            {t('coursePlayer:preview')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg">{t('coursePlayer:courseInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3">
                <div className="flex justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-gray-600 flex-shrink-0">{t('coursePlayer:instructor')}:</span>
                  <span className="font-medium text-right">{course.instructor}</span>
                </div>
                <div className="flex justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-gray-600 flex-shrink-0">{t('coursePlayer:level')}:</span>
                  <Badge variant="outline" className="text-xs">{course.level}</Badge>
                </div>
                <div className="flex justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-gray-600 flex-shrink-0">{t('coursePlayer:language')}:</span>
                  <span className="text-right">{course.language}</span>
                </div>
                <Separator className="my-2 sm:my-3" />
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>{t('coursePlayer:progress')}:</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-1 sm:h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}