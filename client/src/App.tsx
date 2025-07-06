import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { AppLayout } from "@/components/layout/app-layout";

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
import { AdminTeacherManagement } from "@/pages/admin/teacher-management";
import { AdminFinancial } from "@/pages/admin/financial";
import { AdminSystem } from "@/pages/admin/system-simple";
import AdminSettings from "@/pages/admin/settings";
import { IranianComplianceSettings } from "@/pages/admin/iranian-compliance-settings";
import { FinancialReportsPage } from "@/pages/admin/FinancialReportsPage";
import AIServicesManagement from "@/pages/admin/AIServicesManagement";
import TeacherPaymentsPage from "@/pages/admin/teacher-payments";
import WhiteLabelPage from "@/pages/admin/white-label";
import SupervisionPage from "@/pages/admin/supervision";
import SMSSettingsPage from "@/pages/admin/sms-settings";
import CampaignManagementPage from "@/pages/admin/campaign-management";
import WebsiteBuilderPage from "@/pages/admin/website-builder";
import WalletPage from "@/pages/wallet";
import ReferralsPage from "@/pages/referrals";
import Courses from "@/pages/courses";
import LeadManagement from "@/pages/lead-management";
import CallCenterDashboard from "@/pages/callcenter/dashboard";
import TeacherDashboardNew from "@/pages/teacher/dashboard";
import AccountantDashboard from "@/pages/accountant/dashboard";
import MentorDashboard from "@/pages/mentor/dashboard";
import StudentDashboard from "@/pages/student/dashboard";

// Student pages
import TutorsPage from "@/pages/student/tutors";
import SessionsPage from "@/pages/student/sessions";
import HomeworkPage from "@/pages/student/homework";
import MessagesPage from "@/pages/student/messages";
import PaymentPage from "@/pages/student/payment";

// Teacher pages
import TeacherClassesPage from "@/pages/teacher/classes";
import TeacherSchedulePage from "@/pages/teacher/schedule";
import TeacherHomeworkPage from "@/pages/teacher/homework";
import TeacherStudentsPage from "@/pages/teacher/students";
import TeacherResourcesPage from "@/pages/teacher/resources";
import TeacherReportsPage from "@/pages/teacher/reports";

// Mentor pages
import MentorStudentsPage from "@/pages/mentor/students";
import MentorSessionsPage from "@/pages/mentor/sessions";
import MentorProgressPage from "@/pages/mentor/progress";

// Call Center pages
import CallLogsPage from "@/pages/callcenter/calls";
import ProspectsPage from "@/pages/callcenter/prospects";
import CampaignsPage from "@/pages/callcenter/campaigns";

// Admin pages
import AdminClassesPage from "@/pages/admin/classes";
import AdminReportsPage from "@/pages/admin/reports";
import AdminCommunicationsPage from "@/pages/admin/communications";
import AdminSupervisionPage from "@/pages/admin/supervision";

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

  return <AppLayout>{children}</AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/demo" component={DemoDashboard} />
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
          <GamificationProgress />
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
          <AppLayout>
            <EnhancedAdminDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute>
          <AppLayout>
            <AdminStudents />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute>
          <AppLayout>
            <AdminCourses />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financial">
        <ProtectedRoute>
          <AppLayout>
            <AdminFinancial />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/system">
        <ProtectedRoute>
          <AppLayout>
            <AdminSystem />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/iranian-compliance">
        <ProtectedRoute>
          <AppLayout>
            <IranianComplianceSettings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute>
          <AppLayout>
            <AdminSettings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financial-reports">
        <ProtectedRoute>
          <AppLayout>
            <FinancialReportsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/ai-management">
        <ProtectedRoute>
          <AppLayout>
            <AIServicesManagement />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Enterprise Features */}
      <Route path="/admin/teacher-payments">
        <ProtectedRoute>
          <AppLayout>
            <TeacherPaymentsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/white-label">
        <ProtectedRoute>
          <AppLayout>
            <WhiteLabelPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/sms-settings">
        <ProtectedRoute>
          <AppLayout>
            <SMSSettingsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/campaign-management">
        <ProtectedRoute>
          <AppLayout>
            <CampaignManagementPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/website-builder">
        <ProtectedRoute>
          <AppLayout>
            <WebsiteBuilderPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/teachers">
        <ProtectedRoute>
          <AdminTeacherManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/callcenter">
        <ProtectedRoute>
          <CallCenterDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/callcenter/leads">
        <ProtectedRoute>
          <LeadManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher-new">
        <ProtectedRoute>
          <TeacherDashboardNew />
        </ProtectedRoute>
      </Route>
      <Route path="/accountant">
        <ProtectedRoute>
          <AccountantDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/mentor">
        <ProtectedRoute>
          <MentorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student">
        <ProtectedRoute>
          <StudentDashboard />
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
      
      {/* Student Routes */}
      <Route path="/tutors">
        <ProtectedRoute>
          <TutorsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/sessions">
        <ProtectedRoute>
          <SessionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/homework">
        <ProtectedRoute>
          <HomeworkPage />
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/payment">
        <ProtectedRoute>
          <PaymentPage />
        </ProtectedRoute>
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard">
        <ProtectedRoute>
          <TeacherDashboardNew />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/classes">
        <ProtectedRoute>
          <TeacherClassesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/schedule">
        <ProtectedRoute>
          <TeacherSchedulePage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/homework">
        <ProtectedRoute>
          <TeacherHomeworkPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/students">
        <ProtectedRoute>
          <TeacherStudentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/resources">
        <ProtectedRoute>
          <TeacherResourcesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/reports">
        <ProtectedRoute>
          <TeacherReportsPage />
        </ProtectedRoute>
      </Route>

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard">
        <ProtectedRoute>
          <MentorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/mentor/students">
        <ProtectedRoute>
          <MentorStudentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/mentor/sessions">
        <ProtectedRoute>
          <MentorSessionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/mentor/progress">
        <ProtectedRoute>
          <MentorProgressPage />
        </ProtectedRoute>
      </Route>

      {/* Call Center Routes */}
      <Route path="/callcenter/calls">
        <ProtectedRoute>
          <CallLogsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/callcenter/prospects">
        <ProtectedRoute>
          <ProspectsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/callcenter/campaigns">
        <ProtectedRoute>
          <CampaignsPage />
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/classes">
        <ProtectedRoute>
          <AppLayout>
            <AdminClassesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute>
          <AppLayout>
            <AdminReportsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/communications">
        <ProtectedRoute>
          <AppLayout>
            <AdminCommunicationsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/supervision">
        <ProtectedRoute>
          <AppLayout>
            <AdminSupervisionPage />
          </AppLayout>
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
