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
import GamesManagement from "@/pages/admin/games-management";
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
import StudentTestTaking from "@/pages/student/test-taking";
import StudentVideoCourses from "@/pages/student/video-courses";
import VideoCoursDetail from "@/pages/student/video-course-detail";
import VideoPlayer from "@/pages/student/video-player";

// Teacher pages
import TeacherClassesPage from "@/pages/teacher/classes";
import TeacherSchedulePage from "@/pages/teacher/schedule";
import TeacherHomeworkPage from "@/pages/teacher/homework";
import TeacherStudentsPage from "@/pages/teacher/students";
import TeacherResourcesPage from "@/pages/teacher/resources";
import TeacherReportsPage from "@/pages/teacher/reports";
import TeacherTestsPage from "@/pages/teacher/tests";
import TeacherVideoCourses from "@/pages/teacher/video-courses";

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
import MentorMatchingPage from "@/pages/admin/mentor-matching";
import UserManagement from "@/pages/admin/user-management";
import TeacherStudentMatchingPage from "@/pages/admin/teacher-student-matching";
import RoomManagement from "@/pages/admin/room-management";
import { CallernManagement } from "@/pages/admin/callern-management";
import CallernSystem from "@/pages/callern";
import GamificationSystem from "@/pages/games";

// Language provider removed - using useLanguage hook directly

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
      <Route path="/admin/iranian-compliance">
        <ProtectedRoute>
          <IranianComplianceSettings />
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
          <AIServicesManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/games-management">
        <ProtectedRoute>
          <GamesManagement />
        </ProtectedRoute>
      </Route>
      
      {/* Enterprise Features */}
      <Route path="/admin/teacher-payments">
        <ProtectedRoute>
          <TeacherPaymentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/white-label">
        <ProtectedRoute>
          <WhiteLabelPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/sms-settings">
        <ProtectedRoute>
          <SMSSettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/campaign-management">
        <ProtectedRoute>
          <CampaignManagementPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/website-builder">
        <ProtectedRoute>
          <WebsiteBuilderPage />
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
      <Route path="/callern">
        <ProtectedRoute>
          <CallernSystem />
        </ProtectedRoute>
      </Route>
      <Route path="/games">
        <ProtectedRoute>
          <GamificationSystem />
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
      <Route path="/tests">
        <ProtectedRoute>
          <StudentTestTaking />
        </ProtectedRoute>
      </Route>
      <Route path="/video-courses">
        <ProtectedRoute>
          <StudentVideoCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/video-courses/:courseId">
        <ProtectedRoute>
          <VideoCoursDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/video-player/:lessonId">
        <ProtectedRoute>
          <VideoPlayer />
        </ProtectedRoute>
      </Route>
      <Route path="/student/games">
        <ProtectedRoute>
          <GamificationSystem />
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
      <Route path="/teacher/tests">
        <ProtectedRoute>
          <TeacherTestsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/video-courses">
        <ProtectedRoute>
          <TeacherVideoCourses />
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
      <Route path="/admin/callern-management">
        <ProtectedRoute>
          <AppLayout>
            <CallernManagement />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/room-management">
        <ProtectedRoute>
          <RoomManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/mentor-matching">
        <ProtectedRoute>
          <AppLayout>
            <MentorMatchingPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/user-management">
        <ProtectedRoute>
          <AppLayout>
            <UserManagement />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/teacher-student-matching">
        <ProtectedRoute>
          <AppLayout>
            <TeacherStudentMatchingPage />
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
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
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
