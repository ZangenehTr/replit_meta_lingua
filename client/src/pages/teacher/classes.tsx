import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Clock, Video, MessageSquare, FileText, Settings, Phone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useLocation } from "wouter";
import { format } from "date-fns";

interface TeacherClass {
  id: number;
  courseId: number;
  title: string;
  description: string;
  level: string;
  studentCount: number;
  maxStudents: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  schedule: string;
  course: {
    title: string;
    language: string;
  };
  students: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    progress: number;
  }>;
}

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['teacher', 'common']);
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("active");

  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/teacher/classes'],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('common:ui.loading')}</p>
        </div>
      </div>
    );
  }

  const activeClasses = classes?.filter((cls: TeacherClass) => cls.status === 'active') || [];
  const completedClasses = classes?.filter((cls: TeacherClass) => cls.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('teacher:classes.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('teacher:classes.subtitle')}
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">{t('common:active')} ({activeClasses.length})</TabsTrigger>
            <TabsTrigger value="completed">{t('common:completed')} ({completedClasses.length})</TabsTrigger>
            <TabsTrigger value="upcoming">{t('common:upcoming')} (0)</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeClasses.map((cls: TeacherClass) => (
                <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {cls.course.title} • {cls.level}
                        </p>
                      </div>
                      <Badge variant="default">{cls.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        <span>{cls.studentCount}/{cls.maxStudents} students</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{cls.schedule}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Video className="h-4 w-4 mr-2" />
                          Join Class
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {completedClasses.map((cls: TeacherClass) => (
                <Card key={cls.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Completed on {cls.endDate ? format(new Date(cls.endDate), 'MMM d, yyyy') : 'Date unavailable'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming classes scheduled</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}