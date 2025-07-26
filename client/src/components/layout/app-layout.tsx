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
import { LogOut, User, Settings, Home, Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LanguageSelector } from "@/components/language-selector";
import MobileBottomNav from "./mobile-bottom-nav";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation(['common']);
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { direction } = useLanguage();

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
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="md:hidden touch-target-sm"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="w-72 p-0 max-w-[75vw]" onInteractOutside={() => setMobileMenuOpen(false)}>
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            
            {/* Enhanced Logo and Brand */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (user.role === 'Admin' || user.role === 'Supervisor') {
                  setLocation("/admin");
                } else if (user.role === 'Teacher/Tutor') {
                  setLocation("/teacher");
                } else if (user.role === 'Call Center Agent') {
                  setLocation("/callcenter");
                } else if (user.role === 'Mentor') {
                  setLocation("/mentor");
                } else {
                  setLocation("/dashboard");
                }
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

          {/* Mobile-Optimized User Actions */}
          <div className="flex items-center space-x-2">
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

      {/* Main Layout with Sidebar */}
      <div className="flex min-h-[calc(100vh-3.5rem)]" dir={direction}>
        {/* Desktop Sidebar - hidden on mobile */}
        <div 
          className={`sidebar-container hidden md:block md:fixed md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:z-30 border-r border-border bg-background ${direction === 'rtl' ? 'rtl-sidebar' : 'ltr-sidebar'}`}
          style={{
            position: 'fixed',
            top: '64px',
            width: '256px',
            height: 'calc(100vh - 64px)',
            zIndex: 30,
            ...(direction === 'rtl' ? { right: '0px', left: 'auto' } : { left: '0px', right: 'auto' })
          }}
        >
          <Sidebar />
        </div>
        
        {/* Main Content - properly spaced for sidebar and bottom nav */}
        <main 
          className="flex-1 overflow-y-auto pb-20 md:pb-8"
          dir={direction} 
          style={{
            position: 'relative',
            minHeight: '100vh',
            direction: direction,
            textAlign: direction === 'rtl' ? 'right' : 'left',
            marginLeft: direction === 'ltr' ? '256px' : '0',
            marginRight: direction === 'rtl' ? '256px' : '0',
            width: 'calc(100vw - 256px)'
          }}
        >
          <div className="min-h-full p-4 sm:p-6 lg:p-8" style={{direction: direction, textAlign: direction === 'rtl' ? 'right' : 'left'}}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}