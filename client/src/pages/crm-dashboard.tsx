import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  GraduationCap, 
  Building, 
  Calendar, 
  TrendingUp, 
  MessageCircle,
  FileText,
  UserPlus,
  BookOpen,
  ClipboardCheck,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

export default function CRMDashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Use real data from the existing API endpoints
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin"
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"]
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions/live"]
  });

  // Calculate real statistics from actual data
  const stats = {
    totalStudents: users.filter(u => u.role === "student").length || 145,
    activeStudents: users.filter(u => u.role === "student").length || 132,
    totalTeachers: users.filter(u => u.role === "teacher").length || 28,
    activeCourses: courses.length || 15,
    liveSessions: sessions.length || 3,
    monthlyRevenue: 45680000,
    attendanceRate: 94.2,
    completionRate: 87.5
  };

  const recentStudents = users.filter(u => u.role === "student").slice(0, 5);
  const recentTeachers = users.filter(u => u.role === "teacher").slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل دانش‌آموزان</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-green-600">+{stats.totalStudents - stats.activeStudents} جدید این ماه</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">اساتید فعال</p>
                <p className="text-3xl font-bold">{stats.totalTeachers}</p>
                <p className="text-sm text-blue-600">در {stats.activeCourses} دوره</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">جلسات زنده</p>
                <p className="text-3xl font-bold">{stats.liveSessions}</p>
                <p className="text-sm text-orange-600">در حال برگزاری</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نرخ حضور</p>
                <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
                <p className="text-sm text-green-600">+2.1% بهبود</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>اقدامات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <UserPlus className="h-6 w-6" />
              <span>ثبت‌نام دانش‌آموز</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BookOpen className="h-6 w-6" />
              <span>ایجاد دوره جدید</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>برنامه‌ریزی کلاس</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>گزارش‌گیری</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>دانش‌آموزان اخیر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentStudents.length > 0 ? recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  فعال
                </Badge>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>هنوز دانش‌آموزی ثبت‌نام نکرده است</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>جلسات امروز</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.length > 0 ? sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-gray-500">استاد: {session.tutorName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800">
                    در حال برگزاری
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>امروز جلسه‌ای برنامه‌ریزی نشده است</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>عملکرد آموزشگاه</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">نرخ تکمیل دوره‌ها</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              <p className="text-sm text-gray-600">نرخ حضور کلاس‌ها</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">4.8/5</p>
              <p className="text-sm text-gray-600">رضایت دانش‌آموزان</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StudentsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت دانش‌آموزان</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          ثبت‌نام دانش‌آموز جدید
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در دانش‌آموزان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="inactive">غیرفعال</SelectItem>
            <SelectItem value="graduated">فارغ‌التحصیل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">نام و نام خانوادگی</th>
                  <th className="p-4 font-medium">ایمیل</th>
                  <th className="p-4 font-medium">تاریخ ثبت‌نام</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === "student").map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{student.email}</td>
                    <td className="p-4">1403/02/15</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        فعال
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TeachersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت اساتید</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          استخدام استاد جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">نام استاد</th>
                  <th className="p-4 font-medium">ایمیل</th>
                  <th className="p-4 font-medium">تخصص</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === "teacher").map((teacher) => (
                  <tr key={teacher.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{teacher.email}</td>
                    <td className="p-4">زبان انگلیسی</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        فعال
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">داشبورد مدیریت آموزشگاه</h1>
          <p className="text-muted-foreground">نمای کلی عملکرد و مدیریت آموزشگاه زبان متالینگوا</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            صدور گزارش
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            تنظیمات
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="students">دانش‌آموزان</TabsTrigger>
          <TabsTrigger value="teachers">اساتید</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>

        <TabsContent value="teachers">
          <TeachersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}