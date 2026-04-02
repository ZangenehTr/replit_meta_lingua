import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useToast } from "@/hooks/use-toast";
import { 
  Map, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Settings,
  Users,
  BookOpen,
  Target,
  Route,
  Clock,
  Star,
  BarChart3
} from "lucide-react";

export function AdminCallernRoadmaps() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<any>(null);
  
  // Form state for creating roadmaps
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "",
    sessions: "",
    duration: "",
    targetLanguage: ""
  });

  // Form state for editing roadmaps
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    level: "",
    sessions: "",
    duration: "",
    targetLanguage: ""
  });

  // Fetch roadmaps data
  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.admin.callernRoadmaps, { search: searchTerm, status: filterStatus }],
  });

  // Mock roadmaps data for development
  const mockRoadmaps = [
    {
      id: 1,
      title: "Business English A2",
      description: "Comprehensive business communication skills for intermediate learners",
      level: "A2",
      sessions: 24,
      duration: "3 months",
      status: "active",
      enrolledStudents: 45,
      completionRate: 78,
      lastUpdated: "2024-01-20"
    },
    {
      id: 2,
      title: "IELTS Speaking B2",
      description: "Advanced speaking preparation for IELTS exam",
      level: "B2",
      sessions: 16,
      duration: "2 months",
      status: "active",
      enrolledStudents: 32,
      completionRate: 85,
      lastUpdated: "2024-01-18"
    }
  ];

  const displayRoadmaps = isLoading ? mockRoadmaps : (Array.isArray(roadmaps) && roadmaps.length > 0 ? roadmaps : mockRoadmaps);

  // Mutation for creating roadmaps
  const createRoadmapMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest(API_ENDPOINTS.admin.callernRoadmaps, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: t('common:success'),
        description: t('admin:callernRoadmaps.createSuccess')
      });
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        level: "",
        sessions: "",
        duration: "",
        targetLanguage: ""
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.callernRoadmaps] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:callernRoadmaps.createError'),
        variant: 'destructive'
      });
    }
  });

  // Mutation for updating roadmaps
  const updateRoadmapMutation = useMutation({
    mutationFn: (data: typeof editFormData) => apiRequest(`${API_ENDPOINTS.admin.callernRoadmaps}/${selectedRoadmap?.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: t('common:success'),
        description: t('admin:callernRoadmaps.updateSuccess', 'Roadmap updated successfully')
      });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.callernRoadmaps] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:callernRoadmaps.updateError', 'Failed to update roadmap'),
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.level) {
      toast({
        title: t('common:error'),
        description: t('admin:callernRoadmaps.fillRequired'),
        variant: 'destructive'
      });
      return;
    }
    createRoadmapMutation.mutate(formData);
  };

  const handleViewClick = (roadmap: any) => {
    setSelectedRoadmap(roadmap);
    setIsViewOpen(true);
  };

  const handleEditClick = (roadmap: any) => {
    setSelectedRoadmap(roadmap);
    setEditFormData({
      title: roadmap.title,
      description: roadmap.description,
      level: roadmap.level,
      sessions: roadmap.sessions.toString(),
      duration: roadmap.duration,
      targetLanguage: roadmap.targetLanguage || ""
    });
    setIsEditOpen(true);
  };

  const handleSettingsClick = (roadmap: any) => {
    setSelectedRoadmap(roadmap);
    setIsSettingsOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.description || !editFormData.level) {
      toast({
        title: t('common:error'),
        description: t('admin:callernRoadmaps.fillRequired'),
        variant: 'destructive'
      });
      return;
    }
    updateRoadmapMutation.mutate(editFormData);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.callernRoadmaps')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:callernRoadmaps.description')}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-roadmap">
              <Plus className="h-4 w-4 me-2" />
              {t('admin:callernRoadmaps.createRoadmap', 'Create Roadmap')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin:callernRoadmaps.createRoadmap', 'Create Roadmap')}</DialogTitle>
              <DialogDescription>
                {t('admin:callernRoadmaps.createDescription', 'Create a new learning roadmap for students')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('admin:callernRoadmaps.title', 'Title')} *</Label>
                <Input
                  id="title"
                  name="title"
                  data-testid="input-roadmap-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder={t('admin:callernRoadmaps.titlePlaceholder', 'Enter roadmap title')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{t('admin:callernRoadmaps.description', 'Description')} *</Label>
                <Textarea
                  id="description"
                  name="description"
                  data-testid="textarea-roadmap-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t('admin:callernRoadmaps.descriptionPlaceholder', 'Describe the roadmap objectives and content')}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">{t('admin:callernRoadmaps.level', 'Level')} *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                    <SelectTrigger data-testid="select-roadmap-level">
                      <SelectValue placeholder={t('admin:callernRoadmaps.selectLevel', 'Select level')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Beginner</SelectItem>
                      <SelectItem value="A2">A2 - Elementary</SelectItem>
                      <SelectItem value="B1">B1 - Intermediate</SelectItem>
                      <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                      <SelectItem value="C1">C1 - Advanced</SelectItem>
                      <SelectItem value="C2">C2 - Proficient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetLanguage">{t('admin:callernRoadmaps.targetLanguage', 'Target Language')}</Label>
                  <Select value={formData.targetLanguage} onValueChange={(value) => setFormData({...formData, targetLanguage: value})}>
                    <SelectTrigger data-testid="select-target-language">
                      <SelectValue placeholder={t('admin:callernRoadmaps.selectLanguage', 'Select language')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="persian">Persian</SelectItem>
                      <SelectItem value="arabic">Arabic</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessions">{t('admin:callernRoadmaps.sessions', 'Number of Sessions')}</Label>
                  <Input
                    id="sessions"
                    name="sessions"
                    type="number"
                    data-testid="input-roadmap-sessions"
                    value={formData.sessions}
                    onChange={(e) => setFormData({...formData, sessions: e.target.value})}
                    placeholder={t('admin:callernRoadmaps.sessionsPlaceholder', 'e.g. 24')}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">{t('admin:callernRoadmaps.duration', 'Duration')}</Label>
                  <Input
                    id="duration"
                    name="duration"
                    data-testid="input-roadmap-duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder={t('admin:callernRoadmaps.durationPlaceholder', 'e.g. 3 months')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  data-testid="button-cancel-roadmap"
                >
                  {t('common:cancel', 'Cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoadmapMutation.isPending}
                  data-testid="button-save-roadmap"
                >
                  {createRoadmapMutation.isPending ? t('common:creating', 'Creating...') : t('common:create', 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:callernRoadmaps.totalRoadmaps')}
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-roadmaps">
              {displayRoadmaps.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:callernRoadmaps.activeRoadmaps')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-roadmaps">
              {displayRoadmaps.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:callernRoadmaps.totalStudents')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-students">
              {displayRoadmaps.reduce((sum, r) => sum + r.enrolledStudents, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:callernRoadmaps.avgCompletion')}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-completion">
              {Math.round(displayRoadmaps.reduce((sum, r) => sum + r.completionRate, 0) / displayRoadmaps.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin:callernRoadmaps.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10"
            data-testid="input-search-roadmaps"
          />
        </div>
      </div>

      {/* Roadmaps List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayRoadmaps.map((roadmap) => (
          <Card key={roadmap.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg" data-testid={`text-roadmap-title-${roadmap.id}`}>
                    {roadmap.title}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {roadmap.level}
                  </Badge>
                </div>
                <Badge 
                  variant={roadmap.status === 'active' ? 'default' : 'secondary'}
                  data-testid={`badge-status-${roadmap.id}`}
                >
                  {roadmap.status}
                </Badge>
              </div>
              <CardDescription>{roadmap.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span data-testid={`text-sessions-${roadmap.id}`}>
                    {roadmap.sessions} {t('admin:callernRoadmaps.sessions')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span data-testid={`text-duration-${roadmap.id}`}>
                    {roadmap.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span data-testid={`text-enrolled-${roadmap.id}`}>
                    {roadmap.enrolledStudents} {t('admin:callernRoadmaps.enrolled')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span data-testid={`text-completion-${roadmap.id}`}>
                    {roadmap.completionRate}% {t('admin:callernRoadmaps.completion')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid={`button-view-${roadmap.id}`}
                  onClick={() => handleViewClick(roadmap)}
                >
                  <Eye className="h-4 w-4 me-1" />
                  {t('common:view')}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid={`button-edit-${roadmap.id}`}
                  onClick={() => handleEditClick(roadmap)}
                >
                  <Edit className="h-4 w-4 me-1" />
                  {t('common:edit')}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid={`button-settings-${roadmap.id}`}
                  onClick={() => handleSettingsClick(roadmap)}
                >
                  <Settings className="h-4 w-4 me-1" />
                  {t('common:settings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('common:view')} - {selectedRoadmap?.title}</DialogTitle>
          </DialogHeader>
          {selectedRoadmap && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">{t('admin:callernRoadmaps.title')}</Label>
                <p className="text-sm text-muted-foreground">{selectedRoadmap.title}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t('admin:callernRoadmaps.description')}</Label>
                <p className="text-sm text-muted-foreground">{selectedRoadmap.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t('admin:callernRoadmaps.level')}</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoadmap.level}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t('admin:callernRoadmaps.sessions')}</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoadmap.sessions}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t('admin:callernRoadmaps.duration')}</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoadmap.duration}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t('admin:callernRoadmaps.enrolled')}</Label>
                  <p className="text-sm text-muted-foreground">{selectedRoadmap.enrolledStudents}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">{t('admin:callernRoadmaps.completion')}</Label>
                <p className="text-sm text-muted-foreground">{selectedRoadmap.completionRate}%</p>
              </div>
              <Button onClick={() => setIsViewOpen(false)} className="w-full">
                {t('common:close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('common:edit')} - {selectedRoadmap?.title}</DialogTitle>
            <DialogDescription>
              {t('admin:callernRoadmaps.editDescription', 'Update the roadmap details')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('admin:callernRoadmaps.title')} *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                placeholder={t('admin:callernRoadmaps.titlePlaceholder')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('admin:callernRoadmaps.description')} *</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder={t('admin:callernRoadmaps.descriptionPlaceholder')}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level">{t('admin:callernRoadmaps.level')} *</Label>
                <Select value={editFormData.level} onValueChange={(value) => setEditFormData({...editFormData, level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-language">{t('admin:callernRoadmaps.targetLanguage')}</Label>
                <Select value={editFormData.targetLanguage} onValueChange={(value) => setEditFormData({...editFormData, targetLanguage: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="persian">Persian</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sessions">{t('admin:callernRoadmaps.sessions')}</Label>
                <Input
                  id="edit-sessions"
                  type="number"
                  value={editFormData.sessions}
                  onChange={(e) => setEditFormData({...editFormData, sessions: e.target.value})}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">{t('admin:callernRoadmaps.duration')}</Label>
                <Input
                  id="edit-duration"
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData({...editFormData, duration: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
              >
                {t('common:cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={updateRoadmapMutation.isPending}
              >
                {updateRoadmapMutation.isPending ? t('common:saving', 'Saving...') : t('common:save', 'Save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common:settings')} - {selectedRoadmap?.title}</DialogTitle>
            <DialogDescription>
              {t('admin:callernRoadmaps.settingsDescription', 'Manage roadmap settings and preferences')}
            </DialogDescription>
          </DialogHeader>
          {selectedRoadmap && (
            <div className="space-y-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">{t('admin:callernRoadmaps.general', 'General')}</TabsTrigger>
                  <TabsTrigger value="advanced">{t('admin:callernRoadmaps.advanced', 'Advanced')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('admin:callernRoadmaps.status')}</Label>
                    <Badge 
                      variant={selectedRoadmap.status === 'active' ? 'default' : 'secondary'}
                    >
                      {selectedRoadmap.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('admin:callernRoadmaps.lastUpdated', 'Last Updated')}</Label>
                    <p className="text-sm text-muted-foreground">{selectedRoadmap.lastUpdated}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('admin:callernRoadmaps.enrolledStudents', 'Total Enrolled')}</Label>
                    <p className="text-sm text-muted-foreground">{selectedRoadmap.enrolledStudents} {t('admin:callernRoadmaps.students', 'students')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('admin:callernRoadmaps.completion')}</Label>
                    <p className="text-sm text-muted-foreground">{selectedRoadmap.completionRate}%</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Button onClick={() => setIsSettingsOpen(false)} className="w-full">
                {t('common:close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}