import fs from 'fs';

// Comprehensive curated translations with proper Persian
const curatedTranslations = {
  // Dashboard
  "Administrative overview and system metrics": "نمای کلی مدیریتی و معیارهای سیستم",
  "Performance Improvement Needed": "نیاز به بهبود عملکرد",
  "Student Retention Analysis": "تحلیل حفظ دانش‌آموزان",
  "New Student 3mo": "دانش‌آموزان جدید ۳ ماه",
  "Total Retention": "میزان کلی حفظ",
  
  // Communication
  "Communication Started": "ارتباط آغاز شد",
  "Opening chat with {{name}}": "باز کردن چت با {{name}}",
  
  // Quality
  "Quality & Satisfaction Metrics": "معیارهای کیفیت و رضایت",
  "Course Material Quality": "کیفیت محتوای کلاس",
  "Teaching Quality": "کیفیت تدریس",
  "Support Response Time": "زمان پاسخ پشتیبانی",
  "Technical Issues": "مشکلات فنی",
  "Weekday Sessions": "جلسات روزهای هفته",
  "Weekend Sessions": "جلسات آخر هفته",
  "Online Capacity": "ظرفیت آنلاین",
  "Morning Classes": "کلاس‌های صبحگاهی",
  "Overdue Payments": "پرداخت‌های معوق",
  "Payment Details": "جزئیات پرداخت",
  "Amount": "مبلغ",
  "Due Date": "تاریخ سررسید",
  "Student": "دانش‌آموز",
  "Peak Hours (6-9 PM)": "ساعات اوج (۶-۹ عصر)",
  
  // Analytics
  "Overview": "نمای کلی",
  "Revenue": "درآمد",
  "Students": "دانش‌آموزان",
  "Teachers": "معلمان",
  "Courses": "کلاس‌ها",
  "Sessions": "جلسات",
  "Financial": "مالی",
  "Time Range": "بازه زمانی",
  "Course Filter": "فیلتر کلاس",
  "Refresh": "بروزرسانی",
  "Download": "دانلود",
  "Total Revenue": "کل درآمد",
  "Monthly Growth": "رشد ماهانه",
  "Active Students": "دانش‌آموزان فعال",
  "Completion Rate": "نرخ تکمیل",
  "Teacher Satisfaction": "رضایت معلمان",
  "Operations": "عملیات",
  "Revenue Overview": "نمای کلی درآمد",
  "Student Performance": "عملکرد دانش‌آموزان",
  "Teacher Performance": "عملکرد معلمان",
  "Course Insights": "بینش‌های کلاسی",
  
  // AI Management
  "AI Management System": "سیستم مدیریت هوش مصنوعی",
  "Manage AI models, training data, and system configuration": "مدیریت مدل‌های هوش مصنوعی، داده‌های آموزشی و پیکربندی سیستم",
  "Ollama Models": "مدل‌های Ollama",
  "Model Training": "آموزش مدل",
  "Model Testing": "آزمایش مدل",
  "Status": "وضعیت",
  "Install": "نصب",
  "Remove": "حذف",
  "Test Model": "آزمایش مدل",
  "Upload Training Files": "آپلود فایل‌های آموزشی",
  "Model Status": "وضعیت مدل",
  "Online": "آنلاین",
  "Offline": "آفلاین",
  "Installing": "در حال نصب",
  "Bootstrap System": "راه‌اندازی سیستم",
  
  // Teacher Management
  "Manage instructors and teaching staff": "مدیریت مدرسان و کادر آموزشی",
  "Filter by Status": "فیلتر بر اساس وضعیت",
  "All": "همه",
  "Active": "فعال",
  "Inactive": "غیرفعال",
  "First Name": "نام",
  "Last Name": "نام خانوادگی",
  "Email": "ایمیل",
  "Phone": "تلفن",
  "Specialization": "تخصص",
  "Qualifications": "مدارک تحصیلی",
  "Experience": "سابقه",
  "Languages": "زبان‌ها",
  "Hourly Rate": "نرخ ساعتی",
  "Biography": "بیوگرافی",
  "View Details": "مشاهده جزئیات",
  "Edit Teacher": "ویرایش معلم",
  "Create Teacher": "ایجاد معلم",
  "Cancel": "لغو",
  "Total Hours": "کل ساعات",
  "Teaching hours this month": "ساعات تدریس این ماه",
  "Search teachers...": "جستجوی معلمان...",
  "Showing {showing} of {total} teachers": "نمایش {showing} از {total} معلم",
  "Error loading teacher data": "خطا در بارگذاری اطلاعات معلم",
  "Retry": "تلاش مجدد",
  "Retrying...": "در حال تلاش مجدد...",
  "Failed to load teachers": "بارگذاری معلمان ناموفق بود",
  "All Teachers": "همه معلمان",
  "Active Only": "فقط فعال",
  "Inactive Only": "فقط غیرفعال",
  "Select Experience": "انتخاب سابقه",
  "Teaching Languages": "زبان‌های تدریس",
  "Persian, English": "فارسی، انگلیسی",
  
  // Settings
  "Settings": "تنظیمات",
  
  // General
  "New this month": "جدید این ماه",
  "Registrations": "ثبت‌نام‌ها",
  "Performance": "عملکرد",
  "Teacher": "معلم",
  "Rating": "امتیاز",
  "Conversions": "تبدیل‌ها",
  "Channel": "کانال",
  "Class Utilization": "میزان استفاده از کلاس",
  "Teacher Utilization": "میزان استفاده از معلم",
  "Efficiency": "کارایی",
  "Operational Metrics": "معیارهای عملیاتی",
  "Student Satisfaction": "رضایت دانش‌آموزان",
  "NPS Score": "امتیاز NPS",
  "Class Observations": "مشاهدات کلاسی",
  "AI Services": "سرویس‌های هوش مصنوعی",
  "Created successfully": "با موفقیت ایجاد شد",
  
  // Courses
  "Course Title": "عنوان کلاس",
  "Import": "وارد کردن",
  "Select": "انتخاب",
  "Error": "خطا",
  "Details": "جزئیات",
  
  // Rooms
  "Rooms": "اتاق‌ها",
  
  // CallerN
  "Video Call Session": "جلسه تماس تصویری",
  "Pending": "در انتظار",
  "Completed": "تکمیل شده",
  "Cancelled": "لغو شده",
  "Duration (minutes)": "مدت (دقیقه)",
  "Rating (1-5)": "امتیاز (۱-۵)",
  "Notes": "یادداشت‌ها",
  "All Sessions": "همه جلسات",
  
  // Roadmap - Social Media
  "Social Media Integration": "یکپارچگی شبکه‌های اجتماعی",
  "Manage your institute's social media presence": "مدیریت حضور موسسه در شبکه‌های اجتماعی",
  "Connected Platforms": "پلتفرم‌های متصل",
  "Post Scheduler": "زمان‌بندی پست",
  "Analytics Dashboard": "داشبورد تحلیل‌ها",
  "Connect Platform": "اتصال پلتفرم",
  "Instagram": "اینستاگرام",
  "Telegram": "تلگرام",
  "WhatsApp": "واتساپ",
  "LinkedIn": "لینکدین",
  "YouTube": "یوتیوب",
  "Twitter": "توییتر",
  "Facebook": "فیسبوک",
  "Pinterest": "پینترست",
  "TikTok": "تیک‌تاک",
  "Connect": "اتصال",
  "Connected": "متصل شده",
  "Disconnect": "قطع اتصال",
  "Schedule Post": "زمان‌بندی پست",
  "Post Content": "محتوای پست",
  "Select platforms...": "انتخاب پلتفرم‌ها...",
  "Schedule Time": "زمان زمان‌بندی",
  "Schedule": "زمان‌بندی",
  "Scheduled Posts": "پست‌های زمان‌بندی شده",
  "No scheduled posts": "پست زمان‌بندی شده‌ای وجود ندارد",
  "Total Posts": "کل پست‌ها",
  "Total Engagement": "کل تعاملات",
  "Avg Reach": "میانگین دسترسی",
  "Best Platform": "بهترین پلتفرم",
  "Post Analytics": "تحلیل پست‌ها",
  "Engagement Rate": "نرخ تعامل",
  "Reach": "دسترسی",
  "Clicks": "کلیک‌ها",
  
  // Roadmap - AI Sales Agent
  "AI Sales Agent": "نماینده فروش هوش مصنوعی",
  "24/7 bilingual AI-powered sales assistant": "دستیار فروش هوش مصنوعی دوزبانه ۲۴/۷",
  "Agent Configuration": "پیکربندی نماینده",
  "Conversation Logs": "گزارش مکالمات",
  "Performance": "عملکرد",
  "Agent Name": "نام نماینده",
  "Languages": "زبان‌ها",
  "Select languages...": "انتخاب زبان‌ها...",
  "Persian": "فارسی",
  "English": "انگلیسی",
  "Arabic": "عربی",
  "Sales Scripts": "متن‌های فروش",
  "Add custom scripts and responses": "افزودن متن‌ها و پاسخ‌های سفارشی",
  "Working Hours": "ساعات کاری",
  "24/7 Availability": "دسترسی ۲۴/۷",
  "Enable": "فعال کردن",
  "Save Configuration": "ذخیره پیکربندی",
  "Recent Conversations": "مکالمات اخیر",
  "No conversations yet": "هنوز مکالمه‌ای وجود ندارد",
  "Visitor": "بازدیدکننده",
  "Lead": "سرنخ",
  "Customer": "مشتری",
  "Duration": "مدت",
  "Total Conversations": "کل مکالمات",
  "Conversion Rate": "نرخ تبدیل",
  "Avg Response Time": "میانگین زمان پاسخ",
  "Customer Satisfaction": "رضایت مشتری",
  "Conversation Trends": "روندهای مکالمه",
  
  // Roadmap - Book E-commerce
  "Book E-Commerce Platform": "پلتفرم تجارت الکترونیک کتاب",
  "Sell language learning books with AI-generated descriptions": "فروش کتاب‌های یادگیری زبان با توضیحات تولید شده توسط هوش مصنوعی",
  "Add New Book": "افزودن کتاب جدید",
  "Book Title": "عنوان کتاب",
  "Author": "نویسنده",
  "ISBN": "شابک",
  "Price (IRR)": "قیمت (ریال)",
  "Stock Quantity": "تعداد موجودی",
  "Category": "دسته‌بندی",
  "Description": "توضیحات",
  "Generate AI Description": "تولید توضیحات با هوش مصنوعی",
  "Upload Cover": "آپلود جلد",
  "Add Book": "افزودن کتاب",
  "Generate Description": "تولید توضیحات",
  "Generating...": "در حال تولید...",
  "AI description generated successfully": "توضیحات هوش مصنوعی با موفقیت تولید شد",
  "Total Books": "کل کتاب‌ها",
  "Total Sales": "کل فروش",
  "In Stock": "موجود در انبار",
  "Avg Rating": "میانگین امتیاز",
  "Catalog": "کاتالوگ",
  "Orders": "سفارشات",
  "Analytics": "تحلیل‌ها",
  "Search books by title, author, or ISBN...": "جستجوی کتاب بر اساس عنوان، نویسنده یا شابک...",
  "Sold": "فروخته شده",
  "Recent Orders": "سفارشات اخیر",
  "Manage book orders and shipping": "مدیریت سفارشات کتاب و ارسال",
  "No orders yet": "هنوز سفارشی وجود ندارد",
  "Sales Analytics": "تحلیل فروش",
  "Track sales performance and trends": "پیگیری عملکرد فروش و روندها",
  "Analytics data will appear here": "داده‌های تحلیلی اینجا نمایش داده می‌شوند",
  
  // Roadmap - Multi-Platform Scraping
  "Multi-Platform Content Scraper": "جمع‌آوری محتوا از چند پلتفرم",
  "Extract educational content from multiple platforms": "استخراج محتوای آموزشی از چندین پلتفرم",
  "Source Platforms": "پلتفرم‌های منبع",
  "Scraping Queue": "صف جمع‌آوری",
  "Content Library": "کتابخانه محتوا",
  "Add Scraping Task": "افزودن وظیفه جمع‌آوری",
  "Platform": "پلتفرم",
  "Select platform...": "انتخاب پلتفرم...",
  "Source URL": "آدرس منبع",
  "Content Type": "نوع محتوا",
  "Select type...": "انتخاب نوع...",
  "Video": "ویدیو",
  "Article": "مقاله",
  "Audio": "صوتی",
  "Document": "سند",
  "Start Scraping": "شروع جمع‌آوری",
  "Active Tasks": "وظایف فعال",
  "No active scraping tasks": "وظیفه جمع‌آوری فعالی وجود ندارد",
  "Progress": "پیشرفت",
  "Items Collected": "موارد جمع‌آوری شده",
  "Content Items": "موارد محتوا",
  "Storage Used": "فضای استفاده شده",
  "Last Updated": "آخرین بروزرسانی",
  "Content Overview": "نمای کلی محتوا",
  "Type Distribution": "توزیع نوع",
  
  // Roadmap - Persian Calendar
  "Persian/English/Arabic Calendar": "تقویم فارسی/انگلیسی/عربی",
  "Multi-calendar system for scheduling": "سیستم چند تقویمی برای زمان‌بندی",
  "Calendar View": "نمای تقویم",
  "Month View": "نمای ماهانه",
  "Week View": "نمای هفتگی",
  "Day View": "نمای روزانه",
  "Add Event": "افزودن رویداد",
  "Event Title": "عنوان رویداد",
  "Start Date": "تاریخ شروع",
  "End Date": "تاریخ پایان",
  "Create Event": "ایجاد رویداد",
  "Upcoming Events": "رویدادهای آینده",
  "No upcoming events": "رویداد آینده‌ای وجود ندارد",
  "Event Statistics": "آمار رویدادها",
  "Total Events": "کل رویدادها",
  "This Month": "این ماه",
  "Next Week": "هفته آینده",
  
  // Additional comprehensive translations
  "System Settings": "تنظیمات سیستم",
  "Configure payment gateways, SMS, email, and security settings": "پیکربندی درگاه‌های پرداخت، پیامک، ایمیل و تنظیمات امنیتی",
  "Teacher Management": "مدیریت معلمان",
  "Manage instructors and their qualifications": "مدیریت مدرسان و مدارک آن‌ها",
  "New This Month": "جدید این ماه",
  "Retention Rate": "نرخ حفظ",
  "Recent Class Observations": "مشاهدات اخیر کلاس",
  "Configure and manage AI models for language learning": "پیکربندی و مدیریت مدل‌های هوش مصنوعی برای یادگیری زبان",
  "Room created successfully": "اتاق با موفقیت ایجاد شد",
  "Room updated successfully": "اتاق با موفقیت بروزرسانی شد",
  "Room deleted successfully": "اتاق با موفقیت حذف شد",
  "Failed to create room": "ایجاد اتاق ناموفق بود",
  "Failed to update room": "بروزرسانی اتاق ناموفق بود",
  "Failed to delete room": "حذف اتاق ناموفق بود",
  "CallerN Management": "مدیریت CallerN",
  "Manage teacher availability for on-demand video calls": "مدیریت در دسترس بودن معلمان برای تماس‌های تصویری درخواستی",
  "System Administration": "مدیریت سیستم",
  "Manage system configuration, backups, and monitoring": "مدیریت پیکربندی سیستم، پشتیبان‌گیری و نظارت",
  "Configure SMS notifications and templates": "پیکربندی اعلان‌های پیامکی و قالب‌ها",
  "Reports & Analytics": "گزارش‌ها و تحلیل‌ها",
  "Comprehensive reporting and data analytics": "گزارش‌دهی جامع و تحلیل داده",
  "Schedule New Class": "زمان‌بندی کلاس جدید",
  "Course": "کلاس",
  "Select course to schedule": "انتخاب کلاس برای زمان‌بندی",
  "Available Teachers": "معلمان در دسترس",
  "Select available teacher": "انتخاب معلم در دسترس",
  "Room": "اتاق",
  "Select room": "انتخاب اتاق",
  "Class Type": "نوع کلاس",
  "In-Person": "حضوری",
  "Hybrid": "ترکیبی",
  "Manage marketing campaigns and social media integration": "مدیریت کمپین‌های بازاریابی و یکپارچگی شبکه‌های اجتماعی",
  "Active Campaigns": "کمپین‌های فعال",
  "Running now": "در حال اجرا",
  "Total Leads": "کل سرنخ‌ها",
  "from last month": "از ماه گذشته",
  "ROI by Channel": "بازگشت سرمایه به تفکیک کانال",
  "Average ROI": "میانگین بازگشت سرمایه",
  "Campaigns List": "لیست کمپین‌ها",
  "Create Campaign": "ایجاد کمپین",
  "Campaign Name": "نام کمپین",
  "Select channel": "انتخاب کانال",
  "Budget": "بودجه",
  "Target Audience": "مخاطبان هدف",
  "All Students": "همه دانش‌آموزان",
  "Prospective Students": "دانش‌آموزان آینده",
  "Former Students": "دانش‌آموزان سابق",
  "Launch Campaign": "راه‌اندازی کمپین",
  "No campaigns created": "کمپینی ایجاد نشده است",
  "Drag & drop to schedule": "برای زمان‌بندی بکشید و رها کنید",
  "No classes scheduled": "کلاسی زمان‌بندی نشده است",
  "Click a slot to schedule": "برای زمان‌بندی روی یک بازه کلیک کنید",
  "Content Scraping": "جمع‌آوری محتوا",
  "URL": "آدرس",
  "File Name": "نام فایل",
  "Size": "حجم",
  "Format": "فرمت",
  "Extract": "استخراج",
  "Extracting...": "در حال استخراج...",
  "Content extracted successfully": "محتوا با موفقیت استخراج شد",
  "Failed to extract content": "استخراج محتوا ناموفق بود",
  "PDF Book Files": "فایل‌های PDF کتاب",
  "PDF File": "فایل PDF",
  "Audio Files (Optional)": "فایل‌های صوتی (اختیاری)",
  "Video Files (Optional)": "فایل‌های ویدیویی (اختیاری)",
  "Hardcopy Book Details": "جزئیات کتاب چاپی",
  "Cover Image": "تصویر جلد",
  "Book created successfully": "کتاب با موفقیت ایجاد شد",
  "Failed to create book": "ایجاد کتاب ناموفق بود",
  "View Logs": "مشاهده لاگ‌ها",
  "Recent scraping activities": "فعالیت‌های اخیر جمع‌آوری",
  "No logs available": "لاگی موجود نیست",
  "Delete Platform": "حذف پلتفرم",
  "Confirm deletion": "تایید حذف",
  "Are you sure you want to delete this platform connection?": "آیا مطمئن هستید که می‌خواهید اتصال این پلتفرم را حذف کنید؟",
  "Delete": "حذف",
  "Platform connected successfully": "پلتفرم با موفقیت متصل شد",
  "Failed to connect platform": "اتصال پلتفرم ناموفق بود",
  "Platform disconnected successfully": "پلتفرم با موفقیت قطع شد",
  "Failed to disconnect platform": "قطع اتصال پلتفرم ناموفق بود",
  "Post scheduled successfully": "پست با موفقیت زمان‌بندی شد",
  "Failed to schedule post": "زمان‌بندی پست ناموفق بود",
  "Agent configuration saved successfully": "پیکربندی نماینده با موفقیت ذخیره شد",
  "Failed to save agent configuration": "ذخیره پیکربندی نماینده ناموفق بود",
  "Task started successfully": "وظیفه با موفقیت آغاز شد",
  "Failed to start scraping task": "آغاز وظیفه جمع‌آوری ناموفق بود",
  "Event created successfully": "رویداد با موفقیت ایجاد شد",
  "Failed to create event": "ایجاد رویداد ناموفق بود",
  "Campaign created successfully": "کمپین با موفقیت ایجاد شد",
  "Failed to create campaign": "ایجاد کمپین ناموفق بود",
  "Class scheduled successfully": "کلاس با موفقیت زمان‌بندی شد",
  "Failed to schedule class": "زمان‌بندی کلاس ناموفق بود"
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

// Main function
async function updateTranslations() {
  // Read files
  const enAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/en/admin.json', 'utf8'));
  const faAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/fa/admin.json', 'utf8'));
  const missingKeys = fs.readFileSync('missing-fa-keys.txt', 'utf8').trim().split('\n');
  
  console.log(`Processing ${missingKeys.length} missing keys with curated translations...`);
  
  const translations = {};
  let translatedCount = 0;
  let manualCount = 0;
  
  for (const key of missingKeys) {
    const englishValue = getValueByPath(enAdmin, key);
    if (englishValue) {
      // Check if we have a curated translation
      const curatedValue = curatedTranslations[englishValue];
      const farsiValue = curatedValue || englishValue; // Fallback to English if no translation
      
      setValueByPath(translations, key, farsiValue);
      translatedCount++;
      
      if (curatedValue) {
        manualCount++;
        console.log(`✓ ${key}: "${englishValue}" -> "${farsiValue}"`);
      } else {
        console.log(`⚠ ${key}: "${englishValue}" (no translation, using English)`);
      }
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
  
  console.log(`\n✅ Successfully processed ${translatedCount} keys`);
  console.log(`📝 Curated translations: ${manualCount}`);
  console.log(`⚠️  Needs manual translation: ${translatedCount - manualCount}`);
  console.log(`Updated fa/admin.json`);
}

updateTranslations().catch(console.error);
