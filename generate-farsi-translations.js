import fs from 'fs';

// Common English to Farsi translations
const commonTranslations = {
  // General terms
  "title": "عنوان",
  "subtitle": "زیرعنوان",
  "description": "توضیحات",
  "overview": "نمای کلی",
  "details": "جزئیات",
  "view": "مشاهده",
  "edit": "ویرایش",
  "delete": "حذف",
  "create": "ایجاد",
  "update": "بروزرسانی",
  "save": "ذخیره",
  "cancel": "لغو",
  "download": "دانلود",
  "upload": "آپلود",
  "search": "جستجو",
  "filter": "فیلتر",
  "refresh": "بروزرسانی",
  "retry": "تلاش مجدد",
  "retrying": "در حال تلاش مجدد",
  "loading": "در حال بارگذاری",
  "error": "خطا",
  "success": "موفقیت",
  "failed": "ناموفق",
  "active": "فعال",
  "inactive": "غیرفعال",
  "online": "آنلاین",
  "offline": "آفلاین",
  "total": "کل",
  "all": "همه",
  "status": "وضعیت",
  "actions": "عملیات",
  
  // User related
  "students": "دانش‌آموزان",
  "teachers": "معلمان",
  "teacher": "معلم",
  "student": "دانش‌آموز",
  "firstName": "نام",
  "lastName": "نام خانوادگی",
  "email": "ایمیل",
  "phone": "تلفن",
  "bio": "بیوگرافی",
  
  // Course related
  "courses": "کلاس‌ها",
  "course": "کلاس",
  "sessions": "جلسات",
  "session": "جلسه",
  "lessons": "درس‌ها",
  "lesson": "درس",
  
  // Financial
  "revenue": "درآمد",
  "amount": "مبلغ",
  "payment": "پرداخت",
  "overdue": "معوق",
  "dueDate": "تاریخ سررسید",
  
  // Analytics
  "analytics": "تحلیل‌ها",
  "performance": "عملکرد",
  "metrics": "معیارها",
  "rating": "امتیاز",
  "satisfaction": "رضایت",
  "completionRate": "نرخ تکمیل",
  "retention": "حفظ",
  "retentionRate": "نرخ حفظ",
  "growth": "رشد",
  "monthly": "ماهانه",
  
  // Time related
  "morning": "صبح",
  "afternoon": "بعدازظهر",
  "evening": "عصر",
  "weekday": "روز هفته",
  "weekend": "آخر هفته",
  "peakHours": "ساعات اوج",
  
  // Quality
  "quality": "کیفیت",
  "technical": "فنی",
  "issues": "مسائل",
  "support": "پشتیبانی",
  "response": "پاسخ",
  "time": "زمان",
  
  // AI
  "ai": "هوش مصنوعی",
  "training": "آموزش",
  "testing": "آزمایش",
  "model": "مدل",
  "install": "نصب",
  "remove": "حذف",
  "installing": "در حال نصب",
  
  // Communication
  "communication": "ارتباطات",
  "chat": "چت",
  "opening": "باز کردن",
  "started": "شروع شد",
  
  // Management
  "management": "مدیریت",
  "settings": "تنظیمات",
  "rooms": "اتاق‌ها",
  "created": "ایجاد شد",
  "successfully": "با موفقیت",
  
  // Operations
  "operations": "عملیات",
  "utilization": "استفاده",
  "capacity": "ظرفیت",
  "efficiency": "کارایی",
  
  // Misc
  "view details": "مشاهده جزئیات",
  "view Details": "مشاهده جزئیات",
  "viewDetails": "مشاهده جزئیات",
  "new this month": "جدید این ماه",
  "newThisMonth": "جدید این ماه",
  "registrations": "ثبت‌نام‌ها",
  "conversions": "تبدیل‌ها",
  "channel": "کانال",
  "npsScore": "امتیاز NPS",
  "classObservations": "مشاهدات کلاس"
};

// Function to get value from nested object using dot notation
function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to set value in nested object using dot notation
function setValueByPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Translate a single English phrase to Farsi
function translateToFarsi(englishText) {
  if (!englishText) return '';
  
  // Clean the text
  const text = englishText.toString().trim();
  
  // Check for direct match in common translations
  const lowerText = text.toLowerCase();
  if (commonTranslations[lowerText]) {
    return commonTranslations[lowerText];
  }
  
  // Try to build translation from words
  const words = text.split(/\s+/);
  if (words.length > 1) {
    const translated = words.map(word => {
      const lowerWord = word.toLowerCase();
      return commonTranslations[lowerWord] || word;
    }).join(' ');
    
    if (!translated.includes('{') && translated !== text) {
      return translated;
    }
  }
  
  // Pattern-based translations
  if (text.includes('...')) {
    return text.replace('...', '...');
  }
  
  // If no translation found, create a Persian-friendly version
  return createFallbackTranslation(text);
}

// Create a fallback translation for untranslated terms
function createFallbackTranslation(text) {
  const patterns = {
    'Management': 'مدیریت',
    'Service': 'سرویس',
    'System': 'سیستم',
    'Platform': 'پلتفرم',
    'Dashboard': 'داشبورد',
    'Admin': 'مدیر',
    'Student': 'دانش‌آموز',
    'Teacher': 'معلم',
    'Course': 'کلاس',
    'Analytics': 'تحلیل',
    'Performance': 'عملکرد',
    'Quality': 'کیفیت',
    'Hours': 'ساعات',
    'Rate': 'نرخ',
    'This Month': 'این ماه',
    'Total': 'کل',
    'Active': 'فعال',
    'New': 'جدید',
    'Failed': 'ناموفق',
    'Show': 'نمایش',
    'Improvement': 'بهبود',
    'Needed': 'مورد نیاز',
    'Analysis': 'تحلیل',
    'Details': 'جزئیات',
    'Material': 'محتوا',
    'Response': 'پاسخ',
    'Time': 'زمان',
    'Issues': 'مسائل',
    'Sessions': 'جلسات',
    'Payments': 'پرداخت‌ها',
    'Classes': 'کلاس‌ها',
    'Filter': 'فیلتر',
    'Range': 'بازه',
    'Growth': 'رشد',
    'Completion': 'تکمیل',
    'Satisfaction': 'رضایت',
    'Revenue': 'درآمد',
    'Insights': 'بینش‌ها',
    'AI': 'هوش مصنوعی',
    'Model': 'مدل',
    'Status': 'وضعیت',
    'Install': 'نصب',
    'Bootstrap': 'راه‌اندازی',
    'Specialization': 'تخصص',
    'Qualifications': 'مدارک',
    'Experience': 'تجربه',
    'Languages': 'زبان‌ها',
    'Hourly': 'ساعتی',
    'Bio': 'بیوگرافی',
    'Placeholder': 'متن راهنما',
    'Labels': 'برچسب‌ها',
    'Form': 'فرم',
    'Select': 'انتخاب',
    'Error': 'خطا',
    'Loading': 'بارگذاری',
    'Showing': 'نمایش',
    'Settings': 'تنظیمات',
    'Registrations': 'ثبت‌نام‌ها',
    'Conversions': 'تبدیل‌ها',
    'Utilization': 'استفاده',
    'Efficiency': 'کارایی',
    'Operational': 'عملیاتی',
    'Metrics': 'معیارها',
    'NPS': 'NPS',
    'Score': 'امتیاز',
    'Observations': 'مشاهدات',
    'Services': 'سرویس‌ها',
    'Rooms': 'اتاق‌ها',
    'Created': 'ایجاد شد',
    'Successfully': 'با موفقیت',
    'Communication': 'ارتباطات',
    'Opening': 'باز کردن',
    'Chat': 'چت',
    'Started': 'شروع شد',
    'Retention': 'حفظ',
    '3mo': '۳ ماه'
  };
  
  let translated = text;
  for (const [eng, fa] of Object.entries(patterns)) {
    translated = translated.replace(new RegExp(eng, 'g'), fa);
  }
  
  return translated;
}

// Main function
async function generateTranslations() {
  // Read files
  const enAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/en/admin.json', 'utf8'));
  const faAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/fa/admin.json', 'utf8'));
  const missingKeys = fs.readFileSync('missing-fa-keys.txt', 'utf8').trim().split('\n');
  
  console.log(`Processing ${missingKeys.length} missing keys...`);
  
  const translations = {};
  let translatedCount = 0;
  
  for (const key of missingKeys) {
    const englishValue = getValueByPath(enAdmin, key);
    if (englishValue) {
      const farsiValue = translateToFarsi(englishValue);
      setValueByPath(translations, key, farsiValue);
      translatedCount++;
      console.log(`${key}: "${englishValue}" -> "${farsiValue}"`);
    } else {
      console.warn(`Warning: No English value found for key: ${key}`);
    }
  }
  
  // Merge translations into faAdmin
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(faAdmin, translations);
  
  // Write updated Farsi file
  fs.writeFileSync(
    'client/src/i18n/locales/fa/admin.json',
    JSON.stringify(faAdmin, null, 2),
    'utf8'
  );
  
  console.log(`\n✅ Successfully translated ${translatedCount} keys`);
  console.log(`Updated fa/admin.json with missing translations`);
}

generateTranslations().catch(console.error);
