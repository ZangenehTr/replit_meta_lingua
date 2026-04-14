import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Check, X, Type } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import type { CustomFont } from "@shared/schema";

export default function FontManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fontToDelete, setFontToDelete] = useState<number | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    fontFamily: '',
    language: 'fa'
  });

  const { data: fonts = [], isLoading } = useQuery<CustomFont[]>({
    queryKey: ['/api/cms/fonts'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/cms/fonts/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('admin:fontManagement.failedToUpload'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/fonts'] });
      toast({
        title: t('common:success'),
        description: t('admin:fontManagement.fontUploaded'),
      });
      setSelectedFile(null);
      setUploadForm({ name: '', fontFamily: '', language: 'fa' });
    },
    onError: (error: Error) => {
      toast({
        title: t('common:error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async ({ id, isActive, language }: { id: number; isActive: boolean; language: string }) => {
      return apiRequest(`/api/cms/fonts/${id}/activate`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive, language }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/fonts'] });
      toast({
        title: t('common:success'),
        description: t('admin:fontManagement.fontStatusUpdated'),
      });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('admin:fontManagement.failedToUpdateStatus'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/fonts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/fonts'] });
      toast({
        title: t('common:success'),
        description: t('admin:fontManagement.fontDeleted'),
      });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('admin:fontManagement.failedToDelete'),
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (!['woff', 'woff2', 'ttf', 'otf'].includes(ext || '')) {
        toast({
          title: t('admin:fontManagement.invalidFile'),
          description: t('admin:fontManagement.invalidFileDescription'),
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      if (!uploadForm.fontFamily) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadForm(prev => ({
          ...prev,
          fontFamily: nameWithoutExt.replace(/[-_]/g, ' ')
        }));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.fontFamily) {
      toast({
        title: t('admin:fontManagement.validationError'),
        description: t('admin:fontManagement.validationErrorDescription'),
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('fontFile', selectedFile);
    formData.append('name', uploadForm.name);
    formData.append('fontFamily', uploadForm.fontFamily);
    formData.append('language', uploadForm.language);

    uploadMutation.mutate(formData);
  };

  const getLanguageLabel = (lang: string | null) => {
    if (!lang) return t('admin:fontManagement.allLanguages');
    switch (lang) {
      case 'fa': return t('admin:fontManagement.farsi');
      case 'en': return t('admin:fontManagement.english');
      case 'ar': return t('admin:fontManagement.arabic');
      default: return lang;
    }
  };

  const getSampleText = (lang: string | null) => {
    switch (lang) {
      case 'fa': return t('admin:fontManagement.sampleTextFa');
      case 'ar': return t('admin:fontManagement.sampleTextAr');
      default: return t('admin:fontManagement.sampleText');
    }
  };

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:fontManagement.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin:fontManagement.description')}</p>
        </div>
      </div>

      <Card data-testid="font-upload-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('admin:fontManagement.uploadTitle')}
          </CardTitle>
          <CardDescription>
            {t('admin:fontManagement.uploadDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {t('admin:fontManagement.supportedFormats')}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-name">{t('admin:fontManagement.fontDisplayName')} *</Label>
              <Input
                id="font-name"
                placeholder={t('admin:fontManagement.placeholderFontName')}
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-font-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-family">{t('admin:fontManagement.fontFamilyName')} *</Label>
              <Input
                id="font-family"
                placeholder={t('admin:fontManagement.placeholderFontFamily')}
                value={uploadForm.fontFamily}
                onChange={(e) => setUploadForm(prev => ({ ...prev, fontFamily: e.target.value }))}
                data-testid="input-font-family"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('admin:fontManagement.targetLanguage')}</Label>
              <Select
                value={uploadForm.language}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fa">{t('admin:fontManagement.farsi')}</SelectItem>
                  <SelectItem value="en">{t('admin:fontManagement.english')}</SelectItem>
                  <SelectItem value="ar">{t('admin:fontManagement.arabic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-file">{t('admin:fontManagement.fontFile')} *</Label>
              <Input
                id="font-file"
                type="file"
                accept=".woff,.woff2,.ttf,.otf"
                onChange={handleFileChange}
                data-testid="input-font-file"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {t('admin:fontManagement.selected')}: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} {t('common:kb', 'KB')})
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !selectedFile}
            className="w-full md:w-auto"
            data-testid="button-upload-font"
          >
            <Upload className="h-4 w-4 me-2" />
            {uploadMutation.isPending ? t('admin:fontManagement.uploading') : t('admin:fontManagement.uploadFont')}
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="fonts-list-card">
        <CardHeader>
          <CardTitle>{t('admin:fontManagement.uploadedFonts')}</CardTitle>
          <CardDescription>
            {t('admin:fontManagement.uploadedFontsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('admin:fontManagement.loadingFonts')}</div>
          ) : fonts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin:fontManagement.noFontsUploaded')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fonts.map((font) => (
                <Card key={font.id} className={font.isActive ? 'border-green-500 border-2' : ''} data-testid={`font-card-${font.id}`}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Type className="h-5 w-5 text-muted-foreground" />
                        {font.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3" />
                            {t('admin:fontManagement.active')}
                          </span>
                        )}
                      </div>
                      
                      <style>
                        {`
                          @font-face {
                            font-family: '${font.fontFamily}-preview';
                            src: url('${font.fileUrl}') format('${font.fileFormat === 'woff2' ? 'woff2' : font.fileFormat === 'woff' ? 'woff' : 'truetype'}');
                          }
                        `}
                      </style>
                      
                      <div 
                        className="p-4 bg-muted rounded-md text-center text-2xl"
                        style={{ fontFamily: `'${font.fontFamily}-preview', sans-serif` }}
                      >
                        {getSampleText(font.language)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold">{font.name}</h3>
                      <p className="text-sm text-muted-foreground">{t('admin:fontManagement.family')}: {font.fontFamily}</p>
                      <p className="text-sm text-muted-foreground">{t('admin:fontManagement.language')}: {getLanguageLabel(font.language)}</p>
                      <p className="text-sm text-muted-foreground">{t('admin:fontManagement.format')}: .{font.fileFormat}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={font.isActive ? "outline" : "default"}
                        onClick={() => activateMutation.mutate({
                          id: font.id,
                          isActive: !font.isActive,
                          language: font.language || ''
                        })}
                        disabled={activateMutation.isPending}
                        className="flex-1"
                        data-testid={`button-toggle-${font.id}`}
                      >
                        {font.isActive ? <X className="h-4 w-4 me-1" /> : <Check className="h-4 w-4 me-1" />}
                        {font.isActive ? t('admin:fontManagement.deactivate') : t('admin:fontManagement.activate')}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setFontToDelete(font.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${font.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={fontToDelete !== null} onOpenChange={(open) => !open && setFontToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin:fontManagement.confirmDelete', 'Delete Font')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin:fontManagement.confirmDeleteDescription', 'Are you sure you want to delete this font? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFontToDelete(null)}>
              {t('common:cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (fontToDelete !== null) { deleteMutation.mutate(fontToDelete); setFontToDelete(null); } }}
            >
              {t('common:delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
