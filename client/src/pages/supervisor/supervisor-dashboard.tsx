import { useState, useEffect, useCallback } from "react";
import { useSupervisorDashboardData, useSupervisorMutations, type ObservationFormValues } from "@/hooks/useSupervisorDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import DynamicForm from "@/components/forms/DynamicForm";
import { formatCurrency } from "@/lib/utils";
import { TeacherNameLink } from "@/components/ui/teacher-name-link";
import {
  Users, GraduationCap, ClipboardCheck, TrendingUp,
  UserCheck, Calendar, AlertTriangle, CheckCircle, Clock,
  Target, BookOpen, DollarSign, MessageSquare, Eye,
  UserMinus, AlertCircle, XCircle, ShieldCheck
} from "lucide-react";

import { ObservationDialog } from "@/components/supervisor/ObservationDialog";
import { TeachersAttentionDialog, StudentsAttentionDialog } from "@/components/supervisor/AttentionDialogs";
import { TeacherPerformanceGrid } from "@/components/supervisor/TeacherPerformanceGrid";

const observationSchema = z.object({
  sessionId: z.number().min(1, "Please select a session"),
  teacherId: z.number().min(1, "Please select a teacher"),
  observationType: z.enum(["live_online", "live_in_person"]),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  teachingMethodology: z.number().min(1).max(5),
  classroomManagement: z.number().min(1).max(5),
  studentEngagement: z.number().min(1).max(5),
  contentDelivery: z.number().min(1).max(5),
  languageSkills: z.number().min(1).max(5),
  timeManagement: z.number().min(1).max(5),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
});

const REASON_LABELS: Record<string, string> = {
  sick: "Sick / Illness",
  emergency: "Personal Emergency",
  conflict: "Schedule Conflict",
  weather: "Weather / Force Majeure",
  other: "Other",
};

export default function SupervisorDashboard() {
  const { t } = useTranslation(["supervisor", "common"]);
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [teachersAttentionDialogOpen, setTeachersAttentionDialogOpen] = useState(false);
  const [studentsAttentionDialogOpen, setStudentsAttentionDialogOpen] = useState(false);
  const [approvalModalRequest, setApprovalModalRequest] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: cancelRequests = [], isLoading: cancelLoading } = useQuery<any[]>({
    queryKey: ['/api/classes/cancel-requests', { status: 'pending' }],
    queryFn: async () => {
      const res = await fetch('/api/classes/cancel-requests?status=pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`/api/classes/cancel-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({})
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Approved", description: `Cancellation approved. ${data.smsCount || 0} SMS sent.` });
      setApprovalModalRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/classes/cancel-requests'] });
    },
    onError: (err: Error) => { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`/api/classes/cancel-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({})
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Cancellation request rejected. Requester notified." });
      setApprovalModalRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/classes/cancel-requests'] });
    },
    onError: (err: Error) => { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!approvalModalRequest) return;
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      if (!approveMutation.isPending) approveMutation.mutate(approvalModalRequest.request.id);
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (!rejectMutation.isPending) rejectMutation.mutate(approvalModalRequest.request.id);
    }
  }, [approvalModalRequest, approveMutation, rejectMutation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const { stats, teacherPerformance, allTeachers, pendingObservations, dailyIncome, teachersNeedingAttention, studentsNeedingAttention, upcomingSessions, businessIntelligence, targetFormDefinition, targetFormLoading, isLoading } = useSupervisorDashboardData(targetDialogOpen);

  const observationForm = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: { sessionId: 0, teacherId: 0, observationType: "live_online", scheduledDate: "", scheduledTime: "", teachingMethodology: 1, classroomManagement: 1, studentEngagement: 1, contentDelivery: 1, languageSkills: 1, timeManagement: 1, strengths: "", areasForImprovement: "", notes: "", followUpRequired: false },
  });

  const handleSessionSelection = (sessionId: string) => {
    const session = upcomingSessions.find((s) => s.id.toString() === sessionId);
    if (session) {
      const d = new Date(session.scheduledAt);
      observationForm.setValue("teacherId", session.teacherId);
      observationForm.setValue("scheduledDate", d.toISOString().split("T")[0]);
      observationForm.setValue("scheduledTime", d.toTimeString().slice(0, 5));
      observationForm.setValue("observationType", session.deliveryMode === "online" ? "live_online" : "live_in_person");
    }
  };

  const checkForDuplicate = async (sessionId: number, teacherId: number) => {
    try {
      const existing = await apiRequest(`/api/supervision/observations?sessionId=${sessionId}&teacherId=${teacherId}`);
      return existing && existing.length > 0;
    } catch { return false; }
  };

  const { createObservationMutation, setTargetMutation, sendTeacherAlert, sendStudentAlert } = useSupervisorMutations(
    observationForm,
    setObservationDialogOpen,
    setTargetDialogOpen,
  );
  const onObservationSubmit = async (data: ObservationFormValues) => {
    const isDuplicate = await checkForDuplicate(data.sessionId, data.teacherId);
    if (isDuplicate) { toast({ title: "Duplicate Observation", description: "An observation for this session already exists", variant: "destructive" }); return; }
    const scoreFields: (keyof ObservationFormValues)[] = ["teachingMethodology", "classroomManagement", "studentEngagement", "contentDelivery", "languageSkills", "timeManagement"];
    const overallScore = parseFloat((scoreFields.reduce((s, f) => s + (data[f] as number), 0) / scoreFields.length).toFixed(2));
    const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    createObservationMutation.mutate({ teacherId: data.teacherId, supervisorId: user?.id ?? 0, sessionId: data.sessionId, observationType: data.observationType, observationDate: dt.toISOString(), overallScore, strengths: data.strengths || "", areasForImprovement: data.areasForImprovement || "", notes: data.notes || "", followUpRequired: data.followUpRequired || false });
  };
  const handleTargetSubmit = async (data: Record<string, unknown>) => {
    return setTargetMutation.mutateAsync({ ...data, supervisorId: user?.id ?? 0, createdDate: new Date().toISOString(), status: "active" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("supervisor:welcome", "Welcome")}, {user?.firstName || "Supervisor"}! 🔍</h1>
              <p className="opacity-90">{t("supervisor:welcomeMessage", "Monitor excellence, guide success, and ensure quality education!")}</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t("supervisor:totalTeachers", "Total Teachers")}</p>
                <p className="text-xl font-bold">👩‍🏫 {stats?.totalTeachers || 0}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t("supervisor:qualityScore", "Quality Score")}</p>
                <p className="text-xl font-bold">📊 {stats?.qualityScore || 95}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("supervisor:dashboard.title")}</h1>
            <p className="text-gray-600 mt-2">{t("supervisor:dashboard.welcomeMessage")}</p>
          </div>
          <div className="flex space-x-3">
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" onClick={() => setObservationDialogOpen(true)}>
              <ClipboardCheck className="h-4 w-4 me-2" />{t("common:supervisor.scheduleObservation")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: t("common:supervisor.teachers"), value: stats?.totalTeachers || 0, icon: Users, gradient: "from-blue-500 to-blue-600", iconClass: "text-blue-200" },
            { label: "مجموع دانش‌آموزان", value: stats?.totalStudents || 0, icon: GraduationCap, gradient: "from-green-500 to-green-600", iconClass: "text-green-200" },
            { label: t("common:supervisor.pendingReviews"), value: pendingObservations.length || 0, icon: ClipboardCheck, gradient: "from-purple-500 to-purple-600", iconClass: "text-purple-200" },
          ].map(({ label, value, icon: Icon, gradient, iconClass }) => (
            <Card key={label} className={`bg-gradient-to-br ${gradient} text-white`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div><p className={`${iconClass.replace("200", "100")}`}>{label}</p><p className="text-3xl font-bold">{value}</p></div>
                  <Icon className={`h-8 w-8 ${iconClass}`} />
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white cursor-pointer hover:from-red-600 hover:to-red-700 transition-all" onClick={() => setTeachersAttentionDialogOpen(true)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-red-100">{t("common:supervisor.improvementNeeded")}</p><p className="text-3xl font-bold">{teachersNeedingAttention?.length || 0}</p></div>
                <UserMinus className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white cursor-pointer hover:from-amber-600 hover:to-amber-700 transition-all" onClick={() => setStudentsAttentionDialogOpen(true)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-amber-100">{t("common:supervisor.studentsNeedingAttention")}</p><p className="text-3xl font-bold">{studentsNeedingAttention?.length || 0}</p></div>
                <AlertCircle className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t("dashboard.overview", { ns: "common" })}</TabsTrigger>
            <TabsTrigger value="teachers">{t("supervisor:evaluations.performance")}</TabsTrigger>
            <TabsTrigger value="cancellations" className="relative">
              Cancellations
              {cancelRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cancelRequests.length > 9 ? '9+' : cancelRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><TrendingUp className="h-5 w-5 me-2 text-blue-600" />Business Intelligence</CardTitle><CardDescription>Key performance indicators</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      {businessIntelligence?.monthlyRevenue > 0 ? (
                        <><div className="text-2xl font-bold text-green-700">{businessIntelligence.monthlyRevenue.toLocaleString()}</div><div className="text-xs text-green-600">Monthly Revenue</div></>
                      ) : (
                        <><div className="text-2xl font-bold text-gray-400">No Data</div><div className="text-xs text-gray-500">Monthly Revenue</div></>
                      )}
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-700">{businessIntelligence?.studentEngagementRate || 0}%</div>
                      <div className="text-xs text-blue-600">Student Engagement</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50">
                      <div className="text-2xl font-bold text-purple-700">{businessIntelligence?.sessionCompletionRate || 0}%</div>
                      <div className="text-xs text-purple-600">Session Completion</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-50">
                      <div className="text-2xl font-bold text-orange-700">{businessIntelligence?.teacherQualityScore || 0}/5.0</div>
                      <div className="text-xs text-orange-600">Teaching Quality</div>
                    </div>
                  </div>
                  <div className="flex justify-center pt-2">
                    <Badge variant={businessIntelligence?.qualityTrend === "improving" ? "default" : "secondary"} className={businessIntelligence?.qualityTrend === "improving" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                      Quality Trend: {businessIntelligence?.qualityTrend?.replace("_", " ") || "stable"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center"><TrendingUp className="h-5 w-5 me-2 text-indigo-600" />{t("supervisor:dashboard.iranianMarketKPIs")}</CardTitle><CardDescription>{t("supervisor:dashboard.localMarketIndicators")}</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      ["Revenue per Student", businessIntelligence?.avgRevenuePerStudent > 0 ? formatCurrency(businessIntelligence.avgRevenuePerStudent, "IRR") : "No payments"],
                      ["Weekly Active Students", `${businessIntelligence?.weeklyActiveStudents || 0} students`],
                      ["Monthly Sessions", `${businessIntelligence?.monthlyCompletedSessions || 0} completed`],
                      ["Total Enrolled", `${businessIntelligence?.totalStudents || 0} students`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 space-y-2">
                    {[["Student Engagement", businessIntelligence?.studentEngagementRate || 0, "bg-blue-500"], ["Session Success Rate", businessIntelligence?.sessionCompletionRate || 0, "bg-green-500"]].map(([label, pct, color]) => (
                      <div key={label as string}>
                        <div className="flex justify-between text-xs mb-1"><span>{label as string}</span><span>{pct as number}%</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-2"><div className={`${color as string} h-2 rounded-full`} style={{ width: `${Math.min(100, pct as number)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center"><ClipboardCheck className="h-5 w-5 me-2 text-orange-600" />{t("supervisor:observations.title")}</CardTitle><CardDescription>{t("supervisor:observations.approvedClasses")}</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {pendingObservations.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{t("supervisor:observations.noPending")}</p>
                    </div>
                  ) : pendingObservations.slice(0, 4).map((obs) => (
                    <div key={obs.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate"><TeacherNameLink teacherId={obs.teacherId} fullName={obs.teacherName} variant="subtle" /> - {obs.className}</div>
                        <div className="text-xs text-gray-500">{new Date(obs.scheduledDate).toLocaleDateString()} • {obs.observationType}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">{obs.priority}</Badge>
                    </div>
                  ))}
                  {pendingObservations.length > 4 && (
                    <div className="text-center pt-2"><Button variant="link" className="text-xs h-auto p-0">{t("supervisor:observations.viewAll")} {pendingObservations.length - 4} {t("supervisor:observations.more")}</Button></div>
                  )}
                </CardContent>
              </Card>
            </div>

            {dailyIncome && (
              <Card>
                <CardHeader><CardTitle className="flex items-center"><DollarSign className="h-5 w-5 me-2 text-green-600" />{t("supervisor:dashboard.dailyIncomeByCategory")}</CardTitle><CardDescription>{t("supervisor:dashboard.revenueBreakdown")} - {new Date().toLocaleDateString()}</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Online Group", key: "onlineGroup", bg: "bg-blue-50", text: "text-blue-600", bold: "text-blue-800" },
                      { label: "Online 1-on-1", key: "onlineOneOnOne", bg: "bg-purple-50", text: "text-purple-600", bold: "text-purple-800" },
                      { label: "In-Person Group", key: "inPersonGroup", bg: "bg-orange-50", text: "text-orange-600", bold: "text-orange-800" },
                      { label: "In-Person 1-on-1", key: "inPersonOneOnOne", bg: "bg-red-50", text: "text-red-600", bold: "text-red-800" },
                      { label: "Callern", key: "callern", bg: "bg-teal-50", text: "text-teal-600", bold: "text-teal-800" },
                    ].map(({ label, key, bg, text, bold }) => (
                      <div key={key} className={`text-center p-4 ${bg} rounded-lg border`}>
                        <div className={`text-sm ${text} font-medium`}>{label}</div>
                        <div className={`text-2xl font-bold ${bold}`}>{dailyIncome.categories?.[key]?.students || 0}</div>
                        <div className="text-xs text-gray-500">students</div>
                        <div className="text-sm font-semibold text-green-600 mt-1">{formatCurrency(dailyIncome.categories?.[key]?.revenue || 0, "IRR")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Total Daily Revenue:</span>
                    <span className="text-2xl font-bold text-green-700">{formatCurrency(dailyIncome.totalRevenue || 0, "IRR")}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <TeacherPerformanceGrid
              teacherPerformance={teacherPerformance || []}
              onScheduleObservation={(id) => { observationForm.setValue("teacherId", id); setObservationDialogOpen(true); }}
            />
          </TabsContent>

          <TabsContent value="cancellations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Cancellation Requests
                </CardTitle>
                <CardDescription>
                  Review and act on emergency class cancellation requests. Use <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">A</kbd> to approve, <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">R</kbd> to reject when a request is open.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cancelLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : cancelRequests.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400" />
                    <p className="font-medium">No pending cancellation requests</p>
                    <p className="text-sm mt-1">All clear! Classes are proceeding as scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cancelRequests.map((item: any) => {
                      const req = item.request;
                      const session = item.session;
                      const requester = item.requester;
                      const isUrgent = req.isLessThan30Min;
                      return (
                        <div
                          key={req.id}
                          className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">
                                Session #{req.classSessionId}
                              </span>
                              {isUrgent && (
                                <Badge variant="destructive" className="text-xs">⚡ &lt;30 min</Badge>
                              )}
                              <Badge variant="outline" className="text-xs capitalize">{req.requesterRole}</Badge>
                              {req.studentRequestCount > 1 && (
                                <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                  {req.studentRequestCount} students
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">{requester?.firstName} {requester?.lastName}</span>
                              {" — "}{REASON_LABELS[req.reasonCategory] || req.reasonCategory}
                              {req.reasonText && <span className="text-gray-500"> · {req.reasonText}</span>}
                            </p>
                            {session?.sessionDate && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                <Clock className="h-3 w-3 inline me-1" />
                                {new Date(session.sessionDate).toLocaleDateString()} {session.startTime || ''}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => setApprovalModalRequest(item)}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancellation Approval Modal */}
        <Dialog open={!!approvalModalRequest} onOpenChange={() => setApprovalModalRequest(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Review Cancellation Request
              </DialogTitle>
            </DialogHeader>
            {approvalModalRequest && (() => {
              const req = approvalModalRequest.request;
              const session = approvalModalRequest.session;
              const requester = approvalModalRequest.requester;
              return (
                <div className="space-y-3 py-2">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Session</span>
                      <span className="font-medium">#{req.classSessionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Requested by</span>
                      <span className="font-medium capitalize">{requester?.firstName} {requester?.lastName} ({req.requesterRole})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reason</span>
                      <span className="font-medium">{REASON_LABELS[req.reasonCategory] || req.reasonCategory}</span>
                    </div>
                    {session?.sessionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Session date</span>
                        <span className="font-medium">{new Date(session.sessionDate).toLocaleDateString()} {session.startTime || ''}</span>
                      </div>
                    )}
                    {req.studentRequestCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Student requests</span>
                        <span className="font-medium">{req.studentRequestCount}</span>
                      </div>
                    )}
                    {req.isLessThan30Min && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Class starts in less than 30 minutes!</span>
                      </div>
                    )}
                    {req.reasonText && (
                      <div>
                        <span className="text-gray-500">Details</span>
                        <p className="mt-1 text-gray-800">{req.reasonText}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Approving will cancel the session, set chatroom to read-only, and send SMS to all enrolled students.
                  </p>
                </div>
              );
            })()}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => approvalModalRequest && rejectMutation.mutate(approvalModalRequest.request.id)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                <XCircle className="h-4 w-4 me-1" />
                Reject <kbd className="ms-1 px-1 text-xs bg-gray-100 border rounded opacity-60">R</kbd>
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => approvalModalRequest && approveMutation.mutate(approvalModalRequest.request.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin me-2" />Approving...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 me-1" />Approve <kbd className="ms-1 px-1 text-xs bg-green-500 border border-green-400 rounded opacity-80">A</kbd></>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ObservationDialog
          open={observationDialogOpen}
          onOpenChange={setObservationDialogOpen}
          form={observationForm}
          onSubmit={onObservationSubmit}
          isPending={createObservationMutation.isPending}
          upcomingSessions={upcomingSessions}
          allTeachers={allTeachers || []}
          onSessionSelection={handleSessionSelection}
        />

        <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Set Monthly/Seasonal Targets</DialogTitle></DialogHeader>
            {targetFormLoading ? (
              <div className="py-8 text-center">Loading form...</div>
            ) : targetFormDefinition ? (
              <>
                <DynamicForm formDefinition={targetFormDefinition} onSubmit={handleTargetSubmit} disabled={setTargetMutation.isPending} showTitle={false} />
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900">Automatic Target Setting</h4>
                    <p className="text-sm text-green-800 mt-1">These targets will be automatically tracked with progress notifications.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-red-600">Failed to load form definition</div>
            )}
          </DialogContent>
        </Dialog>

        <TeachersAttentionDialog
          open={teachersAttentionDialogOpen}
          onOpenChange={setTeachersAttentionDialogOpen}
          teachers={teachersNeedingAttention}
          onScheduleReview={(id) => { setTeachersAttentionDialogOpen(false); window.location.href = `/supervisor/schedule-review?teacher=${id}`; }}
          onSendAlert={(teacher) => sendTeacherAlert.mutate({ teacherId: teacher.id, issue: teacher.reason })}
          isSending={sendTeacherAlert.isPending}
        />

        <StudentsAttentionDialog
          open={studentsAttentionDialogOpen}
          onOpenChange={setStudentsAttentionDialogOpen}
          students={studentsNeedingAttention}
          onViewProfile={() => setLocation("/admin/students")}
          onSendAlert={(student) => sendStudentAlert.mutate({ studentId: student.id, issue: `${student.issue} concerns`, teacherName: student.teacher })}
          isSending={sendStudentAlert.isPending}
        />
      </div>
    </div>
  );
}
