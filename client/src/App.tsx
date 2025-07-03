import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";

import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import DemoDashboard from "@/pages/demo-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import GamificationProgress from "@/pages/gamification-progress";
import UserProfile from "@/pages/user-profile";
import CRMDashboard from "@/pages/crm-dashboard";
import StudentInformationSystem from "@/pages/student-information-system";
import { AdminDashboard as EnhancedAdminDashboard } from "@/pages/admin/admin-dashboard";
import { AdminStudents } from "@/pages/admin/students";
import { AdminCourses } from "@/pages/admin/courses";
import { AdminCourseManagement } from "@/pages/admin/course-management-simple";
import { EnhancedCourseCreation } from "@/pages/admin/enhanced-course-creation";
import { AdminTeacherManagement } from "@/pages/admin/teacher-management";
import { AdminFinancial } from "@/pages/admin/financial";
import { AdminSystem } from "@/pages/admin/system-simple";
import AdminSettings from "@/pages/admin/settings";
import { FinancialReportsPage } from "@/pages/admin/FinancialReportsPage";
import { AIManagementPage } from "@/pages/admin/AIManagementPage";
import { AIManagementPageSimple } from "@/pages/admin/AIManagementPageSimple";
import WalletPage from "@/pages/wallet";
import ReferralsPage from "@/pages/referrals";
import Courses from "@/pages/courses";
import { LanguageProvider } from "@/hooks/use-language";

// QueryClient is now configured with centralized API client in lib/queryClient.ts

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useAuth();

  // Show loading state only for initial load
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If there's an error or no user, redirect to auth
  if (error || !user) {
    return <Redirect to="/auth" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/demo" component={DemoDashboard} />
      <Route path="/admin">
        <ProtectedRoute>
          <EnhancedAdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute>
          <AdminStudents />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute>
          <AdminCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financial">
        <ProtectedRoute>
          <AdminFinancial />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/system">
        <ProtectedRoute>
          <AdminSystem />
        </ProtectedRoute>
      </Route>
      <Route path="/manager">
        <ProtectedRoute>
          <ManagerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher">
        <ProtectedRoute>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/progress">
        <ProtectedRoute>
          <GamificationProgress />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/crm">
        <ProtectedRoute>
          <CRMDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <EnhancedAdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute>
          <AdminStudents />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute>
          <AdminCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financial">
        <ProtectedRoute>
          <AdminFinancial />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/system">
        <ProtectedRoute>
          <AdminSystem />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute>
          <AdminSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financial-reports">
        <ProtectedRoute>
          <FinancialReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/ai-management">
        <ProtectedRoute>
          <AIManagementPageSimple />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/course-management">
        <ProtectedRoute>
          <AdminCourseManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/create-course">
        <ProtectedRoute>
          <EnhancedCourseCreation />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/teachers">
        <ProtectedRoute>
          <AdminTeacherManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/courses">
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <WalletPage />
        </ProtectedRoute>
      </Route>
      <Route path="/referrals">
        <ProtectedRoute>
          <ReferralsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithBranding() {
  const { branding, isLoading } = useBranding();

  // Always render the app - don't block on branding
  return (
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithBranding />
    </QueryClientProvider>
  );
}

export default App;
