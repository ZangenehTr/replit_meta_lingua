import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import { Sidebar } from "@/components/layout/sidebar";
import { useLanguage } from "@/hooks/use-language";
import { Palette, Upload, Eye, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BrandingSettings {
  id?: number;
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  favicon: string | null;
  loginBackgroundImage: string | null;
  fontFamily: string;
  borderRadius: string;
}

export default function BrandingManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branding, isLoading } = useQuery<BrandingSettings>({
    queryKey: ["/api/branding"],
  });

  const [formData, setFormData] = useState<BrandingSettings>({
    name: "",
    logo: null,
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    accentColor: "#8B5CF6",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    favicon: null,
    loginBackgroundImage: null,
    fontFamily: "Inter",
    borderRadius: "0.5rem"
  });

  // Update form when branding data loads
  React.useEffect(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const updateBrandingMutation = useMutation({
    mutationFn: (data: Partial<BrandingSettings>) => 
      apiRequest("/api/branding", {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      toast({
        title: t('admin:branding.changesSaved'),
        description: t('admin:branding.changesSavedDescription')
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('admin:branding.error'),
        description: t('admin:branding.errorDescription')
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandingMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const previewStyles = {
    '--primary': formData.primaryColor,
    '--secondary': formData.secondaryColor,
    '--accent': formData.accentColor,
    '--background': formData.backgroundColor,
    '--foreground': formData.textColor,
    '--font-family': formData.fontFamily,
    '--radius': formData.borderRadius
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('admin:branding.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex">
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('admin:branding.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('admin:branding.description')}
              </p>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={updateBrandingMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateBrandingMutation.isPending 
                ? t('admin:branding.saving')
                : t('admin:branding.saveChanges')
              }
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branding Settings Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {t('admin:branding.basicSettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      {t('admin:branding.instituteName')}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={t('admin:branding.instituteNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo">
                      {t('admin:branding.logoUrl')}
                    </Label>
                    <Input
                      id="logo"
                      value={formData.logo || ''}
                      onChange={(e) => handleInputChange('logo', e.target.value)}
                      placeholder={t('admin:branding.logoUrlPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="favicon">
                      {t('admin:branding.faviconUrl')}
                    </Label>
                    <Input
                      id="favicon"
                      value={formData.favicon || ''}
                      onChange={(e) => handleInputChange('favicon', e.target.value)}
                      placeholder={t('admin:branding.faviconUrlPlaceholder')}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('admin:branding.themeColors')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">
                        {t('admin:branding.primaryColor')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secondaryColor">
                        {t('admin:branding.secondaryColor')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          placeholder="#10B981"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="accentColor">
                        {t('admin:branding.accentColor')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.accentColor}
                          onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          placeholder="#8B5CF6"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="backgroundColor">
                        {t('admin:branding.backgroundColor')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.backgroundColor}
                          onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('admin:branding.typography')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fontFamily">
                      {t('admin:branding.fontFamily')}
                    </Label>
                    <Input
                      id="fontFamily"
                      value={formData.fontFamily}
                      onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                      placeholder="Inter, Arial, sans-serif"
                    />
                  </div>

                  <div>
                    <Label htmlFor="borderRadius">
                      {t('admin:branding.borderRadius')}
                    </Label>
                    <Input
                      id="borderRadius"
                      value={formData.borderRadius}
                      onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                      placeholder="0.5rem"
                    />
                  </div>

                  <div>
                    <Label htmlFor="loginBackground">
                      {t('admin:branding.loginBackground')}
                    </Label>
                    <Input
                      id="loginBackground"
                      value={formData.loginBackgroundImage || ''}
                      onChange={(e) => handleInputChange('loginBackgroundImage', e.target.value)}
                      placeholder={t('admin:branding.loginBackgroundPlaceholder')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {t('admin:branding.livePreview')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-6 rounded-lg border-2 border-dashed border-gray-300"
                    style={previewStyles}
                  >
                    <div className="space-y-4">
                      <div 
                        className="text-2xl font-bold"
                        style={{ color: formData.textColor, fontFamily: formData.fontFamily }}
                      >
                        {formData.name || t('admin:branding.instituteName')}
                      </div>
                      
                      {formData.logo && (
                        <img 
                          src={formData.logo} 
                          alt="Logo" 
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}

                      <div className="flex gap-2">
                        <div 
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ 
                            backgroundColor: formData.primaryColor,
                            borderRadius: formData.borderRadius,
                            fontFamily: formData.fontFamily
                          }}
                        >
                          {t('admin:branding.sampleButton')}
                        </div>
                        <div 
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ 
                            backgroundColor: formData.secondaryColor,
                            borderRadius: formData.borderRadius,
                            fontFamily: formData.fontFamily
                          }}
                        >
                          {t('admin:branding.sampleButton')}
                        </div>
                      </div>

                      <div 
                        className="p-4 rounded"
                        style={{ 
                          backgroundColor: formData.backgroundColor,
                          color: formData.textColor,
                          border: `2px solid ${formData.accentColor}`,
                          borderRadius: formData.borderRadius,
                          fontFamily: formData.fontFamily
                        }}
                      >
                        {t('admin:branding.sampleText')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('admin:branding.preview')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {t('admin:branding.previewDescription')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}