import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch roadmaps data
  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: ['/api/admin/callern-roadmaps', { search: searchTerm, status: filterStatus }],
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
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-roadmap">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:callernRoadmaps.createRoadmap')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:callernRoadmaps.createRoadmap')}</DialogTitle>
              <DialogDescription>
                {t('admin:callernRoadmaps.createDescription')}
              </DialogDescription>
            </DialogHeader>
            {/* Roadmap creation form would go here */}
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin:callernRoadmaps.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
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
                <Button size="sm" variant="outline" data-testid={`button-view-${roadmap.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  {t('common:view')}
                </Button>
                <Button size="sm" variant="outline" data-testid={`button-edit-${roadmap.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  {t('common:edit')}
                </Button>
                <Button size="sm" variant="outline" data-testid={`button-settings-${roadmap.id}`}>
                  <Settings className="h-4 w-4 mr-1" />
                  {t('common:settings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}