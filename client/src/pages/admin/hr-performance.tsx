import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, AlertTriangle, TrendingUp, RefreshCw, Eye, CheckCircle, Settings2 } from "lucide-react";
import { Link, useLocation } from "wouter";

interface PerformanceReview {
  id: number;
  employeeId: number;
  reviewYear: number;
  reviewMonth: number;
  overallScore: string | null;
  metricBreakdown: Record<string, number> | null;
  aiNarrative: string | null;
  improvementPlan: string | null;
  anomalyDetected: boolean;
  anomalyDetails: string | null;
  previousMonthScore: string | null;
  threeMonthAvgScore: string | null;
  status: string;
  generatedAt: string | null;
}

interface Employee {
  id: number;
  employeeCode: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  department: string | null;
}

interface AnomalyRecord {
  id: number;
  employeeId: number;
  reviewYear: number;
  reviewMonth: number;
  overallScore: string | null;
  anomalyDetails: string | null;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function scoreColor(score: number) {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-yellow-700";
  return "text-red-700";
}

export default function HRPerformancePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const preselectedEmployee = params.get("employee");

  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(preselectedEmployee ? Number(preselectedEmployee) : null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [detailReview, setDetailReview] = useState<PerformanceReview | null>(null);
  const [thresholdForm, setThresholdForm] = useState({ anomaly: "15", improvement: "60" });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
  });

  const { data: adminSettings } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/admin/settings"],
    enabled: isAdmin,
  });

  useEffect(() => {
    if (adminSettings) {
      setThresholdForm({
        anomaly: String(adminSettings.hrAnomalyThreshold ?? 15),
        improvement: String(adminSettings.hrImprovementThreshold ?? 60),
      });
    }
  }, [adminSettings]);

  const saveThresholdsMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/settings", { method: "PATCH", body: {
      hrAnomalyThreshold: thresholdForm.anomaly,
      hrImprovementThreshold: thresholdForm.improvement,
    }}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "HR thresholds updated" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const { data: anomalies = [] } = useQuery<AnomalyRecord[]>({
    queryKey: ["/api/hr/employees/performance/anomalies"],
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/hr/employees", selectedEmployee, "performance"],
    queryFn: () => selectedEmployee
      ? fetch(`/api/hr/employees/${selectedEmployee}/performance`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!selectedEmployee,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest(`/api/hr/employees/${selectedEmployee}/performance/generate`, { method: "POST", body: { year, month } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees", selectedEmployee, "performance"] });
      qc.invalidateQueries({ queryKey: ["/api/hr/employees/performance/anomalies"] });
      toast({ title: "Performance review generated" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ reviewId }: { reviewId: number }) =>
      apiRequest(`/api/hr/employees/${selectedEmployee}/performance/${reviewId}/publish`, { method: "PUT" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees", selectedEmployee, "performance"] });
      toast({ title: "Review published" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const selectedEmp = employees.find(e => e.id === selectedEmployee);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6" /> ارزیابی عملکرد با هوش مصنوعی</h1>
          <p className="text-muted-foreground">نمرات عملکرد ماهانه، روایت‌ها و برنامه‌های بهبود تولید شده توسط هوش مصنوعی</p>
        </div>
        <Link href="/admin/hr/employees"><Button variant="outline">← کارمندان</Button></Link>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Settings2 className="h-4 w-4" /> آستانه‌های ارزیابی منابع انسانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="space-y-1">
                <Label className="text-xs">آستانه هشدار ناهنجاری (افت نمره)</Label>
                <Input type="number" min={0} max={100} step={1} className="w-32" value={thresholdForm.anomaly}
                  onChange={e => setThresholdForm(f => ({ ...f, anomaly: e.target.value }))} />
                <p className="text-xs text-muted-foreground">افت در مقایسه با میانگین ۳ ماهه که هشدار ایجاد می‌کند</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">آستانه برنامه بهبود (نمره مطلق)</Label>
                <Input type="number" min={0} max={100} step={1} className="w-32" value={thresholdForm.improvement}
                  onChange={e => setThresholdForm(f => ({ ...f, improvement: e.target.value }))} />
                <p className="text-xs text-muted-foreground">نمرات پایین‌تر از این، برنامه ۳۰ روزه ایجاد می‌کند</p>
              </div>
              <Button size="sm" onClick={() => saveThresholdsMutation.mutate()} disabled={saveThresholdsMutation.isPending}>
                {saveThresholdsMutation.isPending ? "در حال ذخیره..." : "ذخیره آستانه‌ها"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {anomalies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" /> ناهنجاری‌های عملکرد شناسایی شد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm bg-white rounded p-2 border border-orange-100">
                  <span className="font-medium">{a.firstName} {a.lastName} ({a.employeeCode})</span>
                  <span className="text-muted-foreground">{MONTHS[a.reviewMonth - 1]} {a.reviewYear}</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">{a.anomalyDetails}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEmployee(a.employeeId)}>مشاهده</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 flex-1 min-w-48">
              <label className="text-sm font-medium">کارمند</label>
              <Select value={selectedEmployee ? String(selectedEmployee) : ""} onValueChange={v => setSelectedEmployee(Number(v))}>
                <SelectTrigger><SelectValue placeholder="انتخاب کارمند..." /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.firstName} {e.lastName} — {e.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">سال</label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">ماه</label>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={!selectedEmployee || generateMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                {generateMutation.isPending ? "در حال تولید..." : "تولید ارزیابی"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!selectedEmployee ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>یک کارمند را انتخاب کنید تا ارزیابی عملکرد آن‌ها را مشاهده یا تولید کنید.</p>
            </div>
          ) : reviewsLoading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری ارزیابی‌ها...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>هنوز ارزیابی‌ای برای {selectedEmp?.firstName} {selectedEmp?.lastName} ثبت نشده.</p>
              <p className="text-sm">یک ماه را انتخاب کنید و روی "تولید ارزیابی" کلیک کنید.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>دوره</TableHead>
                  <TableHead>نمره</TableHead>
                  <TableHead>میانگین ۳ ماهه</TableHead>
                  <TableHead>ناهنجاری</TableHead>
                  <TableHead>خلاصه هوش مصنوعی</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map(r => {
                  const score = Number(r.overallScore ?? 0);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{MONTHS[r.reviewMonth - 1]} {r.reviewYear}</TableCell>
                      <TableCell>
                        <span className={`text-xl font-bold ${scoreColor(score)}`}>{score.toFixed(0)}</span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </TableCell>
                      <TableCell>{r.threeMonthAvgScore ? Number(r.threeMonthAvgScore).toFixed(1) : "—"}</TableCell>
                      <TableCell>
                        {r.anomalyDetected ? (
                          <Badge variant="outline" className="text-orange-700 border-orange-300 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> افت شناسایی شد
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.aiNarrative ?? "هنوز تولید نشده"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "published" ? "default" : "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setDetailReview(r)}><Eye className="h-4 w-4" /></Button>
                          {isAdmin && r.status === "draft" && (
                            <Button size="sm" variant="ghost" onClick={() => publishMutation.mutate({ reviewId: r.id })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailReview} onOpenChange={open => !open && setDetailReview(null)}>
        {detailReview && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                ارزیابی عملکرد — {selectedEmp?.firstName} {selectedEmp?.lastName}<br />
                <span className="text-sm font-normal text-muted-foreground">{MONTHS[detailReview.reviewMonth - 1]} {detailReview.reviewYear}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${scoreColor(Number(detailReview.overallScore ?? 0))}`}>
                  {Number(detailReview.overallScore ?? 0).toFixed(0)}
                </div>
                <div className="text-muted-foreground text-sm">
                  <div>/ ۱۰۰ نمره کل</div>
                  {detailReview.threeMonthAvgScore && <div>میانگین ۳ ماهه: {Number(detailReview.threeMonthAvgScore).toFixed(1)}</div>}
                </div>
              </div>

              {detailReview.metricBreakdown && Object.keys(detailReview.metricBreakdown).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">تفکیک معیارها</h4>
                  <div className="space-y-3">
                    {Object.entries(detailReview.metricBreakdown).map(([k, v]) => (
                      <div key={k}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{k.replace(/_/g, " ")}</span>
                          <span className={`font-medium ${scoreColor(v)}`}>{v.toFixed(0)}/100</span>
                        </div>
                        <Progress value={v} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailReview.anomalyDetected && detailReview.anomalyDetails && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-800 text-sm">ناهنجاری شناسایی شد</div>
                    <div className="text-sm text-orange-700">{detailReview.anomalyDetails}</div>
                  </div>
                </div>
              )}

              {detailReview.aiNarrative && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2"><Bot className="h-4 w-4" /> روایت عملکرد هوش مصنوعی</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-md">{detailReview.aiNarrative}</p>
                </div>
              )}

              {detailReview.improvementPlan && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">برنامه بهبود ۳۰ روزه</h4>
                  <div className="text-sm leading-relaxed bg-red-50 border border-red-100 p-3 rounded-md whitespace-pre-line">{detailReview.improvementPlan}</div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
