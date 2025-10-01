import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { canAccessRoute, hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
import { Redirect } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: {
    action: 'view' | 'edit' | 'delete' | 'create';
    resource: string;
  };
  fallbackRoute?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  requiredPermission,
  fallbackRoute = "/dashboard"
}: RoleProtectedRouteProps) {
  const { user, isLoading, error } = useAuth();
  const { t } = useTranslation();

  // Show loading state
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  // If there's an error or no user, redirect to auth
  if (error || !user) {
    return <Redirect to="/auth" />;
  }

  // Normalize role mapping to handle database role names
  const normalizeRole = (role: string): UserRole => {
    const roleMapping: Record<string, UserRole> = {
      'admin': 'admin',
      'teacher': 'teacher', 
      'teacher/tutor': 'teacher',
      'student': 'student',
      'mentor': 'mentor',
      'supervisor': 'supervisor',
      'call center agent': 'call_center',
      'callcenter': 'call_center',
      'accountant': 'accountant',
      'manager': 'manager',
      'front desk clerk': 'front_desk_clerk',
      'frontdesk': 'front_desk_clerk',
      'front_desk': 'front_desk_clerk',
      'front_desk_clerk': 'front_desk_clerk',
      'frontdeskclerk': 'front_desk_clerk'
    };
    return roleMapping[role.toLowerCase()] || 'student';
  };
  
  const userRole = normalizeRole(user.role);

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="flex items-center gap-2 justify-center">
                <AlertTriangle className="h-5 w-5" />
                دسترسی محدود
              </CardTitle>
              <CardDescription>
                شما مجوز دسترسی به این بخش را ندارید
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                نقش شما: <span className="font-medium">{getRoleName(user.role)}</span>
              </p>
              <p className="text-xs text-gray-500">
                برای دسترسی به این بخش با مدیر سیستم تماس بگیرید
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(userRole, requiredPermission.action, requiredPermission.resource)) {
    return <Redirect to={fallbackRoute} />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    'Admin': 'مدیر سیستم',
    'Teacher': 'استاد',
    'Student': 'دانشجو',
    'Mentor': 'مربی',
    'Supervisor': 'ناظر',
    'Call Center Agent': 'کارشناس تماس',
    'Accountant': 'حسابدار'
  };
  return roleNames[role] || role;
}