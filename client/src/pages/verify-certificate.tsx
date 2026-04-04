import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";

interface VerifyResult {
  valid: boolean;
  isExpired: boolean;
  message: string;
  certificate?: {
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    revokeReason: string | null;
    studentFirstName: string | null;
    studentLastName: string | null;
    courseTitle: string | null;
    courseLevel: string | null;
    courseLanguage: string | null;
  };
}

export default function VerifyCertificatePage() {
  const [, params] = useRoute("/verify-certificate/:number");
  const [inputNumber, setInputNumber] = useState(params?.number || "");
  const [queryNumber, setQueryNumber] = useState(params?.number || "");

  const { data, isLoading, isFetching } = useQuery<VerifyResult>({
    queryKey: ["/api/certificates/verify", queryNumber],
    queryFn: () => apiRequest(`/api/certificates/verify/${queryNumber.toUpperCase().trim()}`),
    enabled: !!queryNumber,
    retry: false,
  });

  function handleSearch() {
    if (inputNumber.trim()) {
      setQueryNumber(inputNumber.trim().toUpperCase());
    }
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fa-IR") : null;

  const cert = data?.certificate;
  const loading = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">تأیید گواهینامه</h1>
          <p className="text-muted-foreground mt-1">MetaLingo Academy</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <Input
                placeholder="شماره گواهینامه را وارد کنید (مثال: CERT-20250101-AB1234)"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-mono text-sm flex-1"
                aria-label="شماره گواهینامه"
              />
              <Button
                onClick={handleSearch}
                disabled={!inputNumber.trim() || loading}
                aria-label="جستجو"
              >
                <Search className="h-4 w-4 me-1.5" aria-hidden="true" />
                بررسی
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {loading && (
          <div className="text-center py-8 text-muted-foreground">در حال بررسی...</div>
        )}

        {!loading && data && (
          <Card
            className={`border-2 ${
              data.valid
                ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                {data.valid ? (
                  <>
                    <CheckCircle2 className="h-7 w-7 text-green-500" aria-hidden="true" />
                    <span className="text-green-700 dark:text-green-400">گواهینامه معتبر است</span>
                  </>
                ) : cert?.status === "revoked" ? (
                  <>
                    <XCircle className="h-7 w-7 text-red-500" aria-hidden="true" />
                    <span className="text-red-700 dark:text-red-400">گواهینامه باطل شده</span>
                  </>
                ) : data.isExpired ? (
                  <>
                    <AlertTriangle className="h-7 w-7 text-yellow-500" aria-hidden="true" />
                    <span className="text-yellow-700 dark:text-yellow-400">گواهینامه منقضی شده</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-7 w-7 text-red-500" aria-hidden="true" />
                    <span className="text-red-700 dark:text-red-400">گواهینامه یافت نشد</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            {cert && (
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">صاحب گواهینامه:</span>
                    <span className="font-semibold">
                      {cert.studentFirstName} {cert.studentLastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">دوره:</span>
                    <span className="font-semibold text-end max-w-[60%]">{cert.courseTitle}</span>
                  </div>
                  {cert.courseLevel && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">سطح:</span>
                      <span>{cert.courseLevel}</span>
                    </div>
                  )}
                  {cert.courseLanguage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">زبان:</span>
                      <span>{cert.courseLanguage}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاریخ صدور:</span>
                    <span>{formatDate(cert.issuedAt)}</span>
                  </div>
                  {cert.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاریخ انقضا:</span>
                      <span>{formatDate(cert.expiresAt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">شماره گواهینامه:</span>
                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {cert.certificateNumber}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">وضعیت:</span>
                    <Badge variant={data.valid ? "default" : "destructive"}>
                      {data.valid ? "معتبر" : cert.status === "revoked" ? "باطل" : "منقضی"}
                    </Badge>
                  </div>
                </div>

                {cert.status === "revoked" && cert.revokeReason && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-md text-sm text-red-700 dark:text-red-400">
                    <strong>دلیل باطل شدن:</strong> {cert.revokeReason}
                  </div>
                )}
              </CardContent>
            )}

            {!cert && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{data.message}</p>
              </CardContent>
            )}
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          این صفحه برای تأیید اعتبار گواهینامه‌های صادر شده توسط آکادمی MetaLingo است.
        </p>
      </div>
    </div>
  );
}
