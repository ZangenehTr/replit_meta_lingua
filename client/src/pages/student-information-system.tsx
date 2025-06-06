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
  UserPlus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Edit,
  MessageCircle,
  FileText,
  Calendar,
  GraduationCap,
  Award,
  DollarSign,
  Clock,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { BackButton } from "@/components/ui/back-button";

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  currentLevel?: string;
  targetLanguage: string;
  nativeLanguage: string;
  learningGoals: string[];
  communicationLogs: CommunicationLog[];
  paymentHistory: Payment[];
  attendanceRecords: AttendanceRecord[];
  homeworkSubmissions: HomeworkSubmission[];
  progressReports: ProgressReport[];
}

interface CommunicationLog {
  id: number;
  date: string;
  type: 'call' | 'email' | 'sms' | 'meeting';
  subject: string;
  content: string;
  staffMember: string;
}

interface Payment {
  id: number;
  date: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  className: string;
  status: 'present' | 'absent' | 'late';
  duration?: number;
}

interface HomeworkSubmission {
  id: number;
  assignmentTitle: string;
  dueDate: string;
  submissionDate?: string;
  status: 'submitted' | 'pending' | 'late';
  grade?: number;
  feedback?: string;
}

interface ProgressReport {
  id: number;
  date: string;
  level: string;
  skillScores: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
  };
  overallProgress: number;
  teacherNotes: string;
}

export default function StudentInformationSystem() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // Fetch students data from the backend
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["/api/admin/students"],
    enabled: user?.role === "admin" || user?.role === "manager"
  });

  const { data: studentDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["/api/admin/students", selectedStudent?.id],
    enabled: !!selectedStudent?.id
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === "" || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const StudentListView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/dashboard" />
          </div>
          <h2 className="text-2xl font-bold">
            {currentLanguage === 'fa' ? 'سیستم اطلاعات دانش‌آموزان' :
             currentLanguage === 'ar' ? 'نظام معلومات الطلاب' :
             'Student Information System'}
          </h2>
          <p className="text-muted-foreground">
            {currentLanguage === 'fa' ? 'مدیریت جامع پروفایل و پیشرفت دانش‌آموزان' :
             currentLanguage === 'ar' ? 'إدارة شاملة لملفات الطلاب وتقدمهم' :
             'Comprehensive management of student profiles and progress'}
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          {currentLanguage === 'fa' ? 'ثبت‌نام دانش‌آموز جدید' :
           currentLanguage === 'ar' ? 'تسجيل طالب جديد' :
           'Register New Student'}
        </Button>
      </div>

      {/* Search and Filter Controls */}
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
            <SelectItem value="suspended">تعلیق</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          صدور گزارش
        </Button>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">در حال بارگذاری...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-right">
                    <th className="p-4 font-medium">نام و نام خانوادگی</th>
                    <th className="p-4 font-medium">ایمیل</th>
                    <th className="p-4 font-medium">سطح فعلی</th>
                    <th className="p-4 font-medium">زبان هدف</th>
                    <th className="p-4 font-medium">تاریخ ثبت‌نام</th>
                    <th className="p-4 font-medium">وضعیت</th>
                    <th className="p-4 font-medium">اقدامات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            {student.guardianName && (
                              <p className="text-sm text-muted-foreground">ولی: {student.guardianName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p>{student.email}</p>
                          {student.phoneNumber && (
                            <p className="text-sm text-muted-foreground">{student.phoneNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {student.currentLevel || "تعیین نشده"}
                        </Badge>
                      </td>
                      <td className="p-4">{student.targetLanguage}</td>
                      <td className="p-4">{new Date(student.enrollmentDate).toLocaleDateString('fa-IR')}</td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            student.status === 'active' ? 'default' :
                            student.status === 'graduated' ? 'secondary' :
                            student.status === 'suspended' ? 'destructive' : 'outline'
                          }
                        >
                          {student.status === 'active' && 'فعال'}
                          {student.status === 'inactive' && 'غیرفعال'}
                          {student.status === 'graduated' && 'فارغ‌التحصیل'}
                          {student.status === 'suspended' && 'تعلیق'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSelectedStudent(student)}
                          >
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
          )}
        </CardContent>
      </Card>
    </div>
  );

  const StudentDetailView = () => {
    if (!selectedStudent) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedStudent(null)}>
              ← بازگشت
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
              <p className="text-muted-foreground">پروفایل جامع دانش‌آموز</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              صدور گواهی
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              صدور گزارش
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              ویرایش
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="academic">پیشرفت تحصیلی</TabsTrigger>
            <TabsTrigger value="attendance">حضور و غیاب</TabsTrigger>
            <TabsTrigger value="homework">تکالیف</TabsTrigger>
            <TabsTrigger value="communications">ارتباطات</TabsTrigger>
            <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>اطلاعات شخصی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">نام</label>
                      <p>{selectedStudent.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">نام خانوادگی</label>
                      <p>{selectedStudent.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ایمیل</label>
                      <p>{selectedStudent.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تلفن</label>
                      <p>{selectedStudent.phoneNumber || "ثبت نشده"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تاریخ تولد</label>
                      <p>{selectedStudent.dateOfBirth || "ثبت نشده"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">آدرس</label>
                      <p>{selectedStudent.address || "ثبت نشده"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Information */}
              <Card>
                <CardHeader>
                  <CardTitle>اطلاعات ولی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">نام ولی</label>
                      <p>{selectedStudent.guardianName || "ثبت نشده"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تلفن ولی</label>
                      <p>{selectedStudent.guardianPhone || "ثبت نشده"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>پروفایل یادگیری</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">زبان مادری</label>
                      <p>{selectedStudent.nativeLanguage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">زبان هدف</label>
                      <p>{selectedStudent.targetLanguage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">سطح فعلی</label>
                      <Badge>{selectedStudent.currentLevel || "تعیین نشده"}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تاریخ ثبت‌نام</label>
                      <p>{new Date(selectedStudent.enrollmentDate).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">اهداف یادگیری</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStudent.learningGoals.map((goal, index) => (
                        <Badge key={index} variant="outline">{goal}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status and Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>آمار و وضعیت</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">85%</p>
                      <p className="text-sm text-muted-foreground">حضور در کلاس</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">92%</p>
                      <p className="text-sm text-muted-foreground">تکمیل تکالیف</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">B1</p>
                      <p className="text-sm text-muted-foreground">سطح فعلی</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Award className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-sm text-muted-foreground">گواهی‌های کسب شده</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle>گزارش‌های پیشرفت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStudent.progressReports?.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">گزارش {report.level}</h4>
                          <p className="text-sm text-muted-foreground">{new Date(report.date).toLocaleDateString('fa-IR')}</p>
                        </div>
                        <Badge>{report.overallProgress}% پیشرفت کلی</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">شنیداری</p>
                          <p className="font-medium">{report.skillScores.listening}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">گفتاری</p>
                          <p className="font-medium">{report.skillScores.speaking}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">خواندن</p>
                          <p className="font-medium">{report.skillScores.reading}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">نوشتن</p>
                          <p className="font-medium">{report.skillScores.writing}%</p>
                        </div>
                      </div>
                      <p className="text-sm">{report.teacherNotes}</p>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p>هنوز گزارش پیشرفتی ثبت نشده است</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>سوابق حضور و غیاب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStudent.attendanceRecords?.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{record.className}</p>
                        <p className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString('fa-IR')}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            record.status === 'present' ? 'default' :
                            record.status === 'late' ? 'secondary' : 'destructive'
                          }
                        >
                          {record.status === 'present' && 'حاضر'}
                          {record.status === 'absent' && 'غائب'}
                          {record.status === 'late' && 'تأخیر'}
                        </Badge>
                        {record.duration && (
                          <p className="text-sm text-muted-foreground mt-1">{record.duration} دقیقه</p>
                        )}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2" />
                      <p>سابقه حضور و غیابی موجود نیست</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homework">
            <Card>
              <CardHeader>
                <CardTitle>سوابق تکالیف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStudent.homeworkSubmissions?.map((homework) => (
                    <div key={homework.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{homework.assignmentTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          مهلت: {new Date(homework.dueDate).toLocaleDateString('fa-IR')}
                        </p>
                        {homework.submissionDate && (
                          <p className="text-sm text-muted-foreground">
                            ارسال: {new Date(homework.submissionDate).toLocaleDateString('fa-IR')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            homework.status === 'submitted' ? 'default' :
                            homework.status === 'late' ? 'secondary' : 'destructive'
                          }
                        >
                          {homework.status === 'submitted' && 'ارسال شده'}
                          {homework.status === 'pending' && 'در انتظار'}
                          {homework.status === 'late' && 'دیرکرد'}
                        </Badge>
                        {homework.grade && (
                          <p className="text-sm font-medium mt-1">نمره: {homework.grade}/100</p>
                        )}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-2" />
                      <p>سابقه تکلیفی موجود نیست</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <CardTitle>سوابق ارتباطات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStudent.communicationLogs?.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {log.type === 'call' && <Phone className="h-4 w-4" />}
                          {log.type === 'email' && <Mail className="h-4 w-4" />}
                          {log.type === 'sms' && <MessageCircle className="h-4 w-4" />}
                          <p className="font-medium">{log.subject}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{new Date(log.date).toLocaleDateString('fa-IR')}</p>
                          <p>توسط: {log.staffMember}</p>
                        </div>
                      </div>
                      <p className="text-sm">{log.content}</p>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>سابقه ارتباطی موجود نیست</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>سوابق پرداخت‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStudent.paymentHistory?.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString('fa-IR')}</p>
                        <p className="text-sm text-muted-foreground">روش پرداخت: {payment.method}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{payment.amount.toLocaleString('fa-IR')} تومان</p>
                        <Badge 
                          variant={
                            payment.status === 'paid' ? 'default' :
                            payment.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {payment.status === 'paid' && 'پرداخت شده'}
                          {payment.status === 'pending' && 'در انتظار'}
                          {payment.status === 'overdue' && 'معوقه'}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2" />
                      <p>سابقه پرداختی موجود نیست</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className={`container mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {selectedStudent ? <StudentDetailView /> : <StudentListView />}
    </div>
  );
}