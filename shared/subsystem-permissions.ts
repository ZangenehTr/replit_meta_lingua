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
    // NEW: Action-level permissions for fine-grained security
    actions: Record<string, string[]>; // { "resource": ["create", "read", "update", "delete"] }
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
      
      // Missing subsystems found in backend routes
      { id: "mst_test_builder", name: "سازنده آزمون MST", nameEn: "MST Test Builder", icon: "FileText" },
      { id: "placement_test", name: "آزمون تعیین سطح", nameEn: "Placement Test", icon: "ClipboardCheck" },
      { id: "linguaquest", name: "لینگوا کوئست", nameEn: "LinguaQuest", icon: "Map" },
      { id: "course_roadmaps", name: "نقشه راه دوره‌ها", nameEn: "Course Roadmaps", icon: "Route" },
      { id: "roadmap_templates", name: "قالب‌های نقشه راه", nameEn: "Roadmap Templates", icon: "File" },
      { id: "roadmap_instances", name: "نمونه‌های نقشه راه", nameEn: "Roadmap Instances", icon: "MapPin" },
      { id: "callern_roadmaps", name: "نقشه راه Callern", nameEn: "Callern Roadmaps", icon: "Video" },
      { id: "exam_roadmaps", name: "نقشه راه آزمون", nameEn: "Exam Roadmaps", icon: "GraduationCap" },
      { id: "ai_study_partner", name: "مدیریت همکار مطالعه AI", nameEn: "AI Study Partner Management", icon: "Bot" },
      { id: "enhanced_analytics", name: "تحلیل‌های پیشرفته", nameEn: "Enhanced Analytics", icon: "TrendingUp" },
      { id: "tts_system", name: "سیستم TTS", nameEn: "Text-to-Speech System", icon: "Volume2" },
      { id: "3d_content_tools", name: "ابزارهای محتوای سه‌بعدی", nameEn: "3D Content Tools", icon: "Box" },
      { id: "third_party_integrations", name: "یکپارچگی‌های شخص ثالث", nameEn: "Third Party Integrations", icon: "Plug" },
      { id: "calendar_settings", name: "تنظیمات تقویم", nameEn: "Calendar Settings", icon: "CalendarDays" },
      { id: "currency_settings", name: "تنظیمات ارز", nameEn: "Currency Settings", icon: "Coins" },
      { id: "form_management", name: "مدیریت فرم‌ها", nameEn: "Form Management", icon: "FileText" },
      { id: "font_management", name: "مدیریت فونت‌ها", nameEn: "Font Management", icon: "FileText" },
      { id: "subsystem_permissions", name: "مجوزهای زیرسیستم", nameEn: "Subsystem Permissions", icon: "Shield" },
      { id: "api_smoke_test", name: "تست API", nameEn: "API Smoke Test", icon: "Server" },
      { id: "visitor_chat", name: "چت بازدیدکنندگان", nameEn: "Visitor Chat", icon: "MessageCircle" },
      { id: "admin_settings", name: "تنظیمات سیستم", nameEn: "System Settings", icon: "Settings" },
      { id: "book_ecommerce", name: "فروشگاه کتاب", nameEn: "Book E-Commerce", icon: "ShoppingBag" },
      { id: "social_media_scraper", name: "رصد شبکه‌های اجتماعی", nameEn: "Social Media Scraper", icon: "Globe" },
      { id: "review_moderation", name: "مدیریت نظرات", nameEn: "Review Moderation", icon: "Eye" },
      { id: "shopping_cart_settings", name: "تنظیمات سبد خرید", nameEn: "Shopping Cart Settings", icon: "ShoppingCart" },
      { id: "system_status", name: "وضعیت سیستم", nameEn: "System Status", icon: "Server" },
      { id: "financial_reports", name: "گزارش‌های مالی", nameEn: "Financial Reports", icon: "BarChart" },
      { id: "curriculum_categories", name: "دسته‌بندی برنامه درسی", nameEn: "Curriculum Categories", icon: "BookOpen" },
      { id: "sms_test", name: "تست پیامک", nameEn: "SMS Test", icon: "Send" },
      { id: "3d_lesson_builder", name: "سازنده درس سه‌بعدی", nameEn: "3D Lesson Builder", icon: "Box" },
    ]
  },
  {
    id: "call_center",
    name: "مرکز تماس و CRM",
    nameEn: "Call Center & CRM",
    icon: "Phone",
    children: [
      { id: "unified_workflow", name: "مدیریت سرنخ کال‌سنتر", nameEn: "Callcenter Lead Management", icon: "Workflow" },
      { id: "call_logs", name: "سوابق تماس", nameEn: "Call Logs", icon: "Phone" },
      { id: "prospects", name: "مشتریان احتمالی", nameEn: "Prospects", icon: "Target" },
      { id: "call_campaigns", name: "کمپین‌های تماس", nameEn: "Call Campaigns", icon: "Megaphone" },
    ]
  },
  {
    id: "front_desk",
    name: "میز پذیرش و مراجعین",
    nameEn: "Front Desk & Walk-ins",
    icon: "UserCheck",
    children: [
      { id: "front_desk_dashboard", name: "داشبورد میز پذیرش", nameEn: "Front Desk Dashboard", icon: "Home" },
      { id: "walk_in_management", name: "مدیریت مراجعین", nameEn: "Walk-in Management", icon: "Users" },
      { id: "phone_call_logging", name: "ثبت تماس‌ها", nameEn: "Phone Call Logging", icon: "PhoneCall" },
      { id: "front_desk_tasks", name: "مدیریت وظایف", nameEn: "Task Management", icon: "CheckSquare" },
      { id: "visitor_intake", name: "پذیرش مراجعین", nameEn: "Visitor Intake", icon: "UserPlus" },
      { id: "inquiry_tracking", name: "پیگیری استعلامات", nameEn: "Inquiry Tracking", icon: "Search" },
      { id: "appointment_scheduling", name: "تنظیم قرارها", nameEn: "Appointment Scheduling", icon: "Calendar" },
      { id: "trial_lesson_coordination", name: "هماهنگی کلاس آزمایشی", nameEn: "Trial Lesson Coordination", icon: "BookOpen" },
    ]
  },
  {
    id: "hr_module",
    name: "منابع انسانی",
    nameEn: "Human Resources",
    icon: "Users2",
    children: [
      { id: "hr_employees", name: "مدیریت کارکنان", nameEn: "Employee Management", icon: "UserCircle" },
      { id: "hr_leave", name: "مدیریت مرخصی", nameEn: "Leave Management", icon: "CalendarOff" },
      { id: "hr_payroll", name: "حقوق و دستمزد", nameEn: "Payroll", icon: "Banknote" },
      { id: "hr_performance", name: "ارزیابی عملکرد AI", nameEn: "AI Performance Evaluation", icon: "Bot" },
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
      { id: "mentoring_progress", name: "پیگیری پیشرفت منتورینگ", nameEn: "Mentoring Progress", icon: "TrendingUp" },
    ]
  }
];

// Default role permissions based on current system with action-level granularity
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  "Student": {
    subsystems: [
      "student_dashboard", "courses", "video_courses", "callern_student", 
      "games", "tutors", "sessions", "tests", "homework", "messages", 
      "progress", "wallet", "referrals"
    ],
    actions: {
      "student_dashboard": ["read", "view"],
      "courses": ["read", "view", "list"],
      "video_courses": ["read", "view", "list"],
      "callern_student": ["read", "create", "update", "view"],
      "games": ["read", "view", "play", "list"],
      "sessions": ["read", "view", "list", "join"],
      "tests": ["read", "view", "take", "submit"],
      "homework": ["read", "view", "submit", "update"],
      "messages": ["read", "create", "view", "list"],
      "progress": ["read", "view"],
      "wallet": ["read", "view"],
      "referrals": ["read", "create", "view"]
    }
  },
  "Teacher/Tutor": {
    subsystems: [
      "teacher_dashboard", "callern_teacher", "teacher_classes", "teacher_video_courses",
      "teacher_schedule", "teacher_assignments", "teacher_students", "teacher_resources",
      "teacher_reports", "teacher_payments"
    ],
    actions: {
      "teacher_dashboard": ["read", "view"],
      "callern_teacher": ["read", "create", "update", "view", "list"],
      "teacher_classes": ["read", "create", "update", "view", "list"],
      "teacher_video_courses": ["read", "create", "update", "view", "list", "delete"],
      "teacher_schedule": ["read", "create", "update", "view", "list", "delete"],
      "teacher_assignments": ["read", "create", "update", "view", "list", "delete"],
      "teacher_students": ["read", "view", "list", "update"],
      "teacher_resources": ["read", "create", "update", "view", "list", "delete"],
      "teacher_reports": ["read", "view", "list", "generate"],
      "teacher_payments": ["read", "view", "list"]
    }
  },
  "Mentor": {
    subsystems: [
      "mentor_dashboard", "mentee_management", "mentoring_sessions", 
      "mentoring_progress", "unified_workflow"
    ],
    actions: {}
  },
  "Call Center Agent": {
    subsystems: [
      "unified_workflow", "call_logs", "prospects", 
      "call_campaigns"
    ],
    actions: {
      "unified_workflow": ["read", "create", "update", "view", "list"],
      "call_logs": ["read", "create", "update", "view", "list"],
      "prospects": ["read", "create", "update", "view", "list"],
      "call_campaigns": ["read", "view", "list", "participate"]
    }
  },
  "Front Desk Clerk": {
    subsystems: [
      "front_desk_dashboard", "walk_in_management", "phone_call_logging", 
      "front_desk_tasks", "visitor_intake", "inquiry_tracking", 
      "appointment_scheduling", "trial_lesson_coordination"
    ],
    actions: {
      "front_desk_dashboard": ["read", "view"],
      "walk_in_management": ["read", "create", "update", "view", "list", "delete"],
      "phone_call_logging": ["read", "create", "update", "view", "list"],
      "visitor_intake": ["read", "create", "update", "view", "list"],
      "inquiry_tracking": ["read", "create", "update", "view", "list"],
      "appointment_scheduling": ["read", "create", "update", "view", "list", "cancel"],
      "trial_lesson_coordination": ["read", "create", "update", "view", "list", "schedule"],
      "trial_lessons": ["read", "create", "update", "view", "list", "checkin", "complete", "waitlist", "analytics"],
      "front_desk_operations": ["read", "create", "update", "view", "list", "delete", "complete", "convert"],
      "phone_call_logs": ["read", "create", "update", "view", "list", "delete"],
      "front_desk_tasks": ["read", "create", "update", "view", "list", "delete", "complete", "assign", "follow_up"]
    }
  },
  "Supervisor": {
    subsystems: [
      // Institute Management
      "sis", "course_management", "video_course_management", "class_scheduling", 
      "games_management", "callern_management", "room_management", "staff_management",
      "financial_management", "reports_analytics", "communication_center", 
      "quality_assurance", "schedule_review", "sms_management", "mentor_matching",
      // Call Center
      "unified_workflow", "call_logs", "prospects", "call_campaigns",
      // HR Module (read-only for supervisor, including payroll view)
      "hr_employees", "hr_leave", "hr_payroll", "hr_performance"
    ],
    actions: {
      "hr_employees": ["read", "view", "list"],
      "hr_leave": ["read", "view", "list", "update"],
      "hr_payroll": ["read", "view", "list"],
      "hr_performance": ["read", "view", "list"]
    }
  },
  "Accountant": {
    subsystems: [
      "financial_management", "teacher_payment_management", "reports_analytics",
      // HR Payroll access
      "hr_payroll"
    ],
    actions: {
      "hr_payroll": ["read", "view", "list"]
    }
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
      "roadmap_designer", "room_management", "teacher_matching",
      "staff_management", "financial_management", "reports_analytics", "iranian_compliance",
      "ai_services", "ai_training", "communication_center", "quality_assurance", 
      "schedule_review", "teacher_payment_management", "white_label", "sms_management",
      "campaign_management", "website_builder",
      "unified_workflow", "call_logs", "prospects", "call_campaigns",
      "mentor_dashboard", "mentee_management", "mentoring_sessions", "mentoring_progress",
      // Front Desk subsystems
      "front_desk_dashboard", "walk_in_management", "phone_call_logging", 
      "front_desk_tasks", "visitor_intake", "inquiry_tracking", 
      "appointment_scheduling", "trial_lesson_coordination",
      // New subsystems found in backend routes
      "mst_test_builder", "placement_test", "linguaquest",
      "course_roadmaps", "roadmap_templates", "roadmap_instances", 
      "callern_roadmaps", "exam_roadmaps", "ai_study_partner", "enhanced_analytics",
      "tts_system", "3d_content_tools", "third_party_integrations",
      "calendar_settings", "currency_settings",
      "form_management", "font_management", "subsystem_permissions", "api_smoke_test",
      "visitor_chat", "admin_settings", "book_ecommerce", "social_media_scraper",
      "review_moderation", "shopping_cart_settings", "system_status", "financial_reports",
      "curriculum_categories", "sms_test", "3d_lesson_builder",
      // HR Module
      "hr_employees", "hr_leave", "hr_payroll", "hr_performance"
    ],
    actions: {
      // Admin has ALL actions on ALL resources - full system access
      "*": ["create", "read", "update", "delete", "list", "view", "manage", "admin", "execute", "generate", "export", "import", "configure"]
    }
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

// Dynamic navigation generator interface
export interface NavigationItem {
  path: string;
  icon: string;
  label: string;
  nameEn: string;
  roles: string[];
  badge?: number;
  order: number; // Required for stable sorting regardless of translation state
  section?: string;
}

// Subsystem ID to route path mapping
export const SUBSYSTEM_ROUTES: Record<string, string> = {
  // Student Platform
  "student_dashboard": "/dashboard",
  "courses": "/courses", 
  "video_courses": "/video-courses",
  "callern_student": "/callern",
  "games": "/games",
  "tutors": "/tutors",
  "sessions": "/sessions",
  "tests": "/tests",
  "homework": "/homework", 
  "messages": "/messages",
  "progress": "/progress",
  "wallet": "/wallet",
  "referrals": "/referrals",

  // Teacher Platform
  "teacher_dashboard": "/dashboard",
  "callern_teacher": "/teacher/callern",
  "teacher_classes": "/teacher/classes",
  "teacher_video_courses": "/admin/video-courses",
  "teacher_schedule": "/teacher/schedule",
  "teacher_assignments": "/teacher/assignments",
  "teacher_students": "/teacher/students",
  "teacher_resources": "/teacher/resources",
  "teacher_reports": "/teacher/reports",
  "teacher_payments": "/teacher/payments",

  // Institute Management
  "sis": "/admin/students",
  "user_management": "/admin/user-management",
  "course_management": "/admin/courses",
  "video_course_management": "/admin/video-courses",
  "class_scheduling": "/admin/classes",
  "games_management": "/admin/games-management",
  "game_access_control": "/admin/game-access-control",
  "callern_management": "/admin/callern-management",
  "roadmap_designer": "/admin/roadmap-designer",
  "room_management": "/admin/room-management",
  "mentor_matching": "/admin/mentor-matching",
  "teacher_matching": "/admin/teacher-student-matching",
  "staff_management": "/admin/teachers",
  "financial_management": "/admin/financial",
  "reports_analytics": "/admin/reports",
  "iranian_compliance": "/admin/iranian-compliance",
  "ai_services": "/admin/ai-services",
  "ai_training": "/admin/ai-training",
  "communication_center": "/admin/communications",
  "quality_assurance": "/admin/supervision",
  "schedule_review": "/supervisor/schedule-review",
  "teacher_payment_management": "/admin/teacher-payments",
  "white_label": "/admin/white-label",
  "sms_management": "/admin/sms-settings",
  "campaign_management": "/admin/campaign-management",
  "website_builder": "/admin/website-builder",

  // New Missing Subsystems
  "mst_test_builder": "/admin/mst-test-builder",
  "placement_test": "/admin/placement-test",
  "linguaquest": "/admin/linguaquest",
  "course_roadmaps": "/admin/course-roadmaps",
  "roadmap_templates": "/admin/roadmap-templates", 
  "roadmap_instances": "/admin/roadmap-instances",
  "callern_roadmaps": "/admin/callern-roadmaps",
  "exam_roadmaps": "/admin/exam-roadmaps",
  "ai_study_partner": "/admin/ai-study-partner",
  "enhanced_analytics": "/admin/enhanced-analytics",
  "tts_system": "/admin/tts-system",
  "3d_content_tools": "/admin/3d-content-tools",
  "third_party_integrations": "/admin/iranian-compliance", 
  "calendar_settings": "/admin/calendar-settings",
  "currency_settings": "/admin/currency-settings",
  "form_management": "/admin/form-management",
  "font_management": "/admin/font-management",
  "subsystem_permissions": "/admin/subsystem-permissions",
  "api_smoke_test": "/admin/api-smoke-test",
  "visitor_chat": "/admin/visitor-chat",
  "admin_settings": "/admin/settings",
  "book_ecommerce": "/admin/book-ecommerce",
  "social_media_scraper": "/admin/social-media-scraper",
  "review_moderation": "/admin/review-moderation",
  "shopping_cart_settings": "/admin/shopping-cart",
  "system_status": "/admin/system",
  "financial_reports": "/admin/financial-reports",
  "curriculum_categories": "/admin/curriculum-categories",
  "sms_test": "/admin/sms-test",
  "3d_lesson_builder": "/admin/3d-lesson-builder",

  // HR Module
  "hr_employees": "/admin/hr/employees",
  "hr_leave": "/admin/hr/leave",
  "hr_payroll": "/admin/hr/payroll",
  "hr_performance": "/admin/hr/performance",

  // Call Center
  "unified_workflow": "/callcenter/unified-workflow",
  "call_logs": "/admin/calls",
  "prospects": "/admin/prospects", 
  "call_campaigns": "/admin/campaigns",

  // Mentor Platform
  "mentor_dashboard": "/dashboard",
  "mentee_management": "/mentor/students",
  "mentoring_sessions": "/mentor/sessions",
  "mentoring_progress": "/mentor/progress",

  // Front Desk Platform
  "front_desk_dashboard": "/frontdesk",
  "walk_in_management": "/frontdesk/walk-in-intake",
  "phone_call_logging": "/frontdesk/call-logging",
  "front_desk_tasks": "/frontdesk/caller-history",
  "visitor_intake": "/frontdesk/walk-in-intake",
  "inquiry_tracking": "/frontdesk/caller-history",
  "appointment_scheduling": "/frontdesk/trial-scheduling",
  "trial_lesson_coordination": "/frontdesk/trial-scheduling"
};

// Map subsystems to their primary platform/role for color coding
const SUBSYSTEM_PRIMARY_ROLE: Record<string, string> = {
  // Student Platform
  "student_dashboard": "Student",
  "courses": "Student",
  "video_courses": "Student",
  "callern_student": "Student",
  "games": "Student",
  "tutors": "Student",
  "sessions": "Student",
  "tests": "Student",
  "homework": "Student",
  "messages": "Student",
  "progress": "Student",
  "wallet": "Student",
  "referrals": "Student",
  
  // Teacher Platform
  "teacher_dashboard": "Teacher/Tutor",
  "callern_teacher": "Teacher/Tutor",
  "teacher_classes": "Teacher/Tutor",
  "teacher_schedule": "Teacher/Tutor",
  "teacher_assignments": "Teacher/Tutor",
  "teacher_students": "Teacher/Tutor",
  "teacher_resources": "Teacher/Tutor",
  "teacher_reports": "Teacher/Tutor",
  "teacher_payments": "Teacher/Tutor",
  
  // Admin Platform - default to Admin if not specified
};

// Helper function to get all roles that have access to a subsystem
const getRolesForSubsystem = (subsystemId: string): string[] => {
  const rolesWithAccess: string[] = [];
  
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (permissions.subsystems && permissions.subsystems.includes(subsystemId)) {
      rolesWithAccess.push(role);
    }
  }
  
  return rolesWithAccess;
};

export const INSTITUTE_SECTION_MAP: Record<string, { fa: string; en: string }> = {
  sis: { fa: "افراد و دسترسی", en: "People & Access" },
  user_management: { fa: "افراد و دسترسی", en: "People & Access" },
  staff_management: { fa: "افراد و دسترسی", en: "People & Access" },
  mentor_matching: { fa: "افراد و دسترسی", en: "People & Access" },
  teacher_matching: { fa: "افراد و دسترسی", en: "People & Access" },
  subsystem_permissions: { fa: "افراد و دسترسی", en: "People & Access" },

  course_management: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  video_course_management: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  class_scheduling: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  curriculum_categories: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  mst_test_builder: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  placement_test: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  course_roadmaps: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  roadmap_templates: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  roadmap_instances: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  roadmap_designer: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },
  exam_roadmaps: { fa: "دوره‌ها و آموزش", en: "Courses & Academics" },

  games_management: { fa: "بازی و تعاملی", en: "Games & Interactive" },
  game_access_control: { fa: "بازی و تعاملی", en: "Games & Interactive" },
  linguaquest: { fa: "بازی و تعاملی", en: "Games & Interactive" },
  "3d_content_tools": { fa: "بازی و تعاملی", en: "Games & Interactive" },
  "3d_lesson_builder": { fa: "بازی و تعاملی", en: "Games & Interactive" },

  ai_services: { fa: "هوش مصنوعی و فناوری", en: "AI & Technology" },
  ai_training: { fa: "هوش مصنوعی و فناوری", en: "AI & Technology" },
  ai_study_partner: { fa: "هوش مصنوعی و فناوری", en: "AI & Technology" },
  tts_system: { fa: "هوش مصنوعی و فناوری", en: "AI & Technology" },

  callern_management: { fa: "ارتباطات", en: "Communication" },
  callern_roadmaps: { fa: "ارتباطات", en: "Communication" },
  communication_center: { fa: "ارتباطات", en: "Communication" },
  visitor_chat: { fa: "ارتباطات", en: "Communication" },
  sms_management: { fa: "ارتباطات", en: "Communication" },
  campaign_management: { fa: "ارتباطات", en: "Communication" },
  sms_test: { fa: "ارتباطات", en: "Communication" },

  financial_management: { fa: "مالی", en: "Financial" },
  financial_reports: { fa: "مالی", en: "Financial" },
  currency_settings: { fa: "مالی", en: "Financial" },
  shopping_cart_settings: { fa: "مالی", en: "Financial" },
  book_ecommerce: { fa: "مالی", en: "Financial" },
  teacher_payment_management: { fa: "مالی", en: "Financial" },

  website_builder: { fa: "وبسایت و محتوا", en: "Website & Content" },
  white_label: { fa: "وبسایت و محتوا", en: "Website & Content" },
  social_media_scraper: { fa: "وبسایت و محتوا", en: "Website & Content" },
  review_moderation: { fa: "وبسایت و محتوا", en: "Website & Content" },
  form_management: { fa: "وبسایت و محتوا", en: "Website & Content" },
  font_management: { fa: "وبسایت و محتوا", en: "Website & Content" },

  reports_analytics: { fa: "تحلیل و کیفیت", en: "Analytics & Quality" },
  enhanced_analytics: { fa: "تحلیل و کیفیت", en: "Analytics & Quality" },
  quality_assurance: { fa: "تحلیل و کیفیت", en: "Analytics & Quality" },
  schedule_review: { fa: "تحلیل و کیفیت", en: "Analytics & Quality" },

  admin_settings: { fa: "سیستم و تنظیمات", en: "System & Settings" },
  system_status: { fa: "سیستم و تنظیمات", en: "System & Settings" },
  api_smoke_test: { fa: "سیستم و تنظیمات", en: "System & Settings" },
  calendar_settings: { fa: "سیستم و تنظیمات", en: "System & Settings" },
  iranian_compliance: { fa: "سیستم و تنظیمات", en: "System & Settings" },
  third_party_integrations: { fa: "سیستم و تنظیمات", en: "System & Settings" },
  room_management: { fa: "سیستم و تنظیمات", en: "System & Settings" },

  teacher_dashboard: { fa: "تدریس", en: "Teaching" },
  callern_teacher: { fa: "تدریس", en: "Teaching" },
  teacher_classes: { fa: "تدریس", en: "Teaching" },
  teacher_schedule: { fa: "تدریس", en: "Teaching" },
  teacher_assignments: { fa: "تدریس", en: "Teaching" },
  teacher_students: { fa: "تدریس", en: "Teaching" },
  teacher_video_courses: { fa: "محتوا و گزارش", en: "Content & Reports" },
  teacher_resources: { fa: "محتوا و گزارش", en: "Content & Reports" },
  teacher_reports: { fa: "محتوا و گزارش", en: "Content & Reports" },
  teacher_payments: { fa: "مالی", en: "Financial" },

  unified_workflow: { fa: "مرکز تماس", en: "Call Center" },
  call_logs: { fa: "مرکز تماس", en: "Call Center" },
  prospects: { fa: "مرکز تماس", en: "Call Center" },
  call_campaigns: { fa: "مرکز تماس", en: "Call Center" },

  front_desk_dashboard: { fa: "پذیرش", en: "Reception" },
  walk_in_management: { fa: "پذیرش", en: "Reception" },
  visitor_intake: { fa: "پذیرش", en: "Reception" },
  phone_call_logging: { fa: "ارتباطات", en: "Communication" },
  inquiry_tracking: { fa: "ارتباطات", en: "Communication" },
  front_desk_tasks: { fa: "ارتباطات", en: "Communication" },
  appointment_scheduling: { fa: "برنامه‌ریزی", en: "Scheduling" },
  trial_lesson_coordination: { fa: "برنامه‌ریزی", en: "Scheduling" },

  mentor_dashboard: { fa: "منتورینگ", en: "Mentoring" },
  mentee_management: { fa: "منتورینگ", en: "Mentoring" },
  mentoring_sessions: { fa: "منتورینگ", en: "Mentoring" },
  mentoring_progress: { fa: "منتورینگ", en: "Mentoring" },
};

// Generate navigation items dynamically from SUBSYSTEM_TREE based on user role
export const generateDynamicNavigation = (userRole: string, t?: any): NavigationItem[] => {
  const userPermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  if (!userPermissions) {
    console.warn(`No permissions found for role: ${userRole}`);
    return [];
  }

  const allowedSubsystems = userPermissions.subsystems;
  const navigationItems: NavigationItem[] = [];
  let orderCounter = 0;

  // Collect all leaf subsystems (those without children) from SUBSYSTEM_TREE
  const collectLeafSubsystems = (subsystems: SubsystemPermission[], parentPlatform?: string) => {
    subsystems.forEach(subsystem => {
      if (subsystem.children) {
        // Determine platform from parent subsystem
        let platform = parentPlatform;
        if (subsystem.id === "student_platform") platform = "Student";
        else if (subsystem.id === "teacher_platform") platform = "Teacher/Tutor";
        else if (subsystem.id === "mentor_platform") platform = "Mentor";
        else if (subsystem.id === "call_center_platform") platform = "Call Center Agent";
        else if (subsystem.id === "front_desk_platform") platform = "Front Desk Clerk";
        else if (subsystem.id === "supervisor_platform") platform = "Supervisor";
        else if (!platform) platform = "Admin"; // Default to Admin
        
        collectLeafSubsystems(subsystem.children, platform);
      } else {
        if (allowedSubsystems.includes(subsystem.id) && SUBSYSTEM_ROUTES[subsystem.id]) {
          const allRolesWithAccess = getRolesForSubsystem(subsystem.id);
          
          let section = parentPlatform || "Other";
          if (INSTITUTE_SECTION_MAP[subsystem.id]) {
            section = INSTITUTE_SECTION_MAP[subsystem.id].en;
          }
          
          navigationItems.push({
            path: SUBSYSTEM_ROUTES[subsystem.id],
            icon: subsystem.icon || "Home",
            label: subsystem.name,
            nameEn: subsystem.nameEn,
            roles: allRolesWithAccess.length > 0 ? allRolesWithAccess : [userRole],
            order: orderCounter++,
            section
          });
        }
      }
    });
  };

  collectLeafSubsystems(SUBSYSTEM_TREE);

  // Get current language from t if available
  const currentLang = t?.i18n?.language || 'en';
  
  // Sort navigation items alphabetically by the actual displayed label
  // This ensures menu items are sorted by what the user sees, not hard-coded fallback text
  return navigationItems.sort((a, b) => {
    // Use the correct locale for localeCompare based on current language
    const locale = currentLang === 'fa' ? 'fa' : 
                   currentLang === 'ar' ? 'ar' : 
                   'en';
    
    // For Persian/Arabic, sort by the Persian/Arabic label (a.label contains localized text)
    // For English, translate both labels to ensure we sort by rendered text, not nameEn
    if (currentLang === 'fa' || currentLang === 'ar') {
      // Sort by localized label with correct locale
      const labelA = a.label || a.nameEn || '';
      const labelB = b.label || b.nameEn || '';
      return labelA.localeCompare(labelB, locale);
    } else {
      // For English, get the actual translated text if available, fallback to nameEn
      // Since we're in the navigation generation, we use the translation that was applied
      const labelA = a.nameEn || a.label || '';
      const labelB = b.nameEn || b.label || '';
      return labelA.localeCompare(labelB, locale);
    }
  });
};

// Get role-specific filtered subsystems
export const getRoleSubsystems = (userRole: string): string[] => {
  const userPermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  return userPermissions ? userPermissions.subsystems : [];
};