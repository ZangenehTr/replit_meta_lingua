import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Users,
  Clock,
  Star,
  TrendingUp,
  Video,
  FileText,
  Download,
  Upload,
  Settings,
  Play,
  Pause
} from "lucide-react";

export function AdminCourses() {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch courses data
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/admin/courses', { search: searchTerm, category: filterCategory }],
  });

  const courseData = courses || [
    {
      id: 1,
      title: "Persian Language Fundamentals",
      description: "Complete introduction to Persian language with cultural context",
      category: "Persian",
      level: "Beginner",
      duration: "12 weeks",
      lessonsCount: 48,
      enrolledStudents: 156,
      completionRate: 87,
      rating: 4.8,
      status: "active",
      instructor: "Dr. Maryam Hosseini",
      price: 299,
      currency: "USD",
      lastUpdated: "2024-01-20",
      modules: [
        { id: 1, title: "Introduction to Persian Script", lessons: 8, duration: "2 weeks" },
        { id: 2, title: "Basic Grammar Structure", lessons: 12, duration: "3 weeks" },
        { id: 3, title: "Everyday Conversations", lessons: 16, duration: "4 weeks" },
        { id: 4, title: "Cultural Context & Expressions", lessons: 12, duration: "3 weeks" }
      ]
    },
    {
      id: 2,
      title: "English Business Communication",
      description: "Professional English for business environments and corporate communications",
      category: "English",
      level: "Intermediate",
      duration: "8 weeks",
      lessonsCount: 32,
      enrolledStudents: 89,
      completionRate: 92,
      rating: 4.9,
      status: "active",
      instructor: "Prof. James Richardson",
      price: 399,
      currency: "USD",
      lastUpdated: "2024-01-18",
      modules: [
        { id: 1, title: "Professional Email Writing", lessons: 8, duration: "2 weeks" },
        { id: 2, title: "Presentation Skills", lessons: 8, duration: "2 weeks" },
        { id: 3, title: "Meeting Management", lessons: 8, duration: "2 weeks" },
        { id: 4, title: "Negotiation Techniques", lessons: 8, duration: "2 weeks" }
      ]
    },
    {
      id: 3,
      title: "Arabic Grammar Mastery",
      description: "Advanced Arabic grammar with classical and modern applications",
      category: "Arabic",
      level: "Advanced",
      duration: "16 weeks",
      lessonsCount: 64,
      enrolledStudents: 42,
      completionRate: 78,
      rating: 4.7,
      status: "draft",
      instructor: "Dr. Ahmed Al-Mansouri",
      price: 499,
      currency: "USD",
      lastUpdated: "2024-01-15",
      modules: [
        { id: 1, title: "Classical Grammar Foundations", lessons: 16, duration: "4 weeks" },
        { id: 2, title: "Modern Standard Arabic", lessons: 16, duration: "4 weeks" },
        { id: 3, title: "Advanced Syntax", lessons: 16, duration: "4 weeks" },
        { id: 4, title: "Literary Analysis", lessons: 16, duration: "4 weeks" }
      ]
    }
  ];

  const filteredCourses = courseData.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course & Curriculum Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced course builder with multimedia content and assessment tools
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Course
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Build a comprehensive course with modules, lessons, and assessments
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <Input id="courseTitle" placeholder="Enter course title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseCategory">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persian">Persian</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLevel">Difficulty Level</Label>
                      <Select>
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
                      <Label htmlFor="courseDuration">Duration (weeks)</Label>
                      <Input id="courseDuration" type="number" placeholder="12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseDescription">Course Description</Label>
                    <Textarea id="courseDescription" placeholder="Detailed course description..." rows={4} />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Course Modules</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded">
                        <div className="flex-1">
                          <Input placeholder="Module title" />
                        </div>
                        <Input placeholder="Lessons" className="w-24" type="number" />
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-3">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coursePrice">Course Price</Label>
                      <Input id="coursePrice" type="number" placeholder="299" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseCurrency">Currency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD</SelectItem>
                          <SelectItem value="eur">EUR</SelectItem>
                          <SelectItem value="irr">IRR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="freePreview" />
                    <Label htmlFor="freePreview">Allow free preview</Label>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="autoEnroll" />
                      <Label htmlFor="autoEnroll">Allow auto-enrollment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="certificates" />
                      <Label htmlFor="certificates">Issue completion certificates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="discussions" />
                      <Label htmlFor="discussions">Enable course discussions</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline">Save as Draft</Button>
                <Button>Publish Course</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Persian">Persian</SelectItem>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Arabic">Arabic</SelectItem>
            <SelectItem value="French">French</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{course.instructor}</p>
                </div>
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Level:</span>
                  <Badge className={`ml-2 ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">{course.duration}</span>
                </div>
                <div>
                  <span className="text-gray-600">Students:</span>
                  <span className="ml-2 font-bold">{course.enrolledStudents}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rating:</span>
                  <span className="ml-2 font-bold flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {course.rating}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion Rate</span>
                  <span>{course.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${course.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-lg font-bold">
                  ${course.price} {course.currency}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                      <DialogHeader>
                        <DialogTitle>Course Details: {course.title}</DialogTitle>
                      </DialogHeader>
                      
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="content">Content</TabsTrigger>
                          <TabsTrigger value="students">Students</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Course Information</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                  <span>Instructor:</span>
                                  <span className="font-medium">{course.instructor}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Category:</span>
                                  <Badge>{course.category}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Lessons:</span>
                                  <span className="font-medium">{course.lessonsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Last Updated:</span>
                                  <span className="font-medium">{course.lastUpdated}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                  <span>Enrolled Students:</span>
                                  <span className="font-bold">{course.enrolledStudents}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Completion Rate:</span>
                                  <span className="font-bold">{course.completionRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Average Rating:</span>
                                  <span className="font-bold flex items-center">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                    {course.rating}/5.0
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Revenue:</span>
                                  <span className="font-bold">${(course.price * course.enrolledStudents).toLocaleString()}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Course Modules</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {course.modules.map((module, idx) => (
                                  <div key={module.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">{module.title}</h4>
                                        <p className="text-sm text-gray-600">
                                          {module.lessons} lessons • {module.duration}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                          <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="students" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Enrolled Students</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Student management interface would be implemented here</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  {course.enrolledStudents} students currently enrolled
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Engagement Rate</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">78%</div>
                                <p className="text-sm text-gray-600">Average lesson completion</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Drop-off Rate</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">22%</div>
                                <p className="text-sm text-gray-600">Students who discontinue</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Time Spent</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">4.2h</div>
                                <p className="text-sm text-gray-600">Average per week</p>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-green-600">+8 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,842</div>
            <p className="text-xs text-green-600">+234 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-yellow-600">-2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Course Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127k</div>
            <p className="text-xs text-green-600">+15% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}