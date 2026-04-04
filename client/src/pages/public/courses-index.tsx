import { Link } from 'wouter';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Users, BookOpen, Award } from 'lucide-react';

const PROGRAMS = [
  {
    slug: 'ielts',
    name: 'IELTS',
    nameFa: 'آیلتس',
    tagline: 'Band 7+ با برنامه آموزشی ساختارمند',
    icon: '🎯',
    color: 'from-blue-600 to-cyan-500',
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200 hover:border-blue-400',
    stats: '۵۰۰+ دانشجو',
    badges: ['Academic', 'General', 'Band 7+']
  },
  {
    slug: 'toefl',
    name: 'TOEFL',
    nameFa: 'تافل',
    tagline: 'نمره ۱۰۰+ برای دانشگاه‌های آمریکا',
    icon: '📚',
    color: 'from-purple-600 to-blue-500',
    bg: 'from-purple-50 to-blue-50',
    border: 'border-purple-200 hover:border-purple-400',
    stats: '۳۰۰+ دانشجو',
    badges: ['iBT', 'Integrated', 'Score 100+']
  },
  {
    slug: 'gre',
    name: 'GRE',
    nameFa: 'جی آر ای',
    tagline: 'Verbal 160+ برای PhD و Graduate',
    icon: '🧠',
    color: 'from-emerald-600 to-teal-500',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200 hover:border-emerald-400',
    stats: '۲۰۰+ دانشجو',
    badges: ['Verbal', 'Quant', 'AWA', 'GRE 320+']
  },
  {
    slug: 'pte',
    name: 'PTE',
    nameFa: 'پی تی ای',
    tagline: 'PTE 65+ برای مهاجرت به استرالیا',
    icon: '💻',
    color: 'from-orange-600 to-amber-500',
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200 hover:border-orange-400',
    stats: '۱۵۰+ دانشجو',
    badges: ['Academic', 'Core', 'نتیجه ۵ روزه']
  },
  {
    slug: 'conversation',
    name: 'Conversation',
    nameFa: 'مکالمه',
    tagline: 'انگلیسی روان با تمرین روزانه CallerN',
    icon: '🗣️',
    color: 'from-pink-600 to-rose-500',
    bg: 'from-pink-50 to-rose-50',
    border: 'border-pink-200 hover:border-pink-400',
    stats: '۸۰۰+ دانشجو',
    badges: ['روزمره', 'کاری', 'آکادمیک', 'CallerN']
  }
];

export default function CoursesIndex() {
  return (
    <PublicLayout>
      <SEOHead
        title="دوره‌های زبان انگلیسی | MetaLingo"
        description="IELTS، TOEFL، GRE، PTE و مکالمه انگلیسی — با MetaLingo هر آزمونی رو فتح کن. کلاس گروهی، خصوصی و ویدیویی با Placement رایگان."
        keywords="آموزش آیلتس، تافل، GRE، PTE، مکالمه انگلیسی آنلاین، MetaLingo"
        canonicalUrl="https://metalingo.ir/courses"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50" dir="rtl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:px-8">
          <div className="text-center">
            <Badge className="mb-5 text-sm px-3 py-1 bg-blue-100 text-blue-700 border-blue-200">
              ۵ برنامه تخصصی
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
              دوره‌های زبان انگلیسی
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                MetaLingo Academy
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 mb-10">
              از IELTS و TOEFL تا GRE، PTE و مکالمه — با مسیر آموزشی هوشمند و استادهای متخصص
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { icon: Award, text: 'استادهای تأییدشده' },
                { icon: Users, text: 'کلاس گروهی و خصوصی' },
                { icon: BookOpen, text: 'دوره‌های ویدیویی' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 shadow-sm border border-gray-100">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-white" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">برنامه‌های آموزشی</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              هر برنامه با مسیر آموزشی دقیق، استادهای متخصص، و ابزارهای هوشمند MetaLingo طراحی شده
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map(prog => (
              <Link key={prog.slug} href={`/courses/${prog.slug}`}>
                <Card className={`group cursor-pointer border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${prog.border} bg-gradient-to-br ${prog.bg}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prog.color} flex items-center justify-center text-2xl shadow-md`}>
                        {prog.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs">{prog.stats}</Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {prog.name}
                        <span className="text-gray-500 font-medium text-base mr-2">({prog.nameFa})</span>
                      </CardTitle>
                      <p className="text-gray-600 text-sm mt-1">{prog.tagline}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {prog.badges.map((b, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{b}</Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full group-hover:bg-white/70 text-sm font-semibold"
                    >
                      اطلاعات بیشتر
                      <ArrowLeft className="ms-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Placement Promo */}
      <section className="py-16 bg-gradient-to-l from-blue-700 to-cyan-600" dir="rtl">
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
                نمی‌دونی از کجا شروع کنی؟ Placement رو امتحان کن
              </h2>
              <p className="text-white/90 text-base font-medium mb-1">
                The shortest and the most intelligent way
              </p>
              <p className="text-white/75 text-sm">
                ۱۰ دقیقه — ۴ مهارت — سطح دقیق زبانت
              </p>
            </div>
            <div className="shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-50 text-lg px-10 h-14 font-bold shadow-lg"
              >
                <Link href="/take-test" className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  همین الان شروع کن
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="py-14 bg-white" dir="rtl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { emoji: '🤖', title: 'هوش مصنوعی', desc: 'Lexi، دستیار AI تو برنامه شخصی می‌سازه' },
              { emoji: '📞', title: 'CallerN ۲۴/۷', desc: 'هر ساعت با استاد واقعی تمرین کن' },
              { emoji: '🎮', title: 'گیمیفیکیشن', desc: 'XP جمع کن، لول بالا برو، با LinguaQuest' }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
