import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/app-layout";
import { useLanguage } from "@/hooks/use-language";
import { Trophy, Users, TrendingUp, DollarSign, Share2 } from "lucide-react";

interface LeaderboardEntry {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  code: string;
  totalReferrals: number;
  totalConverted: number;
  totalCreditsEarned: number;
}

interface GlobalStats {
  totalReferralLinks: number;
  totalClicks: number;
  totalEnrollments: number;
  totalCommissionPaid: number;
}

export default function ReferralLeaderboardPage() {
  const { currentLanguage, isRTL } = useLanguage();
  const t = (fa: string, en: string) => currentLanguage === "fa" ? fa : en;

  const { data: leaderboard = [], isLoading: leaderLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/admin/referrals/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/referrals/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const { data: globalStats } = useQuery<GlobalStats>({
    queryKey: ["/api/referrals/global-stats"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/global-stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
  const rankIcons = ["🥇", "🥈", "🥉"];

  return (
    <AppLayout>
      <div className={`p-6 max-w-5xl mx-auto ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {t("جدول رتبه‌بندی معرف‌ها", "Referral Leaderboard")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("کاربرانی که بیشترین معرفی داشته‌اند", "Users with the most successful referrals")}
          </p>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Share2, label: t("کل لینک‌ها", "Total Links"), value: globalStats?.totalReferralLinks ?? "—", color: "text-blue-600" },
            { icon: Users, label: t("کل کلیک‌ها", "Total Clicks"), value: globalStats?.totalClicks ?? "—", color: "text-purple-600" },
            { icon: TrendingUp, label: t("ثبت‌نام‌های موفق", "Conversions"), value: globalStats?.totalEnrollments ?? "—", color: "text-green-600" },
            { icon: DollarSign, label: t("کل کمیسیون پرداختی", "Total Commission"), value: (globalStats?.totalCommissionPaid ?? 0).toLocaleString(), color: "text-yellow-600" },
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

        {/* Leaderboard table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("برترین معرف‌ها", "Top Referrers")}</CardTitle>
            <CardDescription>
              {t("رتبه‌بندی بر اساس تعداد ثبت‌نام‌های موفق", "Ranked by successful enrollments")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t("هنوز معرفی‌ای ثبت نشده است", "No referrals recorded yet")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      index === 0
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                        : index === 1
                        ? "bg-gray-50 border-gray-200 dark:bg-gray-900"
                        : index === 2
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
                        : "border-transparent"
                    }`}
                  >
                    <div className={`text-2xl w-8 text-center ${rankColors[index] ?? "text-gray-400"}`}>
                      {index < 3 ? rankIcons[index] : `#${index + 1}`}
                    </div>
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {(entry.firstName?.[0] ?? "") + (entry.lastName?.[0] ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{entry.phoneNumber}</p>
                    </div>
                    <div className="flex gap-4 text-sm text-center">
                      <div>
                        <div className="font-bold text-blue-600">{entry.totalReferrals}</div>
                        <div className="text-gray-500 text-xs">{t("لینک", "Links")}</div>
                      </div>
                      <div>
                        <div className="font-bold text-green-600">{entry.totalConverted}</div>
                        <div className="text-gray-500 text-xs">{t("ثبت‌نام", "Signups")}</div>
                      </div>
                      <div>
                        <div className="font-bold text-yellow-600">
                          {entry.totalCreditsEarned.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-xs">{t("کمیسیون", "Commission")}</div>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-yellow-400 text-yellow-900 border-0">
                        {t("برترین", "Top Referrer")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
