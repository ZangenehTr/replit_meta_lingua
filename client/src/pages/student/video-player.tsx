import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, 
  SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Bookmark, Edit2, Trash2, Clock, FileText, BookOpen
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";

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

export default function VideoPlayer() {
  const { lessonId } = useParams();
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Notes and bookmarks state
  const [noteText, setNoteText] = useState("");
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Fetch lesson details
  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: [`/api/student/video-lessons/${lessonId}`],
  });

  // Fetch notes
  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: [`/api/student/video-lessons/${lessonId}/notes`],
  });

  // Fetch bookmarks
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: [`/api/student/video-lessons/${lessonId}/bookmarks`],
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      return apiRequest(`/api/student/video-lessons/${lessonId}/progress`, {
        method: "POST",
        body: JSON.stringify(progressData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/student/courses`] });
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: { timestamp: number; content: string }) => {
      return apiRequest(`/api/student/video-lessons/${lessonId}/notes`, {
        method: "POST",
        body: JSON.stringify(noteData),
      });
    },
    onSuccess: () => {
      setNoteText("");
      refetchNotes();
      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: number; content: string }) => {
      return apiRequest(`/api/student/video-lessons/${lessonId}/notes/${noteId}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      setEditingNoteId(null);
      setEditingNoteText("");
      refetchNotes();
      toast({
        title: "Note updated",
        description: "Your note has been updated.",
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return apiRequest(`/api/student/video-lessons/${lessonId}/notes/${noteId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      refetchNotes();
      toast({
        title: "Note deleted",
        description: "Your note has been deleted.",
      });
    }
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: { timestamp: number; title: string }) => {
      return apiRequest(`/api/student/video-lessons/${lessonId}/bookmarks`, {
        method: "POST",
        body: JSON.stringify(bookmarkData),
      });
    },
    onSuccess: () => {
      setBookmarkTitle("");
      refetchBookmarks();
      toast({
        title: "Bookmark added",
        description: "Your bookmark has been saved.",
      });
    }
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: number) => {
      return apiRequest(`/api/student/video-lessons/${lessonId}/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      refetchBookmarks();
      toast({
        title: "Bookmark deleted",
        description: "Your bookmark has been deleted.",
      });
    }
  });

  // Video controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const goToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Update progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const video = videoRef.current;
        const completed = video.currentTime >= video.duration * 0.9;
        
        updateProgressMutation.mutate({
          watchTime: Math.floor(video.currentTime),
          totalDuration: Math.floor(video.duration),
          completed,
          lastWatchedAt: new Date().toISOString()
        });
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isPlaying, lessonId]);

  if (lessonLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {/* Navigation */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/video-courses/${lesson?.courseId}`)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Course
              </Button>
            </div>

            {/* Video Player */}
            <Card className="mb-4">
              <CardContent className="p-0">
                <div className="relative bg-black rounded-t-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={lesson?.videoUrl}
                    className="w-full aspect-video"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={1}
                      onValueChange={handleSeek}
                      className="mb-4"
                    />
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => skip(-10)}
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => skip(10)}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-white text-sm ml-2">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Volume Control */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div className="w-24">
                          <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.1}
                            onValueChange={handleVolumeChange}
                          />
                        </div>
                        
                        {/* Playback Speed */}
                        <select
                          value={playbackRate}
                          onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                          className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
                        >
                          <option value="0.5">0.5x</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2x</option>
                        </select>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>{lesson?.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge>{lesson?.level}</Badge>
                    {lesson?.skillFocus && (
                      <Badge variant="outline">{lesson?.skillFocus}</Badge>
                    )}
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{lesson?.description}</p>
                
                {/* Supplementary Materials */}
                {(lesson?.transcriptUrl || lesson?.materialsUrl) && (
                  <div className="flex gap-2 mt-4">
                    {lesson?.transcriptUrl && (
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Transcript
                      </Button>
                    )}
                    {lesson?.materialsUrl && (
                      <Button size="sm" variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Materials
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes and Bookmarks Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <Tabs defaultValue="notes" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="notes" className="p-6 pt-0">
                  {/* Add Note Form */}
                  <div className="mb-4">
                    <Textarea
                      placeholder="Take a note at current timestamp..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (noteText.trim()) {
                          addNoteMutation.mutate({
                            timestamp: Math.floor(currentTime),
                            content: noteText.trim()
                          });
                        }
                      }}
                      disabled={!noteText.trim() || addNoteMutation.isPending}
                    >
                      Add Note at {formatTime(currentTime)}
                    </Button>
                  </div>

                  {/* Notes List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {notes.map((note: VideoNote) => (
                        <div key={note.id} className="border rounded p-3">
                          <div className="flex items-start justify-between mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                              onClick={() => goToTimestamp(note.timestamp)}
                            >
                              {formatTime(note.timestamp)}
                            </Button>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingNoteText(note.content);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-600"
                                onClick={() => deleteNoteMutation.mutate(note.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {editingNoteId === note.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateNoteMutation.mutate({
                                      noteId: note.id,
                                      content: editingNoteText
                                    });
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteText("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">{note.content}</p>
                          )}
                        </div>
                      ))}
                      
                      {notes.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No notes yet. Start taking notes while watching!
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="bookmarks" className="p-6 pt-0">
                  {/* Add Bookmark Form */}
                  <div className="mb-4">
                    <Input
                      placeholder="Bookmark title..."
                      value={bookmarkTitle}
                      onChange={(e) => setBookmarkTitle(e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (bookmarkTitle.trim()) {
                          addBookmarkMutation.mutate({
                            timestamp: Math.floor(currentTime),
                            title: bookmarkTitle.trim()
                          });
                        }
                      }}
                      disabled={!bookmarkTitle.trim() || addBookmarkMutation.isPending}
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      Add Bookmark at {formatTime(currentTime)}
                    </Button>
                  </div>

                  {/* Bookmarks List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {bookmarks.map((bookmark: VideoBookmark) => (
                        <div key={bookmark.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => goToTimestamp(bookmark.timestamp)}
                            >
                              <p className="font-medium text-sm">{bookmark.title}</p>
                              <p className="text-xs text-blue-600 hover:text-blue-700">
                                {formatTime(bookmark.timestamp)}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-600"
                              onClick={() => deleteBookmarkMutation.mutate(bookmark.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {bookmarks.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No bookmarks yet. Add bookmarks to quickly navigate!
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}