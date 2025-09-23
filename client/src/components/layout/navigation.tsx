import { Bell, Globe, Moon, Sun, User, LogOut, TrendingUp, Check, X, AlertCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UniversalSearchBar } from "@/components/search/UniversalSearchBar";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetRole?: string;
  actionUrl?: string;
  metadata?: any;
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: string;
  createdAt: string;
}

export function Navigation() {
  const { t } = useTranslation(['common']);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch unread notification count
  const { data: notificationData, isLoading: isLoadingCount } = useQuery({
    queryKey: ['/api/notifications/count'],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent unread notifications for dropdown
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/notifications/unread'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const notificationCount = notificationData?.count || 0;

  // Mutations for notification actions
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/notifications/${id}/dismiss`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('/api/notifications/mark-all-read', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!user) return;

    const socket: Socket = io(window.location.origin, {
      autoConnect: true,
    });

    // Join user-specific room
    socket.emit('authenticate', { 
      userId: user.id, 
      role: user.role 
    });

    // Listen for real-time notification updates
    socket.on('new-notification', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    });

    socket.on('notification-read', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    });

    socket.on('all-notifications-read', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'en' | 'fa' | 'ar');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'system':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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

          {/* Universal Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <UniversalSearchBar
              variant="compact"
              placeholder={t('common:search.placeholder')}
              className="w-full"
              data-testid="navigation-search-bar"
            />
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

            {/* Dynamic Notifications - Hidden on small screens */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative hidden sm:flex"
                  data-testid="notification-bell-button"
                  disabled={isLoadingCount}
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                      data-testid="notification-count-badge"
                    >
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 max-h-96" align="end">
                <div className="flex items-center justify-between p-3">
                  <h3 className="font-semibold text-sm">
                    {t('common:notifications.title', 'Notifications')}
                  </h3>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="h-auto p-1 text-xs"
                      data-testid="mark-all-read-button"
                    >
                      {t('common:notifications.markAllRead', 'Mark all as read')}
                    </Button>
                  )}
                </div>
                <Separator />
                <ScrollArea className="h-80">
                  {isLoadingNotifications ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-pulse text-sm text-muted-foreground">
                        {t('common:notifications.loading', 'Loading notifications...')}
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {t('common:notifications.empty', 'No new notifications')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('common:notifications.emptyDescription', 'You\'re all caught up!')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className={`group p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                          data-testid={`notification-item-${notification.id}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getPriorityIcon(notification.priority)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium truncate ${getTypeColor(notification.type)}`}>
                                  {notification.title}
                                </p>
                                <div className="flex items-center space-x-1 ml-2">
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissMutation.mutate(notification.id);
                                    }}
                                    disabled={dismissMutation.isPending}
                                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                    data-testid={`dismiss-notification-${notification.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {notification.category} • {notification.priority}
                                </span>
                                <time className="text-xs text-muted-foreground">
                                  {new Date(notification.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-2">
                      <Link href="/notifications">
                        <Button variant="ghost" className="w-full justify-center text-sm" data-testid="view-all-notifications">
                          {t('common:notifications.viewAll', 'View all notifications')}
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
