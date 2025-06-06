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

export default function ReferralsPage() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [referrerPercentage, setReferrerPercentage] = useState(15);
  const [referredPercentage, setReferredPercentage] = useState(5);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
    fetchCourses();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        fetch('/api/referrals/settings'),
        fetch('/api/referrals/stats')
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
        title: "خطا",
        description: "مجموع درصد کمیسیون نمی‌تواند بیش از 20% باشد",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/referrals/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerPercentage,
          referredPercentage,
        }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        toast({
          title: "موفق",
          description: "تنظیمات کمیسیون بروزرسانی شد",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی تنظیمات",
        variant: "destructive",
      });
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
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          سیستم معرفی دوره‌ها
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          با معرفی دوره‌ها به دوستان، کمیسیون دریافت کنید (حداکثر 20% از قیمت دوره)
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">تنظیمات کمیسیون</TabsTrigger>
          <TabsTrigger value="courses">معرفی دوره‌ها</TabsTrigger>
          <TabsTrigger value="stats">آمار و گزارش</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                تنظیمات توزیع کمیسیون
              </CardTitle>
              <CardDescription>
                تعیین کنید که 20% کمیسیون چگونه بین شما و فرد معرفی‌شده تقسیم شود
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="referrer">درصد کمیسیون شما</Label>
                  <Input
                    id="referrer"
                    type="number"
                    min="0"
                    max="20"
                    value={referrerPercentage}
                    onChange={(e) => setReferrerPercentage(Number(e.target.value))}
                  />
                  <p className="text-sm text-gray-500">
                    درصدی که شما از هر فروش دریافت می‌کنید
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referred">درصد تخفیف فرد معرفی‌شده</Label>
                  <Input
                    id="referred"
                    type="number"
                    min="0"
                    max="20"
                    value={referredPercentage}
                    onChange={(e) => setReferredPercentage(Number(e.target.value))}
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

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="relative">
                <CardHeader>
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {course.description.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{course.language}</Badge>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    
                    <div className="text-lg font-bold text-green-600">
                      {course.price.toLocaleString()} تومان
                    </div>

                    <div className="text-sm text-gray-600">
                      کمیسیون شما: {((course.price * referrerPercentage) / 100).toLocaleString()} تومان
                    </div>

                    <div className="flex gap-2 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => shareViaSMS(course.id, course.title)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        SMS
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => shareViaWhatsApp(course.id, course.title)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
      </Tabs>
    </div>
  );
}