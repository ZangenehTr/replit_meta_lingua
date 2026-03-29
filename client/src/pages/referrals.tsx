import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Users, TrendingUp, DollarSign, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/ui/back-button';
import { useLanguage } from '@/hooks/use-language';

interface ReferralSettings {
  id: number;
  referrerPercentage: number;
  referredPercentage: number;
  totalReferrals: number;
  totalEnrollments: number;
  totalCommissionEarned: number;
}

interface ReferralStats {
  totalShares: number;
  totalClicks: number;
  totalEnrollments: number;
  totalCommissionEarned: number;
  conversionRate: number;
}

interface Course {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  description: string;
  language: string;
  level: string;
}

interface PayoutRecord {
  id: number;
  referrerCreditAwarded: string;
  referredCreditAwarded: string;
  coursePaymentId: number | null;
  createdAt: string;
  referrerId: number | null;
  referrerFirst: string | null;
  referrerLast: string | null;
  referrerPhone: string | null;
  referredId: number | null;
}

interface PayoutAuditResponse {
  payouts: PayoutRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ReferralsPage() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [referrerPercentage, setReferrerPercentage] = useState(15);
  const [referredPercentage, setReferredPercentage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [payoutData, setPayoutData] = useState<PayoutAuditResponse | null>(null);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [utmData, setUtmData] = useState<{ enrollmentsByUtm: any[]; registrationsByUtm: any[] } | null>(null);
  const [utmLoading, setUtmLoading] = useState(false);
  const { toast } = useToast();
  const { currentLanguage, t, isRTL } = useLanguage();

  useEffect(() => {
    fetchReferralData();
    fetchCourses();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const [settingsRes, statsRes] = await Promise.all([
        fetch('/api/referrals/settings', { headers }),
        fetch('/api/referrals/stats', { headers })
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        setReferrerPercentage(settingsData.referrerPercentage);
        setReferredPercentage(settingsData.referredPercentage);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const updateReferralSettings = async () => {
    if (referrerPercentage + referredPercentage > 20) {
      toast({
        title: currentLanguage === 'fa' ? "خطا" : currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'fa' ? "مجموع درصد کمیسیون نمی‌تواند بیش از 20% باشد" :
                    currentLanguage === 'ar' ? "لا يمكن أن يتجاوز إجمالي نسبة العمولة 20%" :
                    "Total commission percentage cannot exceed 20%",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        toast({
          title: currentLanguage === 'fa' ? "خطا در احراز هویت" : currentLanguage === 'ar' ? "خطأ في المصادقة" : "Authentication Error",
          description: currentLanguage === 'fa' ? "لطفاً دوباره وارد شوید" : currentLanguage === 'ar' ? "يرجى تسجيل الدخول مرة أخرى" : "Please log in again",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      const response = await fetch('/api/referrals/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          referrerPercentage,
          referredPercentage,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSettings(responseData);
        toast({
          title: currentLanguage === 'fa' ? "موفق" : currentLanguage === 'ar' ? "نجح" : "Success",
          description: currentLanguage === 'fa' ? "تنظیمات کمیسیون بروزرسانی شد" :
                      currentLanguage === 'ar' ? "تم تحديث إعدادات العمولة" :
                      "Commission settings updated successfully",
          duration: 3000,
        });
      } else {
        throw new Error(responseData.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Referral settings update error:', error);
      toast({
        title: currentLanguage === 'fa' ? "خطا" : currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'fa' ? "خطا در بروزرسانی تنظیمات" :
                    currentLanguage === 'ar' ? "خطأ في تحديث الإعدادات" :
                    `Failed to update settings: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const fetchUtmBreakdown = async () => {
    setUtmLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/attribution/utm-breakdown", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUtmData(await res.json());
    } catch (err) {
      console.error("Error fetching UTM breakdown:", err);
    } finally {
      setUtmLoading(false);
    }
  };

  const fetchPayoutAudit = async (pg: number) => {
    setPayoutLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/admin/referrals/payout-audit?page=${pg}&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayoutData(data);
      }
    } catch (err) {
      console.error("Error fetching payout audit:", err);
    } finally {
      setPayoutLoading(false);
    }
  };

  const generateCourseReferralLink = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/refer`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        return data.shareUrl;
      }
      throw new Error('Failed to generate referral link');
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ایجاد لینک معرفی",
        variant: "destructive",
      });
      return null;
    }
  };

  const shareViaSMS = async (courseId: number, courseTitle: string) => {
    const shareUrl = await generateCourseReferralLink(courseId);
    if (shareUrl) {
      const message = `سلام! دوره عالی "${courseTitle}" رو بهت پیشنهاد می‌دم. با این لینک ثبت‌نام کن و تخفیف بگیر: ${shareUrl}`;
      window.open(`sms:?body=${encodeURIComponent(message)}`);
    }
  };

  const shareViaWhatsApp = async (courseId: number, courseTitle: string) => {
    const shareUrl = await generateCourseReferralLink(courseId);
    if (shareUrl) {
      const message = `سلام! دوره عالی "${courseTitle}" رو بهت پیشنهاد می‌دم. با این لینک ثبت‌نام کن و تخفیف بگیر: ${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  };

  const totalPercentage = referrerPercentage + referredPercentage;
  const remainingPercentage = 20 - totalPercentage;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <BackButton href="/dashboard" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {currentLanguage === 'fa' ? 'سیستم معرفی دوره‌ها' : 
           currentLanguage === 'ar' ? 'نظام إحالة الدورات' : 
           'Course Referral System'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {currentLanguage === 'fa' ? 'با معرفی دوره‌ها به دوستان، کمیسیون دریافت کنید (حداکثر 20% از قیمت دوره)' :
           currentLanguage === 'ar' ? 'احصل على عمولة من خلال إحالة الدورات للأصدقاء (حد أقصى 20% من سعر الدورة)' :
           'Earn commission by referring courses to friends (maximum 20% of course price)'}
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full" onValueChange={(v) => {
        if (v === "payout-audit") fetchPayoutAudit(1);
        if (v === "attribution") fetchUtmBreakdown();
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">
            {currentLanguage === 'fa' ? 'تنظیمات' : 
             currentLanguage === 'ar' ? 'الإعدادات' : 
             'Settings'}
          </TabsTrigger>
          <TabsTrigger value="stats">
            {currentLanguage === 'fa' ? 'آمار' : 
             currentLanguage === 'ar' ? 'الإحصائيات' : 
             'Stats'}
          </TabsTrigger>
          <TabsTrigger value="payout-audit">
            {currentLanguage === 'fa' ? 'حسابرسی' : 
             currentLanguage === 'ar' ? 'التدقيق' : 
             'Payouts'}
          </TabsTrigger>
          <TabsTrigger value="attribution">
            {currentLanguage === 'fa' ? 'منبع ترافیک' : 
             currentLanguage === 'ar' ? 'مصدر الزيارات' : 
             'Attribution'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {currentLanguage === 'fa' ? 'تنظیمات توزیع کمیسیون' :
                 currentLanguage === 'ar' ? 'إعدادات توزيع العمولة' :
                 'Commission Distribution Settings'}
              </CardTitle>
              <CardDescription>
                {currentLanguage === 'fa' ? 'تعیین کنید که 20% کمیسیون چگونه بین شما و فرد معرفی‌شده تقسیم شود' :
                 currentLanguage === 'ar' ? 'حدد كيف يتم تقسيم عمولة 20% بينك وبين الشخص المُحال' :
                 'Determine how the 20% commission is split between you and the referred person'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="referrer">
                    {currentLanguage === 'fa' ? 'درصد کمیسیون شما' :
                     currentLanguage === 'ar' ? 'نسبة عمولتك' :
                     'Your Commission Percentage'}
                  </Label>
                  <Input
                    id="referrer"
                    type="number"
                    min="0"
                    max="20"
                    value={referrerPercentage}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      if (newValue >= 0 && newValue <= 20) {
                        setReferrerPercentage(newValue);
                        setReferredPercentage(20 - newValue); // Auto-adjust to maintain 20% total
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500">
                    {currentLanguage === 'fa' ? 'درصدی که شما از هر فروش دریافت می‌کنید' :
                     currentLanguage === 'ar' ? 'النسبة التي تحصل عليها من كل بيعة' :
                     'Percentage you earn from each sale'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referred">
                    {currentLanguage === 'fa' ? 'درصد تخفیف فرد معرفی‌شده' :
                     currentLanguage === 'ar' ? 'نسبة خصم الشخص المُحال' :
                     'Referred Person Discount Percentage'}
                  </Label>
                  <Input
                    id="referred"
                    type="number"
                    min="0"
                    max="20"
                    value={referredPercentage}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      if (newValue >= 0 && newValue <= 20) {
                        setReferredPercentage(newValue);
                        setReferrerPercentage(20 - newValue); // Auto-adjust to maintain 20% total
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500">
                    درصد تخفیفی که فرد معرفی‌شده دریافت می‌کند
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>مجموع استفاده شده:</span>
                  <span className={totalPercentage > 20 ? 'text-red-500' : 'text-green-500'}>
                    {totalPercentage}%
                  </span>
                </div>
                <Progress value={Math.min(totalPercentage, 20)} className="w-full" />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>باقی‌مانده: {Math.max(remainingPercentage, 0)}%</span>
                  <span>حداکثر: 20%</span>
                </div>
              </div>

              {totalPercentage > 20 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    مجموع درصدها نمی‌تواند بیش از 20% باشد
                  </p>
                </div>
              )}

              <Button 
                onClick={updateReferralSettings} 
                className="w-full"
                disabled={totalPercentage > 20}
              >
                ذخیره تنظیمات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تعداد اشتراک‌گذاری</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalShares || 0}</div>
                <p className="text-xs text-muted-foreground">
                  لینک‌های ارسال شده
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تعداد بازدید</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalClicks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  کلیک روی لینک‌ها
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تعداد ثبت‌نام</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ثبت‌نام‌های موفق
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل کمیسیون</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(stats?.totalCommissionEarned || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  تومان دریافتی
                </p>
              </CardContent>
            </Card>
          </div>

          {stats && stats.totalClicks > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>نرخ تبدیل</CardTitle>
                <CardDescription>
                  درصد افرادی که پس از کلیک روی لینک، ثبت‌نام کرده‌اند
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>نرخ تبدیل:</span>
                    <span className="font-medium">
                      {((stats.totalEnrollments / stats.totalClicks) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(stats.totalEnrollments / stats.totalClicks) * 100} 
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payout-audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {currentLanguage === 'fa' ? 'گزارش پرداخت کمیسیون‌ها' :
                 currentLanguage === 'ar' ? 'تقرير مدفوعات العمولات' :
                 'Referral Commission Payout Report'}
              </CardTitle>
              <CardDescription>
                {currentLanguage === 'fa' ? 'تمام کمیسیون‌های پرداخت‌شده به معرفان و دانشجویان معرفی‌شده' :
                 currentLanguage === 'ar' ? 'جميع العمولات المدفوعة للمحيلين والطلاب المحالين' :
                 'All commissions paid to referrers and referred students'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : !payoutData || payoutData.payouts.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  {currentLanguage === 'fa' ? 'هنوز پرداختی ثبت نشده است' :
                   currentLanguage === 'ar' ? 'لا توجد مدفوعات مسجلة بعد' :
                   'No payouts recorded yet'}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="pb-2 text-start">
                            {currentLanguage === 'fa' ? 'معرف' : 'Referrer'}
                          </th>
                          <th className="pb-2 text-start">
                            {currentLanguage === 'fa' ? 'تلفن معرف' : 'Referrer Phone'}
                          </th>
                          <th className="pb-2 text-start">
                            {currentLanguage === 'fa' ? 'کمیسیون معرف' : 'Referrer Credit'}
                          </th>
                          <th className="pb-2 text-start">
                            {currentLanguage === 'fa' ? 'کمیسیون دانشجو' : 'Referred Credit'}
                          </th>
                          <th className="pb-2 text-start">
                            {currentLanguage === 'fa' ? 'تاریخ' : 'Date'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payoutData.payouts.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-2">
                              {row.referrerFirst || row.referrerLast
                                ? `${row.referrerFirst ?? ''} ${row.referrerLast ?? ''}`.trim()
                                : `ID ${row.referrerId ?? '—'}`}
                            </td>
                            <td className="py-2 text-gray-500 text-xs">{row.referrerPhone ?? '—'}</td>
                            <td className="py-2 font-medium text-green-600">
                              {Number(row.referrerCreditAwarded).toLocaleString()} 
                              {currentLanguage === 'fa' ? ' تومان' : ''}
                            </td>
                            <td className="py-2 font-medium text-blue-600">
                              {Number(row.referredCreditAwarded).toLocaleString()}
                              {currentLanguage === 'fa' ? ' تومان' : ''}
                            </td>
                            <td className="py-2 text-gray-500 text-xs">
                              {new Date(row.createdAt).toLocaleDateString(
                                currentLanguage === 'fa' ? 'fa-IR' : 'en-US'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {payoutData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={payoutPage <= 1 || payoutLoading}
                        onClick={() => {
                          const next = payoutPage - 1;
                          setPayoutPage(next);
                          fetchPayoutAudit(next);
                        }}
                      >
                        {currentLanguage === 'fa' ? 'قبلی' : 'Prev'}
                      </Button>
                      <span className="text-sm text-gray-500">
                        {currentLanguage === 'fa'
                          ? `صفحه ${payoutPage} از ${payoutData.totalPages}`
                          : `Page ${payoutPage} of ${payoutData.totalPages}`}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={payoutPage >= payoutData.totalPages || payoutLoading}
                        onClick={() => {
                          const next = payoutPage + 1;
                          setPayoutPage(next);
                          fetchPayoutAudit(next);
                        }}
                      >
                        {currentLanguage === 'fa' ? 'بعدی' : 'Next'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {currentLanguage === 'fa' ? 'گزارش منبع ثبت‌نام‌ها' :
                 currentLanguage === 'ar' ? 'تقرير مصادر التسجيل' :
                 'Enrollment Attribution Report (UTM)'}
              </CardTitle>
              <CardDescription>
                {currentLanguage === 'fa' ? 'تعداد ثبت‌نام‌ها و کاربران جدید به تفکیک منبع ترافیک (UTM)' :
                 currentLanguage === 'ar' ? 'عدد التسجيلات والمستخدمين الجدد حسب مصدر الزيارات' :
                 'Enrollments and new users grouped by UTM source, medium, and campaign'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {utmLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : !utmData ? (
                <p className="text-center text-gray-400 py-8">
                  {currentLanguage === 'fa' ? 'داده‌ای موجود نیست' :
                   currentLanguage === 'ar' ? 'لا توجد بيانات' :
                   'No data available'}
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">
                      {currentLanguage === 'fa' ? 'ثبت‌نام‌های دوره بر اساس UTM' : 'Course Enrollments by UTM'}
                    </h3>
                    {utmData.enrollmentsByUtm.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        {currentLanguage === 'fa' ? 'هنوز داده‌ای ثبت نشده' : 'No enrollment UTM data yet'}
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-gray-500">
                            <th className="pb-2 text-start">{currentLanguage === 'fa' ? 'منبع' : 'Source'}</th>
                            <th className="pb-2 text-start">{currentLanguage === 'fa' ? 'رسانه' : 'Medium'}</th>
                            <th className="pb-2 text-start">{currentLanguage === 'fa' ? 'کمپین' : 'Campaign'}</th>
                            <th className="pb-2 text-end">{currentLanguage === 'fa' ? 'تعداد' : 'Count'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {utmData.enrollmentsByUtm.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-2">{row.utmSource ?? '—'}</td>
                              <td className="py-2 text-gray-500">{row.utmMedium ?? '—'}</td>
                              <td className="py-2 text-gray-500">{row.utmCampaign ?? '—'}</td>
                              <td className="py-2 text-end font-medium">{row.totalEnrollments}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">
                      {currentLanguage === 'fa' ? 'کاربران جدید بر اساس UTM' : 'New User Registrations by UTM'}
                    </h3>
                    {utmData.registrationsByUtm.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        {currentLanguage === 'fa' ? 'هنوز داده‌ای ثبت نشده' : 'No registration UTM data yet'}
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-gray-500">
                            <th className="pb-2 text-start">{currentLanguage === 'fa' ? 'منبع' : 'Source'}</th>
                            <th className="pb-2 text-start">{currentLanguage === 'fa' ? 'رسانه' : 'Medium'}</th>
                            <th className="pb-2 text-start">{currentLanguage === 'fa' ? 'کمپین' : 'Campaign'}</th>
                            <th className="pb-2 text-end">{currentLanguage === 'fa' ? 'کاربران' : 'Users'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {utmData.registrationsByUtm.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-2">{row.utmSource ?? '—'}</td>
                              <td className="py-2 text-gray-500">{row.utmMedium ?? '—'}</td>
                              <td className="py-2 text-gray-500">{row.utmCampaign ?? '—'}</td>
                              <td className="py-2 text-end font-medium">{row.totalRegistrations}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}