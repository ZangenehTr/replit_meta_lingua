import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { TeacherNameLink } from "@/components/ui/teacher-name-link";
import { formatCurrency } from "@/lib/utils";
import { Phone, Users, CheckCircle, XCircle, Plus, Settings, Shield, Sparkles, BookOpen, Languages, Mic, Video, Bell, TrendingUp, Edit, Trash2 } from "lucide-react";

const TIME_SLOTS = [
  { id: "morning", label: "Morning (08:00-12:00)", range: "08:00-12:00" },
  { id: "afternoon", label: "Afternoon (12:00-18:00)", range: "12:00-18:00" },
  { id: "evening", label: "Evening (18:00-24:00)", range: "18:00-24:00" },
  { id: "overnight", label: "Overnight (00:00-08:00)", range: "00:00-08:00" },
];

const AI_TESTS = [
  { label: "Test AI Word Helper", url: "/api/callern/ai/test/word-helper", body: { context: "We are discussing travel plans", level: "B1" }, icon: BookOpen, className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white" },
  { label: "Test Grammar Check", url: "/api/callern/ai/test/grammar-check", body: { text: "I have went to the store yesterday" }, icon: CheckCircle, className: "bg-gradient-to-r from-green-600 to-teal-600 text-white" },
  { label: "Test Translation", url: "/api/callern/ai/test/translate", body: { text: "Hello, how are you today?", targetLanguage: "fa" }, icon: Languages, className: "bg-gradient-to-r from-orange-600 to-red-600 text-white" },
  { label: "Test Pronunciation", url: "/api/callern/ai/test/pronunciation", body: { word: "entrepreneur" }, icon: Mic, className: "bg-gradient-to-r from-pink-600 to-purple-600 text-white" },
];

interface TeacherAvailability { id: number; teacherId: number; teacherName: string; teacherLastName?: string; teacherEmail?: string; isOnline: boolean; hourlyRate?: number; availableHours?: string[]; }
interface AvailableTeacher { id: number; firstName: string; lastName: string; }
interface CallernPackage { id: number; packageName: string; totalHours: number; price: number; description?: string; isActive: boolean; roadmapId?: number; }
interface Roadmap { id: number; roadmapName: string; estimatedHours: number; }

const runAiTest = async (url: string, body: Record<string, unknown>, label: string) => {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    alert(`${label}:\n${JSON.stringify(data, null, 2)}`);
  } catch (e) { alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`); }
};

export function CallernManagement() {
  const { t } = useTranslation(["admin", "common"]);
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAvailability | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);
  const [isEditPackageDialogOpen, setIsEditPackageDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);
  const [newTeacherForm, setNewTeacherForm] = useState({ teacherId: "", hourlyRate: "", availableHours: [] as string[] });
  const [newPackageForm, setNewPackageForm] = useState({ packageName: "", roadmapId: "", price: "", description: "", isActive: true });
  const [editPackageForm, setEditPackageForm] = useState({ id: 0, packageName: "", totalHours: "", price: "", description: "", isActive: true });

  const authHeaders = { Authorization: `Bearer ${localStorage.getItem("auth_token")}`, "Content-Type": "application/json" };
  const fetchJSON = (url: string) => fetch(url, { headers: authHeaders }).then((r) => { if (!r.ok) throw new Error(`Failed: ${r.status}`); return r.json(); });

  const { data: teacherAvailability, isLoading: loadingAvailability } = useQuery<TeacherAvailability[]>({ queryKey: ["/api/admin/callern/teacher-availability"], queryFn: () => fetchJSON("/api/admin/callern/teacher-availability") });
  const { data: availableTeachers, isLoading: loadingTeachers } = useQuery<AvailableTeacher[]>({ queryKey: ["/api/admin/callern/available-teachers"], queryFn: () => fetchJSON("/api/admin/callern/available-teachers") });
  const { data: callernPackages, isLoading: loadingPackages } = useQuery<CallernPackage[]>({ queryKey: ["/api/admin/callern/packages"], queryFn: () => fetchJSON("/api/admin/callern/packages") });
  const { data: roadmaps, isLoading: loadingRoadmaps } = useQuery<Roadmap[]>({ queryKey: ["/api/roadmaps"], queryFn: () => fetchJSON("/api/roadmaps") });
  const { data: followersDashboard = [], isLoading: loadingFollowers } = useQuery<Array<{ teacherId: number; teacherName: string; profileImageUrl?: string; followerCount: number }>>({ queryKey: ["/api/teachers/admin/followers-dashboard"], staleTime: 60000 });

  interface UpdateAvailabilityPayload { hourlyRate?: number | null; availableHours?: string[]; isOnline?: boolean; }
  interface AddTeacherPayload { teacherId: string; hourlyRate: number | null; availableHours: string[]; }
  interface CreatePackagePayload { packageName: string; roadmapId: number; totalHours: number; price: number; description: string; isActive: boolean; }
  interface UpdatePackagePayload { id: number; packageName: string; totalHours: number; price: number; description: string; isActive: boolean; }

  const onMutationError = (e: unknown) => toast({ title: t("common:toast.error"), description: e instanceof Error ? e.message : "An error occurred", variant: "destructive" });

  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ teacherId, updates }: { teacherId: number; updates: UpdateAvailabilityPayload }) => apiRequest(`/api/admin/callern/teacher-availability/${teacherId}`, { method: "PUT", body: updates }),
    onSuccess: () => { toast({ title: t("common:toast.success"), description: t("common:toast.availabilityUpdated") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/callern/teacher-availability"] }); },
    onError: onMutationError,
  });
  const addTeacherMutation = useMutation({
    mutationFn: (data: AddTeacherPayload) => apiRequest("/api/admin/callern/teacher-availability", { method: "POST", body: data }),
    onSuccess: () => { toast({ title: t("common:toast.success"), description: t("common:toast.teacherAddedToCallern") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/callern/teacher-availability"] }); setIsAddDialogOpen(false); setNewTeacherForm({ teacherId: "", hourlyRate: "", availableHours: [] }); },
    onError: onMutationError,
  });
  const createPackageMutation = useMutation({
    mutationFn: (data: CreatePackagePayload) => apiRequest("/api/admin/callern/packages", { method: "POST", body: data }),
    onSuccess: () => { toast({ title: t("common:toast.success") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/callern/packages"] }); setIsCreatePackageDialogOpen(false); setNewPackageForm({ packageName: "", roadmapId: "", price: "", description: "", isActive: true }); },
    onError: onMutationError,
  });
  const updatePackageMutation = useMutation({
    mutationFn: (data: UpdatePackagePayload) => apiRequest(`/api/admin/callern/packages/${data.id}`, { method: "PUT", body: data }),
    onSuccess: () => { toast({ title: t("common:toast.success") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/callern/packages"] }); setIsEditPackageDialogOpen(false); },
    onError: onMutationError,
  });
  const deletePackageMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/callern/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: t("common:toast.success") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/callern/packages"] }); setPackageToDelete(null); },
    onError: onMutationError,
  });
  const startVideoCallMutation = useMutation({
    mutationFn: (teacherId: number) => apiRequest("/api/callern/admin/start-session", { method: "POST", body: { teacherId } }),
    onSuccess: (data: { sessionId: number }) => { window.location.href = `/callern/video/${data.sessionId}`; },
    onError: onMutationError,
  });

  const normalizedRole = user?.role?.toLowerCase();
  if (user && !["admin", "supervisor"].includes(normalizedRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center"><CardHeader><CardTitle className="text-red-600">{t("admin:callernManagement.accessDenied")}</CardTitle><CardDescription>{t("admin:callernManagement.adminSupervisorOnly")}</CardDescription></CardHeader>
          <CardContent><Button variant="outline" className="mt-4" onClick={() => (window.location.href = "/login")}>{t("admin:callernManagement.switchAccount")}</Button></CardContent>
        </Card>
      </div>
    );
  }

  const toggleHour = (range: string) => setNewTeacherForm((p) => ({ ...p, availableHours: p.availableHours.includes(range) ? p.availableHours.filter((h) => h !== range) : [...p.availableHours, range] }));
  const handleAddTeacher = () => {
    if (!newTeacherForm.teacherId) { toast({ title: t("common:toast.error"), description: t("common:toast.selectTeacher"), variant: "destructive" }); return; }
    addTeacherMutation.mutate({ teacherId: newTeacherForm.teacherId, hourlyRate: newTeacherForm.hourlyRate ? parseFloat(newTeacherForm.hourlyRate) : null, availableHours: newTeacherForm.availableHours });
  };
  const handleCreatePackage = () => {
    if (!newPackageForm.packageName || !newPackageForm.roadmapId || !newPackageForm.price) { toast({ title: t("common:toast.error"), description: "Please fill all required fields", variant: "destructive" }); return; }
    const roadmap = roadmaps?.find((r) => r.id.toString() === newPackageForm.roadmapId);
    createPackageMutation.mutate({ packageName: newPackageForm.packageName, roadmapId: parseInt(newPackageForm.roadmapId), totalHours: Math.round(roadmap?.estimatedHours || 0), price: parseFloat(newPackageForm.price), description: newPackageForm.description, isActive: newPackageForm.isActive });
  };
  const handleUpdatePackage = () => {
    if (!editPackageForm.packageName || !editPackageForm.totalHours || !editPackageForm.price) { toast({ title: t("common:toast.error"), description: t("admin:callernManagement.fillRequiredFields"), variant: "destructive" }); return; }
    updatePackageMutation.mutate({ id: editPackageForm.id, packageName: editPackageForm.packageName, totalHours: parseInt(editPackageForm.totalHours), price: parseFloat(editPackageForm.price), description: editPackageForm.description, isActive: editPackageForm.isActive });
  };
  const handleConfigSave = () => {
    if (!selectedTeacher) return;
    const hourlyRate = (document.getElementById("config-hourly-rate") as HTMLInputElement)?.value;
    const hours = TIME_SLOTS.filter((s) => (document.getElementById(`config-${s.id}`) as HTMLInputElement)?.checked).map((s) => s.range);
    updateAvailabilityMutation.mutate({ teacherId: selectedTeacher.teacherId, updates: { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null, availableHours: hours } });
    setIsConfigDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{t("admin:callernManagement.title")}</h1><p className="text-muted-foreground mt-2">{t("admin:callernManagement.subtitle")}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 border-purple-200"><Phone className="h-3 w-3" /><span>{Array.isArray(teacherAvailability) ? teacherAvailability.filter((ta) => ta.isOnline).length : 0} {t("admin:callernManagement.online")}</span></Badge>
          <Badge variant="outline" className="flex items-center gap-1 border-indigo-200"><Users className="h-3 w-3" /><span>{Array.isArray(teacherAvailability) ? teacherAvailability.length : 0} {t("common:total")}</span></Badge>
        </div>
      </div>

      {/* AI Test Panel */}
      <Card className="border-purple-200"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" />AI Integration Test Panel</CardTitle><CardDescription>Test the AI features for Callern video calls</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" className="col-span-full mb-2" onClick={() => runAiTest("/api/callern/ai/test", {}, "AI Connection Test")}><CheckCircle className="w-4 h-4 me-2" />Test AI Connection</Button>
            {AI_TESTS.map(({ label, url, body, icon: Icon, className }) => (
              <Button key={label} onClick={() => runAiTest(url, body, label)} className={className}><Icon className="w-4 h-4 me-2" />{label}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="availability" className="text-xs sm:text-sm">{t("admin:callernManagement.teacherAvailability")}</TabsTrigger>
          <TabsTrigger value="packages" className="text-xs sm:text-sm">{t("admin:callernManagement.callernPackages")}</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">{t("admin:callernManagement.teacherManagement")}</TabsTrigger>
          <TabsTrigger value="followers" className="text-xs sm:text-sm gap-1"><Bell className="h-3 w-3" />دنبال‌کننده‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAvailability ? <div className="col-span-3 text-center py-8">{t("common:loading")}</div> : Array.isArray(teacherAvailability) ? teacherAvailability.map((teacher) => (
              <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div><CardTitle className="text-lg">{teacher.teacherName} {teacher.teacherLastName}</CardTitle><CardDescription>{teacher.teacherEmail}</CardDescription></div>
                    <div className="flex items-center gap-2">{teacher.isOnline ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}<Badge className={teacher.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{teacher.isOnline ? t("admin:callernManagement.online") : t("admin:callernManagement.offline")}</Badge></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-sm font-medium">{t("admin:callernManagement.toggleOnlineStatus")}</Label>
                    <Switch checked={teacher.isOnline} onCheckedChange={() => updateAvailabilityMutation.mutate({ teacherId: teacher.teacherId, updates: { isOnline: !teacher.isOnline } })} disabled={updateAvailabilityMutation.isPending} />
                  </div>
                  {teacher.hourlyRate && <div className="text-sm flex items-center gap-1"><span className="text-gray-500">{t("admin:callernManagement.hourlyRate")}:</span><span className="font-medium">{teacher.hourlyRate} IRR</span></div>}
                  <div className="flex flex-wrap gap-1">{teacher.availableHours?.map((h: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>)}</div>
                  <div className="flex gap-2">
                    {teacher.isOnline && <Button variant="default" size="sm" className="flex-1" disabled={startVideoCallMutation.isPending} onClick={() => startVideoCallMutation.mutate(teacher.teacherId)}><Video className="h-3 w-3" /><span>{t("admin:callernManagement.startVideoCall")}</span></Button>}
                    <Button variant="outline" size="sm" className={teacher.isOnline ? "flex-1" : "w-full"} onClick={() => { setSelectedTeacher(teacher); setIsConfigDialogOpen(true); }}><Settings className="h-3 w-3" /><span>{t("admin:callernManagement.configure")}</span></Button>
                  </div>
                </CardContent>
              </Card>
            )) : <div className="col-span-3 text-center py-8 text-muted-foreground">{t("admin:callernManagement.noAvailabilityData")}</div>}
          </div>
          <Card className="border-dashed"><CardContent className="flex items-center justify-center py-8">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild><Button variant="ghost" className="flex items-center gap-2"><Plus className="h-4 w-4" />{t("admin:callernManagement.addTeacherToCallern")}</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>{t("admin:callernManagement.addTeacherToCallern")}</DialogTitle><DialogDescription>{t("admin:callernManagement.enableForOnDemandCalls")}</DialogDescription></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>{t("admin:callernManagement.selectATeacher")}</Label>
                    <Select value={newTeacherForm.teacherId} onValueChange={(v) => setNewTeacherForm((p) => ({ ...p, teacherId: v }))}>
                      <SelectTrigger><SelectValue placeholder={t("admin:callernManagement.chooseTeacher")} /></SelectTrigger>
                      <SelectContent>{loadingTeachers ? <SelectItem value="loading" disabled>{t("admin:callernManagement.loadingTeachers")}</SelectItem> : Array.isArray(availableTeachers) && availableTeachers.length > 0 ? availableTeachers.map((at) => <SelectItem key={at.id} value={at.id.toString()}>{at.firstName} {at.lastName}</SelectItem>) : <SelectItem value="none" disabled>{t("admin:callernManagement.noTeachersAvailable")}</SelectItem>}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{t("admin:callernManagement.hourlyRate")} (IRR)</Label><Input type="number" placeholder="500000" value={newTeacherForm.hourlyRate} onChange={(e) => setNewTeacherForm((p) => ({ ...p, hourlyRate: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{t("admin:callernManagement.availableHours")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_SLOTS.map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <input type="checkbox" id={`add-${s.id}`} checked={newTeacherForm.availableHours.includes(s.range)} onChange={(e) => toggleHour(s.range)} />
                          <Label htmlFor={`add-${s.id}`} className="text-sm">{s.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleAddTeacher} disabled={addTeacherMutation.isPending}>{addTeacherMutation.isPending ? t("common:loading") : t("admin:callernManagement.addTeacher")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card><CardHeader><div className="flex justify-between items-center"><div><CardTitle>{t("admin:callernManagement.callernPackages")}</CardTitle><CardDescription>{t("admin:callernManagement.managePackages")}</CardDescription></div>
            <Button className="flex items-center gap-2" onClick={() => setIsCreatePackageDialogOpen(true)}><Plus className="h-4 w-4" />{t("admin:callernManagement.createPackage")}</Button>
          </div></CardHeader></Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingPackages ? <div className="col-span-3 text-center py-8">{t("common:loading")}</div> : Array.isArray(callernPackages) && callernPackages.length > 0 ? callernPackages.map((pkg) => (
              <Card key={pkg.id}><CardHeader>
                <div className="flex justify-between items-start">
                  <div><CardTitle className="text-lg">{pkg.packageName}</CardTitle><CardDescription>{pkg.description}</CardDescription></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditPackageForm({ id: pkg.id, packageName: pkg.packageName, totalHours: pkg.totalHours.toString(), price: pkg.price.toString(), description: pkg.description || "", isActive: pkg.isActive }); setIsEditPackageDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => setPackageToDelete(pkg.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-gray-500">{t("admin:callernManagement.hours")}:</span><span className="font-medium">{pkg.totalHours}h</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{t("admin:callernManagement.price")}:</span><span className="font-medium">{formatCurrency(pkg.price, "IRR")}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{t("admin:callernManagement.status")}:</span><Badge className={pkg.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{pkg.isActive ? t("admin:callernManagement.active") : t("admin:callernManagement.inactive")}</Badge></div>
              </CardContent></Card>
            )) : <div className="col-span-3 text-center py-8 text-muted-foreground">{t("admin:callernManagement.noPackagesAvailable")}</div>}
          </div>
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />دنبال‌کنندگان CallerN</CardTitle><CardDescription>آمار دانش‌آموزانی که مدرسان CallerN را دنبال می‌کنند</CardDescription></CardHeader>
            <CardContent>
              {loadingFollowers ? <div className="text-center py-8">در حال بارگذاری...</div> : followersDashboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>هنوز هیچ مدرسی دنبال‌کننده ندارد</p></div>
              ) : (
                <div className="space-y-3">{followersDashboard.map((row, i) => (
                  <div key={row.teacherId} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-bold text-muted-foreground w-8 text-center">{i + 1}</span>
                    {row.profileImageUrl ? <img src={row.profileImageUrl} alt={row.teacherName} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{row.teacherName[0]}</div>}
                    <div className="flex-1"><p className="font-medium"><TeacherNameLink teacherId={row.teacherId} fullName={row.teacherName} variant="subtle" /></p><p className="text-xs text-muted-foreground">مدرس CallerN</p></div>
                    <div className="flex items-center gap-2 text-blue-700 font-bold"><Users className="h-4 w-4" /><span>{row.followerCount}</span><span className="text-xs font-normal text-muted-foreground">دنبال‌کننده</span></div>
                    {i === 0 && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><TrendingUp className="h-3 w-3 me-1" />پرطرفدار</Badge>}
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Overnight Duty Assignments</CardTitle><CardDescription>Manage teacher assignments for 24/7 Callern coverage</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d) => <div key={d}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <Card key={i} className="p-3"><div className="text-xs text-gray-500 mb-2">Night Shift</div><div className="space-y-1"><Badge variant="outline" className="text-xs">Ahmad R.</Badge><Badge variant="outline" className="text-xs">Sara H.</Badge></div>
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-xs"><Plus className="h-3 w-3" /><span>Assign</span></Button>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Configure Teacher Availability</DialogTitle><DialogDescription>Update {selectedTeacher?.teacherName} {selectedTeacher?.teacherLastName}'s settings</DialogDescription></DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Hourly Rate (IRR)</Label><Input type="number" defaultValue={selectedTeacher.hourlyRate || ""} placeholder="500000" id="config-hourly-rate" /></div>
              <div className="space-y-2"><Label>Available Hours</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((s) => <div key={s.id} className="flex items-center gap-2"><input type="checkbox" id={`config-${s.id}`} defaultChecked={selectedTeacher.availableHours?.includes(s.range)} /><Label htmlFor={`config-${s.id}`} className="text-sm">{s.label}</Label></div>)}
                </div>
              </div>
              <Button className="w-full" onClick={handleConfigSave} disabled={updateAvailabilityMutation.isPending}>{updateAvailabilityMutation.isPending ? "Updating..." : "Update Configuration"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isEditPackageDialogOpen} onOpenChange={setIsEditPackageDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{t("admin:callernManagement.editPackage")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("admin:callernManagement.packageName")}</Label><Input value={editPackageForm.packageName} onChange={(e) => setEditPackageForm((p) => ({ ...p, packageName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("admin:callernManagement.hours")}</Label><Input type="number" value={editPackageForm.totalHours} onChange={(e) => setEditPackageForm((p) => ({ ...p, totalHours: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("admin:callernManagement.price")} (IRR)</Label><Input type="number" value={editPackageForm.price} onChange={(e) => setEditPackageForm((p) => ({ ...p, price: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("admin:callernManagement.description")}</Label><Input value={editPackageForm.description} onChange={(e) => setEditPackageForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch id="edit-active" checked={editPackageForm.isActive} onCheckedChange={(v) => setEditPackageForm((p) => ({ ...p, isActive: v }))} /><Label htmlFor="edit-active">{t("admin:callernManagement.active")}</Label></div>
            <Button className="w-full" onClick={handleUpdatePackage} disabled={updatePackageMutation.isPending}>{updatePackageMutation.isPending ? t("common:loading") : t("admin:callernManagement.updatePackage")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Package Dialog */}
      <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{t("admin:callernManagement.createPackage")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("admin:callernManagement.packageName")}</Label><Input value={newPackageForm.packageName} onChange={(e) => setNewPackageForm((p) => ({ ...p, packageName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Select Roadmap</Label>
              <Select value={newPackageForm.roadmapId} onValueChange={(v) => { const r = roadmaps?.find((x) => x.id.toString() === v); setNewPackageForm((p) => ({ ...p, roadmapId: v, packageName: p.packageName || r?.roadmapName || "" })); }}>
                <SelectTrigger><SelectValue placeholder="Choose a roadmap" /></SelectTrigger>
                <SelectContent>{loadingRoadmaps ? <SelectItem value="loading" disabled>Loading...</SelectItem> : Array.isArray(roadmaps) && roadmaps.length > 0 ? roadmaps.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.roadmapName} (~{Math.round(r.estimatedHours)} hrs)</SelectItem>) : <SelectItem value="none" disabled>No roadmaps available</SelectItem>}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t("admin:callernManagement.price")} (IRR)</Label><Input type="number" value={newPackageForm.price} onChange={(e) => setNewPackageForm((p) => ({ ...p, price: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t("admin:callernManagement.description")}</Label><Input value={newPackageForm.description} onChange={(e) => setNewPackageForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch id="new-active" checked={newPackageForm.isActive} onCheckedChange={(v) => setNewPackageForm((p) => ({ ...p, isActive: v }))} /><Label htmlFor="new-active">{t("admin:callernManagement.active")}</Label></div>
            <Button className="w-full" onClick={handleCreatePackage} disabled={createPackageMutation.isPending}>{createPackageMutation.isPending ? t("common:loading") : t("admin:callernManagement.createPackage")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={packageToDelete !== null} onOpenChange={(o) => !o && setPackageToDelete(null)}>
        <DialogContent><DialogHeader><DialogTitle>{t("admin:callernManagement.deletePackage")}</DialogTitle><DialogDescription>{t("admin:callernManagement.deletePackageConfirmation")}</DialogDescription></DialogHeader>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setPackageToDelete(null)}>{t("common:cancel")}</Button>
            <Button variant="destructive" onClick={() => packageToDelete && deletePackageMutation.mutate(packageToDelete)} disabled={deletePackageMutation.isPending}>{deletePackageMutation.isPending ? t("common:loading") : t("common:delete")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
