import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Upload,
  Filter,
  Search,
  Globe,
  Video as VideoIcon,
  Eye,
  Clock,
} from 'lucide-react';
import type { CmsVideo, InsertCmsVideo } from '@shared/schema';
import { FileUploadWidget } from '@/components/forms/widgets/FileUploadWidget';

export default function VideoManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CmsVideo | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewVideo, setPreviewVideo] = useState<CmsVideo | null>(null);

  // Fetch videos with filters
  const { data: videos = [], isLoading: isLoadingVideos } = useQuery<CmsVideo[]>({
    queryKey: ['/api/cms/videos', filterActive, filterLocale, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterActive !== 'all') params.append('isActive', filterActive);
      if (filterLocale !== 'all') params.append('locale', filterLocale);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      
      const query = params.toString();
      return apiRequest(`/api/cms/videos${query ? '?' + query : ''}`, { method: 'GET' });
    }
  });

  // Get unique categories from existing videos
  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));

  // Create video mutation
  const createVideoMutation = useMutation({
    mutationFn: async (videoData: Partial<InsertCmsVideo>) => {
      return apiRequest('/api/cms/videos', {
        method: 'POST',
        body: videoData
      });
    },
    onSuccess: () => {
      toast({
        title: 'Video Created',
        description: 'The video has been created successfully.',
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/videos'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create video. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CmsVideo> }) => {
      const updateData: Partial<InsertCmsVideo> = {
        title: data.title,
        titleEn: data.titleEn,
        titleFa: data.titleFa,
        titleAr: data.titleAr,
        description: data.description,
        descriptionEn: data.descriptionEn,
        descriptionFa: data.descriptionFa,
        descriptionAr: data.descriptionAr,
        videoUrl: data.videoUrl,
        videoType: data.videoType,
        thumbnail: data.thumbnail,
        duration: data.duration,
        category: data.category,
        locale: data.locale,
        isActive: data.isActive,
        createdBy: data.createdBy,
      };

      Object.keys(updateData).forEach(key => 
        updateData[key as keyof InsertCmsVideo] === undefined && delete updateData[key as keyof InsertCmsVideo]
      );

      return apiRequest(`/api/cms/videos/${id}`, {
        method: 'PUT',
        body: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: 'Video Updated',
        description: 'The video has been updated successfully.',
      });
      setEditingVideo(null);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/videos'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update video. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/videos/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Video Deleted',
        description: 'The video has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/videos'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete video. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Toggle active status
  const handleToggleActive = (video: CmsVideo) => {
    updateVideoMutation.mutate({
      id: video.id,
      data: {
        ...video,
        isActive: !video.isActive
      }
    });
  };

  // Filter videos by search query
  const filteredVideos = videos.filter(video => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      video.title?.toLowerCase().includes(query) ||
      video.titleEn?.toLowerCase().includes(query) ||
      video.titleFa?.toLowerCase().includes(query) ||
      video.titleAr?.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query) ||
      video.category?.toLowerCase().includes(query)
    );
  });

  // Helper to get video embed URL
  const getVideoEmbedUrl = (video: CmsVideo) => {
    if (video.videoType === 'youtube') {
      const videoId = video.videoUrl.includes('watch?v=') 
        ? video.videoUrl.split('watch?v=')[1]?.split('&')[0]
        : video.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (video.videoType === 'vimeo') {
      const videoId = video.videoUrl.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return video.videoUrl;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Video Management</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage videos for your CMS
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-video"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>Filter videos by status, language, and category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-videos">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-videos"
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    data-testid="input-search-videos"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-active">Status</Label>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger id="filter-active" data-testid="select-filter-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-locale">Language</Label>
                <Select value={filterLocale} onValueChange={setFilterLocale}>
                  <SelectTrigger id="filter-locale" data-testid="select-filter-locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fa">Persian</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-category">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger id="filter-category" data-testid="select-filter-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat!}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingVideos ? (
            <Card className="col-span-full">
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading videos...</p>
              </CardContent>
            </Card>
          ) : filteredVideos.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6">
                <p className="text-muted-foreground">No videos found. Add your first video to get started!</p>
              </CardContent>
            </Card>
          ) : (
            filteredVideos.map(video => (
              <Card key={video.id} data-testid={`card-video-${video.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div 
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group"
                    onClick={() => setPreviewVideo(video)}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <VideoIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold line-clamp-2">{video.title}</h3>
                      <div className="flex gap-1">
                        <Badge variant={video.isActive ? 'default' : 'secondary'} data-testid={`badge-active-${video.id}`}>
                          {video.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <VideoIcon className="w-3 h-3" />
                        {video.videoType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {video.locale?.toUpperCase() || 'EN'}
                      </span>
                      {video.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.viewCount || 0}
                      </span>
                    </div>

                    {video.category && (
                      <Badge variant="outline">{video.category}</Badge>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingVideo(video)}
                        data-testid={`button-edit-${video.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(video)}
                        data-testid={`button-toggle-${video.id}`}
                      >
                        {video.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this video?')) {
                            deleteVideoMutation.mutate(video.id);
                          }
                        }}
                        data-testid={`button-delete-${video.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <VideoEditorDialog
          open={isCreateDialogOpen || !!editingVideo}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingVideo(null);
            }
          }}
          video={editingVideo}
          onSave={(data) => {
            if (editingVideo) {
              updateVideoMutation.mutate({ id: editingVideo.id, data });
            } else {
              createVideoMutation.mutate({ ...data, createdBy: user?.id });
            }
          }}
        />

        <VideoPreviewDialog
          video={previewVideo}
          open={!!previewVideo}
          onOpenChange={(open) => !open && setPreviewVideo(null)}
          getEmbedUrl={getVideoEmbedUrl}
        />
      </div>
    </AppLayout>
  );
}

interface VideoEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: CmsVideo | null;
  onSave: (data: Partial<CmsVideo>) => void;
}

function VideoEditorDialog({
  open,
  onOpenChange,
  video,
  onSave,
}: VideoEditorDialogProps) {
  const [formData, setFormData] = useState<Partial<CmsVideo>>({
    title: '',
    description: '',
    videoUrl: '',
    videoType: 'youtube',
    thumbnail: '',
    category: '',
    locale: 'en',
    isActive: true,
  });

  // Update formData when video prop changes (for editing)
  useEffect(() => {
    if (video && open) {
      setFormData(video);
    } else if (!open) {
      // Reset to defaults when dialog closes
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        videoType: 'youtube',
        thumbnail: '',
        category: '',
        locale: 'en',
        isActive: true,
      });
    }
  }, [video, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? 'Edit Video' : 'Add New Video'}</DialogTitle>
          <DialogDescription>
            {video ? 'Update your video details' : 'Upload a new video or add an external video link'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-title">Title *</Label>
                <Input
                  id="video-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter video title..."
                  required
                  data-testid="input-video-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-description">Description</Label>
                <Textarea
                  id="video-description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the video..."
                  rows={3}
                  data-testid="textarea-video-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-type">Video Type *</Label>
                <Select
                  value={formData.videoType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, videoType: value }))}
                >
                  <SelectTrigger id="video-type" data-testid="select-video-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="local">Local Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.videoType === 'local' ? (
                <div className="space-y-2">
                  <Label htmlFor="video-file">Video File *</Label>
                  <FileUploadWidget
                    field={{
                      id: 'videoUrl',
                      fileConfig: {
                        multiple: false,
                        maxSize: 100 * 1024 * 1024, // 100MB
                        accept: ['video/*'],
                        subfolder: 'cms-videos',
                        showPreview: false
                      }
                    }}
                    value={formData.videoUrl ? [formData.videoUrl] : []}
                    onChange={(files) => setFormData(prev => ({ ...prev, videoUrl: files[0] || '' }))}
                    language="en"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="video-url">
                    {formData.videoType === 'youtube' ? 'YouTube URL' : 'Vimeo URL'} *
                  </Label>
                  <Input
                    id="video-url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder={formData.videoType === 'youtube' 
                      ? 'https://www.youtube.com/watch?v=...' 
                      : 'https://vimeo.com/...'}
                    required
                    data-testid="input-video-url"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="video-thumbnail">Thumbnail Image</Label>
                <FileUploadWidget
                  field={{
                    id: 'thumbnail',
                    fileConfig: {
                      multiple: false,
                      maxSize: 5 * 1024 * 1024,
                      accept: ['image/*'],
                      subfolder: 'video-thumbnails',
                      showPreview: true
                    }
                  }}
                  value={formData.thumbnail ? [formData.thumbnail] : []}
                  onChange={(files) => setFormData(prev => ({ ...prev, thumbnail: files[0] || '' }))}
                  language="en"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video-category">Category</Label>
                  <Input
                    id="video-category"
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Tutorials, Testimonials"
                    data-testid="input-video-category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-locale">Language</Label>
                  <Select
                    value={formData.locale}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}
                  >
                    <SelectTrigger id="video-locale" data-testid="select-video-locale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fa">Persian</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-duration">Duration (seconds)</Label>
                <Input
                  id="video-duration"
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || undefined }))}
                  placeholder="Video duration in seconds"
                  data-testid="input-video-duration"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="video-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-video-active"
                />
                <Label htmlFor="video-active">Active (visible to public)</Label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-video">
              {video ? 'Update Video' : 'Add Video'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface VideoPreviewDialogProps {
  video: CmsVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getEmbedUrl: (video: CmsVideo) => string;
}

function VideoPreviewDialog({ video, open, onOpenChange, getEmbedUrl }: VideoPreviewDialogProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video.title}</DialogTitle>
          {video.description && (
            <DialogDescription>{video.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          {video.videoType === 'local' ? (
            <video
              src={video.videoUrl}
              controls
              className="w-full h-full"
              data-testid="video-player-local"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={getEmbedUrl(video)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="video-player-embed"
            />
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {video.category && (
            <Badge variant="outline">{video.category}</Badge>
          )}
          <span className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            {video.locale?.toUpperCase() || 'EN'}
          </span>
          {video.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {video.viewCount || 0} views
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
