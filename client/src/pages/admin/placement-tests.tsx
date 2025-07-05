import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit3, Trash2, Play, Users, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateTestData>({
    title: '',
    description: '',
    language: 'persian',
    level: 'beginner',
    duration: 30,
    questionsCount: 20,
    passScore: 70
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: CreateTestData) => {
      return apiRequest('/api/admin/placement-tests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Placement test created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/placement-tests'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create placement test",
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Test Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter test title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select 
            value={formData.language} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="persian">Persian</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the placement test purpose and content"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="level">Target Level</Label>
          <Select 
            value={formData.level} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            min="10"
            max="120"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="questionsCount">Number of Questions</Label>
          <Input
            id="questionsCount"
            type="number"
            value={formData.questionsCount}
            onChange={(e) => setFormData(prev => ({ ...prev, questionsCount: parseInt(e.target.value) }))}
            min="5"
            max="100"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passScore">Passing Score (%)</Label>
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
        {createTestMutation.isPending ? "Creating..." : "Create Placement Test"}
      </Button>
    </form>
  );
}

export function AdminPlacementTests() {
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

  const filteredTests = testsData.filter((test: PlacementTest) => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === "all" || test.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Placement Tests</h1>
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

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search placement tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="persian">Persian</SelectItem>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="arabic">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      {testStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testStats.totalTests}</div>
              <p className="text-xs text-green-600">+{testStats.newTestsThisMonth} new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testStats.totalAttempts}</div>
              <p className="text-xs text-blue-600">{testStats.attemptsThisWeek} this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testStats.averageScore}%</div>
              <p className="text-xs text-gray-600">Across all tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testStats.successRate}%</div>
              <p className="text-xs text-purple-600">Students passing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Placement Tests List */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8">Loading placement tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-8">
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
                        <span className="font-medium">Language:</span>
                        <p className="text-gray-600 capitalize">{test.language}</p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-gray-600">{test.duration} minutes</p>
                      </div>
                      <div>
                        <span className="font-medium">Questions:</span>
                        <p className="text-gray-600">{test.questionsCount}</p>
                      </div>
                      <div>
                        <span className="font-medium">Pass Score:</span>
                        <p className="text-gray-600">{test.passScore}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t">
                      <div>
                        <span className="font-medium">Attempts:</span>
                        <p className="text-gray-600">{test.attempts}</p>
                      </div>
                      <div>
                        <span className="font-medium">Average Score:</span>
                        <p className="text-gray-600">{test.averageScore}%</p>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <p className="text-gray-600">{new Date(test.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span>
                        <p className="text-gray-600">{new Date(test.updatedAt).toLocaleDateString()}</p>
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
  );
}

export default AdminPlacementTests;