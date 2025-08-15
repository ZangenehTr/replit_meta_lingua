import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Maximize,
  Bookmark,
  FileText,
  Clock,
  ChevronLeft,
  Save,
  Trash2,
  Edit2,
  Loader2
} from "lucide-react";

interface VideoLesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  level: string;
  skillFocus: string;
  courseId: number;
}

interface VideoProgressData {
  watchTime: number;
  totalDuration: number;
  completed: boolean;
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

export default function StudentVideoPlayer() {
  const [, params] = useRoute('/video/:videoId');
  const videoId = params?.videoId ? parseInt(params.videoId) : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [noteText, setNoteText] = useState("");
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [editingNote, setEditingNote] = useState<VideoNote | null>(null);
  
  // Fetch video lesson
  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ['/api/videos', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const response = await apiRequest(`/api/videos/${videoId}`);
      return response as VideoLesson;
    },
    enabled: !!videoId
  });
  
  // Fetch video progress
  const { data: progress } = useQuery({
    queryKey: ['/api/videos', videoId, 'progress'],
    queryFn: async () => {
      if (!videoId) return null;
      const response = await apiRequest(`/api/videos/${videoId}/progress`);
      return response as VideoProgressData;
    },
    enabled: !!videoId
  });
  
  // Fetch notes
  const { data: notes = [] } = useQuery({
    queryKey: ['/api/videos', videoId, 'notes'],
    queryFn: async () => {
      if (!videoId) return [];
      const response = await apiRequest(`/api/videos/${videoId}/notes`);
      return response as VideoNote[];
    },
    enabled: !!videoId
  });
  
  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['/api/videos', videoId, 'bookmarks'],
    queryFn: async () => {
      if (!videoId) return [];
      const response = await apiRequest(`/api/videos/${videoId}/bookmarks`);
      return response as VideoBookmark[];
    },
    enabled: !!videoId
  });
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: VideoProgressData) => {
      return await apiRequest(`/api/videos/${videoId}/progress`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  });
  
  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async ({ timestamp, content }: { timestamp: number; content: string }) => {
      return await apiRequest(`/api/videos/${videoId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ timestamp, content })
      });
    },
    onSuccess: () => {
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'notes'] });
      setNoteText("");
    }
  });
  
  // Create bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: async ({ timestamp, title }: { timestamp: number; title: string }) => {
      return await apiRequest(`/api/videos/${videoId}/bookmarks`, {
        method: 'POST',
        body: JSON.stringify({ timestamp, title })
      });
    },
    onSuccess: () => {
      toast({
        title: "Bookmark added",
        description: "Bookmark has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'bookmarks'] });
      setBookmarkTitle("");
    }
  });
  
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
  
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    
    // Resume from last position if available
    if (progress?.watchTime) {
      videoRef.current.currentTime = progress.watchTime;
      setCurrentTime(progress.watchTime);
    }
  };
  
  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };
  
  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  
  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const saveNote = () => {
    if (!noteText.trim()) return;
    createNoteMutation.mutate({
      timestamp: currentTime,
      content: noteText
    });
  };
  
  const saveBookmark = () => {
    const title = bookmarkTitle.trim() || `Bookmark at ${formatTime(currentTime)}`;
    createBookmarkMutation.mutate({
      timestamp: currentTime,
      title
    });
  };
  
  // Save progress periodically
  useEffect(() => {
    if (isPlaying && videoId) {
      progressIntervalRef.current = setInterval(() => {
        const completed = currentTime >= duration * 0.9; // 90% watched = completed
        updateProgressMutation.mutate({
          watchTime: currentTime,
          totalDuration: duration,
          completed
        });
      }, 10000); // Save every 10 seconds
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, videoId]);
  
  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (currentTime > 0 && videoId) {
        const completed = currentTime >= duration * 0.9;
        updateProgressMutation.mutate({
          watchTime: currentTime,
          totalDuration: duration,
          completed
        });
      }
    };
  }, [currentTime, duration, videoId]);
  
  if (videoLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Video not found</p>
            <Link href="/courses">
              <Button className="mt-4">Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/courses">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                src={`/api/videos/stream/${videoId}`}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-white text-sm mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSkip(-10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSkip(10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Playback Speed */}
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                      className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                    
                    {/* Volume */}
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-4 w-4 text-white" />
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
                    
                    {/* Fullscreen */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
              <div className="flex gap-2 mb-4">
                <Badge>{video.level}</Badge>
                <Badge variant="outline">{video.skillFocus}</Badge>
                <Badge variant="outline">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTime(video.duration)}
                </Badge>
              </div>
              <p className="text-muted-foreground">{video.description}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Notes and Bookmarks */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Study Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="notes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="notes" className="space-y-4">
                  {/* Add Note */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note at current time..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={saveNote} size="sm" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Save Note at {formatTime(currentTime)}
                    </Button>
                  </div>
                  
                  {/* Notes List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <button
                          onClick={() => handleSeek(note.timestamp)}
                          className="text-sm text-primary hover:underline mb-1 block"
                        >
                          {formatTime(note.timestamp)}
                        </button>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No notes yet
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="bookmarks" className="space-y-4">
                  {/* Add Bookmark */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Bookmark title (optional)"
                      value={bookmarkTitle}
                      onChange={(e) => setBookmarkTitle(e.target.value)}
                    />
                    <Button onClick={saveBookmark} size="sm" className="w-full">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Add Bookmark at {formatTime(currentTime)}
                    </Button>
                  </div>
                  
                  {/* Bookmarks List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bookmarks.map((bookmark) => (
                      <button
                        key={bookmark.id}
                        onClick={() => handleSeek(bookmark.timestamp)}
                        className="w-full p-3 bg-muted rounded-lg text-left hover:bg-muted/80 transition-colors"
                      >
                        <div className="font-medium text-sm">{bookmark.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(bookmark.timestamp)}
                        </div>
                      </button>
                    ))}
                    {bookmarks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No bookmarks yet
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}