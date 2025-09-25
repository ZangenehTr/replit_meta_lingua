import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, Users, Clock, Target, AlertCircle, CheckCircle, XCircle, Phone, Video, MapPin } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";

interface AnalyticsData {
  totalBookings: number;
  completedBookings: number;
  noShowBookings: number;
  conversions: number;
  conversionRate: string;
  timeSlotStats: Array<{
    timeSlot: number;
    count: number;
  }>;
  languageDistribution?: Array<{
    language: string;
    count: number;
  }>;
  teacherPerformance?: Array<{
    teacherId: number;
    teacherName: string;
    totalLessons: number;
    completionRate: number;
    averageRating: number;
    conversions: number;
  }>;
  weeklyTrends?: Array<{
    date: string;
    bookings: number;
    completions: number;
    conversions: number;
  }>;
}

interface TrialLessonAnalyticsProps {
  className?: string;
}

export function TrialLessonAnalytics({ className }: TrialLessonAnalyticsProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("bookings");

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/trial-lessons/analytics', selectedPeriod, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodType: selectedPeriod,
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: dateRange.to.toISOString().split('T')[0]
      });
      
      const response = await fetch(`/api/trial-lessons/analytics?${params}`);
      return response.json();
    }
  });

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  // Format time slots for display
  const formatTimeSlot = (hour: number) => {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    return format(time, 'ha');
  };

  // Get lesson type icon
  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return <Video className="h-4 w-4 text-blue-600" />;
      case 'phone': return <Phone className="h-4 w-4 text-orange-600" />;
      case 'in_person': return <MapPin className="h-4 w-4 text-green-600" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="analytics-loading">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg mt-6"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="trial-lesson-analytics">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Trial Lesson Analytics</h2>
          <p className="text-muted-foreground">
            Performance metrics and insights for trial lesson bookings
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32" data-testid="period-selector">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <DatePickerWithRange
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="metric-total-bookings">
              {analyticsData.totalBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              Trial lessons booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="metric-completion-rate">
              {analyticsData.totalBookings > 0 
                ? Math.round((analyticsData.completedBookings / analyticsData.totalBookings) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.completedBookings} of {analyticsData.totalBookings} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="metric-conversion-rate">
              {analyticsData.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.conversions} enrolled after trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="metric-noshow-rate">
              {analyticsData.totalBookings > 0 
                ? Math.round((analyticsData.noShowBookings / analyticsData.totalBookings) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.noShowBookings} no-shows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="time-slots" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="time-slots" data-testid="tab-time-slots">Time Slots</TabsTrigger>
          <TabsTrigger value="languages" data-testid="tab-languages">Languages</TabsTrigger>
          <TabsTrigger value="teachers" data-testid="tab-teachers">Teachers</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
        </TabsList>

        {/* Time Slot Analysis */}
        <TabsContent value="time-slots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Time Slots</CardTitle>
              <CardDescription>
                Most requested time slots for trial lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.timeSlotStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timeSlot" 
                      tickFormatter={formatTimeSlot}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `${formatTimeSlot(Number(label))}`}
                      formatter={(value) => [value, 'Bookings']}
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Analysis */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language Distribution</CardTitle>
              <CardDescription>
                Most requested languages for trial lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.languageDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analyticsData.languageDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Performance */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance</CardTitle>
              <CardDescription>
                Trial lesson metrics by teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Total Lessons</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Average Rating</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analyticsData.teacherPerformance || []).map((teacher) => (
                    <TableRow key={teacher.teacherId} data-testid={`teacher-row-${teacher.teacherId}`}>
                      <TableCell className="font-medium">{teacher.teacherName}</TableCell>
                      <TableCell>{teacher.totalLessons}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={teacher.completionRate >= 80 ? "default" : "secondary"}
                          className={teacher.completionRate >= 80 ? "bg-green-500" : ""}
                        >
                          {teacher.completionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span>{teacher.averageRating.toFixed(1)}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </TableCell>
                      <TableCell>{teacher.conversions}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={teacher.conversions / teacher.totalLessons >= 0.3 ? "default" : "secondary"}
                          className={teacher.conversions / teacher.totalLessons >= 0.3 ? "bg-purple-500" : ""}
                        >
                          {((teacher.conversions / teacher.totalLessons) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
              <CardDescription>
                Weekly trends for bookings, completions, and conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.weeklyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bookings" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Bookings"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completions" 
                      stackId="1"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Completions"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conversions" 
                      stackId="1"
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Insights & Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.totalBookings === 0 && (
              <div className="flex items-center space-x-2 text-blue-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">No trial lessons booked yet. Consider promoting trial offers.</span>
              </div>
            )}
            
            {analyticsData.noShowBookings / analyticsData.totalBookings > 0.2 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">High no-show rate detected. Consider implementing reminder systems.</span>
              </div>
            )}
            
            {Number(analyticsData.conversionRate) < 30 && analyticsData.totalBookings > 10 && (
              <div className="flex items-center space-x-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Low conversion rate. Review trial lesson quality and follow-up processes.</span>
              </div>
            )}
            
            {analyticsData.completedBookings / analyticsData.totalBookings > 0.8 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Excellent completion rate! Students are showing up for their trials.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}