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
import { API_ENDPOINTS } from "@/services/endpoints";
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Target,
  Clock,
  Users,
  CheckCircle,
  BarChart3,
  Calendar,
  Award,
  BookOpen
} from "lucide-react";

export function AdminExamRoadmaps() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExam, setFilterExam] = useState("all");

  // Fetch exam roadmaps data
  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.admin.examRoadmaps, { search: searchTerm, exam: filterExam }],
  });

  // Mock exam roadmaps data for development
  const mockRoadmaps = [
    {
      id: 1,
      name: "IELTS Academic Roadmap",
      examType: "IELTS",
      targetScore: "7.0",
      duration: "12 weeks",
      difficulty: "intermediate",
      modules: 4,
      totalLessons: 48,
      enrolledStudents: 67,
      averageScore: 6.8,
      completionRate: 82,
      status: "active"
    },
    {
      id: 2,
      name: "TOEFL iBT Preparation",
      examType: "TOEFL",
      targetScore: "100",
      duration: "10 weeks",
      difficulty: "advanced",
      modules: 4,
      totalLessons: 40,
      enrolledStudents: 43,
      averageScore: 95,
      completionRate: 76,
      status: "active"
    },
    {
      id: 3,
      name: "Cambridge FCE Track",
      examType: "Cambridge",
      targetScore: "B2",
      duration: "16 weeks",
      difficulty: "intermediate",
      modules: 5,
      totalLessons: 64,
      enrolledStudents: 38,
      averageScore: 0, // B2 level
      completionRate: 89,
      status: "active"
    }
  ];

  const displayRoadmaps = isLoading ? mockRoadmaps : (Array.isArray(roadmaps) && roadmaps.length > 0 ? roadmaps : mockRoadmaps);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.examRoadmaps')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:examRoadmaps.description')}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-exam-roadmap">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:examRoadmaps.createRoadmap')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:examRoadmaps.createRoadmap')}</DialogTitle>
              <DialogDescription>
                {t('admin:examRoadmaps.createDescription')}
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
              {t('admin:examRoadmaps.totalRoadmaps')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
              {t('admin:examRoadmaps.totalStudents')}
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
              {t('admin:examRoadmaps.avgCompletion')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-completion">
              {Math.round(displayRoadmaps.reduce((sum, r) => sum + r.completionRate, 0) / displayRoadmaps.length)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:examRoadmaps.activeRoadmaps')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-roadmaps">
              {displayRoadmaps.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Roadmaps Management */}
      <Tabs defaultValue="roadmaps" className="w-full">
        <TabsList>
          <TabsTrigger value="roadmaps">{t('admin:examRoadmaps.roadmaps')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:examRoadmaps.analytics')}</TabsTrigger>
          <TabsTrigger value="templates">{t('admin:examRoadmaps.templates')}</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmaps" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin:examRoadmaps.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-roadmaps"
              />
            </div>
          </div>

          {/* Roadmaps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayRoadmaps.map((roadmap) => (
              <Card key={roadmap.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-roadmap-name-${roadmap.id}`}>
                        {roadmap.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {roadmap.examType}
                        </Badge>
                        <Badge variant="outline">
                          {roadmap.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={roadmap.status === 'active' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${roadmap.id}`}
                    >
                      {roadmap.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-target-${roadmap.id}`}>
                          {roadmap.targetScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-duration-${roadmap.id}`}>
                          {roadmap.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-lessons-${roadmap.id}`}>
                          {roadmap.totalLessons} lessons
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-enrolled-${roadmap.id}`}>
                          {roadmap.enrolledStudents} students
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>{t('admin:examRoadmaps.completion')}</span>
                        <span className="font-medium" data-testid={`text-completion-${roadmap.id}`}>
                          {roadmap.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${roadmap.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {roadmap.averageScore > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>{t('admin:examRoadmaps.avgScore')}</span>
                        <span className="font-medium" data-testid={`text-avg-score-${roadmap.id}`}>
                          {roadmap.averageScore}
                        </span>
                      </div>
                    )}
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
                    <Button size="sm" variant="outline" data-testid={`button-analytics-${roadmap.id}`}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      {t('admin:examRoadmaps.analytics')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:examRoadmaps.performanceAnalytics')}</CardTitle>
              <CardDescription>
                {t('admin:examRoadmaps.analyticsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:examRoadmaps.analyticsPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:examRoadmaps.roadmapTemplates')}</CardTitle>
              <CardDescription>
                {t('admin:examRoadmaps.templatesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:examRoadmaps.templatesPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}