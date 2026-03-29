import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download, Share2, ExternalLink } from "lucide-react";

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

export default function StudentCertificatesPage() {
  const { i18n } = useTranslation(["common"]);
  const isRTL = i18n.dir() === "rtl";
  const { toast } = useToast();

  const { data: certs = [], isLoading } = useQuery<MyCertificate[]>({
    queryKey: ["/api/student/my-certificates"],
    queryFn: () => apiRequest("/api/student/my-certificates"),
  });

  function handleShare(cert: MyCertificate) {
    const url = `${window.location.origin}/verify-certificate/${cert.certificateNumber}`;
    navigator.clipboard.writeText(url);
    toast({ title: "لینک تأیید کپی شد" });
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-yellow-500" aria-hidden="true" />
          گواهینامه‌های من
        </h1>
        <p className="text-muted-foreground mt-1">
          گواهینامه‌های دوره‌های تکمیل‌شده شما
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">در حال بارگذاری...</div>
      ) : certs.length === 0 ? (
        <div className="text-center py-20">
          <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" aria-hidden="true" />
          <h2 className="text-xl font-semibold mb-2">هنوز گواهینامه‌ای ندارید</h2>
          <p className="text-muted-foreground">
            با تکمیل موفقیت‌آمیز دوره‌ها، گواهینامه دیجیتال دریافت خواهید کرد.
          </p>
        </div>
      ) : (
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
                      onClick={() => handlePrint(cert)}
                      className="flex-1"
                      aria-label="دانلود یا چاپ گواهینامه"
                    >
                      <Download className="h-4 w-4 me-1.5" aria-hidden="true" />
                      دانلود
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
      )}
    </div>
  );
}
