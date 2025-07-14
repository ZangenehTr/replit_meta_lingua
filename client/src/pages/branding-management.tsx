import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const { currentLanguage, isRTL } = useLanguage();
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
  useState(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const updateBrandingMutation = useMutation({
    mutationFn: (data: Partial<BrandingSettings>) => 
      apiRequest("/api/branding", {
        method: "PUT",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
      toast({
        title: currentLanguage === 'fa' ? "تغییرات ذخیره شد" : "Changes Saved",
        description: currentLanguage === 'fa' 
          ? "تنظیمات برندینگ با موفقیت به‌روزرسانی شد"
          : "Branding settings have been updated successfully"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: currentLanguage === 'fa' ? "خطا" : "Error",
        description: currentLanguage === 'fa' 
          ? "خطا در به‌روزرسانی تنظیمات برندینگ"
          : "Failed to update branding settings"
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
          <p>{currentLanguage === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {currentLanguage === 'fa' ? 'مدیریت برندینگ' : 'Branding Management'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentLanguage === 'fa' 
                  ? 'تنظیمات ظاهری و برندینگ موسسه خود را شخصی‌سازی کنید'
                  : 'Customize your institute\'s appearance and branding settings'
                }
              </p>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={updateBrandingMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateBrandingMutation.isPending 
                ? (currentLanguage === 'fa' ? 'در حال ذخیره...' : 'Saving...') 
                : (currentLanguage === 'fa' ? 'ذخیره تغییرات' : 'Save Changes')
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
                    {currentLanguage === 'fa' ? 'تنظیمات پایه' : 'Basic Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      {currentLanguage === 'fa' ? 'نام موسسه' : 'Institute Name'}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={currentLanguage === 'fa' ? 'نام موسسه را وارد کنید' : 'Enter institute name'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo">
                      {currentLanguage === 'fa' ? 'لوگو (URL)' : 'Logo (URL)'}
                    </Label>
                    <Input
                      id="logo"
                      value={formData.logo || ''}
                      onChange={(e) => handleInputChange('logo', e.target.value)}
                      placeholder={currentLanguage === 'fa' ? 'آدرس URL لوگو' : 'Logo URL'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="favicon">
                      {currentLanguage === 'fa' ? 'آیکون (Favicon)' : 'Favicon (URL)'}
                    </Label>
                    <Input
                      id="favicon"
                      value={formData.favicon || ''}
                      onChange={(e) => handleInputChange('favicon', e.target.value)}
                      placeholder={currentLanguage === 'fa' ? 'آدرس URL آیکون' : 'Favicon URL'}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {currentLanguage === 'fa' ? 'رنگ‌های تم' : 'Theme Colors'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">
                        {currentLanguage === 'fa' ? 'رنگ اصلی' : 'Primary Color'}
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
                        {currentLanguage === 'fa' ? 'رنگ ثانویه' : 'Secondary Color'}
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
                        {currentLanguage === 'fa' ? 'رنگ تاکیدی' : 'Accent Color'}
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
                        {currentLanguage === 'fa' ? 'رنگ پس‌زمینه' : 'Background Color'}
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
                    {currentLanguage === 'fa' ? 'تنظیمات ظاهری' : 'Appearance Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fontFamily">
                      {currentLanguage === 'fa' ? 'فونت' : 'Font Family'}
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
                      {currentLanguage === 'fa' ? 'گردی گوشه‌ها' : 'Border Radius'}
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
                      {currentLanguage === 'fa' ? 'پس‌زمینه صفحه ورود' : 'Login Background Image'}
                    </Label>
                    <Input
                      id="loginBackground"
                      value={formData.loginBackgroundImage || ''}
                      onChange={(e) => handleInputChange('loginBackgroundImage', e.target.value)}
                      placeholder={currentLanguage === 'fa' ? 'آدرس URL تصویر پس‌زمینه' : 'Background image URL'}
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
                    {currentLanguage === 'fa' ? 'پیش‌نمایش زنده' : 'Live Preview'}
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
                        {formData.name || (currentLanguage === 'fa' ? 'نام موسسه' : 'Institute Name')}
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
                          {currentLanguage === 'fa' ? 'دکمه اصلی' : 'Primary Button'}
                        </div>
                        <div 
                          className="px-4 py-2 rounded text-white text-sm"
                          style={{ 
                            backgroundColor: formData.secondaryColor,
                            borderRadius: formData.borderRadius,
                            fontFamily: formData.fontFamily
                          }}
                        >
                          {currentLanguage === 'fa' ? 'دکمه ثانویه' : 'Secondary Button'}
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
                        {currentLanguage === 'fa' 
                          ? 'این یک نمونه کارت با تنظیمات جدید است.'
                          : 'This is a sample card with the new settings.'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {currentLanguage === 'fa' ? 'راهنمای استفاده' : 'Usage Guide'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    {currentLanguage === 'fa' 
                      ? '• تغییرات به‌صورت خودکار در کل سیستم اعمال می‌شود'
                      : '• Changes will be applied automatically across the entire system'
                    }
                  </p>
                  <p>
                    {currentLanguage === 'fa' 
                      ? '• برای لوگو و آیکون از فرمت‌های PNG، JPG، SVG استفاده کنید'
                      : '• Use PNG, JPG, or SVG formats for logos and icons'
                    }
                  </p>
                  <p>
                    {currentLanguage === 'fa' 
                      ? '• رنگ‌ها باید در فرمت HEX باشند (مثال: #3B82F6)'
                      : '• Colors should be in HEX format (example: #3B82F6)'
                    }
                  </p>
                  <p>
                    {currentLanguage === 'fa' 
                      ? '• تصاویر را روی سرویس میزبانی آپلود کرده و URL آن‌ها را استفاده کنید'
                      : '• Upload images to a hosting service and use their URLs'
                    }
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