import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  BookOpen, 
  Star,
  Calendar,
  Target,
  Award,
  Clock,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/use-language";

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: Array<{ month: string; amount: number; toman: number }>;
    growth: number;
    projection: number;
  };
  students: {
    total: number;
    active: number;
    new: number;
    retention: number;
    demographics: Array<{ age: string; count: number }>;
    courseDistribution: Array<{ course: string; students: number; color: string }>;
  };
  teachers: {
    total: number;
    active: number;
    performance: Array<{ name: string; rating: number; students: number; revenue: number }>;
    satisfaction: number;
  };
  courses: {
    total: number;
    mostPopular: Array<{ name: string; enrollments: number; completion: number; rating: number }>;
    completion: number;
    difficulty: Array<{ level: string; completion: number; satisfaction: number }>;
  };
  sessions: {
    total: number;
    completed: number;
    cancelled: number;
    attendance: number;
    timeDistribution: Array<{ hour: string; sessions: number }>;
  };
  financial: {
    totalRevenue: number;
    expenses: number;
    profit: number;
    paymentMethods: Array<{ method: string; percentage: number; amount: number }>;
    monthlyTrends: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  };
}

export default function AnalyticsDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("6months");
  const [courseFilter, setCourseFilter] = useState("all");
  const { currentLanguage, isRTL } = useLanguage();

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', timeRange, courseFilter],
  });

  // Chart colors for Persian/Iranian theme
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
  const iranianColors = ['#00D084', '#0099FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatToman = (amount: number) => {
    return `${(amount / 10).toLocaleString('fa-IR')} تومان`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background p-4 md:p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <BackButton href="/dashboard" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentLanguage === 'fa' ? 'داشبورد تحلیل و گزارشات' :
                 currentLanguage === 'ar' ? 'لوحة التحليلات والتقارير' :
                 'Analytics & Reports Dashboard'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {currentLanguage === 'fa' ? 'تحلیل جامع عملکرد موسسه و بینش‌ها' :
                 currentLanguage === 'ar' ? 'تحليل شامل لأداء المعهد والرؤى' :
                 'Comprehensive institute performance analytics and insights'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">{formatToman(analytics?.revenue.total || 0)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{analytics?.revenue.growth || 0}% this month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Students
                  </p>
                  <p className="text-2xl font-bold">{analytics?.students.active || 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {analytics?.students.retention || 0}% retention rate
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Course Completion
                  </p>
                  <p className="text-2xl font-bold">{analytics?.courses.completion || 0}%</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {analytics?.courses.total || 0} active courses
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Teacher Satisfaction
                  </p>
                  <p className="text-2xl font-bold">{analytics?.teachers.satisfaction || 0}★</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {analytics?.teachers.active || 0} active teachers
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-5">
            <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
            <TabsTrigger value="students">Student Analytics</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
            <TabsTrigger value="courses">Course Insights</TabsTrigger>
            <TabsTrigger value="operational">Operations</TabsTrigger>
          </TabsList>

          {/* Revenue Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                  <CardDescription>Revenue growth over time (in Toman)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics?.revenue.monthly || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip 
                        formatter={(value: number) => [formatToman(value), 'Revenue']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="toman" 
                        stroke="#00D084" 
                        fill="#00D084" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Profit and expense analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.financial.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: number) => formatToman(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#00D084" name="Revenue" />
                      <Bar dataKey="expenses" fill="#FF6B6B" name="Expenses" />
                      <Bar dataKey="profit" fill="#4ECDC4" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Distribution</CardTitle>
                <CardDescription>How students prefer to pay (Iranian market)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics?.financial.paymentMethods || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {(analytics?.financial.paymentMethods || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={iranianColors[index % iranianColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    {(analytics?.financial.paymentMethods || []).map((method, index) => (
                      <div key={method.method} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: iranianColors[index % iranianColors.length] }}
                          />
                          <span className="font-medium">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{method.percentage}%</div>
                          <div className="text-sm text-gray-600">{formatToman(method.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Analytics Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Demographics</CardTitle>
                  <CardDescription>Age distribution of enrolled students</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.students.demographics || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0099FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Enrollment Distribution</CardTitle>
                  <CardDescription>Popular courses among students</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.students.courseDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ course, students }) => `${course}: ${students}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="students"
                      >
                        {(analytics?.students.courseDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || iranianColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teacher Performance Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance Metrics</CardTitle>
                <CardDescription>Individual teacher statistics and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.teachers.performance || []).map((teacher, index) => (
                    <div key={teacher.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-sm text-gray-600">
                            {teacher.students} students • {teacher.rating}★ rating
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatToman(teacher.revenue)}</div>
                        <div className="text-sm text-gray-600">Monthly Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Insights Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Popular Courses</CardTitle>
                  <CardDescription>Enrollment and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analytics?.courses.mostPopular || []).map((course, index) => (
                      <div key={course.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-gray-600">
                            {course.enrollments} enrollments • {course.rating}★
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{course.completion}%</div>
                          <div className="text-xs text-gray-600">Completion</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Difficulty Analysis</CardTitle>
                  <CardDescription>Completion rates by difficulty level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.courses.difficulty || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completion" fill="#4ECDC4" name="Completion %" />
                      <Bar dataKey="satisfaction" fill="#96CEB4" name="Satisfaction ★" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operational Analytics Tab */}
          <TabsContent value="operational" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Time Distribution</CardTitle>
                  <CardDescription>Peak hours for classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics?.sessions.timeDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#00D084" 
                        strokeWidth={2}
                        dot={{ fill: '#00D084' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Statistics</CardTitle>
                  <CardDescription>Overall session performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics?.sessions.completed || 0}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {analytics?.sessions.cancelled || 0}
                      </div>
                      <div className="text-sm text-gray-600">Cancelled</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics?.sessions.attendance || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Attendance</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics?.sessions.total || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}