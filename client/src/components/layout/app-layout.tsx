import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LogOut, User, Settings, Home, Menu, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LanguageSelector } from "@/components/language-selector";
import MobileBottomNav from "./mobile-bottom-nav";
import { UniversalSearchBar } from "@/components/search/UniversalSearchBar";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from 'react-i18next';
import { getNavigationForRole } from "@/lib/role-based-navigation";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import AdminCopilot from "@/components/admin/AdminCopilot";

const AppLayoutContext = createContext(false);

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const alreadyInsideAppLayout = useContext(AppLayoutContext);

  const { user, logout } = useAuth();
  const { t } = useTranslation(['common']);
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    setLocation("/auth");
    setTimeout(() => window.location.reload(), 100);
  };

  const handleSwitchAccount = () => {
    logout();
    setLocation("/auth?logout=true");
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Teacher/Tutor': return 'bg-blue-100 text-blue-800';
      case 'Student': return 'bg-green-100 text-green-800';
      case 'Supervisor': return 'bg-purple-100 text-purple-800';
      case 'Call Center Agent': return 'bg-orange-100 text-orange-800';
      case 'Mentor': return 'bg-indigo-100 text-indigo-800';
      case 'Accountant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (alreadyInsideAppLayout) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayoutContext.Provider value={true}>
      <div className="min-h-screen bg-background" dir={direction}>
        <SkipToContent />
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-top" role="banner">
          <div className="flex h-16 items-center justify-between px-3 md:px-6">
            <div className="flex items-center space-x-3">
              {user?.role?.toLowerCase() !== 'student' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden touch-target"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMobileMenuOpen(true);
                  }}
                  data-testid="mobile-menu-button"
                  aria-label={t('common:navigation.openMenu', 'باز کردن منو')}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-sidebar"
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                className="flex items-center gap-2 touch-target"
                aria-label={t('common:navigation.goToDashboard', 'رفتن به داشبورد')}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" aria-hidden="true">
                  <Home className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="font-bold text-sm leading-none">MetaLingo</span>
                  <span className="text-xs text-muted-foreground leading-none">
                    {user.role === 'Teacher/Tutor' ? 'Teacher' : user.role}
                  </span>
                </div>
              </Button>
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <UniversalSearchBar
                variant="compact"
                placeholder={t('common:search.placeholder')}
                className="w-full"
                data-testid="global-search-bar"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setLocation('/search')}
                data-testid="mobile-search-button"
                aria-label={t('common:search.openSearch', 'باز کردن جستجو')}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>

              <LanguageSelector />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full" aria-label={t('common:navigation.userMenu', 'منوی کاربر')}>
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {getUserInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    <User className="me-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/settings")}>
                    <Settings className="me-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSwitchAccount}>
                    <User className="me-2 h-4 w-4" />
                    <span>Switch Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="me-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-4rem)]">
          {user?.role?.toLowerCase() !== 'student' && (
            <>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent
                  id="mobile-sidebar"
                  side={direction === 'rtl' ? 'right' : 'left'}
                  className="w-72 p-0 max-w-[75vw] z-[100] md:hidden"
                  aria-label={t('common:navigation.sidebarMenu', 'منوی ناوبری')}
                  onPointerDownOutside={() => setMobileMenuOpen(false)}
                  onEscapeKeyDown={() => setMobileMenuOpen(false)}
                >
                  <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>

              <aside className={`hidden md:block flex-shrink-0 order-first transition-all duration-300 ${
                sidebarCollapsed ? 'md:w-16' : 'md:w-56'
              }`}>
                <div className={`fixed top-16 start-0 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 border-r border-border bg-background transition-all duration-300 ${
                  sidebarCollapsed ? 'w-16' : 'w-56'
                }`}>
                  <Sidebar collapsed={sidebarCollapsed} />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-4 end-2 h-8 w-8 rounded-full border bg-background shadow-sm hover:shadow-md transition-all"
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    data-testid="button-toggle-sidebar"
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </aside>
            </>
          )}

          <main
            id="main-content"
            tabIndex={-1}
            dir={direction}
            className={`flex-1 w-full overflow-y-auto pb-20 md:pb-8 transition-all duration-300 outline-none ${
              user?.role?.toLowerCase() !== 'student'
                ? (sidebarCollapsed ? 'md:ms-16' : 'md:ms-56')
                : ''
            }`}
            aria-label={t('common:navigation.mainContent', 'محتوای اصلی')}
          >
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>

        <MobileBottomNav />
        <AdminCopilot />
      </div>
    </AppLayoutContext.Provider>
  );
}
