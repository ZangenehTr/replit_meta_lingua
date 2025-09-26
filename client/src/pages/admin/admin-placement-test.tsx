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
  ClipboardList, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Users,
  Clock,
  BarChart3,
  CheckCircle,
  AlertCircle,
  FileText,
  Target,
  Award,
  TrendingUp
} from "lucide-react";

export function AdminPlacementTest() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch placement test data
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/placement-tests', { search: searchTerm, status: filterStatus }],
  });

  // Mock placement test data for development
  const mockTests = [
    {
      id: 1,
      name: "Persian Language Placement Test",
      description: "Comprehensive test to assess Persian language proficiency",
      language: "Persian",
      duration: 45,
      questions: 50,
      participants: 234,
      averageScore: 67,
      passRate: 78,
      difficulty: "adaptive",
      status: "active",
      lastUpdated: "2024-01-20"
    },
    {
      id: 2,
      name: "English Business Communication Assessment",
      description: "Placement test for business English skills",
      language: "English",
      duration: 30,
      questions: 35,
      participants: 156,
      averageScore: 72,
      passRate: 84,
      difficulty: "intermediate",
      status: "active",
      lastUpdated: "2024-01-18"
    },
    {
      id: 3,
      name: "General English Proficiency Test",
      description: "Standard English placement assessment",
      language: "English",
      duration: 60,
      questions: 75,
      participants: 345,
      averageScore: 65,
      passRate: 73,
      difficulty: "adaptive",
      status: "active",
      lastUpdated: "2024-01-15"
    }
  ];

  const displayTests = isLoading ? mockTests : (Array.isArray(tests) && tests.length > 0 ? tests : mockTests);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.placementTest')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:placementTest.description')}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-test">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:placementTest.createTest')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:placementTest.createTest')}</DialogTitle>
              <DialogDescription>
                {t('admin:placementTest.createDescription')}
              </DialogDescription>
            </DialogHeader>
            {/* Test creation form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:placementTest.totalTests')}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tests">
              {displayTests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:placementTest.totalParticipants')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-participants">
              {displayTests.reduce((sum, t) => sum + t.participants, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:placementTest.avgScore')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-score">
              {Math.round(displayTests.reduce((sum, t) => sum + t.averageScore, 0) / displayTests.length)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:placementTest.avgPassRate')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-pass-rate">
              {Math.round(displayTests.reduce((sum, t) => sum + t.passRate, 0) / displayTests.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Management */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList>
          <TabsTrigger value="tests">{t('admin:placementTest.tests')}</TabsTrigger>
          <TabsTrigger value="results">{t('admin:placementTest.results')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:placementTest.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin:placementTest.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-tests"
              />
            </div>
          </div>

          {/* Tests Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-test-name-${test.id}`}>
                        {test.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {test.language}
                        </Badge>
                        <Badge variant="outline">
                          {test.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={test.status === 'active' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${test.id}`}
                    >
                      {test.status}
                    </Badge>
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-duration-${test.id}`}>
                          {test.duration} mins
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-questions-${test.id}`}>
                          {test.questions} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-participants-${test.id}`}>
                          {test.participants} taken
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-avg-score-${test.id}`}>
                          {test.averageScore}% avg
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t('admin:placementTest.passRate')}</span>
                        <span className="font-medium" data-testid={`text-pass-rate-${test.id}`}>
                          {test.passRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${test.passRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>{t('admin:placementTest.lastUpdated')}</span>
                      <span className="font-medium" data-testid={`text-updated-${test.id}`}>
                        {test.lastUpdated}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" data-testid={`button-preview-${test.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common:preview')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-${test.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common:edit')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-results-${test.id}`}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      {t('admin:placementTest.results')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:placementTest.testResults')}</CardTitle>
              <CardDescription>
                {t('admin:placementTest.resultsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:placementTest.resultsPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:placementTest.testAnalytics')}</CardTitle>
              <CardDescription>
                {t('admin:placementTest.analyticsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:placementTest.analyticsPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}