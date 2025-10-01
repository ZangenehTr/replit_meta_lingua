import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', type: '' });
  const [uploadFormData, setUploadFormData] = useState({ name: '', description: '', file: null as File | null });

  // Fetch 3D content data
  const { data: content = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/3d-content', { search: searchTerm, type: filterType }],
  });

  // Save/Update content mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedContent?.id) {
        return apiRequest(`/api/admin/3d-content/${selectedContent.id}`, { method: 'PATCH', body: data });
      } else {
        return apiRequest('/api/admin/3d-content', { method: 'POST', body: data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/3d-content'] });
      toast({ title: t('common:success'), description: t('admin:3dContent.saveSuccess', 'محتوا با موفقیت ذخیره شد') });
      setIsEditorOpen(false);
      setSelectedContent(null);
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('admin:3dContent.saveError', 'خطا در ذخیره محتوا'), variant: 'destructive' });
    }
  });

  // Upload content mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/admin/3d-content/upload', { method: 'POST', body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/3d-content'] });
      toast({ title: t('common:success'), description: t('admin:3dContent.uploadSuccess', 'فایل با موفقیت آپلود شد') });
      setUploadFormData({ name: '', description: '', file: null });
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('admin:3dContent.uploadError', 'خطا در آپلود فایل'), variant: 'destructive' });
    }
  });

  const displayContent = Array.isArray(content) ? content : [];

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
                  {t('admin:3dContent.uploadDescription', 'فایل محتوای سه‌بعدی خود را آپلود کنید')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin:3dContent.name', 'نام')}</label>
                  <Input 
                    value={uploadFormData.name}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, name: e.target.value })}
                    placeholder={t('admin:3dContent.namePlaceholder', 'نام محتوا را وارد کنید')}
                    data-testid="input-upload-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin:3dContent.description', 'توضیحات')}</label>
                  <Input 
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                    placeholder={t('admin:3dContent.descriptionPlaceholder', 'توضیحات محتوا را وارد کنید')}
                    data-testid="input-upload-description"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('admin:3dContent.file', 'فایل')}</label>
                  <Input 
                    type="file" 
                    accept=".glb,.gltf,.fbx,.obj"
                    onChange={(e) => setUploadFormData({ ...uploadFormData, file: e.target.files?.[0] || null })}
                    data-testid="input-upload-file"
                  />
                </div>
                <Button 
                  className="w-full" 
                  data-testid="button-upload-submit"
                  onClick={() => {
                    if (uploadFormData.file) {
                      const formData = new FormData();
                      formData.append('name', uploadFormData.name);
                      formData.append('description', uploadFormData.description);
                      formData.append('file', uploadFormData.file);
                      uploadMutation.mutate(formData);
                    }
                  }}
                  disabled={!uploadFormData.file || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? t('common:uploading', 'در حال آپلود...') : t('common:upload', 'آپلود')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            data-testid="button-create-3d"
            onClick={() => {
              setSelectedContent(null);
              setIsEditorOpen(true);
            }}
          >
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      data-testid={`button-preview-${item.id}`}
                      onClick={() => {
                        setSelectedContent(item);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common:preview')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      data-testid={`button-edit-${item.id}`}
                      onClick={() => {
                        setSelectedContent(item);
                        setIsEditorOpen(true);
                      }}
                    >
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
            <CardContent className="space-y-4">
              {isEditorOpen && selectedContent ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin:3dContent.name')}</label>
                    <Input 
                      defaultValue={selectedContent?.name} 
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder={t('admin:3dContent.namePlaceholder')}
                      data-testid="input-content-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin:3dContent.description')}</label>
                    <Input 
                      defaultValue={selectedContent?.description} 
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder={t('admin:3dContent.descriptionPlaceholder')}
                      data-testid="input-content-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('admin:3dContent.type')}</label>
                    <Input 
                      defaultValue={selectedContent?.type} 
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      placeholder={t('admin:3dContent.typePlaceholder')}
                      data-testid="input-content-type"
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    data-testid="button-save-content"
                    onClick={() => saveMutation.mutate(editFormData)}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? t('common:saving', 'در حال ذخیره...') : t('common:save')}
                  </Button>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Box className="h-12 w-12 mx-auto mb-4" />
                  <p>{t('admin:3dContent.editorPlaceholder', 'لطفاً یک محتوا را برای ویرایش انتخاب کنید یا محتوای جدید ایجاد کنید')}</p>
                </div>
              )}
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
              {isPreviewOpen && selectedContent ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                    <Monitor className="h-24 w-24 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('admin:3dContent.name')}</p>
                      <p className="font-medium" data-testid="preview-content-name">{selectedContent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('admin:3dContent.type')}</p>
                      <p className="font-medium" data-testid="preview-content-type">{selectedContent.type}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">{t('admin:3dContent.description')}</p>
                      <p className="font-medium" data-testid="preview-content-description">{selectedContent.description}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full" data-testid="button-close-preview" onClick={() => {
                    setIsPreviewOpen(false);
                    setSelectedContent(null);
                  }}>
                    {t('common:close')}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4" />
                  <p>{t('admin:3dContent.previewPlaceholder', 'لطفاً یک محتوا را برای پیش‌نمایش انتخاب کنید')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}