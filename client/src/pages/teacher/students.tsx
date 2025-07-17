import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Search, Filter, MessageSquare, Phone, Mail, 
  TrendingUp, Award, BookOpen, Clock, ChevronRight,
  Star, Calendar, Target, AlertCircle 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  course: string;
  level: string;
  progress: number;
  attendance: number;
  lastSession: string;
  nextSession: string;
  status: 'active' | 'inactive' | 'completed';
  totalHours: number;
  completedLessons: number;
  totalLessons: number;
  averageGrade: number;
  strengths: string[];
  weaknesses: string[];
}

export default function TeacherStudentsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
  });

  const filteredStudents = students.filter(student => {
    if (!student || !student.name || !student.email) return false;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || student.level === levelFilter;
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('teacher.myStudents')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('teacher.trackStudentsProgress')}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('teacher.totalStudents')}</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('teacher.activeStudents')}</p>
                  <p className="text-2xl font-bold">
                    {students.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('teacher.avgProgress')}</p>
                  <p className="text-2xl font-bold">
                    {Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length || 0)}%
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('teacher.avgAttendance')}</p>
                  <p className="text-2xl font-bold">
                    {Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length || 0)}%
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('teacher.searchStudents')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('teacher.filterByLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.allLevels')}</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('teacher.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('teacher.active')}</SelectItem>
                  <SelectItem value="inactive">{t('teacher.inactive')}</SelectItem>
                  <SelectItem value="completed">{t('teacher.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('teacher.studentsOverview')} ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar>
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{student.name}</h3>
                        <Badge className={getStatusColor(student.status)}>
                          {t(`teacher.${student.status}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {student.course} • {student.level}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t('teacher.lastSession')}: {student.lastSession}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {student.totalHours}h {t('teacher.total')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('teacher.progress')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={student.progress} className="w-20" />
                        <span className="text-sm font-medium">{student.progress}%</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('teacher.attendance')}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getProgressColor(student.attendance)}`}></div>
                        <span className="text-sm font-medium">{student.attendance}%</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('teacher.grade')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{student.averageGrade}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('teacher.noStudentsFound')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? t('teacher.tryDifferentSearch') : t('teacher.noStudentsAssigned')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}