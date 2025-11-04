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
import { useTranslation } from "react-i18next";
import type { CustomFont } from "@shared/schema";

export default function FontManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    fontFamily: '',
    language: 'fa'
  });

  // Fetch all fonts
  const { data: fonts = [], isLoading } = useQuery<CustomFont[]>({
    queryKey: ['/api/cms/fonts'],
  });

  // Upload mutation
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
        throw new Error(error.message || 'Failed to upload font');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/fonts'] });
      toast({
        title: "Success",
        description: "Font uploaded successfully",
      });
      setSelectedFile(null);
      setUploadForm({ name: '', fontFamily: '', language: 'fa' });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Activate/Deactivate mutation
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
        title: "Success",
        description: "Font status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update font status",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/fonts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/fonts'] });
      toast({
        title: "Success",
        description: "Font deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete font",
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
          title: "Invalid File",
          description: "Please upload a valid font file (.woff, .woff2, .ttf, .otf)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Auto-fill font family from filename if not set
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
        title: "Validation Error",
        description: "Please fill all fields and select a font file",
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
    if (!lang) return 'All Languages';
    switch (lang) {
      case 'fa': return 'فارسی (Farsi)';
      case 'en': return 'English';
      case 'ar': return 'عربی (Arabic)';
      default: return lang;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Font Management</h1>
          <p className="text-muted-foreground mt-1">Upload and manage custom fonts for white-label branding</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card data-testid="font-upload-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Custom Font
          </CardTitle>
          <CardDescription>
            Upload a custom font file to use across your platform. Only one font can be active per language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Supported formats: .woff, .woff2, .ttf, .otf (Max size: 5MB)
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-name">Font Display Name *</Label>
              <Input
                id="font-name"
                placeholder="e.g., Vazirmatn Bold"
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-font-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family Name *</Label>
              <Input
                id="font-family"
                placeholder="e.g., Vazirmatn"
                value={uploadForm.fontFamily}
                onChange={(e) => setUploadForm(prev => ({ ...prev, fontFamily: e.target.value }))}
                data-testid="input-font-family"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select
                value={uploadForm.language}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fa">فارسی (Farsi)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">عربی (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-file">Font File *</Label>
              <Input
                id="font-file"
                type="file"
                accept=".woff,.woff2,.ttf,.otf"
                onChange={handleFileChange}
                data-testid="input-font-file"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
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
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Font'}
          </Button>
        </CardContent>
      </Card>

      {/* Fonts List */}
      <Card data-testid="fonts-list-card">
        <CardHeader>
          <CardTitle>Uploaded Fonts</CardTitle>
          <CardDescription>
            Manage your custom fonts. Activate a font to apply it globally for the selected language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading fonts...</div>
          ) : fonts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fonts uploaded yet. Upload your first font above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fonts.map((font) => (
                <Card key={font.id} className={font.isActive ? 'border-green-500 border-2' : ''} data-testid={`font-card-${font.id}`}>
                  <CardContent className="pt-6 space-y-4">
                    {/* Font Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Type className="h-5 w-5 text-muted-foreground" />
                        {font.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3" />
                            Active
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
                        {font.language === 'fa' ? 'نمونه متن' : font.language === 'ar' ? 'نموذج النص' : 'Sample Text'}
                      </div>
                    </div>

                    {/* Font Details */}
                    <div className="space-y-1">
                      <h3 className="font-semibold">{font.name}</h3>
                      <p className="text-sm text-muted-foreground">Family: {font.fontFamily}</p>
                      <p className="text-sm text-muted-foreground">Language: {getLanguageLabel(font.language)}</p>
                      <p className="text-sm text-muted-foreground">Format: .{font.fileFormat}</p>
                    </div>

                    {/* Actions */}
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
                        {font.isActive ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                        {font.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this font?')) {
                            deleteMutation.mutate(font.id);
                          }
                        }}
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
    </div>
  );
}
