import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/useMediaQuery";

// Role-specific dashboard imports
import AdminDashboard from "@/pages/admin-dashboard";
import SupervisorDashboard from "@/pages/supervisor/supervisor-dashboard";
import TeacherDashboard from "@/pages/teacher/dashboard";
import CallCenterDashboard from "@/pages/callcenter/dashboard";
import MentorDashboard from "@/pages/mentor/dashboard";
import StudentDashboard from "@/pages/student/dashboard";
import AccountantDashboard from "@/pages/accountant/dashboard";
import FrontDeskDashboard from "@/pages/frontdesk/dashboard";

/**
 * Unified Dashboard Component
 * 
 * This component serves as the single entry point for all user roles after login.
 * It renders role-appropriate content while maintaining a unified /dashboard URL.
 * 
 * Each role sees their specific dashboard content with proper API endpoints:
 * - Admin: System analytics, user management, financial overview
 * - Supervisor: Quality assurance, teacher observations, business intelligence  
 * - Teacher: Class schedules, student progress, earnings
 * - Call Center: Lead management, call tracking, conversion metrics
 * - Mentor: Mentee progress, goal tracking, motivation support
 * - Student: Course progress, gamification, learning activities
 * - Accountant: Financial reports, payment processing, tax compliance
 */
export default function UnifiedDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['common', 'admin', 'student']);
  const { language, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const isStudent = user?.role?.toLowerCase() === 'student';

  // For students: check enrollment count to decide whether to show welcome page
  const { data: studentCourses, isLoading: coursesLoading } = useQuery<unknown[]>({
    queryKey: ["/api/student/courses"],
    enabled: isStudent,
    retry: false,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (isStudent && !coursesLoading && studentCourses !== undefined && studentCourses.length === 0) {
      navigate("/welcome");
    }
  }, [isStudent, coursesLoading, studentCourses, navigate]);

  // Add debug logging
  console.log('UnifiedDashboard rendering:', { user: user?.role, isRTL });

  // Show loading state while user data loads
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-sm w-full">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
          <p className="text-sm sm:text-base text-muted-foreground">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard content within unified layout
  // Handle both lowercase and capitalized role names
  const normalizedRole = user.role.toLowerCase();
  
  switch (normalizedRole) {
    case 'admin':
      return <AdminDashboard />;

    case 'supervisor':
      return <SupervisorDashboard />;

    case 'teacher/tutor':
    case 'teacher':
    case 'tutor':
      return <TeacherDashboard />;

    case 'call center agent':
    case 'callcenter':
      return <CallCenterDashboard />;

    case 'mentor':
      return <MentorDashboard />;

    case 'student':
      return <StudentDashboard />;

    case 'accountant':
      return <AccountantDashboard />;

    case 'front_desk_clerk':
    case 'frontdesk':
    case 'front_desk':
    case 'front desk clerk':
      return <FrontDeskDashboard />;

    default:
      // Fallback to student dashboard for unknown roles
      console.warn(`Unknown user role: ${user.role}, falling back to student dashboard`);
      return <StudentDashboard />;
  }
}