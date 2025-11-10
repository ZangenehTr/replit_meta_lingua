import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Upload, Search, Filter, Download, Eye, Edit, Trash2, 
  FileText, Video, Image, Headphones, Link, Plus, 
  Folder, Star, Clock, BookOpen, Users, Globe 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'presentation';
  category: string;
  level: string;
  language: string;
  fileUrl?: string;
  externalUrl?: string;
  fileSize?: string;
  duration?: string;
  downloads: number;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
}

export default function TeacherResourcesPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: [API_ENDPOINTS.teacher.resources],
  });

  const categories: Category[] = [
    { id: "all", name: t('allCategories'), count: resources.length, icon: <Folder className="w-4 h-4" /> },
    { id: "lesson-plans", name: t('lessonPlans'), count: resources.filter(r => r.category === 'lesson-plans').length, icon: <BookOpen className="w-4 h-4" /> },
    { id: "worksheets", name: t('worksheets'), count: resources.filter(r => r.category === 'worksheets').length, icon: <FileText className="w-4 h-4" /> },
    { id: "videos", name: t('videos'), count: resources.filter(r => r.type === 'video').length, icon: <Video className="w-4 h-4" /> },
    { id: "audio", name: t('audio'), count: resources.filter(r => r.type === 'audio').length, icon: <Headphones className="w-4 h-4" /> },
    { id: "presentations", name: t('presentations'), count: resources.filter(r => r.type === 'presentation').length, icon: <Image className="w-4 h-4" /> },
    { id: "external", name: t('externalLinks'), count: resources.filter(r => r.type === 'link').length, icon: <Link className="w-4 h-4" /> },
  ];

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(API_ENDPOINTS.teacher.resourcesUpload, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.teacher.resources] });
      toast({
        title: t('success'),
        description: t('resourceUploadedSuccessfully'),
      });
      setShowUploadDialog(false);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('uploadFailed'),
        variant: "destructive",
      });
    },
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesLevel = selectedLevel === "all" || resource.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-red-500" />;
      case 'audio': return <Headphones className="w-8 h-8 text-green-500" />;
      case 'image': return <Image className="w-8 h-8 text-purple-500" />;
      case 'link': return <Link className="w-8 h-8 text-orange-500" />;
      case 'presentation': return <Image className="w-8 h-8 text-yellow-500" />;
      default: return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('teachingResources')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('manageTeachingMaterials')}
            </p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('uploadResource')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('uploadNewResource')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('selectFile')}</label>
                  <Input type="file" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('title')}</label>
                  <Input placeholder={t('resourceTitle')} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('description')}</label>
                  <Input placeholder={t('resourceDescription')} className="mt-1" />
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => setShowUploadDialog(false)} variant="outline" className="flex-1">
                    {t('cancel')}
                  </Button>
                  <Button className="flex-1" disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? t('uploading') : t('upload')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalResources')}</p>
                  <p className="text-2xl font-bold">{resources.length}</p>
                </div>
                <Folder className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalDownloads')}</p>
                  <p className="text-2xl font-bold">
                    {resources.reduce((acc, r) => acc + (r.downloads || 0), 0)}
                  </p>
                </div>
                <Download className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('publicResources')}</p>
                  <p className="text-2xl font-bold">
                    {resources.filter(r => r.isPublic).length}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalLikes')}</p>
                  <p className="text-2xl font-bold">
                    {resources.reduce((acc, r) => acc + (r.likes || 0), 0)}
                  </p>
                </div>
                <Star className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('categories')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedCategory === category.id ? 'bg-blue-50 dark:bg-blue-900 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {category.icon}
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resources Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder={t('searchResources')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">{t('allLevels')}</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(resource.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold truncate pr-2">{resource.title}</h3>
                          {resource.isPublic && (
                            <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {resource.level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {resource.language}
                          </Badge>
                          {resource.fileSize && (
                            <span className="text-xs text-gray-500">{resource.fileSize}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {resource.downloads || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {resource.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(resource.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredResources.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('noResourcesFound')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? t('tryDifferentSearch') : t('noResourcesYet')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}