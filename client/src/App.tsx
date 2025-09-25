import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { LanguageProvider } from "@/hooks/useLanguage";
import { SocketProvider } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next";
import "./i18n"; // Initialize i18n
import { AppLayout } from "@/components/layout/app-layout";
import { RTLLayout } from "@/components/rtl-layout";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";

import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import SimpleAuth from "@/pages/simple-auth";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import SearchResults from "@/pages/SearchResults";
import UnifiedDashboard from "@/pages/unified-dashboard";
import DemoDashboard from "@/pages/demo-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";

import AnalyticsDashboard from "@/pages/analytics-dashboard";
import GamificationProgress from "@/pages/gamification-progress";
import UserProfile from "@/pages/user-profile";
import CRMDashboard from "@/pages/crm-dashboard";
import StudentInformationSystem from "@/pages/student-information-system";
import { AdminDashboard as EnhancedAdminDashboard } from "@/pages/admin/admin-dashboard";
import { AdminStudents } from "@/pages/admin/students";
import { AdminCourses } from "@/pages/admin/courses";
import AdminVideoCourses from "@/pages/admin/video-courses";
import { AdminTeacherManagement } from "@/pages/admin/teacher-management";
import { AdminFinancial } from "@/pages/admin/financial";
import { AdminSystem } from "@/pages/admin/system-simple";
import AdminSettings from "@/pages/admin/settings";
import { IranianComplianceSettings } from "@/pages/admin/iranian-compliance-settings";
import { FinancialReportsPage } from "@/pages/admin/FinancialReportsPage";
import AIServicesManagement from "@/pages/admin/AIServicesManagement";
import GamesManagement from "@/pages/admin/games-management";
import AiTrainingDashboard from "@/pages/AiTrainingDashboard";
import { GameAccessControl } from "@/pages/admin/game-access-control";
import AdminTeacherPaymentsPage from "@/pages/admin/teacher-payments";
import WhiteLabelPage from "@/pages/admin/white-label";
import SupervisionPage from "@/pages/admin/supervision";
import SMSSettingsPage from "@/pages/admin/sms-settings";
import SMSTestPage from "@/pages/admin/sms-test";
import CampaignManagementPage from "@/pages/admin/campaign-management";
import WebsiteBuilderPage from "@/pages/admin/website-builder";
import AdminLeadsPage from "@/pages/admin/leads";
import AdminCampaignsPage from "@/pages/admin/campaigns";
import AdminProspectsPage from "@/pages/admin/prospects";
import AdminCallsPage from "@/pages/admin/calls";
import WalletPage from "@/pages/wallet";
import ReferralsPage from "@/pages/referrals";
import Courses from "@/pages/courses";
import LeadManagement from "@/pages/lead-management";
import CallCenterDashboard from "@/pages/callcenter/dashboard";
import UnifiedCallCenterWorkflow from "@/pages/callcenter/unified-workflow";
import VoIPCenter from "@/pages/callcenter/voip-center";
import SubsystemPermissions from "@/pages/admin/subsystem-permissions";
import TeacherDashboardNew from "@/pages/teacher/dashboard";
import AccountantDashboard from "@/pages/accountant/dashboard";
import MentorDashboard from "@/pages/mentor/dashboard";
import StudentDashboard from "@/pages/student/dashboard";
import SupervisorDashboard from "@/pages/supervisor/supervisor-dashboard";
import TeacherSupervisionDashboard from "@/pages/supervisor/teacher-supervision-dashboard";
import FrontDeskDashboard from "@/pages/frontdesk/dashboard";
import WalkInIntake from "@/pages/frontdesk/walk-in-intake";
import ScheduleObservationReview from "@/components/supervision/ScheduleObservationReview";

// Student pages
import TutorsPage from "@/pages/student/tutors";
import SessionsPage from "@/pages/student/sessions";
import HomeworkPage from "@/pages/student/homework";
import StudentAIConversation from "@/pages/student/AIConversation";
import StudentAIStudyPartnerMobile from "@/pages/student/ai-study-partner-mobile";
import MessagesPage from "@/pages/student/messages";
import PaymentPage from "@/pages/student/payment";
import PronunciationPracticePage from "@/pages/pronunciation-practice";
import StudentTestTaking from "@/pages/student/test-taking";
import StudentTestResults from "@/pages/student/test-results";
import StudentVideoCourses from "@/pages/student/video-courses";
import VideoCoursDetail from "@/pages/student/video-course-detail";
import VideoPlayer from "@/pages/student/video-player";
import StudentProfile from "@/pages/student/profile";
import VirtualMall from "@/pages/student/virtual-mall";
import StudentCart from "@/pages/student/cart";
import StudentCheckout from "@/pages/student/checkout";
import StudentOrderHistory from "@/pages/student/order-history";
import StudentOrderConfirmation from "@/pages/student/order-confirmation";
import StudentBookCatalog from "@/pages/student/book-catalog";
import StudentDashboardMobile from "@/pages/student/dashboard-mobile";
import StudentCoursesMobile from "@/pages/student/courses-mobile";
import BookReader from "@/pages/BookReader";
import CourseDetail from "@/pages/course-detail";
import LevelAssessment from "@/pages/level-assessment";
import MSTPage from "@/pages/mst";
import GamesPage from "@/pages/games";
import GamePlayer from "@/pages/game-player";
import MetaLinguaComplete from "@/pages/meta-lingua-complete";

// Teacher pages
import TeacherClassesPage from "@/pages/teacher/classes";
import TeacherSchedulePage from "@/pages/teacher/schedule";
import TeacherHomeworkPage from "@/pages/teacher/homework";
import TeacherAssignmentsPage from "@/pages/teacher/assignments";
import TeacherStudentsPage from "@/pages/teacher/students";
import TeacherResourcesPage from "@/pages/teacher/resources";
import TeacherReportsPage from "@/pages/teacher/reports";
import TeacherPaymentsPage from "@/pages/teacher/payments";
import TeacherTestsPage from "@/pages/teacher/tests";
import TestQuestionsPage from "@/pages/teacher/test-questions";
import TeacherVideoCourses from "@/pages/teacher/video-courses";
import TeacherAvailability from "@/pages/teacher/teacher-availability";
import ClassCommunication from "@/pages/teacher/class-communication";
import TeacherObservationsPage from "@/pages/teacher/observations";
import TeacherCallernSystem from "@/pages/teacher/callern";

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
import RoadmapDesigner from "@/pages/admin/roadmap-designer";
import MSTTestBuilder from "@/pages/admin/mst-test-builder";
import EcommerceManagement from "@/pages/admin/ecommerce";
import ShoppingCartSettings from "@/pages/admin/shopping-cart";
import CalendarSettings from "@/pages/admin/calendar-settings";
import CurrencySettings from "@/pages/admin/currency-settings";
import CourseRoadmaps from "@/pages/admin/course-roadmaps";
import RoadmapTemplates from "@/pages/admin/roadmap-templates";
import RoadmapInstances from "@/pages/admin/roadmap-instances";
import AIStudyPartner from "@/pages/admin/ai-study-partner";
import EnhancedAnalytics from "@/pages/admin/enhanced-analytics";
import TTSSystem from "@/pages/admin/tts-system";
import RoadmapPage from "@/pages/roadmap";
import CallernSystem from "@/pages/callern";
import CallernEnhancements from "@/pages/callern-enhancements";
import CallernVideoSession from "@/pages/callern-video-session";
import { VideoCall as CallernVideoCall } from "@/components/callern/VideoCallFinal";
import GamificationSystem from "@/pages/games";
import AIPracticePage from "@/pages/ai-practice";

// LinguaQuest Free Learning Platform
import { LinguaQuestHome } from "@/pages/linguaquest/LinguaQuestHome";
import { LinguaQuestLesson } from "@/pages/linguaquest/LinguaQuestLesson";

// Language provider removed - using useLanguage hook directly

// QueryClient is now configured with centralized API client in lib/queryClient.ts

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useAuth();
  const { t } = useTranslation(['common', 'courses']);

  // Show loading state only for initial load
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

  return <AppLayout>{children}</AppLayout>;
}

// Profile redirect component based on user role
function ProfileRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Redirect students to student profile
  if (user.role === 'Student') {
    return <Redirect to="/student/profile" />;
  }
  
  // For other roles, use the general profile
  return <UserProfile />;
}

function Router() {
  return (
    <Switch>
      {/* LinguaQuest Free Learning Platform Routes */}
      <Route path="/linguaquest" component={LinguaQuestHome} />
      <Route path="/linguaquest/lesson/:lessonId" component={LinguaQuestLesson} />
      
      {/* Meta Lingua Complete Implementation Testing */}
      <Route path="/meta-lingua-complete" component={MetaLinguaComplete} />
      
      <Route path="/auth" component={Auth} />
      <Route path="/simple-auth" component={SimpleAuth} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/demo" component={DemoDashboard} />
      <Route path="/manager">
        <ProtectedRoute>
          <ManagerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher">
        <Redirect to="/teacher/dashboard" />
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
          <ProfileRedirect />
        </ProtectedRoute>
      </Route>
      <Route path="/search">
        <ProtectedRoute>
          <SearchResults />
        </ProtectedRoute>
      </Route>
      <Route path="/pronunciation-practice">
        <ProtectedRoute>
          <PronunciationPracticePage />
        </ProtectedRoute>
      </Route>
      <Route path="/crm">
        <ProtectedRoute>
          <CRMDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/admin/dashboard">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/admin/students">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminStudents />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/courses">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminCourses />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/video-courses">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminVideoCourses />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/financial">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminFinancial />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/system">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminSystem />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/iranian-compliance">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <IranianComplianceSettings />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/leads">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminLeadsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/campaigns">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminCampaignsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/prospects">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminProspectsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/calls">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminCallsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminSettings />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/financial-reports">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <FinancialReportsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/ai-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AIServicesManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/ai-services">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AIServicesManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/ai-training">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AiTrainingDashboard />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/games-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <GamesManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/game-access-control">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <GameAccessControl />
        </RoleProtectedRoute>
      </Route>
      
      {/* Enterprise Features */}
      <Route path="/admin/teacher-payments">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminTeacherPaymentsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/white-label">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <WhiteLabelPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/sms-settings">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <SMSSettingsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/sms-test">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <SMSTestPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/campaign-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <CampaignManagementPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/website-builder">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <WebsiteBuilderPage />
        </RoleProtectedRoute>
      </Route>
      
      {/* New Admin Features */}
      <Route path="/admin/mst-test-builder">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <MSTTestBuilder />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/ecommerce">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <EcommerceManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/shopping-cart">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <ShoppingCartSettings />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/calendar-settings">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <CalendarSettings />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/currency-settings">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <CurrencySettings />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/course-roadmaps">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <CourseRoadmaps />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/roadmap-templates">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <RoadmapTemplates />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/roadmap-instances">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <RoadmapInstances />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/ai-study-partner">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AIStudyPartner />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/enhanced-analytics">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <EnhancedAnalytics />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/tts-system">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <TTSSystem />
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/teachers">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminTeacherManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/teacher-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminTeacherManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/subsystem-permissions">
        <RoleProtectedRoute allowedRoles={['admin']}>
          <SubsystemPermissions />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callcenter">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor']}>
          <UnifiedCallCenterWorkflow />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callcenter/dashboard">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor']}>
          <UnifiedCallCenterWorkflow />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callcenter/unified-workflow">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor']}>
          <UnifiedCallCenterWorkflow />
        </RoleProtectedRoute>
      </Route>
      <Route path="/lead-management">
        <ProtectedRoute>
          <LeadManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/callcenter/leads">
        <ProtectedRoute>
          <LeadManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/callcenter/voip">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center']}>
          <VoIPCenter />
        </RoleProtectedRoute>
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
      <Route path="/front-desk">
        <RoleProtectedRoute allowedRoles={['front_desk_clerk', 'admin']}>
          <FrontDeskDashboard />
        </RoleProtectedRoute>
      </Route>
      <Route path="/frontdesk">
        <RoleProtectedRoute allowedRoles={['front_desk_clerk', 'admin']}>
          <FrontDeskDashboard />
        </RoleProtectedRoute>
      </Route>
      <Route path="/frontdesk/walk-in-intake">
        <RoleProtectedRoute allowedRoles={['front_desk_clerk', 'admin']}>
          <WalkInIntake />
        </RoleProtectedRoute>
      </Route>
      <Route path="/student">
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student/dashboard">
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student/mobile">
        <ProtectedRoute>
          <StudentDashboardMobile />
        </ProtectedRoute>
      </Route>
      <Route path="/courses">
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses">
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses/mobile">
        <ProtectedRoute>
          <StudentCoursesMobile />
        </ProtectedRoute>
      </Route>
      <Route path="/course/:courseId">
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/student/profile">
        <ProtectedRoute>
          <StudentProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/callern">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor', 'teacher']}>
          <CallernSystem />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callern-enhancements">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor', 'teacher']}>
          <CallernEnhancements />
        </RoleProtectedRoute>
      </Route>
      <Route path="/games">
        <ProtectedRoute>
          <GamificationSystem />
        </ProtectedRoute>
      </Route>
      <Route path="/game/:gameId">
        <ProtectedRoute>
          <GamePlayer />
        </ProtectedRoute>
      </Route>
      <Route path="/game-player/:gameId">
        <ProtectedRoute>
          <GamePlayer />
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
      <Route path="/student/sessions">
        <ProtectedRoute>
          <SessionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/virtual-mall">
        <ProtectedRoute>
          <VirtualMall />
        </ProtectedRoute>
      </Route>
      <Route path="/student/cart">
        <ProtectedRoute>
          <StudentCart />
        </ProtectedRoute>
      </Route>
      <Route path="/student/checkout">
        <ProtectedRoute>
          <StudentCheckout />
        </ProtectedRoute>
      </Route>
      <Route path="/student/order-history">
        <ProtectedRoute>
          <StudentOrderHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/student/order-confirmation/:orderId">
        <ProtectedRoute>
          <StudentOrderConfirmation />
        </ProtectedRoute>
      </Route>
      <Route path="/student/book-catalog">
        <ProtectedRoute>
          <StudentBookCatalog />
        </ProtectedRoute>
      </Route>
      <Route path="/student/join-class">
        <ProtectedRoute>
          <SessionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/books/:bookId/read">
        <ProtectedRoute>
          <BookReader />
        </ProtectedRoute>
      </Route>
      <Route path="/orders/:orderId/books/:bookId/read">
        <ProtectedRoute>
          <BookReader />
        </ProtectedRoute>
      </Route>
      <Route path="/homework">
        <ProtectedRoute>
          <HomeworkPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/homework">
        <ProtectedRoute>
          <HomeworkPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/AIConversation">
        <ProtectedRoute>
          <StudentAIConversation />
        </ProtectedRoute>
      </Route>
      <Route path="/student/ai-study-partner">
        <ProtectedRoute>
          <StudentAIStudyPartnerMobile />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-study-partner">
        <ProtectedRoute>
          <StudentAIStudyPartnerMobile />
        </ProtectedRoute>
      </Route>
      <Route path="/assignments">
        <ProtectedRoute>
          <HomeworkPage />
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/messages">
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
      <Route path="/student/test-results">
        <RoleProtectedRoute allowedRoles={['student']}>
          <StudentTestResults />
        </RoleProtectedRoute>
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
      <Route path="/student/video-player/:sessionId">
        <ProtectedRoute>
          <VideoPlayer />
        </ProtectedRoute>
      </Route>
      <Route path="/student/games">
        <ProtectedRoute>
          <GamificationSystem />
        </ProtectedRoute>
      </Route>
      <Route path="/level-assessment">
        <ProtectedRoute>
          <LevelAssessment />
        </ProtectedRoute>
      </Route>
      <Route path="/placement-test">
        <ProtectedRoute>
          <MSTPage />
        </ProtectedRoute>
      </Route>
      <Route path="/mst">
        <ProtectedRoute>
          <MSTPage />
        </ProtectedRoute>
      </Route>
      <Route path="/games">
        <ProtectedRoute>
          <GamesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/game/:gameId">
        <ProtectedRoute>
          <GamePlayer />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-practice">
        <ProtectedRoute>
          <AIPracticePage />
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
      <Route path="/teacher/assignments">
        <ProtectedRoute>
          <TeacherAssignmentsPage />
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
      <Route path="/teacher/payments">
        <ProtectedRoute>
          <TeacherPaymentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/tests">
        <ProtectedRoute>
          <TeacherTestsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/tests/:testId">
        <ProtectedRoute>
          <TestQuestionsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/video-courses">
        <ProtectedRoute>
          <TeacherVideoCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/availability">
        <ProtectedRoute>
          <TeacherAvailability />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/class/:classId/chat">
        <ProtectedRoute>
          <ClassCommunication />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/observations">
        <ProtectedRoute>
          <TeacherObservationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/callern">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor', 'teacher']}>
          <TeacherCallernSystem />
        </RoleProtectedRoute>
      </Route>

      {/* Supervisor Routes */}
      <Route path="/supervisor/dashboard">
        <ProtectedRoute>
          <SupervisorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/supervisor/teacher-supervision">
        <ProtectedRoute>
          <TeacherSupervisionDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/supervisor/schedule-review">
        <ProtectedRoute>
          <ScheduleObservationReview />
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
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center']}>
          <CallLogsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callcenter/prospects">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center']}>
          <ProspectsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callcenter/campaigns">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center']}>
          <CampaignsPage />
        </RoleProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/classes">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminClassesPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/callern-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <CallernManagement />
        </RoleProtectedRoute>
      </Route>

      <Route path="/callern-session/:packageId/:studentId/:teacherId">
        <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor', 'teacher']}>
          <CallernVideoSession />
        </RoleProtectedRoute>
      </Route>
      <Route path="/callern/video/:callId">
        {(params: { callId: string }) => {
          const CallernVideoCallWrapper = () => {
            const { user } = useAuth();
            return (
              <CallernVideoCall
                roomId={params.callId}
                userId={user?.id || 0}
                role={(user?.role === 'teacher' ? 'teacher' : 'student') as 'teacher' | 'student'}
                onCallEnd={() => window.history.back()}
              />
            );
          };
          return (
            <RoleProtectedRoute allowedRoles={['admin', 'supervisor', 'call_center', 'mentor', 'teacher']}>
              <CallernVideoCallWrapper />
            </RoleProtectedRoute>
          );
        }}
      </Route>
      <Route path="/admin/room-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <RoomManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/mentor-matching">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <MentorMatchingPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/user-management">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <UserManagement />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/teacher-student-matching">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <TeacherStudentMatchingPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminReportsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/communications">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminCommunicationsPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/supervision">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminSupervisionPage />
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/roadmap-designer">
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <RoadmapDesigner />
        </RoleProtectedRoute>
      </Route>

      <Route path="/roadmap">
        <ProtectedRoute>
          <RoadmapPage />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <UnifiedDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        {(() => {
          const { user, isLoading } = useAuth();
          
          if (isLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Loading...</p>
                </div>
              </div>
            );
          }
          
          if (!user) {
            return <Redirect to="/auth" />;
          }
          
          // Role-based redirects to ensure students use mobile components
          if (user.role === 'student') {
            return <Redirect to="/student" />;
          }
          
          // All other authenticated users redirect to unified dashboard
          return <Redirect to="/dashboard" />;
        })()}
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
      <LanguageProvider>
        <SocketProvider>
          <RTLLayout>
            <AppWithBranding />
          </RTLLayout>
        </SocketProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
