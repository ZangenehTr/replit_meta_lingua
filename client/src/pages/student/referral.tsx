import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { BackButton } from "@/components/ui/back-button";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Share2, Users, TrendingUp, Gift, Copy, Phone, MessageCircle,
  Star, Award, ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReferralStats {
  totalReferrals: number;
  totalConverted: number;
  totalCreditsEarned: number;
  conversionRate: number;
}

interface ReferralSettings {
  referrerPercentage: number;
  referredPercentage: number;
}

interface ReferralLink {
  id: number;
  code: string;
  courseId: number | null;
  courseName: string | null;
  shareUrl: string;
  clicks: number;
  conversions: number;
  totalCommission: number;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  price: number;
}

export default function StudentReferralPage() {
  const { toast } = useToast();
  const { currentLanguage, isRTL } = useLanguage();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  // Per-course links generated on demand (same code, different course param in URL)
  const [courseLinks, setCourseLinks] = useState<Record<number, ReferralLink>>({});

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: settings } = useQuery<ReferralSettings>({
    queryKey: ["/api/referrals/settings"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const { data: links = [], refetch: refetchLinks } = useQuery<ReferralLink[]>({
    queryKey: ["/api/referrals/links"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/links", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch links");
      return res.json();
    },
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async (courseId?: number) => {
      const res = await apiRequest("/api/referrals/links", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      return { link: res as ReferralLink, courseId };
    },
    onSuccess: ({ link, courseId }) => {
      if (!courseId) {
        refetchLinks();
      } else {
        setCourseLinks((prev) => ({ ...prev, [courseId]: { ...link, courseId } }));
      }
      toast({
        title: currentLanguage === "fa" ? "لینک ایجاد شد" : "Link Created",
        description: currentLanguage === "fa"
          ? "لینک دعوت شما آماده است."
          : "Your referral link is ready.",
      });
    },
  });

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: currentLanguage === "fa" ? "کپی شد" : "Copied",
        description: currentLanguage === "fa" ? "لینک کپی شد" : "Link copied to clipboard",
      });
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  const shareViaWhatsApp = (link: ReferralLink) => {
    const msg = currentLanguage === "fa"
      ? `سلام! با این لینک در متالینگوا ثبت‌نام کن و ${settings?.referredPercentage ?? 5}% تخفیف بگیر:\n${link.shareUrl}`
      : `Join Meta Lingua and get ${settings?.referredPercentage ?? 5}% off your first course:\n${link.shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const shareViaSMS = (link: ReferralLink) => {
    const msg = currentLanguage === "fa"
      ? `سلام! با این لینک در متالینگوا ثبت‌نام کن و تخفیف بگیر: ${link.shareUrl}`
      : `Join Meta Lingua and get a discount: ${link.shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(msg)}`);
  };

  const t = (fa: string, en: string) => currentLanguage === "fa" ? fa : en;
  const generalLink = links.find((l) => !l.courseId);

  return (
    <AppLayout>
      <div className={`p-6 max-w-4xl mx-auto ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-4 mb-6">
          <BackButton href="/dashboard" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("دعوت دوستان و کسب درآمد", "Invite Friends & Earn")}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t(
                `با دعوت از دوستان ${settings?.referrerPercentage ?? 15}% کمیسیون دریافت کنید`,
                `Earn ${settings?.referrerPercentage ?? 15}% commission for each referral`
              )}
            </p>
          </div>
        </div>

        {/* How it works */}
        <Card className="mb-6 border-2 border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Gift className="h-5 w-5" />
              {t("چطور کار می‌کند؟", "How it works")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Share2, step: "1", fa: "لینک دعوت بسازید", en: "Create your invite link" },
                { icon: Users, step: "2", fa: "با دوستان به اشتراک بگذارید", en: "Share with friends" },
                { icon: Award, step: "3", fa: `${settings?.referrerPercentage ?? 15}% کمیسیون دریافت کنید`, en: `Earn ${settings?.referrerPercentage ?? 15}% commission` },
              ].map(({ icon: Icon, step, fa, en }) => (
                <div key={step} className="flex flex-col items-center text-center p-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">
                    {step}
                  </div>
                  <Icon className="h-6 w-6 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t(fa, en)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-white/60 dark:bg-black/20 rounded-lg text-sm text-gray-600 dark:text-gray-300">
              <Star className="inline h-4 w-4 text-yellow-500 mr-1" />
              {t(
                `دوستت هم ${settings?.referredPercentage ?? 5}% تخفیف روی اولین دوره‌اش می‌گیره!`,
                `Your friend also gets ${settings?.referredPercentage ?? 5}% off their first course!`
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Share2, label: t("لینک‌های ارسالی", "Links Shared"), value: stats?.totalReferrals ?? 0, color: "text-blue-600" },
            { icon: Users, label: t("نرخ تبدیل", "Conv. Rate"), value: `${stats?.conversionRate ?? 0}%`, color: "text-purple-600" },
            { icon: TrendingUp, label: t("ثبت‌نام‌های موفق", "Conversions"), value: stats?.totalConverted ?? 0, color: "text-green-600" },
            { icon: Gift, label: t("کمیسیون (تومان)", "Commission (T)"), value: (stats?.totalCreditsEarned ?? 0).toLocaleString(), color: "text-yellow-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <Icon className={`h-5 w-5 ${color} mb-1`} />
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* General referral link */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("لینک دعوت عمومی", "General Referral Link")}</CardTitle>
            <CardDescription>
              {t("این لینک را با هر کسی به اشتراک بگذارید", "Share this link with anyone")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generalLink ? (
              <div className="flex gap-2">
                <Input value={generalLink.shareUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generalLink.shareUrl, generalLink.id)}
                >
                  {copiedId === generalLink.id ? "✓" : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => shareViaWhatsApp(generalLink)}>
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => shareViaSMS(generalLink)}>
                  <Phone className="h-4 w-4 text-blue-500" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => createLinkMutation.mutate(undefined)} disabled={createLinkMutation.isPending}>
                <Share2 className="h-4 w-4 mr-2" />
                {t("ایجاد لینک دعوت", "Create Referral Link")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Per-course links */}
        <Card>
          <CardHeader>
            <CardTitle>{t("لینک‌های اختصاصی دوره", "Course-Specific Links")}</CardTitle>
            <CardDescription>
              {t("برای هر دوره لینک اختصاصی بسازید", "Create a link for a specific course")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.slice(0, 6).map((course) => {
              const courseLink = courseLinks[course.id];
              return (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{course.title}</p>
                    {courseLink && (
                      <p className="text-xs text-blue-500 mt-1 truncate font-mono">{courseLink.shareUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {courseLink ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await navigator.clipboard.writeText(courseLink.shareUrl);
                            setCopiedUrl(courseLink.shareUrl);
                            setTimeout(() => setCopiedUrl(null), 2000);
                          }}
                        >
                          {copiedUrl === courseLink.shareUrl ? "✓" : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => shareViaWhatsApp(courseLink)}>
                          <MessageCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createLinkMutation.mutate(course.id)}
                        disabled={createLinkMutation.isPending}
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        {t("ایجاد لینک", "Create Link")}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                {t("دوره‌ای برای نمایش وجود ندارد", "No courses available")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
