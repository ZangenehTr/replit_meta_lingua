import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Clock, Video, MessageSquare, FileText, Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { useLocation } from "wouter";
import { format, isWithinInterval, subMinutes, addMinutes } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

interface ClassSession {
  id: number;
  classId: number;
  scheduledStart: string;
  actualStartTime: string | null;
  status: string;
  startMethod: string | null;
}

function StartClassButton({ classId }: { classId: number }) {
  const queryClient = useQueryClient();

  const { data: session } = useQuery<ClassSession | null>({
    queryKey: [`/api/teacher/class-sessions/${classId}/upcoming`],
    refetchInterval: 30000,
  });

  const startMutation = useMutation({
    mutationFn: async (sessionId: number) =>
      apiRequest(`/api/teacher/class-sessions/${sessionId}/start`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Class started!", description: "The class has been marked as started." });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/class-sessions/${classId}/upcoming`] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Could not start class.", variant: "destructive" });
    },
  });

  if (!session) return null;

  if (session.status === "cancelled") {
    return (
      <Badge variant="outline" className="text-xs">Cancelled</Badge>
    );
  }

  if (session.status === "started" || session.actualStartTime) {
    return (
      <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
        Started ✓
      </Badge>
    );
  }

  const scheduled = new Date(session.scheduledStart);
  const now = new Date();
  const windowStart = subMinutes(scheduled, 15);
  const windowEnd = addMinutes(scheduled, 30);
  const inWindow = isWithinInterval(now, { start: windowStart, end: windowEnd });

  if (!inWindow) return null;

  return (
    <Button
      size="sm"
      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
      onClick={() => startMutation.mutate(session.id)}
      disabled={startMutation.isPending}
    >
      <Play className="h-3 w-3 me-1" />
      {startMutation.isPending ? "Starting…" : "Start Class"}
    </Button>
  );
}

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['teacher', 'common']);
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("active");

  const { data: classes, isLoading } = useQuery<TeacherClass[]>({
    queryKey: [API_ENDPOINTS.teacher.classes],
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
      <div className="w-full px-4 py-8">
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
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <StartClassButton classId={cls.id} />
                        <Button size="sm" className="flex-1">
                          <Video className="h-4 w-4 me-2" />
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
                          <FileText className="h-4 w-4 me-2" />
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
