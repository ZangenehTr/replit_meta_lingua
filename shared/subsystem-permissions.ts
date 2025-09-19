// Comprehensive subsystem permissions tree structure
// This defines all app subsystems and features for role-based access control

export interface SubsystemPermission {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  children?: SubsystemPermission[];
  icon?: string;
}

export interface RolePermissions {
  [roleKey: string]: {
    subsystems: string[]; // Array of subsystem IDs the role has access to
  };
}

// Complete tree of all Meta Lingua subsystems and features
export const SUBSYSTEM_TREE: SubsystemPermission[] = [
  {
    id: "student_platform",
    name: "پلتفرم یادگیری دانش‌آموز",
    nameEn: "Student Learning Platform",
    icon: "GraduationCap",
    children: [
      { id: "student_dashboard", name: "داشبورد دانش‌آموز", nameEn: "Student Dashboard", icon: "Home" },
      { id: "courses", name: "دوره‌ها", nameEn: "Courses", icon: "BookOpen" },
      { id: "video_courses", name: "دوره‌های ویدیویی", nameEn: "Video Courses", icon: "Play" },
      { id: "callern_student", name: "تماس‌های ویدیویی (Callern)", nameEn: "Callern Video Calls", icon: "Video" },
      { id: "games", name: "بازی‌ها و گیمیفیکیشن", nameEn: "Games & Gamification", icon: "Gamepad2" },
      { id: "tutors", name: "یافتن معلم و منتور", nameEn: "Find Tutors & Mentors", icon: "Users" },
      { id: "sessions", name: "جلسات زنده", nameEn: "Live Sessions", icon: "Calendar" },
      { id: "tests", name: "آزمون‌ها و ارزیابی", nameEn: "Tests & Assessments", icon: "FileText" },
      { id: "homework", name: "تکالیف و تمرین‌ها", nameEn: "Homework & Assignments", icon: "ClipboardList" },
      { id: "messages", name: "پیام‌ها و چت", nameEn: "Messages & Chat", icon: "MessageSquare" },
      { id: "progress", name: "پیگیری پیشرفت", nameEn: "Progress Tracking", icon: "TrendingUp" },
      { id: "wallet", name: "کیف پول و اعتبار", nameEn: "Wallet & Credits", icon: "CreditCard" },
      { id: "referrals", name: "سیستم معرفی", nameEn: "Referral System", icon: "Share2" },
    ]
  },
  {
    id: "teacher_platform",
    name: "پلتفرم معلم/مربی",
    nameEn: "Teacher/Tutor Platform",
    icon: "Users",
    children: [
      { id: "teacher_dashboard", name: "داشبورد معلم", nameEn: "Teacher Dashboard", icon: "Home" },
      { id: "callern_teacher", name: "تماس‌های ویدیویی معلم", nameEn: "Teacher Callern", icon: "Video" },
      { id: "teacher_classes", name: "کلاس‌های من", nameEn: "My Classes", icon: "Users" },
      { id: "teacher_video_courses", name: "مدیریت دوره‌های ویدیویی", nameEn: "Video Course Management", icon: "Play" },
      { id: "teacher_schedule", name: "برنامه‌ریزی کلاس", nameEn: "Class Scheduling", icon: "Calendar" },
      { id: "teacher_assignments", name: "مدیریت تکالیف", nameEn: "Assignment Management", icon: "ClipboardCheck" },
      { id: "teacher_students", name: "مدیریت دانش‌آموزان", nameEn: "Student Management", icon: "GraduationCap" },
      { id: "teacher_resources", name: "منابع و مطالب", nameEn: "Resources & Materials", icon: "FileText" },
      { id: "teacher_reports", name: "گزارش‌ها", nameEn: "Reports", icon: "BarChart" },
      { id: "teacher_payments", name: "مدیریت پرداخت‌ها", nameEn: "Payment Management", icon: "DollarSign" },
    ]
  },
  {
    id: "institute_management",
    name: "پلتفرم مدیریت موسسه",
    nameEn: "Institute Management Platform",
    icon: "Building2",
    children: [
      { id: "sis", name: "سیستم اطلاعات دانش‌آموز", nameEn: "Student Information System", icon: "Users" },
      { id: "user_management", name: "مدیریت کاربران", nameEn: "User Management", icon: "UserCog" },
      { id: "course_management", name: "مدیریت دوره‌ها", nameEn: "Course Management", icon: "BookOpen" },
      { id: "video_course_management", name: "مدیریت دوره‌های ویدیویی", nameEn: "Video Course Management", icon: "Play" },
      { id: "class_scheduling", name: "برنامه‌ریزی کلاس", nameEn: "Class Scheduling", icon: "Calendar" },
      { id: "games_management", name: "مدیریت بازی‌ها", nameEn: "Games Management", icon: "Gamepad2" },
      { id: "game_access_control", name: "کنترل دسترسی بازی", nameEn: "Game Access Control", icon: "Settings" },
      { id: "callern_management", name: "مدیریت Callern", nameEn: "Callern Management", icon: "Video" },
      { id: "roadmap_designer", name: "طراح مسیر یادگیری", nameEn: "Learning Roadmap Designer", icon: "Map" },
      { id: "room_management", name: "مدیریت کلاس‌ها", nameEn: "Room Management", icon: "Building2" },
      { id: "mentor_matching", name: "تطبیق منتور", nameEn: "Mentor Matching", icon: "Users" },
      { id: "teacher_matching", name: "تطبیق معلم-دانش‌آموز", nameEn: "Teacher-Student Matching", icon: "GraduationCap" },
      { id: "staff_management", name: "مدیریت معلمان و کارکنان", nameEn: "Teacher & Staff Management", icon: "GraduationCap" },
      { id: "financial_management", name: "مدیریت مالی", nameEn: "Financial Management", icon: "DollarSign" },
      { id: "reports_analytics", name: "گزارش‌ها و تحلیل", nameEn: "Reports & Analytics", icon: "BarChart" },
      { id: "iranian_compliance", name: "تنظیمات بازار ایران", nameEn: "Iranian Market Compliance", icon: "Settings" },
      { id: "ai_services", name: "خدمات هوش مصنوعی", nameEn: "AI Services", icon: "Bot" },
      { id: "ai_training", name: "آموزش مدل‌های AI", nameEn: "AI Training Management", icon: "Bot" },
      { id: "communication_center", name: "مرکز ارتباطات", nameEn: "Communication Center", icon: "MessageCircle" },
      { id: "quality_assurance", name: "تضمین کیفیت", nameEn: "Quality Assurance", icon: "Eye" },
      { id: "schedule_review", name: "بررسی برنامه", nameEn: "Schedule Review", icon: "Calendar" },
      { id: "teacher_payment_management", name: "مدیریت حقوق معلمان", nameEn: "Teacher Payment Management", icon: "DollarSign" },
      { id: "white_label", name: "مدیریت برند سفید", nameEn: "White Label Management", icon: "Building2" },
      { id: "sms_management", name: "مدیریت SMS", nameEn: "SMS Management", icon: "Send" },
      { id: "campaign_management", name: "مدیریت کمپین", nameEn: "Campaign Management", icon: "Megaphone" },
      { id: "website_builder", name: "ساخت وب‌سایت", nameEn: "Website Builder", icon: "Globe" },
    ]
  },
  {
    id: "call_center",
    name: "مرکز تماس و CRM",
    nameEn: "Call Center & CRM",
    icon: "Phone",
    children: [
      { id: "unified_workflow", name: "جریان کار یکپارچه", nameEn: "Unified Workflow", icon: "Workflow" },
      { id: "lead_management", name: "مدیریت سرنخ", nameEn: "Lead Management", icon: "UserPlus" },
      { id: "call_logs", name: "سوابق تماس", nameEn: "Call Logs", icon: "Phone" },
      { id: "prospects", name: "مشتریان احتمالی", nameEn: "Prospects", icon: "Target" },
      { id: "call_campaigns", name: "کمپین‌های تماس", nameEn: "Call Campaigns", icon: "Megaphone" },
    ]
  },
  {
    id: "mentor_platform",
    name: "پلتفرم منتور",
    nameEn: "Mentor Platform",
    icon: "UserCheck",
    children: [
      { id: "mentor_dashboard", name: "داشبورد منتور", nameEn: "Mentor Dashboard", icon: "Home" },
      { id: "mentee_management", name: "مدیریت شاگردان", nameEn: "Mentee Management", icon: "Users" },
      { id: "mentoring_sessions", name: "جلسات منتورینگ", nameEn: "Mentoring Sessions", icon: "Calendar" },
      { id: "mentoring_progress", name: "پیگیری پیشرفت", nameEn: "Progress Tracking", icon: "TrendingUp" },
    ]
  }
];

// Default role permissions based on current system
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  "Student": {
    subsystems: [
      "student_dashboard", "courses", "video_courses", "callern_student", 
      "games", "tutors", "sessions", "tests", "homework", "messages", 
      "progress", "wallet", "referrals"
    ]
  },
  "Teacher": {
    subsystems: [
      "teacher_dashboard", "callern_teacher", "teacher_classes", "teacher_video_courses",
      "teacher_schedule", "teacher_assignments", "teacher_students", "teacher_resources",
      "teacher_reports", "teacher_payments"
    ]
  },
  "Mentor": {
    subsystems: [
      "mentor_dashboard", "mentee_management", "mentoring_sessions", 
      "mentoring_progress", "unified_workflow"
    ]
  },
  "Call Center Agent": {
    subsystems: [
      "unified_workflow", "lead_management", "call_logs", "prospects", 
      "call_campaigns"
    ]
  },
  "Supervisor": {
    subsystems: [
      // Institute Management
      "sis", "course_management", "video_course_management", "class_scheduling", 
      "games_management", "callern_management", "room_management", "staff_management",
      "financial_management", "reports_analytics", "communication_center", 
      "quality_assurance", "schedule_review", "sms_management",
      // Call Center
      "unified_workflow", "lead_management", "call_logs", "prospects", "call_campaigns"
    ]
  },
  "Accountant": {
    subsystems: [
      "financial_management", "teacher_payment_management", "reports_analytics"
    ]
  },
  "Admin": {
    subsystems: [
      // All subsystems - admin has full access
      "student_dashboard", "courses", "video_courses", "callern_student", "games", 
      "tutors", "sessions", "tests", "homework", "messages", "progress", "wallet", "referrals",
      "teacher_dashboard", "callern_teacher", "teacher_classes", "teacher_video_courses",
      "teacher_schedule", "teacher_assignments", "teacher_students", "teacher_resources",
      "teacher_reports", "teacher_payments",
      "sis", "user_management", "course_management", "video_course_management", 
      "class_scheduling", "games_management", "game_access_control", "callern_management",
      "roadmap_designer", "room_management", "mentor_matching", "teacher_matching",
      "staff_management", "financial_management", "reports_analytics", "iranian_compliance",
      "ai_services", "ai_training", "communication_center", "quality_assurance", 
      "schedule_review", "teacher_payment_management", "white_label", "sms_management",
      "campaign_management", "website_builder",
      "unified_workflow", "lead_management", "call_logs", "prospects", "call_campaigns",
      "mentor_dashboard", "mentee_management", "mentoring_sessions", "mentoring_progress"
    ]
  }
};

// Helper functions
export const getAllSubsystemIds = (): string[] => {
  const ids: string[] = [];
  
  const collectIds = (subsystems: SubsystemPermission[]) => {
    subsystems.forEach(subsystem => {
      if (subsystem.children) {
        collectIds(subsystem.children);
      } else {
        ids.push(subsystem.id);
      }
    });
  };
  
  collectIds(SUBSYSTEM_TREE);
  return ids;
};

export const findSubsystemById = (id: string): SubsystemPermission | null => {
  const search = (subsystems: SubsystemPermission[]): SubsystemPermission | null => {
    for (const subsystem of subsystems) {
      if (subsystem.id === id) {
        return subsystem;
      }
      if (subsystem.children) {
        const found = search(subsystem.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return search(SUBSYSTEM_TREE);
};