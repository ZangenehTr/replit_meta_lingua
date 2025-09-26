import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { 
  Box, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Settings,
  Upload,
  Download,
  Palette,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Smartphone
} from "lucide-react";

export function AdminThreeDContentTools() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch 3D content data
  const { data: content = [], isLoading } = useQuery({
    queryKey: ['/api/admin/3d-content', { search: searchTerm, type: filterType }],
  });

  // Mock 3D content data for development
  const mockContent = [
    {
      id: 1,
      name: "Virtual Classroom",
      type: "environment",
      description: "Interactive 3D classroom with whiteboards and student desks",
      status: "published",
      lastModified: "2024-01-20",
      fileSize: "45.2 MB",
      downloads: 234,
      rating: 4.8
    },
    {
      id: 2,
      name: "Grammar Tower",
      type: "interactive",
      description: "3D tower climbing game for grammar practice",
      status: "draft",
      lastModified: "2024-01-18",
      fileSize: "67.8 MB",
      downloads: 156,
      rating: 4.6
    },
    {
      id: 3,
      name: "Language Lab",
      type: "environment",
      description: "Modern language laboratory with audio stations",
      status: "published",
      lastModified: "2024-01-15",
      fileSize: "52.1 MB",
      downloads: 189,
      rating: 4.9
    }
  ];

  const displayContent = isLoading ? mockContent : (Array.isArray(content) && content.length > 0 ? content : mockContent);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.3dContentTools')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:3dContent.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-upload-content">
                <Upload className="h-4 w-4 mr-2" />
                {t('admin:3dContent.uploadContent')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin:3dContent.uploadContent')}</DialogTitle>
                <DialogDescription>
                  {t('admin:3dContent.uploadDescription')}
                </DialogDescription>
              </DialogHeader>
              {/* Upload form would go here */}
            </DialogContent>
          </Dialog>
          <Button data-testid="button-create-3d">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin:3dContent.createNew')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:3dContent.totalContent')}
            </CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-content">
              {displayContent.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:3dContent.published')}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-published-content">
              {displayContent.filter(c => c.status === 'published').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:3dContent.totalDownloads')}
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-downloads">
              {displayContent.reduce((sum, c) => sum + c.downloads, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:3dContent.avgRating')}
            </CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-rating">
              {(displayContent.reduce((sum, c) => sum + c.rating, 0) / displayContent.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management */}
      <Tabs defaultValue="browser" className="w-full">
        <TabsList>
          <TabsTrigger value="browser">{t('admin:3dContent.contentBrowser')}</TabsTrigger>
          <TabsTrigger value="editor">{t('admin:3dContent.editor')}</TabsTrigger>
          <TabsTrigger value="preview">{t('admin:3dContent.preview')}</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin:3dContent.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-content"
              />
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayContent.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-content-name-${item.id}`}>
                        {item.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {item.type}
                      </Badge>
                    </div>
                    <Badge 
                      variant={item.status === 'published' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${item.id}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('admin:3dContent.fileSize')}</span>
                      <span data-testid={`text-filesize-${item.id}`}>{item.fileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('admin:3dContent.downloads')}</span>
                      <span data-testid={`text-downloads-${item.id}`}>{item.downloads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('admin:3dContent.rating')}</span>
                      <span data-testid={`text-rating-${item.id}`}>{item.rating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('admin:3dContent.lastModified')}</span>
                      <span data-testid={`text-modified-${item.id}`}>{item.lastModified}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" data-testid={`button-preview-${item.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common:preview')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-${item.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common:edit')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-download-${item.id}`}>
                      <Download className="h-4 w-4 mr-1" />
                      {t('common:download')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:3dContent.editor')}</CardTitle>
              <CardDescription>
                {t('admin:3dContent.editorDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:3dContent.editorPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:3dContent.preview')}</CardTitle>
              <CardDescription>
                {t('admin:3dContent.previewDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:3dContent.previewPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}