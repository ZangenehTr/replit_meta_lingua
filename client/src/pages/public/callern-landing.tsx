import { useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  Clock,
  Globe,
  Sparkles,
  CheckCircle,
  Users,
  Star,
  Calendar,
  Zap,
  Shield,
  Award,
  PlayCircle,
  MessageCircle,
  ArrowRight,
  Headphones,
  BookOpen,
  Target,
  TrendingUp,
  DollarSign,
  Phone,
  Wifi,
  UserCheck
} from 'lucide-react';

export default function CallernLanding() {
  const { t, i18n } = useTranslation(['common', 'callern']);
  const [selectedTab, setSelectedTab] = useState('features');
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  // Fetch online teachers for showcase
  const { data: onlineTeachers = [] } = useQuery({
    queryKey: ['/api/callern/online-teachers'],
    queryFn: async () => {
      const response = await fetch('/api/callern/online-teachers');
      return response.json();
    }
  });

  const features = [
    {
      icon: Clock,
      title: t('callern:landing.features.available247.title', '24/7 Availability'),
      description: t('callern:landing.features.available247.desc', 'Connect with expert teachers anytime, day or night'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: t('callern:landing.features.nativeSpeakers.title', 'Native Speakers'),
      description: t('callern:landing.features.nativeSpeakers.desc', 'Learn from qualified native English speakers'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: t('callern:landing.features.instantSessions.title', 'Instant Sessions'),
      description: t('callern:landing.features.instantSessions.desc', 'Start a live video session in seconds'),
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Sparkles,
      title: t('callern:landing.features.aiPowered.title', 'AI-Enhanced Learning'),
      description: t('callern:landing.features.aiPowered.desc', 'Real-time AI suggestions and feedback during sessions'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Shield,
      title: t('callern:landing.features.secure.title', 'Secure & Private'),
      description: t('callern:landing.features.secure.desc', 'End-to-end encrypted video calls'),
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Award,
      title: t('callern:landing.features.certified.title', 'Certified Teachers'),
      description: t('callern:landing.features.certified.desc', 'All teachers are TESOL/TEFL certified'),
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const packages = [
    {
      name: t('callern:landing.packages.starter.name', 'Starter'),
      price: '990,000',
      currency: 'IRR',
      minutes: 60,
      validity: 30,
      popular: false,
      features: [
        t('callern:landing.packages.starter.feature1', '60 minutes of live video tutoring'),
        t('callern:landing.packages.starter.feature2', 'Valid for 30 days'),
        t('callern:landing.packages.starter.feature3', 'AI-powered suggestions'),
        t('callern:landing.packages.starter.feature4', 'Session recordings'),
      ]
    },
    {
      name: t('callern:landing.packages.professional.name', 'Professional'),
      price: '2,490,000',
      currency: 'IRR',
      minutes: 180,
      validity: 60,
      popular: true,
      features: [
        t('callern:landing.packages.professional.feature1', '180 minutes of live video tutoring'),
        t('callern:landing.packages.professional.feature2', 'Valid for 60 days'),
        t('callern:landing.packages.professional.feature3', 'AI-powered suggestions'),
        t('callern:landing.packages.professional.feature4', 'Session recordings'),
        t('callern:landing.packages.professional.feature5', 'Priority teacher matching'),
        t('callern:landing.packages.professional.feature6', 'Advanced analytics'),
      ]
    },
    {
      name: t('callern:landing.packages.unlimited.name', 'Unlimited'),
      price: '4,990,000',
      currency: 'IRR',
      minutes: 480,
      validity: 90,
      popular: false,
      features: [
        t('callern:landing.packages.unlimited.feature1', '480 minutes of live video tutoring'),
        t('callern:landing.packages.unlimited.feature2', 'Valid for 90 days'),
        t('callern:landing.packages.unlimited.feature3', 'AI-powered suggestions'),
        t('callern:landing.packages.unlimited.feature4', 'Session recordings'),
        t('callern:landing.packages.unlimited.feature5', 'Priority teacher matching'),
        t('callern:landing.packages.unlimited.feature6', 'Advanced analytics'),
        t('callern:landing.packages.unlimited.feature7', '1-on-1 learning path consultation'),
      ]
    },
  ];

  const benefits = [
    {
      icon: Target,
      title: t('callern:landing.benefits.personalizedLearning.title', 'Personalized Learning'),
      description: t('callern:landing.benefits.personalizedLearning.desc', 'Each session is tailored to your specific goals and level'),
    },
    {
      icon: MessageCircle,
      title: t('callern:landing.benefits.realConversation.title', 'Real Conversation Practice'),
      description: t('callern:landing.benefits.realConversation.desc', 'Improve fluency through authentic conversations with native speakers'),
    },
    {
      icon: TrendingUp,
      title: t('callern:landing.benefits.rapidProgress.title', 'Rapid Progress'),
      description: t('callern:landing.benefits.rapidProgress.desc', 'See measurable improvement in just a few sessions'),
    },
    {
      icon: Headphones,
      title: t('callern:landing.benefits.accentReduction.title', 'Accent & Pronunciation'),
      description: t('callern:landing.benefits.accentReduction.desc', 'Work on your pronunciation and reduce your accent'),
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: t('callern:landing.howItWorks.step1.title', 'Choose Your Package'),
      description: t('callern:landing.howItWorks.step1.desc', 'Select the package that fits your learning goals'),
      icon: Package,
    },
    {
      step: 2,
      title: t('callern:landing.howItWorks.step2.title', 'Browse Online Teachers'),
      description: t('callern:landing.howItWorks.step2.desc', 'View available teachers and their profiles'),
      icon: UserCheck,
    },
    {
      step: 3,
      title: t('callern:landing.howItWorks.step3.title', 'Start Instant Session'),
      description: t('callern:landing.howItWorks.step3.desc', 'Click to connect and begin your live video lesson'),
      icon: Video,
    },
    {
      step: 4,
      title: t('callern:landing.howItWorks.step4.title', 'Learn & Improve'),
      description: t('callern:landing.howItWorks.step4.desc', 'Practice speaking, get feedback, and track your progress'),
      icon: TrendingUp,
    },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title={t('callern:landing.seoTitle', 'CallerN - 24/7 Live Video Tutoring | Meta Lingua')}
        description={t('callern:landing.seoDescription', 'Connect with native English teachers anytime via live video calls. AI-powered, instant sessions, certified teachers. Start speaking confidently today!')}
        keywords="online English tutoring, live video lessons, native English teachers, instant language practice, video call English, speaking practice"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center text-white">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30" data-testid="badge-callern">
              <Video className="h-3 w-3 mr-1" />
              {t('callern:landing.hero.badge', 'Live Video Tutoring')}
            </Badge>
            
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              {t('callern:landing.hero.title', 'Speak English With')} <br />
              <span className="text-yellow-300">
                {t('callern:landing.hero.titleHighlight', 'Native Speakers')}
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-xl text-indigo-100 mb-10">
              {t('callern:landing.hero.description', 'Connect with certified English teachers 24/7 via live video calls. Practice speaking, improve fluency, and gain confidence - all from the comfort of your home.')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6"
                data-testid="button-get-started"
              >
                <Link href="/auth?tab=register">
                  <a className="flex items-center gap-2">
                    {t('callern:landing.cta.getStarted', 'Get Started Free')}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                data-testid="button-view-teachers"
              >
                <Link href="#teachers">
                  <a className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('callern:landing.cta.viewTeachers', 'Meet Our Teachers')}
                  </a>
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Users, label: t('callern:landing.stats.teachers', 'Expert Teachers'), value: '50+' },
                { icon: Clock, label: t('callern:landing.stats.availability', 'Available 24/7'), value: '100%' },
                { icon: Star, label: t('callern:landing.stats.satisfaction', 'Satisfaction Rate'), value: '98%' },
                { icon: Globe, label: t('callern:landing.stats.countries', 'Countries Served'), value: '40+' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="flex flex-col items-center gap-2" data-testid={`stat-${index}`}>
                    <Icon className="h-8 w-8 text-yellow-300" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-indigo-200">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('callern:landing.features.heading', 'Why Choose CallerN?')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('callern:landing.features.subheading', 'The most advanced platform for practicing English with native speakers')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 hover:shadow-lg transition-all" data-testid={`feature-${index}`}>
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('callern:landing.howItWorks.heading', 'How CallerN Works')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('callern:landing.howItWorks.subheading', 'Start speaking English with native teachers in 4 simple steps')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative" data-testid={`step-${index}`}>
                  {index < howItWorks.length - 1 && (
                    <div className={`hidden lg:block absolute top-16 ${isRTL ? 'right-0' : 'left-full'} w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent`} />
                  )}
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-full opacity-20 animate-pulse" />
                      <div className="relative w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Online Teachers Section */}
      <section id="teachers" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4" data-testid="badge-online-now">
              <Wifi className="h-3 w-3 mr-1" />
              {onlineTeachers.length} {t('callern:landing.teachers.onlineNow', 'Teachers Online Now')}
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              {t('callern:landing.teachers.heading', 'Meet Our Expert Teachers')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('callern:landing.teachers.subheading', 'All our teachers are native English speakers with TESOL/TEFL certification')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {onlineTeachers.slice(0, 6).map((teacher: any, index: number) => (
              <Card key={teacher.id || index} className="hover:shadow-xl transition-shadow" data-testid={`teacher-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {teacher.name?.charAt(0) || 'T'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{teacher.name || 'Expert Teacher'}</h3>
                      <p className="text-sm text-muted-foreground">{teacher.specialty || 'English Teacher'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < (teacher.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">({teacher.reviewCount || 120})</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{teacher.country || 'United States'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>{teacher.certification || 'TESOL Certified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{teacher.experience || '5+'} years experience</span>
                    </div>
                  </div>
                  <Button asChild className="w-full" data-testid={`button-connect-${index}`}>
                    <Link href="/auth?tab=register">
                      <a>
                        {t('callern:landing.teachers.connectNow', 'Connect Now')}
                      </a>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg" data-testid="button-view-all-teachers">
              <Link href="/auth?tab=register">
                <a>
                  {t('callern:landing.teachers.viewAll', 'View All Teachers')}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('callern:landing.pricing.heading', 'Simple, Transparent Pricing')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('callern:landing.pricing.subheading', 'Choose the package that fits your learning goals')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Card 
                key={index} 
                className={cn(
                  "relative border-2 hover:shadow-xl transition-all",
                  pkg.popular ? "border-primary shadow-lg scale-105" : "border-gray-200"
                )}
                data-testid={`package-${index}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1">
                      {t('callern:landing.pricing.mostPopular', 'Most Popular')}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{pkg.price.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-2">{pkg.currency}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.minutes} {t('callern:landing.pricing.minutes', 'minutes')} • {pkg.validity} {t('callern:landing.pricing.days', 'days')}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={cn(
                      "w-full",
                      pkg.popular && "bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                    )}
                    size="lg"
                    data-testid={`button-buy-${index}`}
                  >
                    <Link href="/auth?tab=register">
                      <a>
                        {t('callern:landing.pricing.selectPlan', 'Select Plan')}
                      </a>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {t('callern:landing.benefits.heading', 'Transform Your English Skills')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('callern:landing.benefits.subheading', 'Experience the benefits of live video tutoring with native speakers')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`benefit-${index}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                        <CardDescription className="text-base">{benefit.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-pink-600 py-24">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center text-white">
          <Sparkles className="h-12 w-12 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl font-bold mb-6">
            {t('callern:landing.finalCta.title', 'Ready to Speak English Fluently?')}
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            {t('callern:landing.finalCta.description', 'Join thousands of students who are improving their English with CallerN. Start your first session today!')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6"
              data-testid="button-final-cta"
            >
              <Link href="/auth?tab=register">
                <a className="flex items-center gap-2">
                  {t('callern:landing.finalCta.button', 'Start Free Trial')}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

// Import Package icon
import { Package } from 'lucide-react';

// Add cn utility
import { cn } from '@/lib/utils';
