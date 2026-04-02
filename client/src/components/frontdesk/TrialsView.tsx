import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CheckCircle, Clock, Award, Phone, MessageSquare, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TrialLessonCalendar } from "@/components/trial-lessons/TrialLessonCalendar";
import { TeacherNameLink } from "@/components/ui/teacher-name-link";

interface TrialLesson { id: number; studentName: string; studentPhone: string; studentEmail?: string; language: string; level: string; scheduledDate: string; scheduledTime: string; duration: number; teacherId: number; teacherName: string; status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"; location: string; type: "in_person" | "online"; notes?: string; }

interface Props { todayTrials: TrialLesson[]; dashboardStats: { todayTrialsCount: number; confirmedTrials: number; }; formatTime: (d: Date | string) => string; getStatusColor: (s: string) => string; }

export function TrialsView({ todayTrials, dashboardStats, formatTime, getStatusColor }: Props) {
  const { t } = useTranslation(['frontdesk']);

  const pendingCount = todayTrials.filter(t => t.status === "scheduled").length;
  const attendanceRate = todayTrials.length > 0 ? Math.round((todayTrials.filter(t => t.status === "completed").length / todayTrials.length) * 100) : 0;

  const trialStats = [
    [t('frontdesk:trials.totalToday'), dashboardStats.todayTrialsCount, "", Calendar],
    [t('frontdesk:trials.confirmed'), dashboardStats.confirmedTrials, "text-green-600", CheckCircle],
    [t('frontdesk:tasks.pending'), pendingCount, "text-yellow-600", Clock],
    [t('frontdesk:trials.attendanceRate'), `${attendanceRate}%`, "text-purple-600", Award],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">{t('frontdesk:trials.trialLessons')}</h2><p className="text-gray-600 dark:text-gray-400">{t('frontdesk:trials.manageTrialSchedule')}</p></div>
        <Button><Plus className="h-4 w-4 me-2" />{t('frontdesk:trials.newTrialLesson')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {trialStats.map(([label, value, cls, Icon]: any) => (
          <Card key={label as string}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{label as string}</p><p className={`text-2xl font-bold ${cls}`}>{value}</p></div><Icon className="h-8 w-8 text-blue-500 opacity-70" /></div></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><TrialLessonCalendar /></div>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>{t('frontdesk:trials.todaysLessons')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(todayTrials) && todayTrials.map((trial) => (
                  <div key={trial.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2"><h4 className="font-medium">{trial.studentName}</h4><Badge className={getStatusColor(trial.status)}>{trial.status}</Badge></div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{trial.language} • {trial.level}</p>
                      <p><TeacherNameLink teacherId={trial.teacherId} fullName={trial.teacherName} variant="subtle" /></p>
                      <p>{formatTime(trial.scheduledTime)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm" variant="outline"><Phone className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline"><MessageSquare className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline"><Edit className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                {todayTrials.length === 0 && <div className="text-center py-8 text-gray-500"><Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{t('frontdesk:emptyStates.noTrialsToday')}</p></div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
