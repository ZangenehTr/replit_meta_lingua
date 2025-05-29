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
  MoreHorizontal
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface CRMStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeGroups: number;
  monthlyRevenue: number;
  attendanceRate: number;
  completionRate: number;
  parentSatisfaction: number;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  enrollmentDate: string;
  status: string;
  level: string;
  targetLanguage: string;
  groupName: string;
  attendanceRate: number;
  progress: number;
  lastActivity: string;
  parentName?: string;
  parentPhone?: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string[];
  studentCount: number;
  rating: number;
  contractType: string;
  status: string;
  joinDate: string;
}

interface StudentGroup {
  id: number;
  name: string;
  language: string;
  level: string;
  teacherName: string;
  currentStudents: number;
  maxStudents: number;
  schedule: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
}

export default function CRMDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - in real implementation, these would come from API
  const stats: CRMStats = {
    totalStudents: 342,
    activeStudents: 298,
    totalTeachers: 28,
    activeGroups: 24,
    monthlyRevenue: 45680,
    attendanceRate: 87.5,
    completionRate: 82.3,
    parentSatisfaction: 4.6
  };

  const students: Student[] = [
    {
      id: 1,
      firstName: "احمد",
      lastName: "رضایی",
      email: "ahmad.rezaei@email.com",
      phoneNumber: "+98 912 345 6789",
      enrollmentDate: "2024-01-15",
      status: "active",
      level: "intermediate",
      targetLanguage: "English",
      groupName: "English B1 Morning",
      attendanceRate: 92,
      progress: 78,
      lastActivity: "2024-05-29",
      parentName: "محمد رضایی",
      parentPhone: "+98 911 234 5678"
    },
    {
      id: 2,
      firstName: "فاطمه",
      lastName: "احمدی",
      email: "fateme.ahmadi@email.com",
      phoneNumber: "+98 913 456 7890",
      enrollmentDate: "2024-02-20",
      status: "active",
      level: "beginner",
      targetLanguage: "German",
      groupName: "German A1 Evening",
      attendanceRate: 88,
      progress: 65,
      lastActivity: "2024-05-28"
    }
  ];

  const teachers: Teacher[] = [
    {
      id: 1,
      firstName: "سارا",
      lastName: "محمدی",
      email: "sara.mohammadi@institute.com",
      phoneNumber: "+98 912 111 2222",
      specialization: ["English", "IELTS"],
      studentCount: 45,
      rating: 4.8,
      contractType: "full_time",
      status: "active",
      joinDate: "2023-09-01"
    },
    {
      id: 2,
      firstName: "علی",
      lastName: "کریمی",
      email: "ali.karimi@institute.com",
      phoneNumber: "+98 913 222 3333",
      specialization: ["German", "French"],
      studentCount: 32,
      rating: 4.6,
      contractType: "part_time",
      status: "active",
      joinDate: "2024-01-15"
    }
  ];

  const groups: StudentGroup[] = [
    {
      id: 1,
      name: "English B1 Morning",
      language: "English",
      level: "intermediate",
      teacherName: "سارا محمدی",
      currentStudents: 18,
      maxStudents: 20,
      schedule: "شنبه، دوشنبه، چهارشنبه 9:00-11:00",
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      status: "active",
      progress: 65
    },
    {
      id: 2,
      name: "German A1 Evening",
      language: "German",
      level: "beginner",
      teacherName: "علی کریمی",
      currentStudents: 12,
      maxStudents: 15,
      schedule: "یکشنبه، سه‌شنبه، پنج‌شنبه 18:00-20:00",
      startDate: "2024-02-01",
      endDate: "2024-07-01",
      status: "active",
      progress: 45
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل دانش‌آموزان</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-green-600">+12 این ماه</p>
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
                <p className="text-sm text-blue-600">+2 این ماه</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">گروه‌های فعال</p>
                <p className="text-3xl font-bold">{stats.activeGroups}</p>
                <p className="text-sm text-purple-600">+3 این ماه</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">درآمد ماهانه</p>
                <p className="text-3xl font-bold">{stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">+8.2%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
              <p className="text-sm text-muted-foreground">نرخ حضور</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.completionRate}%</p>
              <p className="text-sm text-muted-foreground">نرخ تکمیل دوره</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.parentSatisfaction}/5</p>
              <p className="text-sm text-muted-foreground">رضایت والدین</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">94%</p>
              <p className="text-sm text-muted-foreground">نرخ تمدید</p>
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
              <span>دانش‌آموز جدید</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BookOpen className="h-6 w-6" />
              <span>گروه جدید</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ClipboardCheck className="h-6 w-6" />
              <span>حضور و غیاب</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>گزارش‌گیری</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StudentsTab = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجوی دانش‌آموزان..."
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
            <SelectItem value="suspended">تعلیق</SelectItem>
          </SelectContent>
        </Select>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          دانش‌آموز جدید
        </Button>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">نام</th>
                  <th className="p-4 font-medium">زبان هدف</th>
                  <th className="p-4 font-medium">سطح</th>
                  <th className="p-4 font-medium">گروه</th>
                  <th className="p-4 font-medium">حضور</th>
                  <th className="p-4 font-medium">پیشرفت</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        {student.parentName && (
                          <p className="text-xs text-blue-600">والدین: {student.parentName}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{student.targetLanguage}</td>
                    <td className="p-4">
                      <Badge variant="outline">{student.level}</Badge>
                    </td>
                    <td className="p-4">{student.groupName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-sm">{student.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-sm">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(student.status)}>
                        {student.status === "active" ? "فعال" : "غیرفعال"}
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
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Mail className="h-4 w-4" />
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
          <Plus className="h-4 w-4 mr-2" />
          استاد جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{teacher.firstName} {teacher.lastName}</h3>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                  <Badge className={getStatusColor(teacher.status)}>
                    {teacher.status === "active" ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">تخصص:</span>
                    <span className="text-sm">{teacher.specialization.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">دانش‌آموزان:</span>
                    <span className="text-sm">{teacher.studentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">امتیاز:</span>
                    <span className="text-sm">⭐ {teacher.rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">نوع قرارداد:</span>
                    <span className="text-sm">
                      {teacher.contractType === "full_time" ? "تمام‌وقت" : "پاره‌وقت"}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    مشاهده
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const GroupsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت گروه‌ها</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          گروه جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-gray-500">{group.language} - {group.level}</p>
                  </div>
                  <Badge className={getStatusColor(group.status)}>
                    {group.status === "active" ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">استاد:</span>
                    <span className="text-sm">{group.teacherName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">دانش‌آموزان:</span>
                    <span className="text-sm">{group.currentStudents}/{group.maxStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">برنامه:</span>
                    <span className="text-sm">{group.schedule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">پیشرفت:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{group.progress}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    مشاهده
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">سیستم مدیریت آموزشگاه</h1>
          <p className="text-muted-foreground">مدیریت جامع دانش‌آموزان، اساتید و گروه‌های آموزشی</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            گزارش اکسل
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            گزارش‌گیری
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="students">دانش‌آموزان</TabsTrigger>
          <TabsTrigger value="teachers">اساتید</TabsTrigger>
          <TabsTrigger value="groups">گروه‌ها</TabsTrigger>
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

        <TabsContent value="groups">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}