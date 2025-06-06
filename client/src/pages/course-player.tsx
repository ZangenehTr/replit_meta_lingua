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
  const [activeTab, setActiveTab] = useState("overview");

  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLanguage, isRTL } = useLanguage();

  // Fetch course data
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['/api/courses', courseId, 'player'],
  });

  // Get current lesson
  const currentLesson = course?.lessons.find(lesson => 
    currentLessonId ? lesson.id === currentLessonId : lesson.order === 1
  ) || course?.lessons[0];

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
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      toast({
        title: "درس تکمیل شد! / Lesson Completed!",
        description: "پیشرفت شما ذخیره شد / Your progress has been saved",
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
      title: "نشانه‌گذاری اضافه شد / Bookmark Added",
      description: `در زمان ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60)} / At ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60)}`,
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

  if (isLoading || !course || !currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <BackButton 
              href="/dashboard" 
              label={currentLanguage === 'fa' ? 'بازگشت به دوره' :
                     currentLanguage === 'ar' ? 'العودة إلى الدورة' :
                     'Back to Course'}
            />
            <div>
              <h1 className="text-xl font-bold">{course.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentLesson.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {course.completedLessons} / {course.totalLessons} {
                currentLanguage === 'fa' ? 'دروس' :
                currentLanguage === 'ar' ? 'الدروس' :
                'lessons'
              }
            </Badge>
            <Progress value={course.progress} className="w-32" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="space-y-2">
                      {/* Progress Bar */}
                      <div className="relative">
                        <Progress 
                          value={(currentTime / duration) * 100} 
                          className="h-2 cursor-pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - rect.left) / rect.width;
                            handleSeek(percent * duration);
                          }}
                        />
                        {bookmarks.map((bookmark, index) => (
                          <div
                            key={index}
                            className="absolute top-0 w-1 h-2 bg-yellow-400 cursor-pointer"
                            style={{ left: `${(bookmark / duration) * 100}%` }}
                            onClick={() => handleSeek(bookmark)}
                          />
                        ))}
                      </div>
                      
                      {/* Control Buttons */}
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateLesson('prev')}
                            className="text-white hover:bg-white/20"
                          >
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePlayPause}
                            className="text-white hover:bg-white/20"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateLesson('next')}
                            className="text-white hover:bg-white/20"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="text-white hover:bg-white/20"
                            >
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-20"
                            />
                          </div>
                          
                          <span className="text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <select
                            value={playbackSpeed}
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
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
                            className="text-white hover:bg-white/20"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                          >
                            <Maximize className="h-4 w-4" />
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">نمای کلی / Overview</TabsTrigger>
                <TabsTrigger value="transcript">متن / Transcript</TabsTrigger>
                <TabsTrigger value="notes">یادداشت‌ها / Notes</TabsTrigger>
                <TabsTrigger value="resources">منابع / Resources</TabsTrigger>
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
                        {Math.floor(currentLesson.duration / 60)} دقیقه
                      </div>
                      <div className="flex items-center">
                        {currentLesson.isCompleted ? (
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 mr-1" />
                        )}
                        {currentLesson.isCompleted ? 'تکمیل شده' : 'در حال مطالعه'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transcript">
                <Card>
                  <CardHeader>
                    <CardTitle>متن درس / Lesson Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      {currentLesson.transcript ? (
                        <p className="whitespace-pre-wrap">{currentLesson.transcript}</p>
                      ) : (
                        <p className="text-gray-500">متن این درس در دسترس نیست / Transcript not available for this lesson</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>یادداشت‌های شخصی / Personal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="یادداشت‌های خود را اینجا بنویسید / Write your notes here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={10}
                    />
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">نشانه‌گذاری‌ها / Bookmarks</h4>
                      <div className="space-y-2">
                        {bookmarks.map((bookmark, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span onClick={() => handleSeek(bookmark)} className="cursor-pointer hover:text-blue-600">
                              زمان {formatTime(bookmark)} / Time {formatTime(bookmark)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBookmarks(bookmarks.filter((_, i) => i !== index))}
                            >
                              حذف / Remove
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
                    <CardTitle>منابع و فایل‌ها / Resources & Files</CardTitle>
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
                              دانلود / Download
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">منابع اضافی برای این درس موجود نیست / No additional resources available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Course Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>فهرست دروس / Course Lessons</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        lesson.id === currentLesson.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => setCurrentLessonId(lesson.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {lesson.isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {index + 1}. {lesson.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.floor(lesson.duration / 60)} دقیقه
                            </p>
                          </div>
                        </div>
                        {lesson.isPreview && (
                          <Badge variant="secondary" className="text-xs">
                            پیش‌نمایش / Preview
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>اطلاعات دوره / Course Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">مدرس / Instructor:</span>
                  <span className="text-sm font-medium">{course.instructor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">سطح / Level:</span>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">زبان / Language:</span>
                  <span className="text-sm">{course.language}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>پیشرفت / Progress:</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}