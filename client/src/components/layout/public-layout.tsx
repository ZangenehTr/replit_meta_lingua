import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSelector } from '@/components/language-selector';
import { VisitorChatWidget } from '@/components/visitor-chat/VisitorChatWidget';
import { useLanguage } from '@/hooks/use-language';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  X,
  Home,
  BookOpen,
  Video,
  Info,
  Mail,
  LogIn,
  Sparkles,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { t, i18n } = useTranslation(['common']);
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { direction } = useLanguage();

  // Fetch active curriculum categories for navigation
  const { data: curriculumCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/cms/curriculum-categories/active'],
  });

  const navigation = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.blog'), href: '/blog', icon: BookOpen },
    { name: t('nav.videos'), href: '/videos', icon: Video },
    { name: t('nav.about'), href: '/about', icon: Info },
    { name: t('nav.contact'), href: '/contact', icon: Mail },
  ];

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

  // Helper function to get localized category name
  const getCategoryName = (category: any) => {
    const currentLang = i18n.language;
    if (currentLang === 'fa' && category.nameFa) {
      return category.nameFa;
    }
    if (currentLang === 'ar' && category.nameAr) {
      return category.nameAr;
    }
    return category.name; // Default to English
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5" dir={direction}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="flex items-center gap-2 -m-1.5 p-1.5" data-testid="link-home-logo">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Meta Lingua
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {t('tagline', 'Learn Languages Globally')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8 lg:items-center">
            {/* Home Link */}
            <Link 
              href="/"
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                isActivePath('/')
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="link-nav-home"
            >
              <Home className="h-4 w-4" />
              {t('nav.home')}
            </Link>

            {/* Curriculum Dropdown */}
            {curriculumCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                      isActivePath('/curriculum')
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="button-nav-curriculum"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {t('nav.curriculum', 'Curriculum')}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/curriculum" className="cursor-pointer" data-testid="link-all-courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {t('nav.allCourses', 'All Courses')}
                    </Link>
                  </DropdownMenuItem>
                  <div className="my-1 border-t" />
                  {curriculumCategories.map((category: any) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link href={`/curriculum/${category.slug}`} className="cursor-pointer" data-testid={`link-category-${category.slug}`}>
                        {getCategoryName(category)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Other Navigation Items */}
            {navigation.slice(1).map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`link-nav-${item.href.slice(1) || 'home'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Language & Auth */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-4 items-center">
            <LanguageSelector />
            <Button asChild variant="outline" size="sm" data-testid="button-login">
              <Link href="/auth" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {t('auth.login')}
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" data-testid="button-get-started">
              <Link href="/auth?tab=register">
                {t('cta.getStarted', 'Get Started')}
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
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">Meta Lingua</span>
                      <span className="text-xs text-muted-foreground">
                        {t('tagline', 'Learn Languages Globally')}
                      </span>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {/* Home Link */}
                    <Link 
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActivePath('/')
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                      data-testid="link-mobile-home"
                    >
                      <Home className="h-5 w-5" />
                      {t('nav.home')}
                    </Link>

                    {/* Curriculum Section */}
                    {curriculumCategories.length > 0 && (
                      <div>
                        <Link 
                          href="/curriculum"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActivePath('/curriculum')
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                          data-testid="link-mobile-curriculum"
                        >
                          <GraduationCap className="h-5 w-5" />
                          {t('nav.curriculum', 'Curriculum')}
                        </Link>
                        <div className="ml-8 mt-1 flex flex-col gap-1">
                          {curriculumCategories.map((category: any) => (
                            <Link 
                              key={category.id} 
                              href={`/curriculum/${category.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                              data-testid={`link-mobile-category-${category.slug}`}
                            >
                              {getCategoryName(category)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Navigation Items */}
                    {navigation.slice(1).map((item) => {
                      const Icon = item.icon;
                      const isActive = isActivePath(item.href);
                      return (
                        <Link 
                          key={item.name} 
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                          data-testid={`link-mobile-${item.href.slice(1) || 'home'}`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="border-t pt-4 space-y-2">
                    <Button asChild variant="outline" className="w-full" data-testid="button-mobile-login">
                      <Link href="/auth" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        {t('auth.login')}
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-gradient-to-r from-primary to-purple-600" data-testid="button-mobile-register">
                      <Link href="/auth?tab=register">
                        {t('cta.getStarted', 'Get Started')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Meta Lingua
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('tagline', 'Learn Languages Globally')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('footer.description', 'Empowering language learners worldwide with AI-enhanced, personalized learning experiences.')}
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="p-2 rounded-lg bg-accent hover:bg-primary/10 transition-colors"
                      aria-label={social.name}
                      data-testid={`link-social-${social.name.toLowerCase()}`}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">{t('footer.quickLinks', 'Quick Links')}</h3>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid={`link-footer-${item.href.slice(1) || 'home'}`}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">{t('footer.legal', 'Legal')}</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.privacy', 'Privacy Policy')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.terms', 'Terms of Service')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.cookies', 'Cookie Policy')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Meta Lingua. {t('footer.rights', 'All rights reserved.')}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{t('footer.multilingual', 'Available in English, فارسی, العربية')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Visitor Chat Widget */}
      <VisitorChatWidget />
    </div>
  );
}
