import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ClipboardList,
  Download,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrivateClassRecord {
  id: number;
  student: { id: number; firstName: string; lastName: string } | null;
  teacher: { id: number; firstName: string; lastName: string } | null;
  bundle: { id: number; name: string } | null;
  totalSessions: number;
  remainingSessions: number;
  sessionDuration: number;
  lowSessionAlertThreshold: number;
  status: 'active' | 'completed' | 'expired';
  startDate: string;
  expiryDate: string | null;
  lastSessionDate: string | null;
  alertFiredAt: string | null;
  isLowSession: boolean;
  isAtRisk: boolean;
}

function PrivateClassOverviewPage() {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery<PrivateClassRecord[]>({
    queryKey: ["/api/admin/private-classes"],
    queryFn: () => apiRequest(`/api/admin/private-classes`)
  });

  const logSessionMutation = useMutation({
    mutationFn: async ({ packageId }: { packageId: number }) => {
      return await apiRequest(`/api/private-sessions/log`, {
        method: "POST",
        body: JSON.stringify({
          studentSessionPackageId: packageId,
          sessionDate: new Date().toISOString(),
          actualDuration: 60,
          teacherNotes: "ثبت توسط ادمین",
          attendanceStatus: "attended",
        })
      });
    },
    onSuccess: () => {
      toast({ title: "جلسه ثبت شد و یک جلسه کسر شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/private-classes"] });
    },
    onError: (e: any) => {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    }
  });

  const filtered = records.filter(r => {
    const name = `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`.toLowerCase();
    const teacher = `${r.teacher?.firstName ?? ""} ${r.teacher?.lastName ?? ""}`.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || teacher.includes(q);
  });

  const total = records.length;
  const active = records.filter(r => r.status === 'active').length;
  const alerts = records.filter(r => r.isLowSession && r.status === 'active').length;

  const sessionPct = (rec: PrivateClassRecord) =>
    rec.totalSessions > 0 ? Math.round((rec.remainingSessions / rec.totalSessions) * 100) : 0;

  const exportCSV = () => {
    const headers = ["دانش‌آموز", "استاد", "بسته", "کل جلسات", "باقیمانده", "وضعیت", "شروع", "انقضا"];
    const rows = filtered.map(r => [
      `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`,
      `${r.teacher?.firstName ?? ""} ${r.teacher?.lastName ?? ""}`,
      r.bundle?.name ?? "",
      String(r.totalSessions),
      String(r.remainingSessions),
      r.status === 'active' ? "فعال" : r.status === 'completed' ? "تکمیل" : "منقضی",
      r.startDate ? new Date(r.startDate).toLocaleDateString('fa-IR') : "",
      r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('fa-IR') : "",
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-classes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">نمای کلی کلاس‌های خصوصی</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت و پیگیری همه کلاس‌های خصوصی</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          خروجی CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-gray-500">کل بسته‌ها</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active}</p>
              <p className="text-sm text-gray-500">فعال</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alerts}</p>
              <p className="text-sm text-gray-500">نیاز به تمدید</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="جستجو بر اساس نام دانش‌آموز یا استاد..."
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
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">هیچ کلاسی یافت نشد</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(rec => (
            <Card key={rec.id} className={`hover:shadow-md transition-shadow ${rec.isLowSession ? "border-orange-300" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">{rec.student?.firstName} {rec.student?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <GraduationCap className="h-4 w-4" />
                        <span>{rec.teacher?.firstName} {rec.teacher?.lastName}</span>
                      </div>
                      <Badge variant={rec.status === 'active' ? "default" : "secondary"}>
                        {rec.status === 'active' ? "فعال" : rec.status === 'completed' ? "تکمیل" : "منقضی"}
                      </Badge>
                      {rec.isLowSession && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          نیاز به تمدید
                        </Badge>
                      )}
                      {rec.alertFiredAt && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                          هشدار ارسال شد
                        </Badge>
                      )}
                    </div>

                    {rec.bundle && (
                      <p className="text-sm text-gray-500">{rec.bundle.name}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <BookOpen className="h-3 w-3" />
                        <span>{rec.remainingSessions} از {rec.totalSessions} جلسه</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(rec.startDate).toLocaleDateString('fa-IR')}</span>
                      </div>
                      {rec.expiryDate && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>انقضا: {new Date(rec.expiryDate).toLocaleDateString('fa-IR')}</span>
                        </div>
                      )}
                      {rec.lastSessionDate && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span>آخرین جلسه: {new Date(rec.lastSessionDate).toLocaleDateString('fa-IR')}</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all ${rec.isLowSession ? "bg-orange-500" : "bg-blue-500"}`}
                        style={{ width: `${sessionPct(rec)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{sessionPct(rec)}% جلسات باقیمانده</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logSessionMutation.mutate({ packageId: rec.id })}
                      disabled={logSessionMutation.isPending || rec.status !== 'active' || rec.remainingSessions <= 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      ثبت جلسه
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrivateClassOverviewPage;
