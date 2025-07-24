import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "@/lib/queryClient";
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
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('hero');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fa'>('en');
  const [isRtlMode, setIsRtlMode] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: '',
    titleEn: '',
    titleFa: '',
    slug: '',
    template: '',
    language: 'en',
    direction: 'ltr'
  });

  // Fetch website pages from API
  const { data: websitePages = [], isLoading: pagesLoading } = useQuery<WebsitePage[]>({
    queryKey: ['/api/website-pages']
  });

  // Fetch website templates from API
  const { data: websiteTemplates = [], isLoading: templatesLoading } = useQuery<WebsiteTemplate[]>({
    queryKey: ['/api/website-templates']
  });

  // Create new website page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: any) => {
      return apiRequest('/api/website-pages', {
        method: 'POST',
        body: pageData
      });
    },
    onSuccess: () => {
      toast({
        title: "Page Created",
        description: "New website page has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewPageData({
        title: '',
        titleEn: '',
        titleFa: '',
        slug: '',
        template: '',
        language: 'en',
        direction: 'ltr'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/website-pages'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create page. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update website page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/website-pages/${id}`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Page Updated",
        description: "Website page has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/website-pages'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update page. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Deploy website mutation
  const deployWebsiteMutation = useMutation({
    mutationFn: async (deploymentData: any) => {
      return apiRequest('/api/website-deploy', {
        method: 'POST',
        body: deploymentData
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Website Deployed",
        description: `Website is now live at ${data.url}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy website. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle template selection
  const handleTemplateSelection = (template: WebsiteTemplate) => {
    setSelectedTemplate(template);
    setIsRtlMode(template.isRtlSupported);
  };

  // Handle page creation
  const handleCreatePage = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first.",
        variant: "destructive",
      });
      return;
    }

    const fullPageData = {
      ...newPageData,
      template: selectedTemplate.id,
      status: 'draft',
      content: {
        sections: generateDefaultSections(selectedTemplate)
      }
    };

    createPageMutation.mutate(fullPageData);
  };

  // Generate default sections based on template
  const generateDefaultSections = (template: WebsiteTemplate): WebsiteSection[] => {
    const sections: WebsiteSection[] = [];
    
    // Hero section
    sections.push({
      id: 'hero',
      type: 'hero',
      label: 'Hero Section',
      labelEn: 'Hero Section',
      labelFa: 'بخش اصلی',
      content: {
        en: {
          title: 'Learn English with Expert Teachers',
          subtitle: 'Join our comprehensive English learning program',
          buttonText: 'Start Learning',
          backgroundImage: '/api/placeholder/1200/600'
        },
        fa: {
          title: 'یادگیری انگلیسی با اساتید متخصص',
          subtitle: 'به برنامه جامع آموزش انگلیسی ما بپیوندید',
          buttonText: 'شروع یادگیری',
          backgroundImage: '/api/placeholder/1200/600'
        }
      },
      styles: {
        direction: isRtlMode ? 'rtl' : 'ltr',
        textAlign: isRtlMode ? 'right' : 'left',
        fontFamily: isRtlMode ? 'Vazir' : 'Inter'
      }
    });

    // Courses section
    sections.push({
      id: 'courses',
      type: 'courses',
      label: 'Courses Section',
      labelEn: 'Courses Section',
      labelFa: 'بخش دوره‌ها',
      content: {
        en: {
          title: 'Our Courses',
          subtitle: 'Choose from our wide range of English courses',
          showPricing: true,
          showOnlinePayment: true,
          coursesDisplayMode: 'cards'
        },
        fa: {
          title: 'دوره‌های ما',
          subtitle: 'از میان طیف گسترده‌ای از دوره‌های انگلیسی انتخاب کنید',
          showPricing: true,
          showOnlinePayment: true,
          coursesDisplayMode: 'cards'
        }
      },
      styles: {
        direction: isRtlMode ? 'rtl' : 'ltr',
        textAlign: isRtlMode ? 'right' : 'left',
        fontFamily: isRtlMode ? 'Vazir' : 'Inter'
      }
    });

    return sections;
  };

  // Handle page deployment
  const handleDeployment = async (pageId: number) => {
    const page = websitePages.find(p => p.id === pageId);
    if (!page) return;

    const deploymentData = {
      pageId: pageId,
      domain: `${page.slug}.iranlearn.ir`,
      customDomain: null,
      sslEnabled: true,
      seoSettings: {
        title: page.title,
        description: `${page.title} - Professional English Learning`,
        keywords: ['english', 'learning', 'courses', 'iran', 'language'],
        ogImage: '/api/placeholder/1200/630'
      },
      analytics: {
        googleAnalytics: '',
        facebookPixel: '',
        hotjar: ''
      },
      integrations: {
        paymentGateway: 'shetab',
        smsProvider: 'kavenegar',
        emailProvider: 'internal'
      }
    };

    deployWebsiteMutation.mutate(deploymentData);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('admin:websiteBuilder.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('admin:websiteBuilder.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'fa' : 'en')}
                variant="outline"
              >
                <Languages className="w-4 h-4 mr-2" />
                {currentLanguage === 'en' ? 'English' : 'فارسی'}
              </Button>
              <Button 
                onClick={() => setIsRtlMode(!isRtlMode)}
                variant="outline"
              >
                <AlignRight className="w-4 h-4 mr-2" />
                {isRtlMode ? 'RTL' : 'LTR'}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Page
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Website Page</DialogTitle>
                    <DialogDescription>
                      Create a new page for your website with SEO optimization and payment integration
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Page Title</Label>
                      <Input
                        id="title"
                        value={newPageData.title}
                        onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                        placeholder="Enter page title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={newPageData.slug}
                        onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                        placeholder="page-url-slug"
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleEn">Title (English)</Label>
                      <Input
                        id="titleEn"
                        value={newPageData.titleEn}
                        onChange={(e) => setNewPageData({ ...newPageData, titleEn: e.target.value })}
                        placeholder="English title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleFa">Title (Persian)</Label>
                      <Input
                        id="titleFa"
                        value={newPageData.titleFa}
                        onChange={(e) => setNewPageData({ ...newPageData, titleFa: e.target.value })}
                        placeholder="عنوان فارسی"
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={newPageData.language} onValueChange={(value) => setNewPageData({ ...newPageData, language: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fa">فارسی</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="direction">Text Direction</Label>
                      <Select value={newPageData.direction} onValueChange={(value) => setNewPageData({ ...newPageData, direction: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ltr">Left to Right</SelectItem>
                          <SelectItem value="rtl">Right to Left</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreatePage}
                      disabled={createPageMutation.isPending}
                    >
                      {createPageMutation.isPending ? 'Creating...' : 'Create Page'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="pages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
            </TabsList>

            <TabsContent value="pages" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Website Pages</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websitePages.map((page) => (
                  <Card key={page.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{page.title}</CardTitle>
                          <CardDescription>/{page.slug}</CardDescription>
                        </div>
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                          {page.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {page.visits} visits
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {((page.conversions / page.visits) * 100 || 0).toFixed(1)}% conversion
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => setEditingPage(page)}
                            className="flex-1"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeployment(page.id)}
                            disabled={deployWebsiteMutation.isPending}
                            className="flex-1"
                          >
                            <Globe className="w-4 h-4 mr-1" />
                            {deployWebsiteMutation.isPending ? 'Deploying...' : 'Deploy'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {websitePages.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No pages created yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create your first website page to get started.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websiteTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {currentLanguage === 'en' ? template.nameEn : template.nameFa}
                          </CardTitle>
                          <CardDescription>{template.category}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {template.isResponsive && (
                            <Badge variant="secondary">
                              <Smartphone className="w-3 h-3 mr-1" />
                              Responsive
                            </Badge>
                          )}
                          {template.isRtlSupported && (
                            <Badge variant="secondary">
                              <AlignRight className="w-3 h-3 mr-1" />
                              RTL
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <Eye className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(currentLanguage === 'en' ? template.featuresEn : template.featuresFa).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          onClick={() => handleTemplateSelection(template)}
                          className="w-full"
                          variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                        >
                          {selectedTemplate?.id === template.id ? 'Selected' : 'Select Template'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="builder" className="space-y-6">
              {editingPage ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Page Editor</CardTitle>
                        <CardDescription>Edit your page content and styling</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                              Page builder interface - drag and drop sections here
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Preview</CardTitle>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant={previewMode === 'desktop' ? 'default' : 'outline'}
                              onClick={() => setPreviewMode('desktop')}
                            >
                              <Monitor className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant={previewMode === 'tablet' ? 'default' : 'outline'}
                              onClick={() => setPreviewMode('tablet')}
                            >
                              <Tablet className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant={previewMode === 'mobile' ? 'default' : 'outline'}
                              onClick={() => setPreviewMode('mobile')}
                            >
                              <Smartphone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`border rounded-lg overflow-hidden ${
                          previewMode === 'desktop' ? 'h-96' : 
                          previewMode === 'tablet' ? 'h-80 max-w-sm mx-auto' : 
                          'h-64 max-w-xs mx-auto'
                        }`}>
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full flex items-center justify-center text-white">
                            <div className="text-center">
                              <h3 className="text-lg font-bold mb-2">Live Preview</h3>
                              <p className="text-sm opacity-90">
                                {editingPage.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => updatePageMutation.mutate({ id: editingPage.id, data: editingPage })}
                            disabled={updatePageMutation.isPending}
                            className="flex-1"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updatePageMutation.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            onClick={() => handleDeployment(editingPage.id)}
                            disabled={deployWebsiteMutation.isPending}
                            variant="outline"
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Deploy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select a page to edit
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a page from the Pages tab to start editing.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deploy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Deployment</CardTitle>
                  <CardDescription>
                    Deploy your website with SEO optimization and payment integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Domain Name</Label>
                        <Input placeholder="your-site.iranlearn.ir" />
                      </div>
                      <div>
                        <Label>Custom Domain (Optional)</Label>
                        <Input placeholder="www.yoursite.com" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>SEO Settings</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <Input placeholder="Page Title" />
                        <Textarea placeholder="Meta Description" />
                        <Input placeholder="Keywords (comma-separated)" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Payment Integration</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Enable Shetab Payment Gateway</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Enable Bank Transfer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch />
                          <Label>Enable Installment Plans</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          deployWebsiteMutation.mutate({
                            domain: 'main-site.iranlearn.ir',
                            sslEnabled: true,
                            pages: websitePages.filter(p => p.status === 'published')
                          });
                        }}
                        disabled={deployWebsiteMutation.isPending}
                        className="flex-1"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        {deployWebsiteMutation.isPending ? 'Deploying...' : 'Deploy Website'}
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}