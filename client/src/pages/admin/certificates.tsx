import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Plus, XCircle, Copy, Search, RefreshCw } from "lucide-react";

interface CertificateRow {
  id: number;
  certificateNumber: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  studentId: number;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentPhone: string | null;
  courseId: number;
  courseTitle: string | null;
}

interface Course { id: number; title: string; }
interface Student { id: number; firstName: string | null; lastName: string | null; phoneNumber: string | null; }

export default function CertificatesPage() {
  const { i18n } = useTranslation(["admin", "common"]);
  const isRTL = i18n.dir() === "rtl";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [reissueCert, setReissueCert] = useState<CertificateRow | null>(null);
  const [search, setSearch] = useState("");
  const [issueForm, setIssueForm] = useState({
    studentId: "",
    courseId: "",
    expiresAt: "",
  });

  const { data: certs = [], isLoading } = useQuery<CertificateRow[]>({
    queryKey: ["/api/admin/certificates"],
    queryFn: () => apiRequest("/api/admin/certificates"),
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: () => apiRequest("/api/courses"),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("/api/admin/users?role=Student"),
  });

  const issueMutation = useMutation({
    mutationFn: (data: typeof issueForm) =>
      apiRequest("/api/admin/certificates", {
        method: "POST",
        body: {
          studentId: Number(data.studentId),
          courseId: Number(data.courseId),
          expiresAt: data.expiresAt || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
      toast({ title: "گواهینامه صادر شد" });
      setDialogOpen(false);
      setIssueForm({ studentId: "", courseId: "", expiresAt: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "خطا در صدور گواهینامه", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest(`/api/admin/certificates/${id}/revoke`, {
        method: "PUT",
        body: { reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
      toast({ title: "گواهینامه باطل شد" });
      setRevokeId(null);
      setRevokeReason("");
    },
    onError: (err: any) => {
      toast({ title: err.message || "خطا در باطل کردن", variant: "destructive" });
    },
  });

  const reissueMutation = useMutation({
    mutationFn: (cert: CertificateRow) =>
      apiRequest("/api/admin/certificates", {
        method: "POST",
        body: {
          studentId: cert.studentId,
          courseId: cert.courseId,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
      toast({ title: "گواهینامه جدید صادر شد" });
      setReissueCert(null);
    },
    onError: (err: any) => {
      toast({ title: err.message || "خطا در صدور مجدد", variant: "destructive" });
    },
  });

  function copyNumber(num: string) {
    navigator.clipboard.writeText(num);
    toast({ title: "شماره گواهینامه کپی شد" });
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fa-IR") : "—";

  const filtered = certs.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.certificateNumber.toLowerCase().includes(s) ||
      (c.studentFirstName || "").toLowerCase().includes(s) ||
      (c.studentLastName || "").toLowerCase().includes(s) ||
      (c.studentPhone || "").includes(s) ||
      (c.courseTitle || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" aria-hidden="true" />
            گواهینامه‌های دیجیتال
          </h1>
          <p className="text-muted-foreground mt-1">صدور و مدیریت گواهینامه‌های پایان دوره</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} aria-label="صدور گواهینامه جدید">
          <Plus className="h-4 w-4 me-2" aria-hidden="true" />
          صدور گواهینامه
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{certs.length}</div>
            <div className="text-sm text-muted-foreground">کل گواهینامه‌ها</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {certs.filter(c => c.status === "active").length}
            </div>
            <div className="text-sm text-muted-foreground">فعال</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {certs.filter(c => c.status === "revoked").length}
            </div>
            <div className="text-sm text-muted-foreground">باطل شده</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>لیست گواهینامه‌ها ({certs.length})</CardTitle>
              <CardDescription>گواهینامه‌های صادر شده برای دانشجویان</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="جستجو..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
                aria-label="جستجو در گواهینامه‌ها"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Award className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p>هیچ گواهینامه‌ای یافت نشد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره گواهینامه</TableHead>
                  <TableHead>دانشجو</TableHead>
                  <TableHead>دوره</TableHead>
                  <TableHead>تاریخ صدور</TableHead>
                  <TableHead>انقضا</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {cert.certificateNumber}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyNumber(cert.certificateNumber)}
                          aria-label="کپی شماره گواهینامه"
                        >
                          <Copy className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {cert.studentFirstName} {cert.studentLastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{cert.studentPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{cert.courseTitle}</TableCell>
                    <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                    <TableCell>{formatDate(cert.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cert.status === "active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {cert.status === "active" ? "فعال" : "باطل"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {cert.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRevokeId(cert.id)}
                            aria-label="باطل کردن گواهینامه"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        {cert.status === "revoked" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary"
                            onClick={() => setReissueCert(cert)}
                            aria-label="صدور مجدد گواهینامه"
                            title="صدور مجدد"
                          >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Issue Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>صدور گواهینامه جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="student-search">دانشجو *</Label>
              <select
                id="student-search"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={issueForm.studentId}
                onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
              >
                <option value="">انتخاب دانشجو...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} — {s.phoneNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="course-select">دوره *</Label>
              <select
                id="course-select"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={issueForm.courseId}
                onChange={(e) => setIssueForm({ ...issueForm, courseId: e.target.value })}
              >
                <option value="">انتخاب دوره...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cert-expires">تاریخ انقضا (اختیاری)</Label>
              <Input
                id="cert-expires"
                type="date"
                value={issueForm.expiresAt}
                onChange={(e) => setIssueForm({ ...issueForm, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={() => issueMutation.mutate(issueForm)}
              disabled={!issueForm.studentId || !issueForm.courseId || issueMutation.isPending}
            >
              صدور گواهینامه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-issue Confirmation */}
      <AlertDialog open={reissueCert !== null} onOpenChange={() => setReissueCert(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>صدور مجدد گواهینامه</AlertDialogTitle>
            <AlertDialogDescription>
              یک گواهینامه جدید با شماره جدید برای این دانشجو و دوره صادر می‌شود.
              گواهینامه قبلی باطل باقی خواهد ماند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reissueCert && (
            <div className="px-6 pb-2 text-sm">
              <p>دانشجو: <strong>{reissueCert.studentFirstName} {reissueCert.studentLastName}</strong></p>
              <p>دوره: <strong>{reissueCert.courseTitle}</strong></p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reissueCert && reissueMutation.mutate(reissueCert)}
              disabled={reissueMutation.isPending}
            >
              صدور مجدد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={revokeId !== null} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>باطل کردن گواهینامه</AlertDialogTitle>
            <AlertDialogDescription>
              این گواهینامه باطل خواهد شد و دانشجو دیگر نمی‌تواند آن را تأیید کند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label htmlFor="revoke-reason">دلیل باطل کردن</Label>
            <Input
              id="revoke-reason"
              placeholder="اختیاری"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeId && revokeMutation.mutate({ id: revokeId, reason: revokeReason })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              باطل کردن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
