import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Download, Share2, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";

interface MyCertificate {
  id: number;
  certificateNumber: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  courseId: number;
  courseTitle: string | null;
  courseLevel: string | null;
  courseLanguage: string | null;
  metadata: Record<string, any> | null;
}

interface CompletedEnrollment {
  enrollmentId: number;
  courseId: number;
  progress: number | null;
  completedAt: string | null;
  courseTitle: string | null;
  courseLevel: string | null;
  courseLanguage: string | null;
}

export default function StudentCertificatesPage() {
  const { i18n } = useTranslation(["common"]);
  const isRTL = i18n.dir() === "rtl";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: certs = [], isLoading } = useQuery<MyCertificate[]>({
    queryKey: ["/api/student/my-certificates"],
    queryFn: () => apiRequest("/api/student/my-certificates"),
  });

  const { data: completedEnrollments = [] } = useQuery<CompletedEnrollment[]>({
    queryKey: ["/api/student/completed-enrollments"],
    queryFn: () => apiRequest("/api/student/completed-enrollments"),
  });

  const claimMutation = useMutation({
    mutationFn: (courseId: number) =>
      apiRequest(`/api/courses/${courseId}/complete`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "گواهینامه با موفقیت صادر شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/student/my-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/completed-enrollments"] });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در صدور گواهینامه",
        description: err?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  function handleShare(cert: MyCertificate) {
    const url = `${window.location.origin}/verify-certificate/${cert.certificateNumber}`;
    navigator.clipboard.writeText(url);
    toast({ title: "لینک تأیید کپی شد" });
  }

  async function handleDownload(cert: MyCertificate) {
    try {
      const response = await fetch(`/api/certificates/${cert.certificateNumber}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });

      if (!response.ok) {
        // Fallback to browser print if server PDF not available yet
        handlePrint(cert);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cert.certificateNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to browser print on network error
      handlePrint(cert);
    }
  }

  function handlePrint(cert: MyCertificate) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fa-IR");
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>گواهینامه — ${cert.certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Vazirmatn', Tahoma, sans-serif; background: #fff; }
    .cert { width: 800px; margin: 40px auto; padding: 60px; border: 6px double #1e40af; border-radius: 16px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 40px; }
    .heading { font-size: 22px; color: #374151; margin-bottom: 24px; }
    .course { font-size: 26px; font-weight: bold; color: #1e40af; margin: 20px 0; padding: 16px; background: #eff6ff; border-radius: 8px; }
    .details { margin: 30px 0; font-size: 15px; color: #374151; line-height: 2; }
    .cert-number { font-size: 13px; color: #94a3b8; margin-top: 40px; font-family: monospace; }
    .seal { font-size: 48px; margin: 20px 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="cert">
  <div class="seal">🏅</div>
  <div class="logo">متالینگوآ</div>
  <div class="subtitle">Meta Lingua Academy</div>
  <div class="heading">گواهی می‌شود که</div>
  <div class="details">
    <p>دانشجوی عزیز دوره زیر را با موفقیت به پایان رسانده است:</p>
  </div>
  <div class="course">${cert.courseTitle || "دوره آموزشی"}</div>
  <div class="details">
    <p>تاریخ صدور: ${issuedDate}</p>
    ${cert.courseLevel ? `<p>سطح: ${cert.courseLevel}</p>` : ""}
    ${cert.courseLanguage ? `<p>زبان: ${cert.courseLanguage}</p>` : ""}
  </div>
  <div class="cert-number">شماره گواهینامه: ${cert.certificateNumber}</div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fa-IR") : "—";

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-yellow-500" aria-hidden="true" />
          گواهینامه‌های من
        </h1>
        <p className="text-muted-foreground mt-1">
          گواهینامه‌های دوره‌های تکمیل‌شده شما
        </p>
      </div>

      {/* Claimable certificates section */}
      {completedEnrollments.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              دوره‌های قابل دریافت گواهینامه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedEnrollments.map((enr) => (
              <div
                key={enr.enrollmentId}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background border"
              >
                <div>
                  <p className="font-medium text-sm">{enr.courseTitle || "دوره آموزشی"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {enr.courseLevel && `سطح ${enr.courseLevel}`}
                    {enr.courseLevel && enr.courseLanguage && " · "}
                    {enr.courseLanguage}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => claimMutation.mutate(enr.courseId)}
                  disabled={claimMutation.isPending}
                >
                  {claimMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                  ) : (
                    <Award className="h-4 w-4 me-1.5" aria-hidden="true" />
                  )}
                  دریافت گواهینامه
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Existing certificates */}
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">در حال بارگذاری...</div>
      ) : certs.length === 0 && completedEnrollments.length === 0 ? (
        <div className="text-center py-20">
          <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" aria-hidden="true" />
          <h2 className="text-xl font-semibold mb-2">هنوز گواهینامه‌ای ندارید</h2>
          <p className="text-muted-foreground">
            با تکمیل موفقیت‌آمیز دوره‌ها، گواهینامه دیجیتال دریافت خواهید کرد.
          </p>
        </div>
      ) : certs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((cert) => (
            <Card
              key={cert.id}
              className={`relative overflow-hidden border-2 ${
                cert.status === "active" ? "border-primary/20" : "border-destructive/20 opacity-70"
              }`}
            >
              <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500" />
              <CardContent className="pt-6 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" aria-hidden="true" />
                      <Badge variant={cert.status === "active" ? "default" : "destructive"}>
                        {cert.status === "active" ? "معتبر" : "باطل"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-base leading-tight truncate">
                      {cert.courseTitle}
                    </h3>
                    <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                      <p>تاریخ صدور: {formatDate(cert.issuedAt)}</p>
                      {cert.expiresAt && <p>تاریخ انقضا: {formatDate(cert.expiresAt)}</p>}
                      {cert.courseLevel && <p>سطح: {cert.courseLevel}</p>}
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted-foreground/70">
                      {cert.certificateNumber}
                    </p>
                  </div>
                </div>

                {cert.status === "active" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(cert)}
                      className="flex-1"
                      aria-label="دانلود گواهینامه PDF"
                    >
                      <Download className="h-4 w-4 me-1.5" aria-hidden="true" />
                      دانلود PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(cert)}
                      aria-label="اشتراک‌گذاری لینک تأیید"
                    >
                      <Share2 className="h-4 w-4 me-1.5" aria-hidden="true" />
                      اشتراک
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        window.open(`/verify-certificate/${cert.certificateNumber}`, "_blank")
                      }
                      aria-label="مشاهده صفحه تأیید"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
