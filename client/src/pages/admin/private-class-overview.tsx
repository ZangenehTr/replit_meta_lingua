import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrivateClassRecord {
  id: number;
  studentId: number;
  teacherId: number;
  packageId: number;
  totalSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string | null;
  isActive: boolean;
  alertFiredAt: string | null;
  student: { firstName: string; lastName: string; phone: string } | null;
  teacher: { firstName: string; lastName: string } | null;
  package: { name: string; lowSessionAlertThreshold: number } | null;
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
    mutationFn: async ({ packageId, durationMinutes }: { packageId: number; durationMinutes: number }) => {
      return await apiRequest(`/api/private-sessions/log`, {
        method: "POST",
        body: JSON.stringify({ studentSessionPackageId: packageId, durationMinutes, notes: "ثبت توسط ادمین" })
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
  const active = records.filter(r => r.isActive).length;
  const alerts = records.filter(r => r.alertFiredAt && r.isActive).length;

  const sessionPct = (rec: PrivateClassRecord) =>
    rec.totalSessions > 0 ? Math.round((rec.remainingSessions / rec.totalSessions) * 100) : 0;

  const isLow = (rec: PrivateClassRecord) =>
    rec.package ? rec.remainingSessions <= rec.package.lowSessionAlertThreshold : false;

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">نمای کلی کلاس‌های خصوصی</h1>
        <p className="text-gray-500 text-sm mt-1">مدیریت و پیگیری همه کلاس‌های خصوصی فعال</p>
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
            <Card key={rec.id} className={`hover:shadow-md transition-shadow ${isLow(rec) ? "border-orange-300" : ""}`}>
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
                      <Badge variant={rec.isActive ? "default" : "secondary"}>
                        {rec.isActive ? "فعال" : "تمام شده"}
                      </Badge>
                      {isLow(rec) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          نیاز به تمدید
                        </Badge>
                      )}
                    </div>

                    {rec.package && (
                      <p className="text-sm text-gray-500">{rec.package.name}</p>
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
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all ${isLow(rec) ? "bg-orange-500" : "bg-blue-500"}`}
                        style={{ width: `${sessionPct(rec)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{sessionPct(rec)}% جلسات باقیمانده</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logSessionMutation.mutate({ packageId: rec.id, durationMinutes: 60 })}
                      disabled={logSessionMutation.isPending || !rec.isActive || rec.remainingSessions <= 0}
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
