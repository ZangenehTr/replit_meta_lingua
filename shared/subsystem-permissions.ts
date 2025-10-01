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
      { id: "ecommerce_system", name: "سیستم فروشگاه", nameEn: "E-commerce System", icon: "ShoppingCart" },
      { id: "book_ecommerce", name: "فروشگاه کتاب", nameEn: "Book E-commerce", icon: "Book" },
      { id: "shopping_cart", name: "سبد خرید", nameEn: "Shopping Cart", icon: "ShoppingBag" },
      { id: "course_roadmaps", name: "نقشه راه دوره‌ها", nameEn: "Course Roadmaps", icon: "Route" },
      { id: "roadmap_templates", name: "قالب‌های نقشه راه", nameEn: "Roadmap Templates", icon: "File" },
      { id: "roadmap_instances", name: "نمونه‌های نقشه راه", nameEn: "Roadmap Instances", icon: "MapPin" },
      { id: "callern_roadmaps", name: "نقشه راه Callern", nameEn: "Callern Roadmaps", icon: "Video" },
      { id: "exam_roadmaps", name: "نقشه راه آزمون", nameEn: "Exam Roadmaps", icon: "GraduationCap" },
      { id: "ai_study_partner", name: "همکار مطالعه AI", nameEn: "AI Study Partner", icon: "Bot" },
      { id: "enhanced_analytics", name: "تحلیل‌های پیشرفته", nameEn: "Enhanced Analytics", icon: "TrendingUp" },
      { id: "tts_system", name: "سیستم TTS", nameEn: "Text-to-Speech System", icon: "Volume2" },
      { id: "tts_pipeline", name: "خط تولید TTS", nameEn: "TTS Pipeline", icon: "Workflow" },
      { id: "3d_content_tools", name: "ابزارهای محتوای سه‌بعدی", nameEn: "3D Content Tools", icon: "Box" },
      { id: "third_party_integrations", name: "یکپارچگی‌های شخص ثالث", nameEn: "Third Party Integrations", icon: "Plug" },
      { id: "calendar_settings", name: "تنظیمات تقویم", nameEn: "Calendar Settings", icon: "CalendarDays" },
      { id: "currency_settings", name: "تنظیمات ارز", nameEn: "Currency Settings", icon: "Coins" },
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
    ]
  },
  "Call Center Agent": {
    subsystems: [
      "unified_workflow", "lead_management", "call_logs", "prospects", 
      "call_campaigns"
    ],
    actions: {
      "unified_workflow": ["read", "create", "update", "view", "list"],
      "lead_management": ["read", "create", "update", "view", "list"],
      "call_logs": ["read", "create", "update", "view", "list"],
      "prospects": ["read", "create", "update", "view", "list"],
      "call_campaigns": ["read", "view", "list", "participate"]
    }
  },
  "front_desk_clerk": {
    subsystems: [
      "front_desk_dashboard", "walk_in_management", "phone_call_logging", 
      "front_desk_tasks", "visitor_intake", "inquiry_tracking", 
      "appointment_scheduling", "trial_lesson_coordination",
      // Also give access to lead management for coordination
      "lead_management"
    ],
    actions: {
      "front_desk_dashboard": ["read", "view"],
      "walk_in_management": ["read", "create", "update", "view", "list", "delete"],
      "phone_call_logging": ["read", "create", "update", "view", "list"],
      "visitor_intake": ["read", "create", "update", "view", "list"],
      "inquiry_tracking": ["read", "create", "update", "view", "list"],
      "appointment_scheduling": ["read", "create", "update", "view", "list", "cancel"],
      "trial_lesson_coordination": ["read", "create", "update", "view", "list", "schedule"],
      // CRITICAL FIX: Add trial_lessons permissions to match API endpoints
      "trial_lessons": ["read", "create", "update", "view", "list", "checkin", "complete", "waitlist", "analytics"],
      "lead_management": ["read", "create", "update", "view", "list"],
      // Add front desk resource permissions
      "front_desk_operations": ["read", "create", "update", "view", "list", "delete", "complete", "convert"],
      "phone_call_logs": ["read", "create", "update", "view", "list", "delete"],
      "front_desk_tasks": ["read", "create", "update", "view", "list", "delete", "complete", "assign", "follow_up"]
    }
  },
  "Front Desk Clerk": {
    subsystems: [
      "front_desk_dashboard", "walk_in_management", "phone_call_logging", 
      "front_desk_tasks", "visitor_intake", "inquiry_tracking", 
      "appointment_scheduling", "trial_lesson_coordination",
      "lead_management"
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
      "lead_management": ["read", "create", "update", "view", "list"],
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
      "mentor_dashboard", "mentee_management", "mentoring_sessions", "mentoring_progress",
      // Front Desk subsystems
      "front_desk_dashboard", "walk_in_management", "phone_call_logging", 
      "front_desk_tasks", "visitor_intake", "inquiry_tracking", 
      "appointment_scheduling", "trial_lesson_coordination",
      // New subsystems found in backend routes
      "mst_test_builder", "placement_test", "linguaquest", "ecommerce_system", "book_ecommerce",
      "shopping_cart", "course_roadmaps", "roadmap_templates", "roadmap_instances", 
      "callern_roadmaps", "exam_roadmaps", "ai_study_partner", "enhanced_analytics",
      "tts_system", "tts_pipeline", "3d_content_tools", "third_party_integrations",
      "calendar_settings", "currency_settings"
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
  "ecommerce_system": "/admin/ecommerce",
  "book_ecommerce": "/admin/book-ecommerce",
  "shopping_cart": "/admin/shopping-cart",
  "course_roadmaps": "/admin/course-roadmaps",
  "roadmap_templates": "/admin/roadmap-templates", 
  "roadmap_instances": "/admin/roadmap-instances",
  "callern_roadmaps": "/admin/callern-roadmaps",
  "exam_roadmaps": "/admin/exam-roadmaps",
  "ai_study_partner": "/admin/ai-study-partner",
  "enhanced_analytics": "/admin/enhanced-analytics",
  "tts_system": "/admin/tts-system",
  "tts_pipeline": "/admin/tts-pipeline",
  "3d_content_tools": "/admin/3d-content-tools",
  "third_party_integrations": "/admin/third-party-integrations", 
  "calendar_settings": "/admin/calendar-settings",
  "currency_settings": "/admin/currency-settings",

  // Call Center
  "unified_workflow": "/callcenter/unified-workflow",
  "lead_management": "/admin/leads",
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

// Generate navigation items dynamically from SUBSYSTEM_TREE based on user role
export const generateDynamicNavigation = (userRole: string, t?: any): NavigationItem[] => {
  const userPermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  if (!userPermissions) {
    console.warn(`No permissions found for role: ${userRole}`);
    return [];
  }

  const allowedSubsystems = userPermissions.subsystems;
  const navigationItems: NavigationItem[] = [];

  // Collect all leaf subsystems (those without children) from SUBSYSTEM_TREE
  const collectLeafSubsystems = (subsystems: SubsystemPermission[]) => {
    subsystems.forEach(subsystem => {
      if (subsystem.children) {
        collectLeafSubsystems(subsystem.children);
      } else {
        // Only include if user has permission and route mapping exists
        if (allowedSubsystems.includes(subsystem.id) && SUBSYSTEM_ROUTES[subsystem.id]) {
          navigationItems.push({
            path: SUBSYSTEM_ROUTES[subsystem.id],
            icon: subsystem.icon || "Home",
            label: subsystem.name,
            nameEn: subsystem.nameEn,
            roles: [userRole]
          });
        }
      }
    });
  };

  collectLeafSubsystems(SUBSYSTEM_TREE);

  // Sort navigation items by nameEn for consistency
  return navigationItems.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
};

// Get role-specific filtered subsystems
export const getRoleSubsystems = (userRole: string): string[] => {
  const userPermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  return userPermissions ? userPermissions.subsystems : [];
};