import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SessionRecord {
  id: number;
  sessionDate: string;
  actualDuration: number;
  topicsCovered: string | null;
  teacherNotes: string | null;
  attendanceStatus: string;
}

interface PrivateClassRecord {
  id: number;
  student: { id: number; firstName: string; lastName: string } | null;
  teacher: { id: number; firstName: string; lastName: string } | null;
  bundle: { id: number; name: string } | null;
  crmStage: string;
  totalSessions: number;
  remainingSessions: number;
  sessionDuration: number;
  lowSessionAlertThreshold: number;
  status: 'active' | 'completed' | 'expired';
  startDate: string;
  expiryDate: string | null;
  nextScheduledAt: string | null;
  lastSessionDate: string | null;
  alertFiredAt: string | null;
  isLowSession: boolean;
  isAtRisk: boolean;
}

function PrivateClassOverviewPage() {
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");

  const { data: records = [], isLoading } = useQuery<PrivateClassRecord[]>({
    queryKey: ["/api/admin/private-classes", statusFilter],
    queryFn: () => apiRequest(`/api/admin/private-classes${statusFilter === "all" ? "?status=all" : ""}`)
  });

  const { data: sessionHistory } = useQuery<SessionRecord[]>({
    queryKey: [`/api/admin/private-classes/${expandedId}/sessions`],
    queryFn: () => apiRequest(`/api/admin/private-classes/${expandedId}/sessions`),
    enabled: !!expandedId,
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

  const attendanceLabel = (s: string) =>
    s === 'attended' ? 'حضور' : s === 'absent' ? 'غایب' : 'لغو';

  const crmStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      active_private_class: 'کلاس خصوصی فعال',
      private_class_setup: 'راه‌اندازی کلاس',
      charge_renewal: 'تمدید شارژ',
      completed_private_class: 'تکمیل شده',
      private_class_withdrawal: 'انصراف',
      hold: 'تعلیق',
    };
    return labels[stage] ?? stage;
  };

  const escapeCSVCell = (value: string): string => {
    if (value.includes(",") || value.includes("\n") || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportCSV = () => {
    const headers = ["دانش‌آموز", "استاد", "بسته", "مرحله CRM", "کل جلسات", "باقیمانده", "وضعیت", "شروع", "انقضا", "جلسه بعدی"];
    const rows = filtered.map(r => [
      `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`,
      `${r.teacher?.firstName ?? ""} ${r.teacher?.lastName ?? ""}`,
      r.bundle?.name ?? "",
      crmStageLabel(r.crmStage),
      String(r.totalSessions),
      String(r.remainingSessions),
      r.status === 'active' ? "فعال" : r.status === 'completed' ? "تکمیل" : "منقضی",
      r.startDate ? new Date(r.startDate).toLocaleDateString('fa-IR') : "",
      r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('fa-IR') : "",
      r.nextScheduledAt ? new Date(r.nextScheduledAt).toLocaleDateString('fa-IR') : "تعیین نشده",
    ]);
    const csv = [headers, ...rows].map(row => row.map(escapeCSVCell).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-classes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">نمای کلی کلاس‌های خصوصی</h1>
          <p className="text-gray-500 text-sm mt-1">مشاهده و پیگیری همه کلاس‌های خصوصی (فقط خواندنی)</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 me-2" />
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
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alerts}</p>
              <p className="text-sm text-gray-500">نیاز به تمدید</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="جستجو بر اساس نام دانش‌آموز یا استاد..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>
        <div className="flex rounded-md border overflow-hidden text-sm">
          <button
            className={`px-3 py-2 ${statusFilter === "active" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setStatusFilter("active")}
          >
            فعال
          </button>
          <button
            className={`px-3 py-2 border-l ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setStatusFilter("all")}
          >
            همه
          </button>
        </div>
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
            <Card key={rec.id} className={`hover:shadow-md transition-shadow ${rec.isLowSession ? "border-red-300" : ""}`}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
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
                          <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                            هشدار ارسال شد
                          </Badge>
                        )}
                      </div>

                      {rec.bundle && (
                        <p className="text-sm text-gray-500">{rec.bundle.name}</p>
                      )}
                      <Badge variant="outline" className="text-xs w-fit">
                        {crmStageLabel(rec.crmStage)}
                      </Badge>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
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
                        {rec.nextScheduledAt ? (
                          <div className="flex items-center gap-1 text-blue-600 col-span-2">
                            <Calendar className="h-3 w-3" />
                            <span className="font-medium">جلسه بعدی: {new Date(rec.nextScheduledAt).toLocaleDateString('fa-IR')} {new Date(rec.nextScheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span>جلسه بعدی تعیین نشده</span>
                          </div>
                        )}
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${rec.isLowSession ? "bg-red-500" : "bg-blue-500"}`}
                          style={{ width: `${sessionPct(rec)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">{sessionPct(rec)}% جلسات باقیمانده</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                    >
                      <ClipboardList className="h-4 w-4 me-1" />
                      تاریخچه
                      {expandedId === rec.id ? <ChevronUp className="h-4 w-4 ms-1" /> : <ChevronDown className="h-4 w-4 ms-1" />}
                    </Button>
                  </div>

                  {expandedId === rec.id && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold mb-2">تاریخچه جلسات</h4>
                      {!sessionHistory ? (
                        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
                      ) : sessionHistory.length === 0 ? (
                        <p className="text-sm text-gray-400">هیچ جلسه‌ای ثبت نشده است</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 border-b text-xs">
                                <th className="text-right pb-2 pe-2">تاریخ</th>
                                <th className="text-right pb-2 pe-2">مدت (دقیقه)</th>
                                <th className="text-right pb-2 pe-2">حضور</th>
                                <th className="text-right pb-2 pe-2">موضوع</th>
                                <th className="text-right pb-2">یادداشت استاد</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {sessionHistory.map(s => (
                                <tr key={s.id} className="text-xs">
                                  <td className="py-2 pe-2">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('fa-IR') : '—'}</td>
                                  <td className="py-2 pe-2">{s.actualDuration}</td>
                                  <td className="py-2 pe-2">
                                    <Badge variant={s.attendanceStatus === 'attended' ? 'default' : 'secondary'} className="text-xs py-0">
                                      {attendanceLabel(s.attendanceStatus)}
                                    </Badge>
                                  </td>
                                  <td className="py-2 pe-2 max-w-xs truncate">{s.topicsCovered ?? '—'}</td>
                                  <td className="py-2 max-w-xs truncate text-gray-500 italic">{s.teacherNotes ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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

export default PrivateClassOverviewPage;
