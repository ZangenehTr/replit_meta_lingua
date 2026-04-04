import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import DOMPurify from 'dompurify';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { CallerNSpotlight } from '@/components/callern/CallerNSpotlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Star,
  Users,
  Video,
  BookOpen,
  ArrowLeft,
  Target,
  Clock,
  Calendar,
  MessageSquare,
  Award,
  Loader2,
  Quote,
} from 'lucide-react';

interface LandingPage {
  id: number;
  slug: string;
  programName: string;
  heroTitle: string;
  heroSubtitle: string | null;
  heroCtaPrimary: string | null;
  heroCtaSecondary: string | null;
  targetAudienceBullets: string[];
  examTipsHtml: string | null;
  testimonials: Array<{ quote: string; studentName: string; score: string; examType: string }>;
  faqItems: Array<{ q: string; a: string }>;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  featureBullets: string[];
  isPublished: boolean;
}

interface Teacher {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  teacherBio: string | null;
}

interface CourseCard {
  id: number;
  title: string;
  description: string | null;
  classType: string | null;
  deliveryMode: string | null;
  price: number | null;
  firstSessionDate: string | null;
  startTime: string | null;
  maxStudents: number | null;
  totalSessions: number | null;
}

interface UpcomingClass {
  id: number;
  title: string;
  classType: string | null;
  firstSessionDate: string | null;
  startTime: string | null;
  maxStudents: number | null;
  price: number | null;
  enrolledCount: number;
  remainingSpots: number | null;
}

const EXAM_CONFIG: Record<string, {
  color: string;
  gradient: string;
  icon: string;
  callerNText: string;
  tagline: string;
  stats: string;
}> = {
  ielts: {
    color: 'from-blue-600 to-cyan-500',
    gradient: 'from-blue-50 via-white to-cyan-50',
    icon: '🎯',
    callerNText: 'Speaking آیلتست رو تمرین کن — ۱۵ دقیقه با استاد',
    tagline: 'آموزش آیلتس آنلاین | کلاس IELTS خصوصی و گروهی',
    stats: 'بیش از ۵۰۰ دانشجو'
  },
  toefl: {
    color: 'from-purple-600 to-blue-500',
    gradient: 'from-purple-50 via-white to-blue-50',
    icon: '📚',
    callerNText: 'Integrated Writing رو با استاد مسلط بشو',
    tagline: 'آموزش TOEFL آنلاین | کلاس تافل خصوصی و گروهی',
    stats: 'بیش از ۳۰۰ دانشجو'
  },
  gre: {
    color: 'from-emerald-600 to-teal-500',
    gradient: 'from-emerald-50 via-white to-teal-50',
    icon: '🧠',
    callerNText: 'Verbal رو با استاد GRE کار کن',
    tagline: 'آموزش GRE آنلاین | کلاس جی آر ای خصوصی',
    stats: 'بیش از ۲۰۰ دانشجو'
  },
  pte: {
    color: 'from-orange-600 to-amber-500',
    gradient: 'from-orange-50 via-white to-amber-50',
    icon: '💻',
    callerNText: 'Describe Image رو با استاد PTE تمرین کن',
    tagline: 'آموزش PTE Academic آنلاین | کلاس PTE خصوصی',
    stats: 'بیش از ۱۵۰ دانشجو'
  },
  conversation: {
    color: 'from-pink-600 to-rose-500',
    gradient: 'from-pink-50 via-white to-rose-50',
    icon: '🗣️',
    callerNText: 'هر شب ۱۵ دقیقه با یه استاد واقعی تمرین کن',
    tagline: 'کلاس مکالمه انگلیسی آنلاین | تمرین روزانه با استاد',
    stats: 'بیش از ۸۰۰ دانشجو'
  }
};

function FAQAccordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border rounded-xl overflow-hidden">
          <button
            className="w-full text-right px-5 py-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-semibold text-gray-800 text-sm sm:text-base">{item.q}</span>
            {openIndex === i
              ? <ChevronUp className="h-5 w-5 text-primary shrink-0" />
              : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
            }
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 pt-1 bg-gray-50 text-gray-700 text-sm leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CourseLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const config = EXAM_CONFIG[slug || ''] || EXAM_CONFIG.ielts;

  const { data: page, isLoading } = useQuery<LandingPage>({
    queryKey: ['/api/public/landing-pages', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/landing-pages/${slug}`);
      if (!res.ok) throw new Error('Page not found');
      return res.json();
    },
    enabled: !!slug
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/public/exam-teachers', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/exam-teachers/${slug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!slug
  });

  const { data: upcomingClasses = [] } = useQuery<UpcomingClass[]>({
    queryKey: ['/api/public/upcoming-classes', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/upcoming-classes/${slug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!slug
  });

  const { data: examCourses = [] } = useQuery<CourseCard[]>({
    queryKey: ['/api/public/exam-courses', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/exam-courses/${slug}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!page) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center" dir="rtl">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">صفحه‌ای یافت نشد</h2>
            <p className="text-muted-foreground mb-6">این برنامه در دسترس نیست</p>
            <Link href="/courses">
              <Button>بازگشت به دوره‌ها</Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const canonicalUrl = `https://metalingo.ir/courses/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: page.programName,
    description: page.seoDescription || page.heroSubtitle,
    provider: {
      '@type': 'Organization',
      name: 'MetaLingo Academy',
      sameAs: 'https://metalingo.ir'
    },
    url: canonicalUrl,
    inLanguage: 'fa',
    teaches: page.programName,
    educationalLevel: 'Intermediate to Advanced',
    availableLanguage: 'fa'
  };

  const groupCourses = examCourses.filter(c => c.classType === 'group' || (c.deliveryMode || '').includes('group'));
  const privateCourses = examCourses.filter(c => c.classType === 'private' || (c.deliveryMode || '').includes('private'));
  const videoCourses = examCourses.filter(c => c.classType === 'video' || (c.deliveryMode || '').includes('video') || (c.deliveryMode || '').includes('self'));

  const formatPrice = (price: number | null) => {
    if (!price) return 'رایگان';
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <PublicLayout>
      <SEOHead
        title={page.seoTitle || `${page.programName} | MetaLingo`}
        description={page.seoDescription || page.heroSubtitle || ''}
        keywords={(page.seoKeywords || []).join('، ')}
        canonicalUrl={canonicalUrl}
      />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── SECTION 1: HERO ─── */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${config.gradient}`} dir="rtl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:px-8">
          <div className="text-center">
            <div className="text-5xl mb-4">{config.icon}</div>
            <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-700 border-blue-200">
              {config.tagline}
            </Badge>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
              {page.heroTitle}
            </h1>
            {page.heroSubtitle && (
              <p className="mx-auto max-w-2xl text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
                {page.heroSubtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className={`bg-gradient-to-r ${config.color} text-white text-lg px-8 h-14 shadow-lg`}
              >
                <Link href="/auth?tab=register" className="flex items-center gap-2">
                  {page.heroCtaPrimary || 'ثبت‌نام'}
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14">
                <Link href="/take-test" className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {page.heroCtaSecondary || 'Placement رایگان'}
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Users className="h-4 w-4" />
              <span>{config.stats} تا کنون</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: TARGET AUDIENCE ─── */}
      {(page.targetAudienceBullets || []).length > 0 && (
        <section className="py-14 bg-white" dir="rtl">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                این دوره برای چه کسانی مناسبه؟
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {page.targetAudienceBullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 3: COURSE FORMAT CARDS ─── */}
      <section className="py-14 bg-gray-50" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              فرمت‌های دوره {page.programName}
            </h2>
            <p className="text-gray-500">گروهی، خصوصی، یا ویدیویی — هر جور که راحتی</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Group */}
            <Card className="border-2 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">گروهی آنلاین</CardTitle>
              </CardHeader>
              <CardContent>
                {groupCourses.length > 0 ? (
                  <div className="space-y-3">
                    {groupCourses.slice(0, 2).map(c => (
                      <div key={c.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-1">{c.title}</div>
                        {c.price && <div className="text-blue-600 font-bold text-sm">{formatPrice(c.price)}</div>}
                        {c.firstSessionDate && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            شروع: {formatDate(c.firstSessionDate)}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button asChild size="sm" className="w-full" variant="outline">
                      <Link href="/auth?tab=register">ثبت‌نام در کلاس گروهی</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary">به زودی</Badge>
                    <p className="text-gray-500 text-sm mt-2">کلاس‌های گروهی در حال برنامه‌ریزی</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Private */}
            <Card className="border-2 hover:border-purple-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">خصوصی آنلاین</CardTitle>
              </CardHeader>
              <CardContent>
                {privateCourses.length > 0 ? (
                  <div className="space-y-3">
                    {privateCourses.slice(0, 2).map(c => (
                      <div key={c.id} className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-1">{c.title}</div>
                        {c.price && <div className="text-purple-600 font-bold text-sm">{formatPrice(c.price)}</div>}
                      </div>
                    ))}
                    <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      <Link href="/auth?tab=register">رزرو کلاس خصوصی</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      <Link href="/contact">درخواست کلاس خصوصی</Link>
                    </Button>
                    <p className="text-gray-500 text-xs mt-2">برنامه انعطاف‌پذیر بر اساس وقت شما</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video */}
            <Card className="border-2 hover:border-teal-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                  <Video className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle className="text-lg">دوره‌های ویدیویی</CardTitle>
              </CardHeader>
              <CardContent>
                {videoCourses.length > 0 ? (
                  <div className="space-y-3">
                    {videoCourses.slice(0, 2).map(c => (
                      <div key={c.id} className="p-3 bg-teal-50 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-1">{c.title}</div>
                        {c.price && <div className="text-teal-600 font-bold text-sm">{formatPrice(c.price)}</div>}
                      </div>
                    ))}
                    <Button asChild size="sm" className="w-full" variant="outline">
                      <Link href="/auth?tab=register">مشاهده دوره ویدیویی</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary">به زودی</Badge>
                    <p className="text-gray-500 text-sm mt-2">دوره‌های ویدیویی در حال تولید</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: CALLERN SPOTLIGHT ─── */}
      <CallerNSpotlight headlineText={config.callerNText} />

      {/* ─── SECTION 5: PLACEMENT CTA ─── */}
      <section className="py-14 bg-gradient-to-l from-blue-700 to-cyan-600" dir="rtl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-right text-white">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl">
                  <span className="text-white font-black text-lg select-none">ML</span>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">رایگان</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">
                ۱۰ دقیقه. ۴ مهارت. سطح دقیق تو
              </h2>
              <p className="text-white/90 text-base font-medium mb-1">
                The shortest and the most intelligent way
              </p>
              <p className="text-white/75 text-sm">
                Placement رایگانه — همین الان سطحت رو بسنج
              </p>
            </div>
            <div className="shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-50 text-lg px-10 h-14 font-bold shadow-lg"
              >
                <Link href="/take-test" className="flex items-center gap-2">
                  همین الان شروع کن
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: TEACHER SPOTLIGHT ─── */}
      <section className="py-14 bg-white" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              استادهای {page.programName} در MetaLingo
            </h2>
            <p className="text-gray-500">تدریس توسط متخصصان تأییدشده</p>
          </div>
          {teachers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(teacher => (
                <Card key={teacher.id} className="border-2 hover:border-primary/30 hover:shadow-lg transition-all text-center">
                  <CardContent className="pt-6">
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                      {teacher.profileImage ? (
                        <img
                          src={teacher.profileImage}
                          alt={`${teacher.firstName} ${teacher.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-black text-blue-600">
                          {(teacher.firstName || teacher.email || 'T')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      {teacher.firstName && teacher.lastName
                        ? `${teacher.firstName} ${teacher.lastName}`
                        : teacher.email}
                    </h3>
                    {teacher.teacherBio && (
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{teacher.teacherBio}</p>
                    )}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-600 font-medium">CallerN آنلاین</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href={`/callern?teacherId=${teacher.id}`}>تماس با استاد</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>استادان متخصص در حال آماده‌سازی پروفایل هستند</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/services/callern">همه استادها رو ببین</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 7: TESTIMONIALS ─── */}
      {(page.testimonials || []).length > 0 && (
        <section className="py-14 bg-gray-50" dir="rtl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                موفقیت دانشجوهای {page.programName}
              </h2>
              <p className="text-gray-500">نتایج واقعی، تجربه‌های واقعی</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {page.testimonials.map((t, i) => (
                <Card key={i} className="border-2 hover:shadow-lg transition-all bg-white">
                  <CardContent className="pt-6">
                    <Quote className="h-6 w-6 text-blue-200 mb-3" />
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">
                      "{t.quote}"
                    </p>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{t.studentName}</div>
                        <div className="text-gray-500 text-xs">{t.examType}</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-bold">
                        {t.score}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 8: EXAM TIPS ─── */}
      {page.examTipsHtml && (
        <section className="py-14 bg-white" dir="rtl">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                چطور {page.programName} رو بزنی؟
              </h2>
              <p className="text-gray-500">نکات کلیدی از استادهای MetaLingo</p>
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-700 bg-blue-50 rounded-2xl p-6 border border-blue-100
                [&_ul]:list-none [&_ul]:space-y-3
                [&_li]:flex [&_li]:gap-3 [&_li]:items-start
                [&_strong]:text-blue-700 [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.examTipsHtml, { ALLOWED_TAGS: ['ul','ol','li','strong','em','p','br','h3','h4'], ALLOWED_ATTR: [] }) }}
            />
          </div>
        </section>
      )}

      {/* ─── SECTION 9: FAQ ACCORDION ─── */}
      {(page.faqItems || []).length > 0 && (
        <section className="py-14 bg-gray-50" dir="rtl">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                سوالات متداول {page.programName}
              </h2>
            </div>
            <FAQAccordion items={page.faqItems} />
          </div>
        </section>
      )}

      {/* ─── SECTION 10: UPCOMING CLASSES ─── */}
      <section className="py-14 bg-white" dir="rtl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              کلاس‌های گروهی در راهه
            </h2>
            <p className="text-gray-500">جای محدود — همین الان ثبت‌نام کن</p>
          </div>
          {upcomingClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {upcomingClasses.map(cls => (
                <Card key={cls.id} className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{cls.title}</h3>
                        {cls.firstSessionDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(cls.firstSessionDate)}
                          </div>
                        )}
                        {cls.startTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            {cls.startTime}
                          </div>
                        )}
                      </div>
                      {cls.remainingSpots !== null ? (
                        <Badge
                          variant={cls.remainingSpots <= 3 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {cls.remainingSpots} جا مانده
                        </Badge>
                      ) : cls.maxStudents ? (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {cls.maxStudents} نفر
                        </Badge>
                      ) : null}
                    </div>
                    {cls.price && (
                      <div className="text-blue-600 font-bold text-base mb-3">
                        {formatPrice(cls.price)}
                      </div>
                    )}
                    <Button asChild size="sm" className="w-full">
                      <Link href="/auth?tab=register">ثبت‌نام در کلاس</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">کلاس گروهی جدید به زودی اعلام می‌شه</p>
              <Button asChild variant="outline">
                <Link href="/contact">اطلاع‌رسانی به من</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className={`py-16 bg-gradient-to-br ${config.gradient}`} dir="rtl">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
            آماده‌ای شروع کنی؟
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            اول سطحت رو بسنج — بعد مسیر درست رو بریم
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className={`bg-gradient-to-r ${config.color} text-white text-lg px-8 h-14 shadow-lg`}
            >
              <Link href="/auth?tab=register" className="flex items-center gap-2">
                {page.heroCtaPrimary || 'ثبت‌نام'}
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14">
              <Link href="/take-test" className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Placement رایگان
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
