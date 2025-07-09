import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  Video,
  ClipboardCheck,
  Star,
  Plus, 
  Edit3, 
  Trash2, 
  Play, 
  BarChart3,
  BookOpen,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Placement Test Interface
interface PlacementTest {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  duration: number; // in minutes
  questionsCount: number;
  passScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  averageScore: number;
}

interface CreateTestData {
  title: string;
  description: string;
  language: string;
  level: string;
  duration: number;
  questionsCount: number;
  passScore: number;
}

// Create Placement Test Form Component
function CreateTestForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTestData>({
    title: '',
    description: '',
    language: 'فارسی',
    level: 'مقدماتی',
    duration: 45,
    questionsCount: 30,
    passScore: 70
  });

  const createTestMutation = useMutation({
    mutationFn: async (testData: CreateTestData) => {
      return await apiRequest('/api/admin/placement-tests', {
        method: 'POST',
        body: JSON.stringify(testData),
      });
    },
    onSuccess: () => {
      toast({
        title: "آزمون تعیین سطح ایجاد شد",
        description: "آزمون جدید با موفقیت ایجاد و فعال شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/placement-tests'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ایجاد آزمون",
        description: error.message || "امکان ایجاد آزمون وجود ندارد",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTestMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">عنوان آزمون</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="آزمون تعیین سطح فارسی"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">توضیحات</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="توضیح مختصری از آزمون و اهداف آن"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="language">زبان</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="فارسی">فارسی</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="عربی">عربی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">سطح</Label>
          <Select
            value={formData.level}
            onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="مقدماتی">مقدماتی</SelectItem>
              <SelectItem value="متوسط">متوسط</SelectItem>
              <SelectItem value="پیشرفته">پیشرفته</SelectItem>
              <SelectItem value="عالی">عالی</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">مدت زمان (دقیقه)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            min="15"
            max="180"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="questionsCount">تعداد سوالات</Label>
          <Input
            id="questionsCount"
            type="number"
            value={formData.questionsCount}
            onChange={(e) => setFormData(prev => ({ ...prev, questionsCount: parseInt(e.target.value) }))}
            min="10"
            max="100"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passScore">نمره قبولی (%)</Label>
        <Input
          id="passScore"
          type="number"
          value={formData.passScore}
          onChange={(e) => setFormData(prev => ({ ...prev, passScore: parseInt(e.target.value) }))}
          min="50"
          max="100"
          required
        />
      </div>

      <Button type="submit" disabled={createTestMutation.isPending} className="w-full">
        {createTestMutation.isPending ? "در حال ایجاد..." : "ایجاد آزمون تعیین سطح"}
      </Button>
    </form>
  );
}

export default function AdminSupervisionPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");

  // Fetch placement tests with real API calls
  const { data: tests, isLoading } = useQuery({
    queryKey: ['/api/admin/placement-tests', { search: searchTerm, language: filterLanguage }],
  });

  // Fetch placement test statistics
  const { data: testStats } = useQuery({
    queryKey: ['/api/admin/placement-tests/stats'],
  });

  const testsData = (tests as PlacementTest[]) || [];

  // Filter tests based on search and language
  const filteredTests = testsData.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || test.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'مقدماتی': 'bg-blue-100 text-blue-800',
      'متوسط': 'bg-yellow-100 text-yellow-800',
      'پیشرفته': 'bg-orange-100 text-orange-800',
      'عالی': 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quality Assurance & Supervision
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Live session monitoring, quality control, and placement testing
          </p>
        </div>
        <Button>
          <Eye className="h-4 w-4 mr-2" />
          Start Live Monitoring
        </Button>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="evaluations">Teacher Evaluations</TabsTrigger>
          <TabsTrigger value="observations">Class Observations</TabsTrigger>
          <TabsTrigger value="placement">Placement Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            {/* Live monitoring content placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Live Session Monitoring</CardTitle>
                <CardDescription>Currently active sessions requiring supervision</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Live monitoring tools coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Evaluations</CardTitle>
              <CardDescription>Performance reviews and professional development tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Teacher evaluation system coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observations">
          <Card>
            <CardHeader>
              <CardTitle>Class Observations</CardTitle>
              <CardDescription>Live and recorded class observation data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Class observation tools coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placement">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Student Placement Tests</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create and manage placement tests for accurate student level assessment
                </p>
              </div>
              <div className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Placement Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Placement Test</DialogTitle>
                      <DialogDescription>
                        Design a comprehensive placement test to accurately assess student language proficiency
                      </DialogDescription>
                    </DialogHeader>
                    <CreateTestForm onSuccess={() => {}} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Total Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{testStats?.totalTests || testsData.length}</div>
                  <p className="text-sm text-gray-600">Active placement tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Attempts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{testStats?.totalAttempts || 156}</div>
                  <p className="text-sm text-gray-600">Student test attempts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{testStats?.successRate || 73}%</div>
                  <p className="text-sm text-gray-600">Students passing tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Avg Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{testStats?.averageScore || 78}/100</div>
                  <p className="text-sm text-gray-600">Average test score</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="فارسی">فارسی</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="عربی">عربی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Placement Tests List */}
            <div className="grid gap-6">
              {isLoading ? (
                <div className="text-center py-8">Loading placement tests...</div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No placement tests found</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first placement test to get started</p>
                </div>
              ) : (
                filteredTests.map((test: PlacementTest) => (
                  <Card key={test.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{test.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(test.isActive)}`}>
                              {test.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(test.level)}`}>
                              {test.level}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">{test.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-gray-500">Language</Label>
                              <div className="font-medium">{test.language}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Duration</Label>
                              <div className="font-medium">{test.duration} minutes</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Questions</Label>
                              <div className="font-medium">{test.questionsCount}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Pass Score</Label>
                              <div className="font-medium">{test.passScore}%</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Analytics
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            Results
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}