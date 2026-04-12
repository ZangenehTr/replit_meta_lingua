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
import { useAuth } from "@/hooks/use-auth";
import type { CmsPage, CmsPageSection, InsertCmsPage } from "@shared/schema";
import { SectionListManager } from "@/components/cms/SectionListManager";
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

// Extend CmsPage with sections for UI display
interface CmsPageWithSections extends CmsPage {
  sections?: CmsPageSection[];
}

export default function WebsiteBuilderPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fa'>('en');
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pages');
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    locale: 'en',
    direction: 'ltr',
    isHomepage: false
  });

  // Fetch CMS pages from API
  const { data: cmsPages = [], isLoading: pagesLoading } = useQuery<CmsPage[]>({
    queryKey: ['/api/cms/pages']
  });

  // Stub for websiteTemplates - templates tab will be phased out in favor of section management
  const websiteTemplates: any[] = [];
  const selectedTemplate: any = null;
  const handleTemplateSelection = (template: any) => {
    // Stub function - templates are being phased out
    toast({
      title: "Templates Deprecated",
      description: "Templates are being replaced with flexible section management. Please use the page builder instead.",
      variant: "default"
    });
  };

  // Create new CMS page mutation
  const createPageMutation = useMutation({
    mutationFn: async (pageData: Partial<InsertCmsPage>) => {
      return apiRequest('/api/cms/pages', {
        method: 'POST',
        body: pageData
      });
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.pageCreated'),
        description: "New CMS page has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewPageData({
        title: '',
        slug: '',
        locale: 'en',
        direction: 'ltr',
        isHomepage: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: "Failed to create page. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update CMS page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CmsPage> }) => {
      // Filter to only include editable fields (InsertCmsPage schema)
      const updateData: Partial<InsertCmsPage> = {
        title: data.title,
        titleEn: data.titleEn,
        titleFa: data.titleFa,
        titleAr: data.titleAr,
        slug: data.slug,
        template: data.template,
        status: data.status,
        locale: data.locale,
        direction: data.direction,
        isHomepage: data.isHomepage,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        ogImage: data.ogImage,
        publishedAt: data.publishedAt,
        createdBy: data.createdBy,
        updatedBy: user?.id
      };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => 
        updateData[key as keyof InsertCmsPage] === undefined && delete updateData[key as keyof InsertCmsPage]
      );
      
      return apiRequest(`/api/cms/pages/${id}`, {
        method: 'PUT',
        body: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.pageUpdated'),
        description: "CMS page has been updated successfully.",
      });
      setEditingPage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
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
        title: t('common:toast.websiteDeployed'),
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

  // Handle page creation
  const handleCreatePage = async () => {
    if (!newPageData.title || !newPageData.slug) {
      toast({
        title: t('common:toast.error'),
        description: "Please provide title and slug for the page.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t('common:toast.error'),
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    const cmsPageData: Partial<InsertCmsPage> = {
      title: newPageData.title,
      slug: newPageData.slug,
      locale: newPageData.locale as any,
      direction: newPageData.direction as any,
      isHomepage: newPageData.isHomepage,
      status: 'draft',
      createdBy: user.id
    };

    createPageMutation.mutate(cmsPageData);
  };

  const handleDeployment = (pageId: number) => {
    deployWebsiteMutation.mutate({ pageId });
  };

  const parseGlobalSettings = (page: CmsPage) => {
    try { return JSON.parse(page.template || '{}'); } catch { return {}; }
  };

  const updateGlobalSettingsMutation = useMutation({
    mutationFn: async ({ id, template }: { id: number; template: string }) => {
      return apiRequest(`/api/cms/pages/${id}`, { method: 'PUT', body: { template } });
    },
    onSuccess: (updatedPage: CmsPage) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
      if (editingPage && updatedPage && editingPage.id === updatedPage.id) {
        setEditingPage(updatedPage);
      }
    },
  });

  const handleGlobalSettingChange = (page: CmsPage, key: string, value: boolean) => {
    const current = parseGlobalSettings(page);
    const updated = { ...current, [key]: value };
    updateGlobalSettingsMutation.mutate({ id: page.id, template: JSON.stringify(updated) });
  };

  const openInBuilder = (page: CmsPage) => {
    setEditingPage(page);
    setActiveTab('builder');
  };

  const publishPageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/pages/${id}/publish`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: 'Page published', description: 'The page is now publicly accessible.' });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
    },
    onError: () => {
      toast({ title: 'Publish failed', description: 'Failed to publish page.', variant: 'destructive' });
    }
  });

  const publishPage = (page: CmsPage) => {
    publishPageMutation.mutate(page.id);
  };

  return (
    <AppLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              CMS Page Builder
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage website pages with multi-language support
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'fa' : 'en')}
              variant="outline"
              size="sm"
              className="h-8 text-xs sm:text-sm"
            >
              <Languages className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
              {currentLanguage === 'en' ? 'English' : 'فارسی'}
            </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
                    <span className="hidden sm:inline">Create Page</span>
                    <span className="sm:hidden">{t('admin:add')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <Label htmlFor="locale">Language/Locale</Label>
                      <Select value={newPageData.locale} onValueChange={(value) => setNewPageData({ ...newPageData, locale: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select locale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fa">فارسی</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="isHomepage">Set as Homepage</Label>
                      <Switch
                        id="isHomepage"
                        checked={newPageData.isHomepage}
                        onCheckedChange={(checked) => setNewPageData({ ...newPageData, isHomepage: checked })}
                      />
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                {cmsPages.map((page) => (
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
                            <Languages className="w-4 h-4" />
                            {page.locale || 'en'}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {page.isHomepage ? 'Homepage' : 'Page'}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm" 
                            onClick={() => openInBuilder(page)}
                            className="flex-1"
                          >
                            <Layout className="w-4 h-4 me-1" />
                            Build
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => publishPage(page)}
                            disabled={page.status === 'published' || publishPageMutation.isPending}
                            className="flex-1"
                          >
                            <Globe className="w-4 h-4 me-1" />
                            {page.status === 'published' ? 'Published' : 'Publish'}
                          </Button>
                        </div>
                        {page.status === 'published' && (
                          <a
                            href={`/p/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            View: /p/{page.slug}
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {cmsPages.length === 0 && (
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
                              <Smartphone className="w-3 h-3 me-1" />
                              Responsive
                            </Badge>
                          )}
                          {template.isRtlSupported && (
                            <Badge variant="secondary">
                              <AlignRight className="w-3 h-3 me-1" />
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
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <CardTitle>{editingPage.title}</CardTitle>
                            <CardDescription>/p/{editingPage.slug} — {editingPage.status}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPage(null)}
                            >
                              ← Back
                            </Button>
                            {editingPage.status !== 'published' && (
                              <Button
                                size="sm"
                                onClick={() => publishPage(editingPage)}
                                disabled={publishPageMutation.isPending}
                              >
                                <Globe className="w-3 h-3 me-1" />
                                Publish
                              </Button>
                            )}
                            {editingPage.status === 'published' && (
                              <a
                                href={`/p/${editingPage.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3 me-1" />
                                  View Page
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <SectionListManager pageId={editingPage.id} pageName={editingPage.title} />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-1 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Global Settings</CardTitle>
                        <CardDescription className="text-xs">Applied to the entire page</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(() => {
                          const gs = parseGlobalSettings(editingPage);
                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm">Smooth Scroll</Label>
                                  <p className="text-xs text-muted-foreground">Desktop only, auto-disabled on mobile</p>
                                </div>
                                <Switch
                                  checked={!!gs.smoothScroll}
                                  onCheckedChange={(v) => handleGlobalSettingChange(editingPage, 'smoothScroll', v)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm">Progress Bar</Label>
                                  <p className="text-xs text-muted-foreground">Fixed scroll progress indicator at top</p>
                                </div>
                                <Switch
                                  checked={!!gs.progressBar}
                                  onCheckedChange={(v) => handleGlobalSettingChange(editingPage, 'progressBar', v)}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select a page to build
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Go to the Pages tab and click "Build" on any page to start editing sections.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('pages')}>
                    Go to Pages
                  </Button>
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
                            pages: cmsPages.filter(p => p.status === 'published')
                          });
                        }}
                        disabled={deployWebsiteMutation.isPending}
                        className="flex-1"
                      >
                        <Globe className="w-4 h-4 me-2" />
                        {deployWebsiteMutation.isPending ? 'Deploying...' : 'Deploy Website'}
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 me-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
  );
}