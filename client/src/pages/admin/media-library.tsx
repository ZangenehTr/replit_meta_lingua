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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import {
  Upload,
  Edit,
  Trash2,
  Search,
  Filter,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Music,
  Copy,
  Download,
  Eye,
  Calendar,
  HardDrive,
} from 'lucide-react';
import type { CmsMediaAsset, InsertCmsMediaAsset } from '@shared/schema';
import { FileUploadWidget } from '@/components/forms/widgets/FileUploadWidget';

export default function MediaLibrary() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<CmsMediaAsset | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch media assets with filters
  const { data: mediaAssets = [], isLoading: isLoadingMedia } = useQuery<CmsMediaAsset[]>({
    queryKey: ['/api/cms/media', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('fileType', filterType);
      
      const query = params.toString();
      return apiRequest(`/api/cms/media${query ? '?' + query : ''}`, { method: 'GET' });
    }
  });

  // Filter assets by search query
  const filteredAssets = mediaAssets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.fileName?.toLowerCase().includes(query) ||
      asset.originalName?.toLowerCase().includes(query) ||
      asset.alt?.toLowerCase().includes(query) ||
      asset.caption?.toLowerCase().includes(query)
    );
  });

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return ImageIcon;
      case 'video':
        return VideoIcon;
      case 'audio':
        return Music;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Copy file URL to clipboard
  const handleCopyUrl = (filePath: string) => {
    navigator.clipboard.writeText(filePath);
    toast({
      title: 'URL Copied',
      description: 'File URL has been copied to clipboard.',
    });
  };

  // Download file
  const handleDownload = (filePath: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate stats
  const stats = {
    total: mediaAssets.length,
    images: mediaAssets.filter(a => a.fileType === 'image').length,
    videos: mediaAssets.filter(a => a.fileType === 'video').length,
    documents: mediaAssets.filter(a => a.fileType === 'document').length,
    audio: mediaAssets.filter(a => a.fileType === 'audio').length,
    totalSize: mediaAssets.reduce((sum, a) => sum + (a.fileSize || 0), 0),
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage all your images, videos, documents, and audio files
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <FileText className="w-4 h-4 mr-1" />
              List
            </Button>
            <Button 
              onClick={() => setIsUploadDialogOpen(true)}
              data-testid="button-upload-media"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Images</p>
                  <p className="text-2xl font-bold">{stats.images}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <VideoIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Videos</p>
                  <p className="text-2xl font-bold">{stats.videos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{stats.documents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Music className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audio</p>
                  <p className="text-2xl font-bold">{stats.audio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <HardDrive className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="text-lg font-bold">{formatFileSize(stats.totalSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>Search and filter media files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-media">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-media"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    data-testid="input-search-media"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-type">File Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filter-type" data-testid="select-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoadingMedia ? (
              <Card className="col-span-full">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Loading media assets...</p>
                </CardContent>
              </Card>
            ) : filteredAssets.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">No media files found. Upload your first file to get started!</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssets.map(asset => {
                const Icon = getFileIcon(asset.fileType);
                return (
                  <Card key={asset.id} className="overflow-hidden" data-testid={`card-asset-${asset.id}`}>
                    <div 
                      className="aspect-square bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors relative group"
                      onClick={() => setEditingAsset(asset)}
                    >
                      {asset.fileType === 'image' ? (
                        <img
                          src={asset.filePath}
                          alt={asset.alt || asset.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-12 h-12 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(asset.filePath);
                          }}
                          data-testid={`button-copy-url-${asset.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(asset.filePath, asset.fileName);
                          }}
                          data-testid={`button-download-file-${asset.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium truncate" title={asset.originalName}>
                        {asset.originalName}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {asset.fileType}
                        </Badge>
                        <span>{formatFileSize(asset.fileSize)}</span>
                      </div>
                      {asset.usageCount > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Used {asset.usageCount}x
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map(asset => {
              const Icon = getFileIcon(asset.fileType);
              return (
                <Card key={asset.id} data-testid={`card-asset-${asset.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {asset.fileType === 'image' ? (
                          <img
                            src={asset.filePath}
                            alt={asset.alt || asset.originalName}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Icon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.originalName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline">{asset.fileType}</Badge>
                          <span>{formatFileSize(asset.fileSize)}</span>
                          {asset.width && asset.height && (
                            <span>{asset.width} × {asset.height}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(asset.createdAt).toLocaleDateString()}
                          </span>
                          {asset.usageCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {asset.usageCount}x
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyUrl(asset.filePath)}
                          data-testid={`button-copy-url-list-${asset.id}`}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy URL
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAsset(asset)}
                          data-testid={`button-edit-list-${asset.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <UploadMediaDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/cms/media'] });
            setIsUploadDialogOpen(false);
          }}
        />

        <EditAssetDialog
          asset={editingAsset}
          open={!!editingAsset}
          onOpenChange={(open) => !open && setEditingAsset(null)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/cms/media'] });
            setEditingAsset(null);
          }}
        />
      </div>
    </AppLayout>
  );
}

interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

function UploadMediaDialog({ open, onOpenChange, onUploadComplete }: UploadMediaDialogProps) {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setUploadedFiles([]);
    }
  }, [open]);

  const handleFilesUploaded = (files: string[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      onUploadComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Media Files</DialogTitle>
          <DialogDescription>
            Upload images, videos, documents, or audio files to your media library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FileUploadWidget
            field={{
              id: 'mediaFiles',
              fileConfig: {
                multiple: true,
                maxSize: 100 * 1024 * 1024, // 100MB
                accept: ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.txt'],
                subfolder: 'media-library',
                showPreview: true
              }
            }}
            value={uploadedFiles}
            onChange={handleFilesUploaded}
            language="en"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EditAssetDialogProps {
  asset: CmsMediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

function EditAssetDialog({ asset, open, onOpenChange, onSave }: EditAssetDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    alt: '',
    caption: '',
  });

  useEffect(() => {
    if (asset && open) {
      setFormData({
        alt: asset.alt || '',
        caption: asset.caption || '',
      });
    }
  }, [asset, open]);

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async (data: { id: number, alt: string, caption: string }) => {
      return apiRequest(`/api/cms/media/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ alt: data.alt, caption: data.caption }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Update Saved',
        description: 'Media asset metadata has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/media'] });
      onSave();
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update media asset. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (asset) {
      updateAssetMutation.mutate({
        id: asset.id,
        alt: formData.alt,
        caption: formData.caption
      });
    }
  };

  if (!asset) return null;

  const Icon = asset.fileType === 'image' ? ImageIcon :
               asset.fileType === 'video' ? VideoIcon :
               asset.fileType === 'audio' ? Music : FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Media Asset</DialogTitle>
          <DialogDescription>Update metadata for {asset.originalName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-48 h-48 bg-muted rounded flex items-center justify-center flex-shrink-0">
              {asset.fileType === 'image' ? (
                <img
                  src={asset.filePath}
                  alt={asset.alt || asset.originalName}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Icon className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">File Name</p>
                <p className="font-medium">{asset.originalName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge>{asset.fileType}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {asset.width && asset.height && (
                <div>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                  <p>{asset.width} × {asset.height} pixels</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Usage Count</p>
                <p>{asset.usageCount || 0} times</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset-alt">Alt Text</Label>
              <Input
                id="asset-alt"
                value={formData.alt}
                onChange={(e) => setFormData(prev => ({ ...prev, alt: e.target.value }))}
                placeholder="Describe the image for accessibility..."
                data-testid="input-asset-alt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-caption">Caption</Label>
              <Textarea
                id="asset-caption"
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Add a caption..."
                rows={3}
                data-testid="textarea-asset-caption"
              />
            </div>

            <div className="space-y-2">
              <Label>File URL</Label>
              <div className="flex gap-2">
                <Input value={asset.filePath} readOnly data-testid="input-file-path" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(asset.filePath);
                    toast({
                      title: 'URL Copied',
                      description: 'File URL has been copied to clipboard.',
                    });
                  }}
                  data-testid="button-copy-url-dialog"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-asset">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
