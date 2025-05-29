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
    overview: "Overview",
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
    teacherManagement: "Teacher Management",
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
  },

  fa: {
    // Navigation
    dashboard: "داشبورد",
    manager: "مدیر",
    teacher: "معلم",
    admin: "ادمین",
    logout: "خروج",

    // Dashboard Common
    overview: "نمای کلی",
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
    teacherManagement: "مدیریت معلمان",
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
  },

  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    manager: "المدير",
    teacher: "المعلم",
    admin: "المشرف",
    logout: "تسجيل الخروج",

    // Dashboard Common
    overview: "نظرة عامة",
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