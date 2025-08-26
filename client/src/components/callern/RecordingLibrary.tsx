// Searchable Recording Library Component with Advanced Features
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter,
  Calendar,
  Clock,
  Play,
  Pause,
  Download,
  Scissors,
  FileText,
  Mic,
  Video,
  Star,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Volume2,
  Subtitles,
  Settings,
  Share2,
  BookmarkPlus,
  MessageSquare,
  HighlighterIcon,
  Loader2,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, formatDistance } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Recording {
  id: string;
  sessionId: number;
  studentName: string;
  teacherName: string;
  studentId: number;
  teacherId: number;
  fileName: string;
  fileSize: number;
  duration: number;
  recordedAt: Date;
  transcript?: TranscriptData;
  highlights?: HighlightSegment[];
  tags?: string[];
  language?: string;
  thumbnail?: string;
  playbackUrl?: string;
}

interface TranscriptData {
  segments: TranscriptSegment[];
  fullText: string;
  keywords: string[];
  confidence: number;
}

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: 'student' | 'teacher';
  confidence: number;
}

interface HighlightSegment {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  type: 'vocabulary' | 'grammar' | 'pronunciation' | 'discussion' | 'feedback';
  importance: 'low' | 'medium' | 'high';
  thumbnail?: string;
}

export function RecordingLibrary({ userId, role }: { userId: number; role: string }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Fetch recordings
  const { data: recordings, isLoading } = useQuery({
    queryKey: ['/api/callern/recordings', { searchQuery, dateFilter, languageFilter }],
    queryFn: () => apiRequest('/api/callern/recordings', 'POST', {
      query: searchQuery,
      [role === 'student' ? 'studentId' : 'teacherId']: userId,
      dateFrom: dateFilter,
      language: languageFilter !== 'all' ? languageFilter : undefined
    })
  });

  // Create highlight reel
  const createReelMutation = useMutation({
    mutationFn: (data: { recordingId: string; segmentIds: string[] }) =>
      apiRequest('/api/callern/recordings/create-reel', 'POST', data),
    onSuccess: (data) => {
      toast({
        title: "Highlight Reel Created",
        description: "Your highlight reel is ready for download"
      });
      window.open(data.downloadUrl, '_blank');
    }
  });

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video playback
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

  // Seek to timestamp
  const seekToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
      
      // Scroll transcript to match
      if (showTranscript && selectedRecording?.transcript) {
        const segment = selectedRecording.transcript.segments.find(
          s => s.startTime <= timestamp && s.endTime >= timestamp
        );
        if (segment && transcriptRef.current) {
          const element = document.getElementById(`segment-${segment.startTime}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Update current segment highlighting
  useEffect(() => {
    if (!videoRef.current || !selectedRecording?.transcript) return;

    const updateHighlight = () => {
      const time = videoRef.current!.currentTime;
      setCurrentTime(time);

      // Highlight current transcript segment
      const segment = selectedRecording.transcript!.segments.find(
        s => s.startTime <= time && s.endTime >= time
      );
      
      if (segment) {
        document.querySelectorAll('.transcript-segment').forEach(el => {
          el.classList.remove('bg-primary/10');
        });
        const element = document.getElementById(`segment-${segment.startTime}`);
        element?.classList.add('bg-primary/10');
      }
    };

    videoRef.current.addEventListener('timeupdate', updateHighlight);
    return () => videoRef.current?.removeEventListener('timeupdate', updateHighlight);
  }, [selectedRecording]);

  // Render recording card
  const renderRecordingCard = (recording: Recording) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={() => setSelectedRecording(recording)}
      >
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
          {recording.thumbnail ? (
            <img 
              src={recording.thumbnail} 
              alt="Recording thumbnail" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
            {formatDuration(recording.duration)}
          </Badge>
          {recording.transcript && (
            <Badge className="absolute top-2 left-2 bg-green-500/90">
              <Subtitles className="w-3 h-3 mr-1" />
              Transcript
            </Badge>
          )}
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm">
                {recording.studentName} - {recording.teacherName}
              </CardTitle>
              <CardDescription className="text-xs">
                {format(new Date(recording.recordedAt), 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            {recording.highlights && recording.highlights.length > 0 && (
              <Badge variant="outline">
                <HighlighterIcon className="w-3 h-3 mr-1" />
                {recording.highlights.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        {recording.tags && recording.tags.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              {recording.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {recording.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{recording.tags.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );

  // Render video player with synchronized features
  const renderVideoPlayer = () => {
    if (!selectedRecording) return null;

    return (
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="flex h-full">
            {/* Video Player Section */}
            <div className="flex-1 flex flex-col">
              <div className="relative bg-black flex-1">
                <video
                  ref={videoRef}
                  src={selectedRecording.playbackUrl}
                  className="w-full h-full"
                  controls={false}
                />
                
                {/* Custom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="space-y-2">
                    {/* Progress Bar */}
                    <Slider
                      value={[currentTime]}
                      max={selectedRecording.duration}
                      onValueChange={([value]) => seekToTimestamp(value)}
                      className="cursor-pointer"
                    />
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? <Pause /> : <Play />}
                        </Button>
                        
                        <span className="text-white text-sm">
                          {formatDuration(currentTime)} / {formatDuration(selectedRecording.duration)}
                        </span>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                              {playbackSpeed}x
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-32">
                            <div className="space-y-2">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                <Button
                                  key={speed}
                                  variant={playbackSpeed === speed ? "default" : "ghost"}
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setPlaybackSpeed(speed);
                                    if (videoRef.current) {
                                      videoRef.current.playbackRate = speed;
                                    }
                                  }}
                                >
                                  {speed}x
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => setShowTranscript(!showTranscript)}
                        >
                          <Subtitles />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.requestFullscreen();
                            }
                          }}
                        >
                          <Maximize2 />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => window.open(selectedRecording.playbackUrl, '_blank')}
                        >
                          <Download />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Highlights Timeline */}
              {selectedRecording.highlights && selectedRecording.highlights.length > 0 && (
                <div className="h-20 bg-gray-100 dark:bg-gray-800 p-2 overflow-x-auto">
                  <div className="flex gap-2 h-full">
                    {selectedRecording.highlights.map(highlight => (
                      <motion.div
                        key={highlight.id}
                        whileHover={{ scale: 1.05 }}
                        className={`relative flex-shrink-0 w-32 rounded cursor-pointer border-2 ${
                          selectedHighlights.includes(highlight.id) ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => seekToTimestamp(highlight.startTime)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded" />
                        <img 
                          src={highlight.thumbnail} 
                          alt={highlight.title}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-white text-xs truncate">{highlight.title}</p>
                          <p className="text-white/70 text-xs">
                            {formatDuration(highlight.startTime)}
                          </p>
                        </div>
                        <button
                          className="absolute top-1 right-1 p-1 bg-white/20 rounded hover:bg-white/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHighlights(prev => 
                              prev.includes(highlight.id)
                                ? prev.filter(id => id !== highlight.id)
                                : [...prev, highlight.id]
                            );
                          }}
                        >
                          <BookmarkPlus className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transcript Panel */}
            {showTranscript && selectedRecording.transcript && (
              <div className="w-96 border-l bg-white dark:bg-gray-900">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transcript
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      Confidence: {Math.round(selectedRecording.transcript.confidence * 100)}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const text = selectedRecording.transcript!.fullText;
                        navigator.clipboard.writeText(text);
                        toast({ title: "Transcript copied to clipboard" });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 h-[calc(100%-80px)]" ref={transcriptRef}>
                  <div className="p-4 space-y-3">
                    {selectedRecording.transcript.segments.map((segment, idx) => (
                      <div
                        key={idx}
                        id={`segment-${segment.startTime}`}
                        className="transcript-segment p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => seekToTimestamp(segment.startTime)}
                      >
                        <div className="flex items-start gap-2">
                          <Badge 
                            variant={segment.speaker === 'teacher' ? 'default' : 'secondary'}
                            className="flex-shrink-0"
                          >
                            {segment.speaker === 'teacher' ? 'T' : 'S'}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm">{segment.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDuration(segment.startTime)} - {formatDuration(segment.endTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Keywords */}
                {selectedRecording.transcript.keywords && (
                  <div className="p-4 border-t">
                    <p className="text-sm font-medium mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRecording.transcript.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Recording Library</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Search and review your recorded sessions
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by keywords, student name, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fa">Farsi</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? '⊞' : '☰'}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSearchQuery('has:transcript')}
              >
                With Transcript
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSearchQuery('has:highlights')}
              >
                With Highlights
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSearchQuery('duration:>30')}
              >
                Long Sessions
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Highlight Reel Button */}
      {selectedHighlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary/10 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Create Highlight Reel</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedHighlights.length} segments selected
                  </p>
                </div>
                <Button 
                  onClick={() => setShowHighlightDialog(true)}
                  disabled={createReelMutation.isPending}
                >
                  {createReelMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Create Reel
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recordings Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : recordings && recordings.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "space-y-4"
        }>
          {recordings.map((recording: Recording) => 
            viewMode === 'grid' 
              ? renderRecordingCard(recording)
              : (
                <Card key={recording.id} className="cursor-pointer" onClick={() => setSelectedRecording(recording)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          {recording.thumbnail ? (
                            <img src={recording.thumbnail} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <Video className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {recording.studentName} - {recording.teacherName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(recording.recordedAt), 'MMM dd, yyyy')} • {formatDuration(recording.duration)}
                          </p>
                          {recording.tags && (
                            <div className="flex gap-1 mt-1">
                              {recording.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {recording.transcript && (
                          <Badge className="bg-green-500/10 text-green-600">
                            <Subtitles className="w-3 h-3 mr-1" />
                            Transcript
                          </Badge>
                        )}
                        {recording.highlights && recording.highlights.length > 0 && (
                          <Badge variant="outline">
                            <HighlighterIcon className="w-3 h-3 mr-1" />
                            {recording.highlights.length}
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No recordings found
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal */}
      {renderVideoPlayer()}

      {/* Create Highlight Reel Dialog */}
      <Dialog open={showHighlightDialog} onOpenChange={setShowHighlightDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Highlight Reel</DialogTitle>
            <DialogDescription>
              Combine selected highlights into a single video
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm">
              You've selected {selectedHighlights.length} segments. The reel will be created in the order shown.
            </p>
            
            {/* Preview selected segments */}
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {selectedHighlights.map((id, idx) => {
                  const recording = recordings?.find((r: Recording) => 
                    r.highlights?.some(h => h.id === id)
                  );
                  const highlight = recording?.highlights?.find(h => h.id === id);
                  
                  if (!highlight) return null;
                  
                  return (
                    <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm font-medium">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{highlight.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDuration(highlight.startTime)} - {formatDuration(highlight.endTime)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedHighlights(prev => 
                          prev.filter(hId => hId !== id)
                        )}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHighlightDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedRecording) {
                  createReelMutation.mutate({
                    recordingId: selectedRecording.id,
                    segmentIds: selectedHighlights
                  });
                  setShowHighlightDialog(false);
                }
              }}
              disabled={createReelMutation.isPending}
            >
              Create Reel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}