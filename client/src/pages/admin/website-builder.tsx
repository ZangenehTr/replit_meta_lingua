import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Globe, 
  Layout, 
  Palette, 
  Eye, 
  Code,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Upload,
  Link,
  Image,
  Type,
  Calendar,
  Users,
  BookOpen,
  Star,
  CheckCircle,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Phone,
  Languages,
  Edit2,
  Trash2,
  Copy,
  Settings,
  TrendingUp,
  Target,
  MessageSquare,
  FileText,
  Video,
  AlignRight,
  AlignLeft,
  AlignCenter,
  Save,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebsiteTemplate {
  id: number;
  name: string;
  nameEn: string;
  nameFa: string;
  category: 'landing' | 'course_showcase' | 'institute_profile' | 'campaign';
  preview: string;
  features: string[];
  featuresEn: string[];
  featuresFa: string[];
  isResponsive: boolean;
  isConverted: boolean;
  isRtlSupported: boolean;
}

interface WebsitePage {
  id: number;
  title: string;
  titleEn: string;
  titleFa: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'archived';
  language: 'en' | 'fa' | 'both';
  direction: 'ltr' | 'rtl' | 'auto';
  visits: number;
  conversions: number;
  lastModified: string;
  content: {
    sections: WebsiteSection[];
  };
}

interface WebsiteSection {
  id: string;
  type: string;
  label: string;
  labelEn: string;
  labelFa: string;
  content: {
    en: any;
    fa: any;
  };
  styles: {
    direction: 'ltr' | 'rtl' | 'auto';
    textAlign: 'left' | 'right' | 'center';
    fontFamily: string;
  };
}

export default function WebsiteBuilderPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('hero');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fa'>('en');
  const [isRtlMode, setIsRtlMode] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);

  // Fetch website pages from API - NO MOCK DATA
  const { data: websitePages = [], isLoading: pagesLoading } = useQuery<WebsitePage[]>({
    queryKey: ['/api/website-pages']
  });

  // Fetch website templates from API - NO MOCK DATA  
  const { data: websiteTemplates = [], isLoading: templatesLoading } = useQuery<WebsiteTemplate[]>({
    queryKey: ['/api/website-templates']
  });

  // Create new website page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: Partial<WebsitePage>) => {
      return apiRequest('/api/website-pages', {
        method: 'POST',
        body: JSON.stringify(pageData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/website-pages'] });
      toast({
        title: "Success",
        description: "Website page created successfully",
      });
    }
  });

  // Update website page mutation
  const updatePageMutation = useMutation({
    mutationFn: async (pageData: Partial<WebsitePage>) => {
      return apiRequest(`/api/website-pages/${pageData.id}`, {
        method: 'PUT',
        body: JSON.stringify(pageData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/website-pages'] });
      toast({
        title: "Success", 
        description: "Website page updated successfully",
      });
    }
  });

  // Delete website page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: number) => {
      return apiRequest(`/api/website-pages/${pageId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/website-pages'] });
      toast({
        title: "Success",
        description: "Website page deleted successfully",
      });
    }
  });

  // Professional Farsi-supported page elements
  const farsiPageElements = [
    { type: 'hero', label: 'Hero Section', labelEn: 'Hero Section', labelFa: 'بخش اصلی', icon: Layout },
    { type: 'courses', label: 'Course Grid', labelEn: 'Course Grid', labelFa: 'شبکه دوره‌ها', icon: BookOpen },
    { type: 'teachers', label: 'Teacher Profiles', labelEn: 'Teacher Profiles', labelFa: 'پروفایل استادان', icon: Users },
    { type: 'testimonials', label: 'Testimonials', labelEn: 'Testimonials', labelFa: 'نظرات دانشجویان', icon: Star },
    { type: 'pricing', label: 'Pricing Table', labelEn: 'Pricing Table', labelFa: 'جدول قیمت‌ها', icon: CheckCircle },
    { type: 'contact', label: 'Contact Form', labelEn: 'Contact Form', labelFa: 'فرم تماس', icon: Phone },
    { type: 'social', label: 'Social Media', labelEn: 'Social Media', labelFa: 'رسانه‌های اجتماعی', icon: Instagram },
    { type: 'calendar', label: 'Event Calendar', labelEn: 'Event Calendar', labelFa: 'تقویم رویدادها', icon: Calendar },
    { type: 'about', label: 'About Us', labelEn: 'About Us', labelFa: 'درباره ما', icon: FileText },
    { type: 'gallery', label: 'Media Gallery', labelEn: 'Media Gallery', labelFa: 'گالری تصاویر', icon: Image },
    { type: 'video', label: 'Video Section', labelEn: 'Video Section', labelFa: 'بخش ویدیو', icon: Video },
    { type: 'faq', label: 'FAQ Section', labelEn: 'FAQ Section', labelFa: 'پرسش‌های متداول', icon: MessageSquare }
  ];

  const socialIntegrations = [
    { platform: 'Instagram', icon: Instagram, color: 'bg-pink-500', connected: true },
    { platform: 'YouTube', icon: Youtube, color: 'bg-red-500', connected: true },
    { platform: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600', connected: false },
    { platform: 'Twitter', icon: Twitter, color: 'bg-blue-400', connected: true },
    { platform: 'Telegram', icon: MessageSquare, color: 'bg-blue-500', connected: true }
  ];

  const handleCreatePage = () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive"
      });
      return;
    }

    const newPage = {
      title: `New ${selectedTemplate.name} Page`,
      titleEn: `New ${selectedTemplate.nameEn || selectedTemplate.name} Page`,
      titleFa: `صفحه جدید ${selectedTemplate.nameFa || selectedTemplate.name}`,
      slug: `new-${selectedTemplate.category}-page-${Date.now()}`,
      template: selectedTemplate.name,
      status: 'draft' as const,
      language: currentLanguage,
      direction: isRtlMode ? 'rtl' as const : 'ltr' as const,
      content: {
        sections: []
      }
    };

    createPageMutation.mutate(newPage);
  };

  return (
    <div className="space-y-6" dir={isRtlMode ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentLanguage === 'fa' ? 'سایت ساز و صفحات تبلیغاتی' : 'Website Builder & Campaign Pages'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {currentLanguage === 'fa' 
              ? 'ایجاد وب‌سایت‌های بهینه شده برای تبدیل با پشتیبانی کامل فارسی'
              : 'Create conversion-optimized websites with full Farsi support'
            }
          </p>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          {/* Language Toggle */}
          <Button 
            variant="outline" 
            onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'fa' : 'en')}
          >
            <Languages className="h-4 w-4 mr-2" />
            {currentLanguage === 'en' ? 'فارسی' : 'English'}
          </Button>
          
          {/* RTL Toggle */}
          <Button 
            variant="outline" 
            onClick={() => setIsRtlMode(!isRtlMode)}
          >
            {isRtlMode ? <AlignLeft className="h-4 w-4" /> : <AlignRight className="h-4 w-4" />}
          </Button>
          
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {currentLanguage === 'fa' ? 'پیش‌نمایش' : 'Preview'}
          </Button>
          <Button onClick={handleCreatePage} disabled={createPageMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {currentLanguage === 'fa' ? 'صفحه جدید' : 'New Page'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pages">
            {currentLanguage === 'fa' ? 'صفحات' : 'Pages'}
          </TabsTrigger>
          <TabsTrigger value="templates">
            {currentLanguage === 'fa' ? 'قالب‌ها' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="builder">
            {currentLanguage === 'fa' ? 'ویرایشگر' : 'Builder'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {currentLanguage === 'fa' ? 'آمار' : 'Analytics'}
          </TabsTrigger>
        </TabsList>

        {/* Existing Pages Tab */}
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentLanguage === 'fa' ? 'صفحات موجود' : 'Existing Pages'}
              </CardTitle>
              <CardDescription>
                {currentLanguage === 'fa' 
                  ? 'مدیریت و ویرایش صفحات وب‌سایت با پشتیبانی دو زبانه'
                  : 'Manage and edit your website pages with bilingual support'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pagesLoading ? (
                <div className="text-center py-8">
                  {currentLanguage === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
                </div>
              ) : websitePages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {currentLanguage === 'fa' 
                    ? 'هیچ صفحه‌ای یافت نشد. اولین صفحه خود را ایجاد کنید!'
                    : 'No pages found. Create your first page!'
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {websitePages.map((page: any) => (
                    <Card key={page.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {currentLanguage === 'fa' ? page.titleFa || page.title : page.titleEn || page.title}
                            </CardTitle>
                            <p className="text-sm text-gray-500">{page.slug}</p>
                          </div>
                          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                            {page.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>{currentLanguage === 'fa' ? 'بازدید:' : 'Visits:'}</span>
                            <span className="font-bold">{page.visits?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{currentLanguage === 'fa' ? 'تبدیل:' : 'Conversions:'}</span>
                            <span className="font-bold">{page.conversions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{currentLanguage === 'fa' ? 'آخرین تغییر:' : 'Last Modified:'}</span>
                            <span>{page.lastModified}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4 rtl:space-x-reverse">
                          <Button size="sm" variant="outline" onClick={() => setEditingPage(page)}>
                            <Edit2 className="h-3 w-3 mr-1" />
                            {currentLanguage === 'fa' ? 'ویرایش' : 'Edit'}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            {currentLanguage === 'fa' ? 'نمایش' : 'View'}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Copy className="h-3 w-3 mr-1" />
                            {currentLanguage === 'fa' ? 'کپی' : 'Copy'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentLanguage === 'fa' ? 'قالب‌های حرفه‌ای' : 'Professional Templates'}
              </CardTitle>
              <CardDescription>
                {currentLanguage === 'fa' 
                  ? 'قالب‌های آماده با پشتیبانی کامل RTL و فارسی'
                  : 'Ready-made templates with full RTL and Farsi support'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8">
                  {currentLanguage === 'fa' ? 'در حال بارگذاری قالب‌ها...' : 'Loading templates...'}
                </div>
              ) : websiteTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {currentLanguage === 'fa' 
                    ? 'هیچ قالبی یافت نشد.'
                    : 'No templates found.'
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {websiteTemplates.map((template: any) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="p-0">
                        <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                          <Globe className="h-12 w-12 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardTitle className="text-lg mb-2">
                          {currentLanguage === 'fa' ? template.nameFa || template.name : template.nameEn || template.name}
                        </CardTitle>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {(currentLanguage === 'fa' ? template.featuresFa || template.features : template.featuresEn || template.features)
                              ?.slice(0, 3)
                              .map((feature: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))
                            }
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {template.isResponsive ? 
                                (currentLanguage === 'fa' ? 'ریسپانسیو' : 'Responsive') : 
                                (currentLanguage === 'fa' ? 'غیر ریسپانسیو' : 'Not Responsive')
                              }
                            </span>
                            <span className="flex items-center">
                              <Languages className="h-3 w-3 mr-1" />
                              {template.isRtlSupported ? 
                                (currentLanguage === 'fa' ? 'RTL' : 'RTL Support') : 
                                (currentLanguage === 'fa' ? 'LTR فقط' : 'LTR Only')
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Builder Tab */}
        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Page Elements Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {currentLanguage === 'fa' ? 'عناصر صفحه' : 'Page Elements'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {farsiPageElements.map((element) => {
                    const IconComponent = element.icon;
                    return (
                      <div
                        key={element.type}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          activeSection === element.type ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveSection(element.type)}
                      >
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <IconComponent className="h-4 w-4" />
                          <span className="text-sm">
                            {currentLanguage === 'fa' ? element.labelFa : element.labelEn}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Page Builder Canvas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {currentLanguage === 'fa' ? 'طراح صفحه' : 'Page Builder'}
                  </CardTitle>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button
                      size="sm"
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'tablet' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg bg-white min-h-96 ${
                  previewMode === 'desktop' ? 'w-full' :
                  previewMode === 'tablet' ? 'w-3/4 mx-auto' : 'w-1/2 mx-auto'
                } transition-all duration-300`}>
                  <div className="p-8 text-center text-gray-400">
                    <Layout className="h-16 w-16 mx-auto mb-4" />
                    <p>
                      {currentLanguage === 'fa' 
                        ? 'برای شروع، یک عنصر از پنل سمت چپ انتخاب کنید'
                        : 'Select an element from the left panel to start building'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {currentLanguage === 'fa' ? 'تنظیمات' : 'Properties'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language-select">
                      {currentLanguage === 'fa' ? 'زبان محتوا' : 'Content Language'}
                    </Label>
                    <Select value={currentLanguage} onValueChange={(value: 'en' | 'fa') => setCurrentLanguage(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fa">فارسی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id="rtl-mode" 
                      checked={isRtlMode} 
                      onCheckedChange={setIsRtlMode} 
                    />
                    <Label htmlFor="rtl-mode">
                      {currentLanguage === 'fa' ? 'حالت راست به چپ' : 'RTL Mode'}
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="font-select">
                      {currentLanguage === 'fa' ? 'فونت' : 'Font Family'}
                    </Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          {currentLanguage === 'fa' ? 'پیش‌فرض' : 'Default'}
                        </SelectItem>
                        <SelectItem value="vazir">Vazir (فارسی)</SelectItem>
                        <SelectItem value="tanha">Tanha (فارسی)</SelectItem>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" disabled={updatePageMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {currentLanguage === 'fa' ? 'ذخیره تغییرات' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {currentLanguage === 'fa' ? 'آمار بازدید' : 'Page Views'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {websitePages.reduce((total: number, page: any) => total + (page.visits || 0), 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'fa' ? 'کل بازدیدها' : 'Total visits'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  {currentLanguage === 'fa' ? 'نرخ تبدیل' : 'Conversion Rate'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {websitePages.length > 0 
                    ? `${((websitePages.reduce((total: number, page: any) => total + (page.conversions || 0), 0) / 
                         websitePages.reduce((total: number, page: any) => total + (page.visits || 0), 0)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'fa' ? 'متوسط تبدیل' : 'Average conversion'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  {currentLanguage === 'fa' ? 'صفحات فعال' : 'Active Pages'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {websitePages.filter((page: any) => page.status === 'published').length}
                </div>
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'fa' ? 'منتشر شده' : 'Published pages'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Social Media Integration */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {currentLanguage === 'fa' ? 'اتصال رسانه‌های اجتماعی' : 'Social Media Integration'}
              </CardTitle>
              <CardDescription>
                {currentLanguage === 'fa' 
                  ? 'مدیریت اتصالات شبکه‌های اجتماعی'
                  : 'Manage your social media connections'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {socialIntegrations.map((social, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-4">
                      <div className={`${social.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                        <social.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{social.platform}</h3>
                      <Badge variant={social.connected ? 'default' : 'secondary'}>
                        {social.connected 
                          ? (currentLanguage === 'fa' ? 'متصل' : 'Connected')
                          : (currentLanguage === 'fa' ? 'قطع' : 'Disconnected')
                        }
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}