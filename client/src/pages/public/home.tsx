import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Users,
  BookOpen,
  Video,
  ArrowLeft,
  Star,
  Award,
  Play,
  CheckCircle,
  Target,
  Trophy,
  Gamepad2,
  MessageSquare,
  Brain,
  Clock,
  Calendar,
  ChevronLeft,
} from 'lucide-react';
import type { CmsBlogPost } from '@shared/schema';

interface PublicStats {
  students: number;
  teachers: number;
  courses: number;
}

interface HomepageContent {
  heroHeadline?: string;
  heroSubheadline?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  callerNTitle?: string;
  callerNDescription?: string;
  callerNFeature1?: string;
  callerNFeature2?: string;
  callerNFeature3?: string;
  callerNFeature4?: string;
  pillar1Title?: string;
  pillar1Desc?: string;
  pillar2Title?: string;
  pillar2Desc?: string;
  pillar3Title?: string;
  pillar3Desc?: string;
}

export default function PublicHome() {
  const testPrepImage1 = '/images/ielts_toefl_test_pre_2db77567.jpg';
  const callernImage1 = '/images/online_video_call_tu_7afdda6b.jpg';
  const callernImage2 = '/images/online_video_call_tu_4ad299e6.jpg';

  const { data: blogPosts = [] } = useQuery<CmsBlogPost[]>({
    queryKey: ['/api/cms/blog/posts', 'published'],
    queryFn: async () => {
      const res = await fetch(`/api/cms/blog/posts?status=published`);
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 3) : [];
    }
  });

  const { data: stats } = useQuery<PublicStats>({
    queryKey: ['/api/public/stats'],
    queryFn: async () => {
      const res = await fetch('/api/public/stats');
      return res.json();
    }
  });

  const { data: homepageContent } = useQuery<HomepageContent | null>({
    queryKey: ['/api/public/homepage-content'],
    queryFn: async () => {
      const res = await fetch('/api/public/homepage-content');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const hc = homepageContent || {};

  const pillars = [
    {
      icon: Brain,
      title: hc.pillar1Title || 'یادگیری هوشمند با AI',
      desc: hc.pillar1Desc || 'Lexi، دستیار هوش مصنوعی تو، برنامه‌درسی شخصی‌سازی‌شده بر اساس سطح و هدفت می‌سازه.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Video,
      title: hc.pillar2Title || 'تدریس زنده با CallerN',
      desc: hc.pillar2Desc || 'هر ساعت از شبانه‌روز، با یه استاد واقعی تماس بگیر. بدون رزرو، بدون انتظار.',
      color: 'from-cyan-500 to-teal-500',
    },
    {
      icon: Award,
      title: hc.pillar3Title || 'دوره‌های تخصصی آزمون',
      desc: hc.pillar3Desc || 'IELTS، TOEFL، GRE، PTE — با مسیر آموزشی ساختارمند و گواهینامه معتبر.',
      color: 'from-teal-500 to-green-500',
    },
  ];

  const callerNFeatures = [
    { icon: Clock, text: hc.callerNFeature1 || 'جلسه ۱۰ تا ۱۵ دقیقه‌ای — بدون اتلاف وقت' },
    { icon: Brain, text: hc.callerNFeature2 || 'AI supervisor کنارته — تلفظ، گرامر، لهجه رو آنالیز می‌کنه' },
    { icon: Calendar, text: hc.callerNFeature3 || 'هر ساعت از شبانه‌روز — حتی ساعت ۲ نصفه‌شب' },
    { icon: Users, text: hc.callerNFeature4 || 'استادهای تأییدشده با تجربه تدریس بین‌المللی' },
  ];

  const lexiFeatures = [
    { icon: MessageSquare, text: 'مکالمه طبیعی به زبان انگلیسی با AI' },
    { icon: Zap, text: 'بازخورد فوری روی تلفظ و گرامر' },
    { icon: Trophy, text: 'XP جمع کن، لول بالا برو، با LinguaQuest بازی کن' },
    { icon: Target, text: 'چالش روزانه — فقط ۵ دقیقه، هر روز' },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title="MetaLingo — یادگیری هوشمند زبان"
        description="با MetaLingo زبان انگلیسی رو هوشمند یاد بگیر. IELTS، TOEFL، GRE، PTE و گفتگوی روان. تدریس زنده با CallerN، هوش مصنوعی با Lexi، آزمون رایگان Placement."
        keywords="یادگیری زبان انگلیسی، آموزش آیلتس، تدریس آنلاین، متالینگو، IELTS، TOEFL"
      />

      {/* ——— HERO ——— */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50" dir="rtl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14 lg:py-16 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ——— Text column (leading side in RTL = right) ——— */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 mb-5">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">هوش مصنوعی + تدریس زنده + گیمیفیکیشن</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-5 leading-tight">
                <span className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
                  {hc.heroHeadline || 'زبان انگلیسی رو هوشمند یاد بگیر'}
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                {hc.heroSubheadline || 'برای IELTS، TOEFL، GRE یا گفتگوی روان — MetaLingo با AI، تدریس زنده، و گیمیفیکیشن کنارته.'}
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg px-8 h-14 shadow-lg shadow-blue-500/30"
                >
                  <Link href="/auth?tab=register" className="flex items-center gap-2">
                    {hc.ctaPrimary || 'همین حالا شروع کن'}
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14">
                  <Link href="/courses" className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {hc.ctaSecondary || 'تدریس‌ها را ببین'}
                  </Link>
                </Button>
              </div>
            </div>

            {/* ——— Visual illustration (trailing side in RTL = left) ——— */}
            <div className="hidden lg:block relative h-96" aria-hidden="true">
              {/* Live session card */}
              <div className="absolute top-0 left-8 w-64 bg-white rounded-2xl shadow-xl border border-blue-100 p-4 z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-base font-bold shrink-0">
                    س
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">جلسه زنده با CallerN</p>
                    <p className="text-[11px] text-gray-500">استاد سارا — آنلاین</p>
                  </div>
                  <span className="flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute h-2 w-2 rounded-full bg-green-400 opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-green-500" />
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-blue-600 rounded-lg flex items-center justify-center h-8 text-white text-xs font-medium">
                    <Video className="h-3 w-3 me-1" />
                    ورود به جلسه
                  </div>
                </div>
              </div>

              {/* AI feedback bubble */}
              <div className="absolute top-32 right-4 w-56 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-3 z-20 text-white">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold mb-0.5">Lexi AI</p>
                    <p className="text-[11px] leading-snug opacity-90">آفرین! تلفظت ۹۲٪ دقیق بود. روی «th» بیشتر تمرین کن.</p>
                  </div>
                </div>
              </div>

              {/* LinguaQuest XP card */}
              <div className="absolute bottom-4 left-4 w-60 bg-white rounded-2xl shadow-xl border border-amber-100 p-4 z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-bold text-gray-900">LinguaQuest</span>
                  <span className="ms-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">سطح ۷</span>
                </div>
                <div className="mb-1.5">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>۱٬۲۵۰ XP</span>
                    <span>تا سطح بعد: ۲۵۰ XP</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-1">
                  {['🔥', '⭐', '🎯', '🏆', '💡'].map((emoji, i) => (
                    <span key={i} className="text-base">{emoji}</span>
                  ))}
                </div>
              </div>

              {/* IELTS badge floating */}
              <div className="absolute top-6 right-20 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-30">
                IELTS · TOEFL · GRE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— STATS BAR ——— */}
      <section className="border-y bg-white" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-600 mb-1">
                {stats ? `${stats.students.toLocaleString('fa-IR')}+` : '۱۰۰۰+'}
              </div>
              <div className="text-sm text-gray-500">زبان‌آموز فعال</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-cyan-600 mb-1">
                {stats ? `${stats.teachers.toLocaleString('fa-IR')}+` : '۵۰+'}
              </div>
              <div className="text-sm text-gray-500">استاد متخصص</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-600 mb-1">
                {stats ? `${stats.courses.toLocaleString('fa-IR')}+` : '۲۰+'}
              </div>
              <div className="text-sm text-gray-500">دوره فعال</div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— PLACEMENT STRIP ——— */}
      <section className="bg-gradient-to-l from-blue-700 to-cyan-600 py-12" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-right text-white">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl">
                  <span className="text-white font-black text-lg select-none">ML</span>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                  رایگان
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">
                نمی‌دونی از کجا شروع کنی؟
              </h2>
              <p className="text-white/90 text-base sm:text-lg font-medium mb-1">
                The shortest and the most intelligent way
              </p>
              <p className="text-white/75 text-sm">
                هوشمندترین و سریع‌ترین راه برای سنجش سطح زبانت — فقط ۱۰ دقیقه
              </p>
            </div>
            <div className="shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-50 text-lg px-10 h-14 font-bold shadow-lg"
              >
                <Link href="/take-test" className="flex items-center gap-2">
                  آزمون رایگان Placement
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ——— WHY METALINGO (3 PILLARS) ——— */}
      <section className="py-16 sm:py-24 bg-white" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">چرا MetaLingo؟</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              سه مزیت که MetaLingo رو از همه جدا می‌کنه
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={i} className="border-2 hover:border-blue-200 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-md`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 leading-relaxed">{p.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— CALLERN SPOTLIGHT ——— */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 py-16 sm:py-24" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm mb-6">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">تدریس زنده ۲۴ ساعته</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                <span className="text-cyan-300">
                  {hc.callerNTitle || 'یه استاد همیشه آماده‌ست، هر ساعت از شبانه‌روز'}
                </span>
              </h2>
              <p className="text-white/85 text-lg mb-8 leading-relaxed">
                {hc.callerNDescription || 'CallerN رو ساختیم تا هر وقت خواستی با یه استاد واقعی تمرین کنی. بدون رزرو قبلی، بدون صبر کردن.'}
              </p>
              <ul className="space-y-4 mb-8">
                {callerNFeatures.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-cyan-200" />
                      </div>
                      <span className="text-white/90">{f.text}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-gray-50 font-bold px-8 h-13"
                >
                  <Link href="/callern" className="flex items-center gap-2">
                    با یه استاد تماس بگیر
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/50 text-white hover:bg-white/10 px-8"
                >
                  <Link href="/auth?tab=register">
                    ثبت‌نام رایگان
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-video">
                <img
                  src={callernImage1}
                  alt="تدریس زنده آنلاین با استاد در MetaLingo CallerN"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 end-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-gray-800">۱۲ استاد آنلاین</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block relative rounded-3xl overflow-hidden shadow-xl aspect-video">
                <img
                  src={callernImage2}
                  alt="جلسه تدریس ویدیویی آنلاین"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-transparent to-transparent" />
                <div className="absolute top-4 start-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-gray-800">۴.۹ امتیاز از زبان‌آموزان</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— LEXI + LINGUAQUEST TEASER ——— */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              یادگیری که انگیزه می‌ده
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Lexi، AI‌یی که مثل یه دوست باهات انگلیسی تمرین می‌کنه — و LinguaQuest که یادگیری رو به بازی تبدیل می‌کنه
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lexi Card */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-md">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Lexi — دستیار AI تو</CardTitle>
                <p className="text-gray-500 leading-relaxed">
                  یه مکالمه‌زا هوشمند که تلفظ، گرامر و روانی کلامت رو بهتر می‌کنه. درست مثل داشتن یه دوست نیتیو.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {lexiFeatures.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{f.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  <Link href="/auth?tab=register" className="flex items-center justify-center gap-2">
                    با Lexi شروع کن
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* LinguaQuest Card */}
            <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-white overflow-hidden">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center mb-3 shadow-md">
                  <Gamepad2 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">LinguaQuest — یادگیری بازی‌گونه</CardTitle>
                <p className="text-gray-500 leading-relaxed">
                  XP جمع کن، به رتبه‌بندی برس، چالش روزانه انجام بده. یادگیری که حس یه بازی رو داره.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { value: '۱۹+', label: 'نوع بازی' },
                    { value: 'روزانه', label: 'چالش' },
                    { value: 'XP', label: 'سیستم امتیاز' },
                    { value: '🏆', label: 'لیدربورد' },
                  ].map((s, i) => (
                    <div key={i} className="bg-teal-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-black text-teal-700">{s.value}</div>
                      <div className="text-xs text-teal-600">{s.label}</div>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-teal-600 to-green-500 hover:from-teal-700 hover:to-green-600"
                >
                  <Link href="/auth?tab=register" className="flex items-center justify-center gap-2">
                    شروع بازی
                    <Play className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ——— TEST PREP SECTION ——— */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 to-blue-700 py-16 sm:py-24" dir="rtl">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 mb-6">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">آمادگی آزمون‌های بین‌المللی</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                IELTS، TOEFL، GRE، PTE<br />
                <span className="text-cyan-300">با مسیر درست یاد بگیر</span>
              </h2>
              <p className="text-white/85 text-lg mb-6 leading-relaxed">
                دوره‌های تخصصی برای هر آزمون، با استادهای مجرب و مسیر آموزشی دقیق. از سطح‌سنجی تا قبولی.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'محتوای بروز بر اساس فرمت جدید آزمون‌ها',
                  'جلسات تمرین Speaking با استادهای CallerN',
                  'آزمون‌های تمرینی با نمره‌دهی هوشمند',
                  'گواهینامه دوره پس از اتمام',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cyan-300 shrink-0 mt-0.5" />
                    <span className="text-white/90">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-white text-teal-700 hover:bg-gray-50 font-bold px-8">
                  <Link href="/curriculum" className="flex items-center gap-2">
                    مشاهده دوره‌ها
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/50 text-white hover:bg-white/10 px-8">
                  <Link href="/take-test">
                    تست سطح رایگان
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              <img
                src={testPrepImage1}
                alt="آمادگی برای آزمون IELTS و TOEFL در MetaLingo"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 end-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-teal-600" />
                  <div>
                    <div className="text-2xl font-black text-gray-900">۹۴٪</div>
                    <div className="text-sm text-gray-600">نرخ موفقیت زبان‌آموزان</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— BLOG TEASER ——— */}
      {blogPosts.length > 0 && (
        <section className="py-16 sm:py-24 bg-white" dir="rtl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">آخرین مقالات</h2>
                <p className="text-gray-500">نکات و راهکارهای یادگیری زبان</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/blog" className="flex items-center gap-2">
                  همه مقالات
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post: any) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-xs text-gray-400 mb-2">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fa-IR') : ''}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 leading-snug line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4">{post.excerpt || post.metaDescription}</p>
                    <Link href={`/blog/${post.slug}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      بیشتر بخوانید
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— FINAL CTA ——— */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-16" dir="rtl">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            آماده‌ای شروع کنی؟
          </h2>
          <p className="text-white/90 text-lg mb-8">
            اول سطحت رو بسنج، بعد مسیرت رو انتخاب کن. همه چیز رایگان.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-50 font-bold text-lg px-10 h-14">
              <Link href="/take-test" className="flex items-center gap-2">
                آزمون رایگان Placement
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/60 text-white hover:bg-white/10 text-lg px-10 h-14">
              <Link href="/auth?tab=register">
                ثبت‌نام رایگان
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
