import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Search,
  User,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface PrivateStudent {
  id: number;
  studentId: number;
  totalSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string | null;
  isActive: boolean;
  alertFiredAt: string | null;
  student: { firstName: string; lastName: string; phone: string } | null;
  package: { name: string; lowSessionAlertThreshold: number } | null;
  recentSessions: {
    id: number;
    sessionDate: string;
    durationMinutes: number;
    notes: string | null;
  }[];
}

function PrivateStudentsPage() {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logDialog, setLogDialog] = useState<{ open: boolean; packageId: number | null }>({ open: false, packageId: null });
  const [duration, setDuration] = useState("60");
  const [sessionNotes, setSessionNotes] = useState("");

  const { data: students = [], isLoading } = useQuery<PrivateStudent[]>({
    queryKey: ["/api/teacher/private-students"],
    queryFn: () => apiRequest(`/api/teacher/private-students`)
  });

  const logMutation = useMutation({
    mutationFn: async ({ packageId, durationMinutes, notes }: { packageId: number; durationMinutes: number; notes?: string }) => {
      return await apiRequest(`/api/private-sessions/log`, {
        method: "POST",
        body: JSON.stringify({ studentSessionPackageId: packageId, durationMinutes, notes })
      });
    },
    onSuccess: () => {
      toast({ title: "جلسه با موفقیت ثبت شد", description: "یک جلسه از بسته کسر شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/private-students"] });
      setLogDialog({ open: false, packageId: null });
      setDuration("60");
      setSessionNotes("");
    },
    onError: (e: any) => {
      toast({ title: "خطا در ثبت جلسه", description: e.message, variant: "destructive" });
    }
  });

  const { data: sessionHistory } = useQuery<{ id: number; sessionDate: string; durationMinutes: number; notes: string | null }[]>({
    queryKey: [`/api/teacher/private-students/${expandedId}/sessions`],
    queryFn: () => apiRequest(`/api/teacher/private-students/${expandedId}/sessions`),
    enabled: !!expandedId,
  });

  const isLow = (s: PrivateStudent) =>
    s.package ? s.remainingSessions <= s.package.lowSessionAlertThreshold : false;

  const filtered = students.filter(s => {
    const name = `${s.student?.firstName ?? ""} ${s.student?.lastName ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const active = students.filter(s => s.isActive).length;

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دانش‌آموزان خصوصی من</h1>
          <p className="text-gray-500 text-sm mt-1">{active} دانش‌آموز فعال</p>
        </div>
        <Link href="/teacher/dashboard">
          <Button variant="outline" size="sm">بازگشت به داشبورد</Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="جستجو بر اساس نام دانش‌آموز..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">در حال بارگذاری...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">هیچ دانش‌آموز خصوصی‌ای ندارید</h3>
            <p className="text-gray-500">دانش‌آموزان خصوصی توسط واحد ثبت‌نام اختصاص می‌یابند</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(student => (
            <Card key={student.id} className={`hover:shadow-md transition-shadow ${isLow(student) ? "border-orange-300" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">{student.student?.firstName} {student.student?.lastName}</span>
                        </div>
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? "فعال" : "تمام شده"}
                        </Badge>
                        {isLow(student) && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            جلسات رو به اتمام
                          </Badge>
                        )}
                      </div>
                      {student.package && (
                        <p className="text-sm text-gray-500">{student.package.name}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{student.remainingSessions} از {student.totalSessions} جلسه</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(student.startDate).toLocaleDateString('fa-IR')}</span>
                        </div>
                        {student.expiryDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>انقضا: {new Date(student.expiryDate).toLocaleDateString('fa-IR')}</span>
                          </div>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isLow(student) ? "bg-orange-500" : "bg-blue-500"}`}
                          style={{ width: `${student.totalSessions > 0 ? Math.round((student.remainingSessions / student.totalSessions) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog
                        open={logDialog.open && logDialog.packageId === student.id}
                        onOpenChange={open => setLogDialog({ open, packageId: open ? student.id : null })}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={!student.isActive || student.remainingSessions <= 0}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            ثبت جلسه
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>ثبت جلسه — {student.student?.firstName} {student.student?.lastName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div>
                              <Label>مدت جلسه (دقیقه)</Label>
                              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" />
                            </div>
                            <div>
                              <Label>یادداشت (اختیاری)</Label>
                              <Input value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="مطالب پوشش داده شده..." />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setLogDialog({ open: false, packageId: null })}>
                                انصراف
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => logMutation.mutate({ packageId: student.id, durationMinutes: Number(duration), notes: sessionNotes || undefined })}
                                disabled={logMutation.isPending || !duration}
                              >
                                {logMutation.isPending ? "در حال ثبت..." : "ثبت جلسه"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === student.id ? null : student.id)}
                      >
                        {expandedId === student.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        تاریخچه
                      </Button>
                    </div>
                  </div>

                  {expandedId === student.id && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        تاریخچه جلسات
                      </h4>
                      {!sessionHistory ? (
                        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
                      ) : sessionHistory.length === 0 ? (
                        <p className="text-sm text-gray-400">هنوز جلسه‌ای ثبت نشده است</p>
                      ) : (
                        <div className="space-y-2">
                          {sessionHistory.slice(0, 10).map(s => (
                            <div key={s.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <div className="flex items-center gap-3">
                                <span>{new Date(s.sessionDate).toLocaleDateString('fa-IR')}</span>
                                <span className="text-gray-500">{s.durationMinutes} دقیقه</span>
                              </div>
                              {s.notes && <span className="text-gray-500 truncate max-w-xs">{s.notes}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrivateStudentsPage;
