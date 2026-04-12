import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LanguageSelector } from '@/components/language-selector';
import { VisitorChatWidget } from '@/components/visitor-chat/VisitorChatWidget';
import { useLanguage } from '@/hooks/use-language';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Menu,
  Home,
  BookOpen,
  Info,
  Mail,
  LogIn,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Moon,
  Sun,
  MessageSquare,
  TrendingUp,
  FileCheck,
  Star,
  Users,
  Gamepad2,
  FlaskConical,
  ChevronDown,
  Video,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const examPrograms = [
  {
    href: '/courses/ielts',
    icon: Star,
    name: 'IELTS',
    desc: 'رودمپ اختصاصی تا Band 7.5+',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    href: '/courses/toefl',
    icon: TrendingUp,
    name: 'TOEFL',
    desc: 'آزمون iBT با هدف‌گذاری دقیق',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    href: '/courses/gre',
    icon: FileCheck,
    name: 'GRE',
    desc: 'ریاضی + کلامی + تحلیلی',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    href: '/courses/pte',
    icon: FlaskConical,
    name: 'PTE',
    desc: 'سریع‌ترین مسیر — نتیجه در ۵ روز',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
  },
];

const conversationItems = [
  {
    href: '/courses/conversation',
    icon: MessageSquare,
    name: 'مکالمه عمومی',
    desc: 'تسلط به صحبت کردن روزمره',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    href: '/linguaquest',
    icon: Gamepad2,
    name: 'LinguaQuest',
    desc: 'یادگیری با ۱۲ نوع بازی زبانی',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

export function PublicLayout({ children }: PublicLayoutProps) {
  const { t, i18n } = useTranslation(['common']);
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExamsOpen, setMobileExamsOpen] = useState(false);
  const [mobileConvOpen, setMobileConvOpen] = useState(false);
  const { direction } = useLanguage();
  const breadcrumbs = useBreadcrumbs();
  const { isDark, toggleTheme } = useTheme();

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 overflow-x-hidden" dir={direction}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">

          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/home" className="flex items-center gap-2 -m-1.5 p-1.5" data-testid="link-home-logo">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg">
                <span className="text-white font-black text-lg tracking-tight select-none">ML</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 bg-clip-text text-transparent">
                  MetaLingo
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {t('tagline', 'Learn Languages Globally')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-1 lg:items-center">

            {/* Home */}
            <Link
              href="/home"
              className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                location === '/home' || location === '/'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              data-testid="link-nav-home"
            >
              {t('nav.home')}
            </Link>

            {/* Exams Mega-Menu */}
            <NavigationMenu dir={direction}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`text-sm font-semibold px-3 py-2 h-auto rounded-lg bg-transparent hover:bg-accent ${
                      isActivePath('/courses') ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="button-nav-exams"
                  >
                    {t('nav.exams', 'آزمون‌ها')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[480px] p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                        {t('nav.examPrep', 'آماده‌سازی برای آزمون‌های بین‌المللی')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {examPrograms.map((program) => {
                          const Icon = program.icon;
                          return (
                            <button
                              key={program.href}
                              onClick={() => setLocation(program.href)}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-start w-full group"
                              data-testid={`link-program-${program.name.toLowerCase()}`}
                            >
                              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${program.bg} shrink-0`}>
                                <Icon className={`h-5 w-5 ${program.color}`} />
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${program.color} group-hover:underline`}>
                                  {program.name}
                                </p>
                                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                                  {program.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <button
                          onClick={() => setLocation('/courses')}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                          data-testid="link-all-programs"
                        >
                          {t('nav.allPrograms', 'مشاهده همه برنامه‌ها')} ←
                        </button>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Conversation Mega-Menu */}
            <NavigationMenu dir={direction}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`text-sm font-semibold px-3 py-2 h-auto rounded-lg bg-transparent hover:bg-accent ${
                      isActivePath('/courses/conversation') || isActivePath('/linguaquest')
                        ? 'text-indigo-600'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="button-nav-conversation"
                  >
                    {t('nav.conversation', 'مکالمه')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[360px] p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                        {t('nav.languageSkills', 'مهارت‌های زبانی و مکالمه')}
                      </p>
                      <div className="flex flex-col gap-2">
                        {conversationItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.href}
                              onClick={() => setLocation(item.href)}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-start w-full group"
                              data-testid={`link-conv-${item.href.split('/').pop()}`}
                            >
                              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${item.bg} shrink-0`}>
                                <Icon className={`h-5 w-5 ${item.color}`} />
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${item.color} group-hover:underline`}>
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                        <div className="pt-2 border-t mt-1">
                          <button
                            onClick={() => setLocation('/take-test')}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                            data-testid="link-take-test-conv"
                          >
                            {t('nav.freePlacement', 'تست سطح رایگان')} ←
                          </button>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* CallerN */}
            <Link
              href="/services/callern"
              className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActivePath('/services/callern')
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              data-testid="link-nav-callern"
            >
              {t('nav.callern', 'CallerN')}
            </Link>

            {/* Teachers */}
            <Link
              href="/teachers"
              className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActivePath('/teachers')
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              data-testid="link-nav-teachers"
            >
              {t('nav.teachers', 'معلمان')}
            </Link>

            {/* Blog */}
            <Link
              href="/blog"
              className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActivePath('/blog')
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              data-testid="link-nav-blog"
            >
              {t('nav.blog', 'وبلاگ')}
            </Link>
          </div>

          {/* Right Side - Language, Theme & Auth */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-2 items-center">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              data-testid="button-theme-toggle"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="button-login">
              <Link href="/auth" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {t('auth.login')}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20"
              data-testid="button-free-test"
            >
              <Link href="/take-test">
                {t('cta.freeTest', 'تست رایگان')} ←
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSelector />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 overflow-y-auto">
                <div className="flex flex-col gap-5 mt-6">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl">
                      <span className="text-white font-black text-lg tracking-tight select-none">ML</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        MetaLingo
                      </span>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-1">
                    {/* Home */}
                    <Link
                      href="/home"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        location === '/home' || location === '/'
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                      data-testid="link-mobile-home"
                    >
                      <Home className="h-5 w-5" />
                      {t('nav.home')}
                    </Link>

                    {/* Exams Section */}
                    <div>
                      <button
                        onClick={() => setMobileExamsOpen(!mobileExamsOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <span className="font-semibold text-sm">{t('nav.exams', 'آزمون‌ها')}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${mobileExamsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileExamsOpen && (
                        <div className="ms-4 mt-1 flex flex-col gap-1">
                          {examPrograms.map((program) => {
                            const Icon = program.icon;
                            return (
                              <Link
                                key={program.href}
                                href={program.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                  isActivePath(program.href)
                                    ? `${program.bg} ${program.color} font-semibold`
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${program.color}`} />
                                {program.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Conversation Section */}
                    <div>
                      <button
                        onClick={() => setMobileConvOpen(!mobileConvOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <span className="font-semibold text-sm">{t('nav.conversation', 'مکالمه')}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${mobileConvOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileConvOpen && (
                        <div className="ms-4 mt-1 flex flex-col gap-1">
                          {conversationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                  isActivePath(item.href)
                                    ? `${item.bg} ${item.color} font-semibold`
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${item.color}`} />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Other links */}
                    {[
                      { href: '/services/callern', label: t('nav.callern', 'CallerN'), icon: Video },
                      { href: '/teachers', label: t('nav.teachers', 'معلمان'), icon: Users },
                      { href: '/blog', label: t('nav.blog', 'وبلاگ'), icon: BookOpen },
                      { href: '/about', label: t('nav.about', 'درباره ما'), icon: Info },
                      { href: '/contact', label: t('nav.contact', 'تماس'), icon: Mail },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActivePath(href)
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                        data-testid={`link-mobile-${href.split('/').pop()}`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    ))}
                  </nav>

                  <div className="border-t pt-4 space-y-2">
                    <Button asChild variant="outline" className="w-full" data-testid="button-mobile-login">
                      <Link href="/auth" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        {t('auth.login')}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                      data-testid="button-mobile-free-test"
                    >
                      <Link href="/take-test">
                        {t('cta.freeTest', 'تست رایگان')} ←
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Breadcrumbs — hidden on the home page */}
      {breadcrumbs.length > 0 && location !== '/' && (
        <div className="border-b bg-white/50 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  const Icon = crumb.icon;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="flex items-center gap-2" data-testid={`breadcrumb-current-${index}`}>
                            {Icon && <Icon className="h-4 w-4" />}
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href!} className="flex items-center gap-2" data-testid={`breadcrumb-link-${index}`}>
                              {Icon && <Icon className="h-4 w-4" />}
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-gray-950/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">

            {/* Brand Column */}
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl">
                  <span className="text-white font-black text-lg tracking-tight select-none">ML</span>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 bg-clip-text text-transparent">
                  MetaLingo
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                {t('footer.description', 'پلتفرم هوشمند یادگیری زبان با هوش مصنوعی، تدریس زنده، و گیمیفیکیشن.')}
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <button
                      key={social.name}
                      type="button"
                      className="p-2 rounded-lg bg-accent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      aria-label={social.name}
                      title={social.name}
                      data-testid={`link-social-${social.name.toLowerCase()}`}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground hover:text-indigo-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Programs */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">{t('nav.exams', 'آزمون‌ها')}</h3>
              <ul className="space-y-2">
                {examPrograms.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                      {p.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/courses/conversation" className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                    {t('nav.conversation', 'مکالمه')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">{t('footer.quickLinks', 'لینک‌های سریع')}</h3>
              <ul className="space-y-2">
                {[
                  { href: '/services/callern', label: 'CallerN' },
                  { href: '/teachers', label: t('nav.teachers', 'معلمان') },
                  { href: '/blog', label: t('nav.blog', 'وبلاگ') },
                  { href: '/videos', label: t('nav.videos', 'ویدیوها') },
                  { href: '/about', label: t('nav.about', 'درباره ما') },
                  { href: '/contact', label: t('nav.contact', 'تماس با ما') },
                  { href: '/verify-certificate', label: t('footer.verifyCert', 'تأیید گواهینامه') },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors" data-testid={`link-footer-${href.split('/').pop()}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MetaLingo. {t('footer.rights', 'All rights reserved.')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                {t('footer.privacy', 'حریم خصوصی')}
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                {t('footer.terms', 'شرایط استفاده')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      <VisitorChatWidget />
    </div>
  );
}
