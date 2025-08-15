import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  BookmarkPlus,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoPlayerProps {
  lessonId: number;
  courseId?: number;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

interface VideoLesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  transcriptUrl?: string;
  subtitlesUrl?: string;
  materialsUrl?: string;
}

interface VideoProgress {
  watchTime: number;
  totalDuration: number;
  completed: boolean;
  lastWatchedAt: string;
}

interface VideoNote {
  id: number;
  timestamp: number;
  content: string;
  createdAt: string;
}

interface VideoBookmark {
  id: number;
  timestamp: number;
  title: string;
  createdAt: string;
}

export default function VideoPlayer({ lessonId, courseId, onComplete, onNext, onPrevious }: VideoPlayerProps) {
  const { t } = useTranslation(['student', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Notes and bookmarks
  const [noteText, setNoteText] = useState('');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [activeTab, setActiveTab] = useState('notes');

  // Fetch video lesson data
  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['/api/videos', lessonId],
    queryFn: async () => {
      const response = await apiRequest(`/api/videos/${lessonId}`);
      return response as VideoLesson;
    }
  });

  // Fetch video progress
  const { data: progress } = useQuery({
    queryKey: ['/api/videos', lessonId, 'progress'],
    queryFn: async () => {
      const response = await apiRequest(`/api/videos/${lessonId}/progress`);
      return response as VideoProgress;
    }
  });

  // Fetch notes
  const { data: notes = [] } = useQuery({
    queryKey: ['/api/videos', lessonId, 'notes'],
    queryFn: async () => {
      const response = await apiRequest(`/api/videos/${lessonId}/notes`);
      return response as VideoNote[];
    }
  });

  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['/api/videos', lessonId, 'bookmarks'],
    queryFn: async () => {
      const response = await apiRequest(`/api/videos/${lessonId}/bookmarks`);
      return response as VideoBookmark[];
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { watchTime: number; totalDuration: number; completed: boolean }) => {
      return await apiRequest(`/api/videos/${lessonId}/progress`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (data: { timestamp: number; content: string }) => {
      return await apiRequest(`/api/videos/${lessonId}/notes`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', lessonId, 'notes'] });
      setNoteText('');
      toast({
        title: t('common:toast.success'),
        description: t('student:videoPlayer.noteAdded')
      });
    }
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (data: { timestamp: number; title: string }) => {
      return await apiRequest(`/api/videos/${lessonId}/bookmarks`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', lessonId, 'bookmarks'] });
      setBookmarkTitle('');
      toast({
        title: t('common:toast.success'),
        description: t('student:videoPlayer.bookmarkAdded')
      });
    }
  });

  // Load saved progress when video loads
  useEffect(() => {
    if (videoRef.current && progress) {
      videoRef.current.currentTime = progress.watchTime;
      setCurrentTime(progress.watchTime);
    }
  }, [progress, lesson]);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const watchTime = videoRef.current.currentTime;
        const totalDuration = videoRef.current.duration;
        const completed = watchTime / totalDuration > 0.9;

        updateProgressMutation.mutate({
          watchTime,
          totalDuration,
          completed
        });

        if (completed && onComplete) {
          onComplete();
        }
      }
    }, 10000); // Save every 10 seconds

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, lessonId]);

  // Video event handlers
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const newTime = value[0];
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (rate: string) => {
    if (!videoRef.current) return;
    const newRate = parseFloat(rate);
    videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSkipBack = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const handleSkipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate({
      timestamp: currentTime,
      content: noteText
    });
  };

  const handleAddBookmark = () => {
    if (!bookmarkTitle.trim()) return;
    addBookmarkMutation.mutate({
      timestamp: currentTime,
      title: bookmarkTitle
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToTimestamp = (timestamp: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestamp;
    setCurrentTime(timestamp);
  };

  if (lessonLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-8">
        <p>{t('student:videoPlayer.lessonNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <Card className="overflow-hidden bg-black">
        <div 
          className="relative aspect-video"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={`/api/videos/stream/${lessonId}`}
            className="w-full h-full"
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
            }}
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />

          {/* Video Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleSkipBack}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleSkipForward}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {/* Volume Control */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Playback Speed */}
                <Select value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
                  <SelectTrigger className="w-20 h-8 text-white border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>

                {/* Fullscreen */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleFullscreen}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lesson Info and Interactive Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lesson Details */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{lesson.title}</h2>
              <div className="flex gap-2">
                {onPrevious && (
                  <Button variant="outline" size="sm" onClick={onPrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('student:videoPlayer.previous')}
                  </Button>
                )}
                {onNext && (
                  <Button variant="outline" size="sm" onClick={onNext}>
                    {t('student:videoPlayer.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4">{lesson.description}</p>
            
            {progress && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round((progress.watchTime / duration) * 100)}% {t('student:videoPlayer.watched')}
                </span>
                {progress.completed && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {t('student:videoPlayer.completed')}
                  </span>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Notes and Bookmarks */}
        <Card className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                {t('student:videoPlayer.notes')}
              </TabsTrigger>
              <TabsTrigger value="bookmarks">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {t('student:videoPlayer.bookmarks')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-2">
                <Textarea
                  placeholder={t('student:videoPlayer.addNotePlaceholder')}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  className="w-full"
                >
                  {t('student:videoPlayer.addNote')} @ {formatTime(currentTime)}
                </Button>
              </div>

              {/* Notes List */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80"
                      onClick={() => jumpToTimestamp(note.timestamp)}
                    >
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{formatTime(note.timestamp)}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      {t('student:videoPlayer.noNotes')}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bookmarks" className="space-y-4">
              {/* Add Bookmark Form */}
              <div className="space-y-2">
                <Input
                  placeholder={t('student:videoPlayer.bookmarkTitlePlaceholder')}
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                />
                <Button 
                  onClick={handleAddBookmark} 
                  disabled={!bookmarkTitle.trim() || addBookmarkMutation.isPending}
                  className="w-full"
                >
                  {t('student:videoPlayer.addBookmark')} @ {formatTime(currentTime)}
                </Button>
              </div>

              {/* Bookmarks List */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div 
                      key={bookmark.id} 
                      className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80"
                      onClick={() => jumpToTimestamp(bookmark.timestamp)}
                    >
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{formatTime(bookmark.timestamp)}</span>
                        <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium">{bookmark.title}</p>
                    </div>
                  ))}
                  {bookmarks.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      {t('student:videoPlayer.noBookmarks')}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}