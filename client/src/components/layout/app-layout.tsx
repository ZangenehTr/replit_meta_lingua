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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, Home } from "lucide-react";
import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

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
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
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
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="font-semibold">Meta Lingua</span>
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.firstName} />
                  <AvatarFallback>
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
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content - proper spacing to prevent sidebar overlap */}
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}