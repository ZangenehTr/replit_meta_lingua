import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/use-language";

// Role-specific dashboard imports
import { AdminDashboard } from "@/pages/admin/admin-dashboard";
import SupervisorDashboard from "@/pages/supervisor/supervisor-dashboard";
import TeacherDashboard from "@/pages/teacher/dashboard";
import CallCenterDashboard from "@/pages/callcenter/dashboard";
import MentorDashboard from "@/pages/mentor/dashboard";
import StudentDashboard from "@/pages/student/dashboard";

// Accountant dashboard import (same as admin for now)
// Will be replaced with dedicated accountant dashboard when available

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
  const { t } = useTranslation(['common']);
  const { isRTL } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  // Add debug logging
  console.log('UnifiedDashboard rendering:', { user: user?.role, isRTL });

  // Check if mobile viewport with proper client-side detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading state while user data loads
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard content within unified layout
  switch (user.role) {
    case 'Admin':
      return <AdminDashboard />;
    
    case 'Supervisor':
      return <SupervisorDashboard />;
    
    case 'Teacher/Tutor':
      return <TeacherDashboard />;
    
    case 'Call Center Agent':
      return <CallCenterDashboard />;
    
    case 'Mentor':
      return <MentorDashboard />;
    
    case 'Student':
      return <StudentDashboard />;
    
    case 'Accountant':
      // For now, accountants use admin dashboard with filtered permissions
      // TODO: Create dedicated accountant dashboard with financial focus
      return <AdminDashboard />;
    
    default:
      // Fallback to student dashboard for unknown roles
      console.warn(`Unknown user role: ${user.role}, falling back to student dashboard`);
      return <StudentDashboard />;
  }
}