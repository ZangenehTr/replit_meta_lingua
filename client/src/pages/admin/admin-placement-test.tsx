import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  TrendingUp,
  Activity,
  Calendar,
  Loader2
} from "lucide-react";

// Form validation schema
const createTestSchema = z.object({
  title: z.string().min(3, "Test name must be at least 3 characters").max(100, "Test name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  language: z.string().min(1, "Language is required"),
  duration: z.number().min(10, "Duration must be at least 10 minutes").max(180, "Duration must be less than 180 minutes"),
  difficulty: z.string().min(1, "Difficulty is required")
});

type CreateTestFormValues = z.infer<typeof createTestSchema>;

export function AdminPlacementTest() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Create test form with validation
  const form = useForm<CreateTestFormValues>({
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      title: "",
      description: "",
      language: "English",
      duration: 45,
      difficulty: "adaptive"
    }
  });

  // Fetch placement test data
  const { data: tests = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/placement-tests', { search: searchTerm, status: filterStatus }],
  });

  // Fetch placement test stats
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/admin/placement-tests/stats'],
  });

  // Fetch placement test sessions (results)
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: ['/api/placement-test-sessions'],
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: CreateTestFormValues) => {
      return await apiRequest('/api/admin/placement-tests', {
        method: 'POST',
        body: testData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Placement test created successfully"
      });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/placement-tests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/placement-tests/stats'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create placement test",
        variant: "destructive"
      });
    }
  });

  const handleCreateTest = (values: CreateTestFormValues) => {
    createTestMutation.mutate(values);
  };

  const displayTests = Array.isArray(tests) && tests.length > 0 ? tests : [];

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
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTest)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:name')} *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., General English Placement Test"
                          data-testid="input-test-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:description')} *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the purpose and content of this test"
                          rows={3}
                          data-testid="textarea-test-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common:language')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-test-language">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Persian">Persian</SelectItem>
                            <SelectItem value="Arabic">Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:placementTest.duration')} (mins)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            min="10"
                            max="180"
                            data-testid="input-test-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:placementTest.difficulty')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-test-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="adaptive">Adaptive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-create"
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTestMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createTestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('common:create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
              {stats?.totalTests || displayTests.length}
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
              {stats?.totalAttempts || 0}
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
              {stats?.averageScore || 0}%
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
              {stats?.successRate || 0}%
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
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading tests...</p>
            </div>
          ) : displayTests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4" />
                <p>No placement tests found. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayTests.map((test: any) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-test-name-${test.id}`}>
                          {test.title || test.name}
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
                        variant={test.isActive || test.status === 'active' ? 'default' : 'secondary'}
                        data-testid={`badge-status-${test.id}`}
                      >
                        {test.isActive || test.status === 'active' ? 'active' : 'inactive'}
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
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-attempts-${test.id}`}>
                            {test.attempts || 0} attempts
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-avg-score-${test.id}`}>
                            {Math.round(test.averageScore || 0)}% avg
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-updated-${test.id}`}>
                            {new Date(test.updatedAt || test.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
              {sessionsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Loading results...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4" />
                  <p>No test results yet. Results will appear here once students complete tests.</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Overall Level</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session: any) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            Student #{session.userId}
                          </TableCell>
                          <TableCell>{session.targetLanguage || 'English'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {session.overallCefrLevel || session.overallCEFRLevel || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{Math.round(session.overallScore || 0)}%</TableCell>
                          <TableCell>
                            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {statsLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Loading analytics...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tests This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats?.newTestsThisMonth || 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      New tests created
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Attempts This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.attemptsThisWeek || 0}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Student test attempts
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats?.successRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Overall pass rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>
                    Key metrics for placement test performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Attempts</span>
                      </div>
                      <span className="text-2xl font-bold">{stats?.totalAttempts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Average Score</span>
                      </div>
                      <span className="text-2xl font-bold">{stats?.averageScore || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Success Rate</span>
                      </div>
                      <span className="text-2xl font-bold">{stats?.successRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
