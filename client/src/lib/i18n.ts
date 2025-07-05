// Multilingual support for Meta Lingua platform
export type Language = 'en' | 'fa' | 'ar';

export interface Translations {
  // Navigation
  dashboard: string;
  manager: string;
  teacher: string;
  admin: string;
  logout: string;

  // Dashboard Common
  overview: string;
  students: string;
  classes: string;
  assignments: string;
  sessions: string;
  reports: string;
  settings: string;

  // Teacher Dashboard
  teachingOverview: string;
  studentProgress: string;
  myClasses: string;
  homeworkReview: string;
  createAssignment: string;
  scheduleSession: string;
  sendAnnouncement: string;
  myStudents: string;
  teachingRating: string;
  sessionsCompleted: string;
  pendingReviews: string;
  todaysSchedule: string;
  studentAchievements: string;
  quickActions: string;

  // Manager Dashboard
  managerDashboard: string;
  performanceOverview: string;
  teacherManagement: string;
  courseAnalytics: string;
  createClass: string;
  assignTeacher: string;
  activeStudents: string;
  monthlyRevenue: string;
  activeTeachers: string;
  satisfactionScore: string;

  // Forms
  title: string;
  description: string;
  course: string;
  courses: string;
  dueDate: string;
  startDate: string;
  endDate: string;
  schedule: string;
  duration: string;
  materials: string;
  objectives: string;
  priority: string;
  save: string;
  cancel: string;
  create: string;
  createCourse: string;
  update: string;
  delete: string;
  submit: string;

  // Calendar
  today: string;
  month: string;
  week: string;
  day: string;
  selectDate: string;
  pickDate: string;

  // Status
  active: string;
  inactive: string;
  pending: string;
  completed: string;
  scheduled: string;
  cancelled: string;
  submitted: string;
  graded: string;
  overdue: string;
  rating: string;
  averageRating: string;

  // Time
  minutes: string;
  hours: string;
  days: string;
  weeks: string;
  months: string;

  // Common
  search: string;
  filter: string;
  sort: string;
  actions: string;
  edit: string;
  view: string;
  loading: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  
  // Dashboard specific
  upcomingSessions: string;
  recentMessages: string;
  courseProgress: string;
  liveVideoClasses: string;
  viewAll: string;
  noUpcomingSessions: string;
  noMessages: string;
  joinLive: string;
  learningStreak: string;
  availableCredits: string;
  
  // Navigation
  myDashboard: string;
  myCourses: string;
  findTutors: string;
  liveSessions: string;
  homework: string;
  messages: string;
  progress: string;
  paymentCredits: string;
  profile: string;
  signOut: string;
  
  // Missing keys
  joinNow: string;
  reschedule: string;
  joining: string;
  continueReading: string;
  enrollNow: string;
  enrolling: string;
  myCourses2: string;
  availableCourses: string;
  noCourses: string;
  challenges: string;
  leaderboard: string;
  with: string;
  today: string;
  daysAgo: string;
  hoursAgo: string;
  justNow: string;
  noCoursesAvailable: string;
  continueLearning: string;
  updating: string;

  // New Dashboard Keys
  viewAllTasks: string;
  noPendingHomework: string;
  greatJobStaying: string;
  creditsPayment: string;
  creditsAvailable: string;
  buyMoreCredits: string;
  securePaymentVia: string;
  basedOnPerformance: string;
  getPersonalizedPlan: string;
  practicePronounciation: string;
  reviewIrregularVerbs: string;
  focusOnListening: string;
  poweredByOllama: string;
  studentsCount: string;
  viewAllTutors: string;
  noTutorsAvailable: string;
  basicInfo: string;
  learning: string;
  preferences: string;
  cultural: string;
  profileSettings: string;
  manageAccount: string;
  learningProfile: string;
  tellUsAbout: string;
  nativeLanguage: string;
  currentProficiency: string;
  preferredLearningStyle: string;
  preferredStudyTime: string;
  weeklyStudyHours: string;
  aboutMe: string;
  updateLearningProfile: string;
  updateBasicInfo: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  optionalForSMS: string;
  readyToContinue: string;
  lessonsDay: string;
  streak: string;
  discoverLanguageLevel: string;
  takeAssessment: string;
  whatIsMyLevel: string;
  
  // Additional missing keys from screenshots
  start: string;
  noCoursesAvailableAtMoment: string;
  
  // Course Management Keys
  courseManagement: string;
  advancedCourseBuilder: string;
  enrolledStudents: string;
  totalStudents: string;
  completionRate: string;
  adminDashboard: string;
  
  // Role-based navigation keys (PRD specified roles)
  studentInformationSystem: string;
  courseManagement: string;
  classScheduling: string;
  teacherManagement: string;
  financialManagement: string;
  reportsAnalytics: string;
  communicationCenter: string;
  qualityAssurance: string;
  leadManagement: string;
  callLogs: string;
  prospects: string;
  campaigns: string;
  mentees: string;
  mentoringSessions: string;
  progressTracking: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    manager: "Manager",
    teacher: "Teacher",
    admin: "Admin",
    logout: "Logout",

    // Dashboard Common
    students: "Students",
    classes: "Classes",
    assignments: "Assignments",
    sessions: "Sessions",
    reports: "Reports",
    settings: "Settings",

    // Teacher Dashboard
    teachingOverview: "Teaching Overview",
    studentProgress: "Student Progress",
    myClasses: "My Classes",
    homeworkReview: "Homework Review",
    createAssignment: "Create Assignment",
    scheduleSession: "Schedule Session",
    sendAnnouncement: "Send Announcement",
    myStudents: "My Students",
    teachingRating: "Teaching Rating",
    sessionsCompleted: "Sessions Completed",
    pendingReviews: "Pending Reviews",
    todaysSchedule: "Today's Schedule",
    studentAchievements: "Student Achievements",
    quickActions: "Quick Teaching Actions",

    // Manager Dashboard
    managerDashboard: "Manager Dashboard",
    performanceOverview: "Performance Overview",
    courseAnalytics: "Course Analytics",
    createClass: "Create Class",
    assignTeacher: "Assign Teacher",
    activeStudents: "Active Students",
    monthlyRevenue: "Monthly Revenue",
    activeTeachers: "Active Teachers",
    satisfactionScore: "Satisfaction Score",

    // Forms
    title: "Title",
    description: "Description",
    course: "Course",
    courses: "Courses",
    dueDate: "Due Date",
    startDate: "Start Date",
    endDate: "End Date",
    schedule: "Schedule",
    duration: "Duration",
    materials: "Materials",
    objectives: "Objectives",
    priority: "Priority",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    createCourse: "Create Course",
    update: "Update",
    delete: "Delete",
    submit: "Submit",

    // Calendar
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    selectDate: "Select Date",
    pickDate: "Pick a date",

    // Status
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
    submitted: "Submitted",
    graded: "Graded",
    overdue: "Overdue",
    rating: "Rating",
    averageRating: "Average Rating",

    // Time
    minutes: "minutes",
    hours: "hours",
    days: "days",
    weeks: "weeks",
    months: "months",

    // Common
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    actions: "Actions",
    edit: "Edit",
    view: "View",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Information",
    
    // Dashboard specific
    upcomingSessions: "Upcoming Sessions",
    recentMessages: "Recent Messages",
    courseProgress: "Course Progress",
    liveVideoClasses: "Live Video Classes",
    liveVirtualClassroom: "Live Virtual Classroom",
    viewAll: "View All",
    noUpcomingSessions: "No upcoming sessions scheduled",
    noMessages: "No messages yet",
    joinLive: "Join Live",
    joinNow: "Join Now",
    learningStreak: "Learning Streak",
    availableCredits: "Available Credits",
    pendingHomework: "Pending Homework",
    leaderboard: "Leaderboard",
    challenges: "Challenges",
    overview: "Overview",
    creditsAndPayment: "Credits & Payment",
    aiStudyAssistant: "AI Study Assistant",
    courseProgressAndEnrollment: "Course Progress & Enrollment",
    featuredTutors: "Featured Tutors",
    welcomeBack: "Welcome back",
    whatsMyLevel: "What's my level",
    myProgress: "My Progress",
    myProfile: "My Profile",
    
    // Navigation
    myDashboard: "Dashboard",
    myCourses: "My Courses",
    findTutors: "Find Tutors",
    liveSessions: "Live Sessions",
    homework: "Homework",
    messages: "Messages",
    progress: "Progress",
    paymentCredits: "Payment & Credits",
    profile: "Profile",
    signOut: "Sign Out",
    
    // Additional keys
    reschedule: "Reschedule",
    joining: "Joining...",
    continueReading: "Continue Reading",
    enrollNow: "Enroll Now",
    enrolling: "Enrolling...",
    myCourses2: "My Courses",
    availableCourses: "Available Courses",
    noCourses: "No courses available at the moment",
    with: "with",
    daysAgo: "days ago",
    hoursAgo: "hours ago",
    justNow: "Just now",
    noCoursesAvailable: "No courses available at the moment",
    continueLearning: "Continue Learning",
    updating: "Updating...",
    
    // New Dashboard Keys
    viewAllTasks: "View All Tasks",
    noPendingHomework: "No pending homework",
    greatJobStaying: "Great job staying on top of your tasks",
    creditsPayment: "Credits & Payment",
    creditsAvailable: "Credits Available",
    buyMoreCredits: "Buy More Credits",
    securePaymentVia: "Secure payment via Shetab",
    basedOnPerformance: "Based on your recent performance, here are personalized recommendations for your learning journey",
    getPersonalizedPlan: "Get Personalized Study Plan",
    practicePronounciation: "Practice pronunciation for the next few sessions",
    reviewIrregularVerbs: "Review irregular verbs in your target language",
    focusOnListening: "Focus on listening comprehension exercises",
    poweredByOllama: "Powered by Ollama AI - Recommendations update based on your progress",
    studentsCount: "students",
    viewAllTutors: "View All Tutors",
    noTutorsAvailable: "No tutors available at the moment",
    basicInfo: "Basic Info",
    learning: "Learning",
    preferences: "Preferences",
    cultural: "Cultural",
    profileSettings: "Profile Settings",
    manageAccount: "Manage your account and learning preferences",
    learningProfile: "Learning Profile",
    tellUsAbout: "Tell us about your language learning goals and preferences",
    nativeLanguage: "Native Language",
    currentProficiency: "Current Proficiency Level",
    preferredLearningStyle: "Preferred Learning Style",
    preferredStudyTime: "Preferred Study Time",
    weeklyStudyHours: "Weekly Study Hours",
    aboutMe: "About Me",
    updateLearningProfile: "Update Learning Profile",
    updateBasicInfo: "Update Basic Info",
    firstName: "First Name",
    lastName: "Last Name",
    phoneNumber: "Phone Number",
    optionalForSMS: "Optional - for SMS notifications and support",
    readyToContinue: "Ready to continue your language learning journey",
    lessonsDay: "Lessons",
    streak: "Day Streak",
    discoverLanguageLevel: "Discover Your Language Level",
    takeAssessment: "Take our comprehensive assessment to determine your exact proficiency level",
    whatIsMyLevel: "What is my level",
    
    // Additional missing keys from screenshots
    start: "Start",
    noCoursesAvailableAtMoment: "No courses available at the moment",
    
    // Course Management Keys  
    advancedCourseBuilder: "Advanced course builder with multimedia content and assessment tools",
    enrolledStudents: "Enrolled Students",
    totalStudents: "Total Students",
    completionRate: "Completion Rate",
    adminDashboard: "Admin Dashboard",
    
    // Role-based navigation keys (PRD specified roles)
    studentInformationSystem: "Student Information System",
    courseManagement: "Course Management",
    classScheduling: "Class Scheduling",
    teacherManagement: "Teacher Management",
    financialManagement: "Financial Management",
    reportsAnalytics: "Reports & Analytics",
    communicationCenter: "Communication Center",
    qualityAssurance: "Quality Assurance",
    leadManagement: "Lead Management",
    callLogs: "Call Logs",
    prospects: "Prospects",
    campaigns: "Campaigns",
    mentees: "Mentees",
    mentoringSessions: "Mentoring Sessions",
    progressTracking: "Progress Tracking",
  },

  fa: {
    // Navigation
    dashboard: "داشبورد",
    manager: "مدیر",
    teacher: "معلم",
    admin: "ادمین",
    logout: "خروج",

    // Dashboard Common
    students: "دانش‌آموزان",
    classes: "کلاس‌ها",
    assignments: "تکالیف",
    sessions: "جلسات",
    reports: "گزارش‌ها",
    settings: "تنظیمات",

    // Teacher Dashboard
    teachingOverview: "نمای کلی تدریس",
    studentProgress: "پیشرفت دانش‌آموزان",
    myClasses: "کلاس‌های من",
    homeworkReview: "بررسی تکالیف",
    createAssignment: "ایجاد تکلیف",
    scheduleSession: "زمان‌بندی جلسه",
    sendAnnouncement: "ارسال اطلاعیه",
    myStudents: "دانش‌آموزان من",
    teachingRating: "امتیاز تدریس",
    sessionsCompleted: "جلسات تکمیل شده",
    pendingReviews: "بررسی‌های در انتظار",
    todaysSchedule: "برنامه امروز",
    studentAchievements: "دستاوردهای دانش‌آموزان",
    quickActions: "اقدامات سریع تدریس",

    // Manager Dashboard
    managerDashboard: "داشبورد مدیر",
    performanceOverview: "نمای کلی عملکرد",
    courseAnalytics: "تحلیل دوره‌ها",
    createClass: "ایجاد کلاس",
    assignTeacher: "تخصیص معلم",
    activeStudents: "دانش‌آموزان فعال",
    monthlyRevenue: "درآمد ماهانه",
    activeTeachers: "معلمان فعال",
    satisfactionScore: "امتیاز رضایت",

    // Forms
    title: "عنوان",
    description: "توضیحات",
    course: "دوره",
    courses: "دوره‌ها",
    dueDate: "مهلت تحویل",
    startDate: "تاریخ شروع",
    endDate: "تاریخ پایان",
    schedule: "زمان‌بندی",
    duration: "مدت زمان",
    materials: "مواد آموزشی",
    objectives: "اهداف",
    priority: "اولویت",
    save: "ذخیره",
    cancel: "انصراف",
    create: "ایجاد",
    createCourse: "ایجاد دوره",
    update: "به‌روزرسانی",
    delete: "حذف",
    submit: "ارسال",

    // Calendar
    today: "امروز",
    month: "ماه",
    week: "هفته",
    day: "روز",
    selectDate: "انتخاب تاریخ",
    pickDate: "یک تاریخ انتخاب کنید",

    // Status
    active: "فعال",
    inactive: "غیرفعال",
    pending: "در انتظار",
    completed: "تکمیل شده",
    scheduled: "زمان‌بندی شده",
    cancelled: "لغو شده",
    submitted: "ارسال شده",
    graded: "نمره‌گذاری شده",
    overdue: "گذشته از موعد",
    rating: "امتیاز",
    averageRating: "میانگین امتیاز",

    // Time
    minutes: "دقیقه",
    hours: "ساعت",
    days: "روز",
    weeks: "هفته",
    months: "ماه",

    // Common
    search: "جستجو",
    filter: "فیلتر",
    sort: "مرتب‌سازی",
    actions: "اقدامات",
    edit: "ویرایش",
    view: "مشاهده",
    loading: "در حال بارگذاری...",
    error: "خطا",
    success: "موفقیت",
    warning: "هشدار",
    info: "اطلاعات",
    
    // Dashboard specific
    upcomingSessions: "جلسات آتی",
    recentMessages: "پیام‌های اخیر",
    courseProgress: "پیشرفت دوره",
    liveVideoClasses: "کلاس‌های ویدیویی زنده",
    liveVirtualClassroom: "کلاس مجازی زنده",
    viewAll: "مشاهده همه",
    noUpcomingSessions: "هیچ جلسه‌ای برنامه‌ریزی نشده",
    noMessages: "هیچ پیامی وجود ندارد",
    joinLive: "پیوستن زنده",
    joinNow: "هم‌اکنون بپیوندید",
    learningStreak: "روزهای مطالعه",
    availableCredits: "اعتبار موجود",
    pendingHomework: "تکالیف در انتظار",
    leaderboard: "جدول امتیازات",
    challenges: "چالش‌ها",
    overview: "نمای کلی",
    creditsAndPayment: "اعتبار و پرداخت",
    aiStudyAssistant: "دستیار هوشمند مطالعه",
    courseProgressAndEnrollment: "پیشرفت دوره و ثبت‌نام",
    featuredTutors: "اساتید ویژه",
    welcomeBack: "خوش آمدید",
    whatsMyLevel: "سطح من چیست",
    myProgress: "پیشرفت من",
    myProfile: "پروفایل من",
    
    // Navigation
    myDashboard: "داشبورد",
    myCourses: "دوره‌های من",
    findTutors: "یافتن مربی",
    liveSessions: "جلسات زنده",
    homework: "تکالیف",
    messages: "پیام‌ها",
    progress: "پیشرفت",
    paymentCredits: "پرداخت و اعتبار",
    profile: "پروفایل",
    signOut: "خروج",
    
    // Additional keys
    reschedule: "تغییر زمان",
    joining: "در حال پیوستن...",
    continueReading: "ادامه مطالعه",
    enrollNow: "ثبت‌نام کنید",
    enrolling: "در حال ثبت‌نام...",
    myCourses2: "دوره‌های من",
    availableCourses: "دوره‌های موجود",
    noCourses: "در حال حاضر هیچ دوره‌ای موجود نیست",
    with: "با",
    daysAgo: "روز پیش",
    hoursAgo: "ساعت پیش",
    justNow: "هم‌اکنون",
    noCoursesAvailable: "در حال حاضر هیچ دوره‌ای موجود نیست",
    continueLearning: "ادامه یادگیری",
    updating: "در حال به‌روزرسانی...",
    
    // Missing dashboard translations
    discoverLanguageLevel: "سطح زبان خود را کشف کنید",
    takeAssessment: "ارزیابی جامع ما را انجام دهید تا سطح دقیق مهارت خود را تعیین کنید",
    whatIsMyLevel: "سطح من چیست",
    start: "شروع",
    noCoursesAvailableAtMoment: "در حال حاضر هیچ دوره‌ای موجود نیست",
    
    // Course Management Keys
    advancedCourseBuilder: "سازنده دوره پیشرفته با محتوای چندرسانه‌ای و ابزارهای ارزیابی",
    enrolledStudents: "دانش‌آموزان ثبت‌نام‌شده",
    totalStudents: "کل دانش‌آموزان",
    completionRate: "نرخ تکمیل",
    adminDashboard: "داشبورد مدیریت",
    
    // Role-based navigation keys (PRD specified roles)
    studentInformationSystem: "سیستم اطلاعات دانش‌آموزان",
    courseManagement: "مدیریت دوره‌ها",
    classScheduling: "زمان‌بندی کلاس‌ها",
    teacherManagement: "مدیریت اساتید",
    financialManagement: "مدیریت مالی",
    reportsAnalytics: "گزارش‌ها و تحلیل‌ها",
    communicationCenter: "مرکز ارتباطات",
    qualityAssurance: "تضمین کیفیت",
    leadManagement: "مدیریت لیدها",
    callLogs: "سوابق تماس‌ها",
    prospects: "مشتریان بالقوه",
    campaigns: "کمپین‌ها",
    mentees: "شاگردان",
    mentoringSessions: "جلسات منتورینگ",
    progressTracking: "رهگیری پیشرفت",
  },

  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    manager: "المدير",
    teacher: "المعلم",
    admin: "المشرف",
    logout: "تسجيل الخروج",

    // Dashboard Common
    students: "الطلاب",
    classes: "الفصول",
    assignments: "المهام",
    sessions: "الجلسات",
    reports: "التقارير",
    settings: "الإعدادات",

    // Teacher Dashboard
    teachingOverview: "نظرة عامة على التدريس",
    studentProgress: "تقدم الطلاب",
    myClasses: "فصولي",
    homeworkReview: "مراجعة الواجبات",
    createAssignment: "إنشاء مهمة",
    scheduleSession: "جدولة جلسة",
    sendAnnouncement: "إرسال إعلان",
    myStudents: "طلابي",
    teachingRating: "تقييم التدريس",
    sessionsCompleted: "الجلسات المكتملة",
    pendingReviews: "المراجعات المعلقة",
    todaysSchedule: "جدول اليوم",
    studentAchievements: "إنجازات الطلاب",
    quickActions: "إجراءات سريعة للتدريس",

    // Manager Dashboard
    managerDashboard: "لوحة تحكم المدير",
    performanceOverview: "نظرة عامة على الأداء",
    teacherManagement: "إدارة المعلمين",
    courseAnalytics: "تحليلات الدورة",
    createClass: "إنشاء فصل",
    assignTeacher: "تعيين معلم",
    activeStudents: "الطلاب النشطون",
    monthlyRevenue: "الإيرادات الشهرية",
    activeTeachers: "المعلمون النشطون",
    satisfactionScore: "درجة الرضا",

    // Forms
    title: "العنوان",
    description: "الوصف",
    course: "الدورة",
    courses: "الدورات",
    dueDate: "تاريخ الاستحقاق",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    schedule: "الجدولة",
    duration: "المدة",
    materials: "المواد",
    objectives: "الأهداف",
    priority: "الأولوية",
    save: "حفظ",
    cancel: "إلغاء",
    create: "إنشاء",
    createCourse: "إنشاء دورة",
    update: "تحديث",
    delete: "حذف",
    submit: "إرسال",

    // Calendar
    today: "اليوم",
    month: "شهر",
    week: "أسبوع",
    day: "يوم",
    selectDate: "اختر التاريخ",
    pickDate: "اختر تاريخاً",

    // Status
    active: "نشط",
    inactive: "غير نشط",
    pending: "معلق",
    completed: "مكتمل",
    scheduled: "مجدول",
    cancelled: "ملغى",
    submitted: "مرسل",
    graded: "مصحح",
    overdue: "متأخر",
    rating: "التقييم",
    averageRating: "متوسط التقييم",

    // Time
    minutes: "دقائق",
    hours: "ساعات",
    days: "أيام",
    weeks: "أسابيع",
    months: "أشهر",

    // Common
    search: "بحث",
    filter: "تصفية",
    sort: "ترتيب",
    actions: "إجراءات",
    edit: "تعديل",
    view: "عرض",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجح",
    warning: "تحذير",
    info: "معلومات",
    
    // Dashboard specific
    upcomingSessions: "الجلسات القادمة",
    recentMessages: "الرسائل الأخيرة",
    courseProgress: "تقدم الدورة",
    liveVideoClasses: "الفصول المباشرة",
    liveVirtualClassroom: "الفصل الافتراضي المباشر",
    viewAll: "عرض الكل",
    noUpcomingSessions: "لا توجد جلسات مجدولة قادمة",
    noMessages: "لا توجد رسائل بعد",
    joinLive: "انضم مباشرة",
    joinNow: "انضم الآن",
    learningStreak: "سلسلة التعلم",
    availableCredits: "الرصيد المتاح",
    pendingHomework: "الواجبات المعلقة",
    leaderboard: "لوحة المتصدرين",
    challenges: "التحديات",
    overview: "نظرة عامة",
    creditsAndPayment: "الأرصدة والدفع",
    aiStudyAssistant: "مساعد الدراسة الذكي",
    courseProgressAndEnrollment: "تقدم الدورة والتسجيل",
    featuredTutors: "المدرسون المميزون",
    welcomeBack: "مرحباً بعودتك",
    whatsMyLevel: "ما هو مستواي",
    myProgress: "تقدمي",
    myProfile: "ملفي الشخصي",
    
    // Navigation
    myDashboard: "لوحة التحكم",
    myCourses: "دوراتي",
    findTutors: "العثور على مدرسين",
    liveSessions: "الجلسات المباشرة",
    homework: "الواجبات",
    messages: "الرسائل",
    progress: "التقدم",
    paymentCredits: "الدفع والأرصدة",
    profile: "الملف الشخصي",
    signOut: "تسجيل الخروج",
    
    // Missing dashboard translations
    discoverLanguageLevel: "اكتشف مستوى اللغة الخاص بك",
    takeAssessment: "خذ تقييمنا الشامل لتحديد مستوى إتقانك بدقة",
    whatIsMyLevel: "ما هو مستواي",
    start: "ابدأ",
    noCoursesAvailableAtMoment: "لا توجد دورات متاحة في الوقت الحالي",
    
    // Course Management Keys
    advancedCourseBuilder: "منشئ الدورات المتقدم مع المحتوى متعدد الوسائط وأدوات التقييم",
    enrolledStudents: "الطلاب المسجلون",
    totalStudents: "إجمالي الطلاب",
    completionRate: "معدل الإنجاز",
    adminDashboard: "لوحة تحكم الإدارة",
  }
};

// Persian calendar utilities
export const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const persianWeekdays = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

// Convert Gregorian to Persian date
export function gregorianToPersian(date: Date): { year: number; month: number; day: number } {
  let gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  
  // Simplified conversion algorithm
  const jy = gy <= 1600 ? 0 : 979;
  gy > 1600 && (gy -= 621);
  
  let jp = 0;
  if (gm > 2) {
    jp = Math.floor((gm + 1) * 30.6) - 62 + gd;
  } else {
    jp = Math.floor((gm + 13) * 30.6) - 62 + gd;
  }
  
  const jy2 = jy + Math.floor(jp / 365.25);
  const jp2 = jp % 365.25;
  
  const jm = jp2 < 186 ? Math.ceil(jp2 / 31) : Math.ceil((jp2 - 186) / 30) + 6;
  const jd = jp2 < 186 ? jp2 % 31 || 31 : (jp2 - 186) % 30 || 30;
  
  return { year: jy2, month: jm, day: Math.floor(jd) };
}

// Format Persian date
export function formatPersianDate(date: Date): string {
  const persian = gregorianToPersian(date);
  return `${persian.day} ${persianMonths[persian.month - 1]} ${persian.year}`;
}

// Direction utilities
export function getTextDirection(language: Language): 'ltr' | 'rtl' {
  return language === 'fa' || language === 'ar' ? 'rtl' : 'ltr';
}