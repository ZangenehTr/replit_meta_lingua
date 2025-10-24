import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/layout/sidebar';
import { apiRequest } from '@/lib/queryClient';
import {
  Upload,
  Video,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Clock,
  Users,
  BarChart,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface VideoLesson {
  id: number;
  courseId: number;
  courseName: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  moduleId: number | null;
  orderIndex: number;
  language: string;
  level: string;
  skillFocus: string;
  isFree: boolean;
  isPublished: boolean;
  viewCount: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  name: string;
  description: string;
}

interface VideoStats {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  averageCompletionRate: number;
  publishedVideos: number;
  draftVideos: number;
}

export default function TeacherVideoManagement() {
  const { t } = useTranslation(['teacher', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form state for new video
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    courseId: '',
    level: 'A1',
    skillFocus: 'general',
    isFree: false,
    file: null as File | null
  });

  // Fetch teacher's video lessons
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['/api/teacher/videos'],
    queryFn: async () => {
      const response = await apiRequest('/api/teacher/videos');
      return response as VideoLesson[];
    }
  });

  // Fetch courses for selection
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/teacher/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/teacher/courses');
      return response as Course[];
    }
  });

  // Fetch video statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/teacher/video-stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/teacher/video-stats');
      return response as VideoStats;
    }
  });

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      try {
        const response = await fetch('/api/teacher/videos/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        return await response.json();
      } finally {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/video-stats'] });
      setIsUploadDialogOpen(false);
      setUploadForm({
        title: '',
        description: '',
        courseId: '',
        level: 'A1',
        skillFocus: 'general',
        isFree: false,
        file: null
      });
      toast({
        title: t('common:toast.success'),
        description: t('teacher:videoManagement.uploadSuccess')
      });
    },
    onError: () => {
      toast({
        title: t('common:toast.error'),
        description: t('teacher:videoManagement.uploadError'),
        variant: 'destructive'
      });
    }
  });

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<VideoLesson> }) => {
      return await apiRequest(`/api/teacher/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/videos'] });
      setIsEditDialogOpen(false);
      setSelectedVideo(null);
      toast({
        title: t('common:toast.success'),
        description: t('teacher:videoManagement.updateSuccess')
      });
    }
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/teacher/videos/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/videos'] });
      toast({
        title: t('common:toast.success'),
        description: t('teacher:videoManagement.deleteSuccess')
      });
    }
  });

  // Toggle publish status mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      return await apiRequest(`/api/teacher/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/videos'] });
      toast({
        title: t('common:toast.success'),
        description: t('teacher:videoManagement.statusUpdated')
      });
    }
  });

  // Filter videos
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === 'all' || video.courseId.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: t('common:toast.error'),
          description: t('teacher:videoManagement.fileTooLarge'),
          variant: 'destructive'
        });
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.title || !uploadForm.courseId) {
      toast({
        title: t('common:toast.error'),
        description: t('teacher:videoManagement.requiredFields'),
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('video', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('courseId', uploadForm.courseId);
    formData.append('level', uploadForm.level);
    formData.append('skillFocus', uploadForm.skillFocus);
    formData.append('isFree', uploadForm.isFree.toString());

    uploadVideoMutation.mutate(formData);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('teacher:videoManagement.title')}</h1>
            <p className="text-muted-foreground">{t('teacher:videoManagement.subtitle')}</p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('teacher:videoManagement.totalVideos')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('teacher:videoManagement.totalViews')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('teacher:videoManagement.avgCompletion')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageCompletionRate}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('teacher:videoManagement.published')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.publishedVideos}/{stats.totalVideos}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('teacher:videoManagement.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('teacher:videoManagement.allCourses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher:videoManagement.allCourses')}</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {t('teacher:videoManagement.uploadVideo')}
            </Button>
          </div>

          {/* Videos List */}
          {videosLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <Card className="p-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('teacher:videoManagement.noVideos')}</h3>
              <p className="text-muted-foreground mb-4">{t('teacher:videoManagement.noVideosDescription')}</p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                {t('teacher:videoManagement.uploadFirstVideo')}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {video.isPublished ? (
                        <Badge className="bg-green-500">{t('teacher:videoManagement.published')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('teacher:videoManagement.draft')}</Badge>
                      )}
                      {video.isFree && (
                        <Badge variant="outline">{t('teacher:videoManagement.free')}</Badge>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {video.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.viewCount} {t('teacher:videoManagement.views')}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart className="h-3 w-3" />
                        {video.completionRate}% {t('teacher:videoManagement.completion')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {video.level}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Switch
                        checked={video.isPublished}
                        onCheckedChange={(checked) => 
                          togglePublishMutation.mutate({ id: video.id, isPublished: checked })
                        }
                        disabled={togglePublishMutation.isPending}
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVideo(video);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(t('teacher:videoManagement.confirmDelete'))) {
                              deleteVideoMutation.mutate(video.id);
                            }
                          }}
                          disabled={deleteVideoMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Upload Dialog */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('teacher:videoManagement.uploadNewVideo')}</DialogTitle>
                <DialogDescription>
                  {t('teacher:videoManagement.uploadDescription')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label>{t('teacher:videoManagement.videoFile')}</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadForm.file ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{uploadForm.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(uploadForm.file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUploadForm({ ...uploadForm, file: null })}
                        >
                          {t('common:remove')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('teacher:videoManagement.selectFile')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">{t('teacher:videoManagement.videoTitle')}</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder={t('teacher:videoManagement.titlePlaceholder')}
                    className="mt-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">{t('teacher:videoManagement.videoDescription')}</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder={t('teacher:videoManagement.descriptionPlaceholder')}
                    className="mt-2"
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <Label>{t('teacher:videoManagement.course')}</Label>
                  <Select 
                    value={uploadForm.courseId} 
                    onValueChange={(value) => setUploadForm({ ...uploadForm, courseId: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t('teacher:videoManagement.selectCourse')} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Level and Skill Focus */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('teacher:videoManagement.level')}</Label>
                    <Select 
                      value={uploadForm.level} 
                      onValueChange={(value) => setUploadForm({ ...uploadForm, level: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 - Beginner</SelectItem>
                        <SelectItem value="A2">A2 - Elementary</SelectItem>
                        <SelectItem value="B1">B1 - Intermediate</SelectItem>
                        <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                        <SelectItem value="C1">C1 - Advanced</SelectItem>
                        <SelectItem value="C2">C2 - Proficiency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('teacher:videoManagement.skillFocus')}</Label>
                    <Select 
                      value={uploadForm.skillFocus} 
                      onValueChange={(value) => setUploadForm({ ...uploadForm, skillFocus: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t('teacher:videoManagement.general')}</SelectItem>
                        <SelectItem value="speaking">{t('teacher:videoManagement.speaking')}</SelectItem>
                        <SelectItem value="listening">{t('teacher:videoManagement.listening')}</SelectItem>
                        <SelectItem value="reading">{t('teacher:videoManagement.reading')}</SelectItem>
                        <SelectItem value="writing">{t('teacher:videoManagement.writing')}</SelectItem>
                        <SelectItem value="grammar">{t('teacher:videoManagement.grammar')}</SelectItem>
                        <SelectItem value="vocabulary">{t('teacher:videoManagement.vocabulary')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Free Video Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="isFree">{t('teacher:videoManagement.freeVideo')}</Label>
                  <Switch
                    id="isFree"
                    checked={uploadForm.isFree}
                    onCheckedChange={(checked) => setUploadForm({ ...uploadForm, isFree: checked })}
                  />
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('teacher:videoManagement.uploading')}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadForm.file || !uploadForm.title || !uploadForm.courseId}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('teacher:videoManagement.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('teacher:videoManagement.upload')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          {selectedVideo && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('teacher:videoManagement.editVideo')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">{t('teacher:videoManagement.videoTitle')}</Label>
                    <Input
                      id="edit-title"
                      value={selectedVideo.title}
                      onChange={(e) => setSelectedVideo({ ...selectedVideo, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">{t('teacher:videoManagement.videoDescription')}</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedVideo.description}
                      onChange={(e) => setSelectedVideo({ ...selectedVideo, description: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-isFree">{t('teacher:videoManagement.freeVideo')}</Label>
                    <Switch
                      id="edit-isFree"
                      checked={selectedVideo.isFree}
                      onCheckedChange={(checked) => setSelectedVideo({ ...selectedVideo, isFree: checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedVideo(null);
                    }}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      updateVideoMutation.mutate({
                        id: selectedVideo.id,
                        data: {
                          title: selectedVideo.title,
                          description: selectedVideo.description,
                          isFree: selectedVideo.isFree
                        }
                      });
                    }}
                    disabled={updateVideoMutation.isPending}
                  >
                    {t('common:save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}