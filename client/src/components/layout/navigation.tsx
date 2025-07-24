import { Bell, Globe, Moon, Sun, User, LogOut, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "./mobile-nav";

export function Navigation() {
  const { t } = useTranslation(['common']);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'en' | 'fa' | 'ar');
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Navigation */}
          <MobileNav />

          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('common:navigation.siteName')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('common:navigation.tagline')}
                </p>
              </div>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Language Selector - Hidden on mobile */}
            <div className="hidden sm:block">
              <Select
                value={language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-20 border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fa">فا</SelectItem>
                  <SelectItem value="ar">ع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Notifications - Hidden on small screens */}
            <Button variant="ghost" size="sm" className="relative hidden sm:flex">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/progress">
                  <DropdownMenuItem>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Progress & Achievements</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
