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
import { LogOut, User, Settings, Home, Menu, Search } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LanguageSelector } from "@/components/language-selector";
import MobileBottomNav from "./mobile-bottom-nav";
import { UniversalSearchBar } from "@/components/search/UniversalSearchBar";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from 'react-i18next';
import { getNavigationForRole } from "@/lib/role-based-navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation(['common']);
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);


  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    // Navigate to auth page
    setLocation("/auth");
    // Force a page refresh to clear all state
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      {/* Mobile-First Global Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-top">
        <div className="flex h-16 items-center justify-between px-3 md:px-6">
          {/* Mobile Menu Button & Brand */}
          <div className="flex items-center space-x-3">
            {/* Only show mobile menu for non-student roles */}
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
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            {/* Enhanced Logo and Brand */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // All roles go to unified dashboard
                setLocation("/dashboard");
              }}
              className="flex items-center gap-2 touch-target"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="font-bold text-sm leading-none">Meta Lingua</span>
                <span className="text-xs text-muted-foreground leading-none">
                  {user.role === 'Teacher/Tutor' ? 'Teacher' : user.role}
                </span>
              </div>
            </Button>
          </div>

          {/* Global Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <UniversalSearchBar
              variant="compact"
              placeholder={t('common:search.placeholder')}
              className="w-full"
              data-testid="global-search-bar"
            />
          </div>

          {/* Mobile-Optimized User Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile Only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setLocation('/search')}
              data-testid="mobile-search-button"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Language Selector - Always Visible */}
            <LanguageSelector />
            
            {/* User Menu - Enhanced for Mobile */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={user.avatar} alt={user.firstName} />
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
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleSwitchAccount}>
                <User className="mr-2 h-4 w-4" />
                <span>Switch Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar - Fixed to LTR layout */}
      <div className="flex min-h-[calc(100vh-4rem)]" dir="ltr">
        {/* Desktop Sidebar - hidden on mobile/tablet */}
        {user?.role?.toLowerCase() !== 'student' && (
          <>
            {/* Mobile Sheet Sidebar */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent 
                side="left" 
                className="w-72 p-0 max-w-[75vw] z-[100] md:hidden" 
                onPointerDownOutside={() => setMobileMenuOpen(false)}
                onEscapeKeyDown={() => setMobileMenuOpen(false)}
              >
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar - always visible on desktop */}
            <aside className="hidden md:block md:w-64 flex-shrink-0 order-first">
              <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 border-r border-border bg-background">
                <Sidebar />
              </div>
            </aside>
          </>
        )}
        
        {/* Main Content - simple responsive margins */}
        <main 
          className={`flex-1 w-full overflow-y-auto pb-20 md:pb-8 ${
            user?.role?.toLowerCase() !== 'student' 
              ? 'md:ml-64'  // Desktop/Tablet: sidebar margin
              : ''
          }`}
          dir="ltr"
        >
          <div className="min-h-full">
            {/* Universal Container System */}
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  );
}