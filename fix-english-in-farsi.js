import fs from 'fs';

// Comprehensive English to Farsi translations for all remaining keys
const englishToFarsi = {
  // Common terms
  "This month": "این ماه",
  "Connect your platforms": "پلتفرم‌های خود را متصل کنید",
  "Followers": "دنبال‌کنندگان",
  "Members": "اعضا",
  "Manage": "مدیریت",
  "Campaign Analytics": "تحلیل کمپین",
  "Name": "نام",
  "Type": "نوع",
  "Leads": "سرنخ‌ها",
  "Conversion": "تبدیل",
  "Actions": "عملیات",
  "Edit": "ویرایش",
  "View": "مشاهده",
  "General": "عمومی",
  "Shetab": "شتاب",
  "Isabel VoIP line settings": "تنظیمات خط VoIP Isabel",
  "Port": "پورت",
  "Username": "نام کاربری",
  "Password": "رمز عبور",
  "Enable VoIP Integration": "فعال‌سازی یکپارچگی VoIP",
  "API Key": "کلید API",
  "Test Connection": "تست اتصال",
  "Connection": "اتصال",
  "Successful": "موفق",
  "Failed": "ناموفق",
  "Configure": "پیکربندی",
  "Integration": "یکپارچگی",
  "noAvailabilityData": "داده‌ای برای نمایش وجود ندارد",
  "No availability data": "داده در دسترس بودن وجود ندارد",
  "Loading...": "در حال بارگذاری...",
  "Error loading data": "خطا در بارگذاری داده",
  "Retry": "تلاش مجدد",
  "Save Changes": "ذخیره تغییرات",
  "Reset": "بازنشانی",
  "Apply": "اعمال",
  "Clear": "پاک کردن",
  "Search": "جستجو",
  "Export": "خروجی",
  "Import": "ورودی",
  "Print": "چاپ",
  "Share": "اشتراک‌گذاری",
  "Copy": "کپی",
  "Paste": "جای‌گذاری",
  "Cut": "برش",
  "Undo": "بازگردانی",
  "Redo": "انجام مجدد",
  "Select All": "انتخاب همه",
  "Deselect": "لغو انتخاب",
  "Confirm": "تایید",
  "Warning": "هشدار",
  "Info": "اطلاعات",
  "Success": "موفقیت",
  "Close": "بستن",
  "Previous": "قبلی",
  "Next": "بعدی",
  "First": "اول",
  "Last": "آخر",
  "Page": "صفحه",
  "of": "از",
  "items": "مورد",
  "showing": "نمایش",
  "Loading": "بارگذاری",
  "Please wait": "لطفاً صبر کنید",
  "Processing": "در حال پردازش",
  "Uploading": "در حال آپلود",
  "Downloading": "در حال دانلود",
  "Saving": "در حال ذخیره",
  "Sending": "در حال ارسال",
  "Connecting": "در حال اتصال",
  "Disconnecting": "در حال قطع اتصال",
  "Yes": "بله",
  "No": "خیر",
  "Ok": "تایید",
  "Done": "انجام شد",
  "Back": "بازگشت",
  "Continue": "ادامه",
  "Skip": "رد شدن",
  "Finish": "پایان",
  "Help": "راهنما",
  "About": "درباره",
  "Contact": "تماس",
  "Support": "پشتیبانی",
  "Documentation": "مستندات",
  "FAQ": "سوالات متداول",
  "Terms": "شرایط",
  "Privacy": "حریم خصوصی",
  "Legal": "قانونی",
  "Settings": "تنظیمات",
  "Preferences": "ترجیحات",
  "Profile": "پروفایل",
  "Account": "حساب کاربری",
  "Logout": "خروج",
  "Login": "ورود",
  "Register": "ثبت‌نام",
  "Sign Up": "ثبت‌نام",
  "Sign In": "ورود",
  "Forgot Password": "فراموشی رمز عبور",
  "Change Password": "تغییر رمز عبور",
  "Update": "بروزرسانی",
  "Upgrade": "ارتقا",
  "Downgrade": "کاهش سطح",
  "Subscribe": "اشتراک",
  "Unsubscribe": "لغو اشتراک",
  "Renew": "تمدید",
  "Expire": "انقضا",
  "Active": "فعال",
  "Inactive": "غیرفعال",
  "Enabled": "فعال شده",
  "Disabled": "غیرفعال شده",
  "Visible": "قابل مشاهده",
  "Hidden": "مخفی",
  "Public": "عمومی",
  "Private": "خصوصی",
  "Draft": "پیش‌نویس",
  "Published": "منتشر شده",
  "Archived": "بایگانی شده",
  "Deleted": "حذف شده",
  "Pending": "در انتظار",
  "Approved": "تایید شده",
  "Rejected": "رد شده",
  "Completed": "تکمیل شده",
  "In Progress": "در حال انجام",
  "On Hold": "متوقف شده",
  "Cancelled": "لغو شده",
  "New": "جدید",
  "Updated": "بروزرسانی شده",
  "Modified": "تغییر یافته",
  "Created": "ایجاد شده",
  "Edited": "ویرایش شده",
  
  // Additional specific translations
  "Website Builder": "سازنده وب‌سایت",
  "Create and customize your institute's website": "ایجاد و سفارشی‌سازی وب‌سایت موسسه خود",
  "Room Management": "مدیریت اتاق‌ها",
  "Manage physical and virtual learning spaces": "مدیریت فضاهای یادگیری فیزیکی و مجازی",
  "Financial Reports": "گزارش‌های مالی",
  "Detailed financial analytics and reporting": "تحلیل‌های مالی جامع و گزارش‌دهی",
  "VoIP": "وی‌او‌آی‌پی",
  "VoIP Configuration": "پیکربندی VoIP",
  "VoIP Server Address": "آدرس سرور VoIP",
  "Enable Call Recording": "فعال‌سازی ضبط تماس",
  "Recording Storage Path": "مسیر ذخیره‌سازی ضبط",
  "Test Phone Number": "شماره تلفن تست",
  "Test Call": "تماس تست",
  "Enter phone number to make a test call": "شماره تلفن را برای انجام تماس تست وارد کنید",
  "Full Diagnostic": "تشخیص کامل",
  "Save VoIP Settings": "ذخیره تنظیمات VoIP",
  "Third-Party Services Status": "وضعیت سرویس‌های شخص ثالث",
  "Current status of integrations": "وضعیت فعلی یکپارچگی‌ها",
  "Persian Calendar": "تقویم فارسی",
  "Shetab Configuration": "پیکربندی شتاب",
  "Shetab payment gateway settings": "تنظیمات درگاه پرداخت شتاب",
  "Merchant ID": "شناسه پذیرنده",
  "Terminal ID": "شناسه ترمینال",
  "Secret Key": "کلید محرمانه",
  "Environment": "محیط",
  "Select Environment": "انتخاب محیط",
  "Production": "تولید",
  "Sandbox": "محیط تست",
  "Enable Shetab Integration": "فعال‌سازی یکپارچگی شتاب",
  "Callback URL": "آدرس بازگشت",
  "Return URL": "آدرس برگشت",
  "Save Shetab Settings": "ذخیره تنظیمات شتاب",
  "3D Lesson Builder": "سازنده درس سه‌بعدی",
  "Create immersive 3D learning experiences for your video courses": "ایجاد تجربه‌های یادگیری سه‌بعدی جذاب برای دوره‌های ویدیویی شما",
  "Create 3D Lesson": "ایجاد درس سه‌بعدی",
  "Create New 3D Lesson": "ایجاد درس سه‌بعدی جدید",
  "Build interactive 3D lessons that enhance your video courses with engaging vocabulary and grammar exercises": "ساخت درس‌های سه‌بعدی تعاملی که دوره‌های ویدیویی شما را با تمرین‌های جذاب واژگان و گرامر غنی می‌کنند",
  "Select Template": "انتخاب قالب",
  "Lesson Details": "جزئیات درس",
  "Scene Configuration": "پیکربندی صحنه",
  "Lesson Title": "عنوان درس",
  "Enter an engaging lesson title": "عنوان جذاب درس را وارد کنید",
  "Attach to Course": "الحاق به کلاس",
  "Select Course": "انتخاب کلاس",
  "Self-Hosted Ready": "آماده میزبانی محلی",
  "System configured for local deployment": "سیستم برای استقرار محلی پیکربندی شده است",
  
  // Book E-commerce comprehensive translations
  "Admin access required to manage 3D lessons": "دسترسی مدیر برای مدیریت درس‌های سه‌بعدی مورد نیاز است",
  "Book E-commerce": "فروشگاه کتاب",
  "Manage book catalog, orders, and analytics": "مدیریت کاتالوگ کتاب، سفارشات و تحلیل‌ها",
  "Create a new book entry for your catalog": "ایجاد ورودی کتاب جدید برای کاتالوگ شما",
  "Upload Book": "آپلود کتاب",
  "Book Type": "نوع کتاب",
  "PDF Book (Digital)": "کتاب PDF (دیجیتال)",
  "Hardcopy Book (Physical)": "کتاب چاپی (فیزیکی)",
  "Title": "عنوان",
  "AI will generate a Farsi description (100-200 words) after you save this book": "هوش مصنوعی پس از ذخیره این کتاب، توضیحات فارسی (۱۰۰-۲۰۰ کلمه) تولید خواهد کرد",
  "Price": "قیمت",
  "Language": "زبان",
  "Level": "سطح",
  "Page Count": "تعداد صفحات",
  "Published Year": "سال انتشار",
  
  // Final batch - 3D Lessons and common UI labels
  "Describe what students will learn in this 3D lesson": "توضیح دهید دانش‌آموزان در این درس سه‌بعدی چه چیزی یاد خواهند گرفت",
  "Order Index": "شماره ترتیب",
  "Vocabulary Words": "واژگان",
  "Enter vocabulary words separated by commas": "واژگان را با کاما از هم جدا کنید",
  "Learning Objectives": "اهداف یادگیری",
  "Enter learning objectives separated by commas": "اهداف یادگیری را با کاما از هم جدا کنید",
  "Estimated Duration (minutes)": "مدت تخمینی (دقیقه)",
  "XP Reward": "پاداش XP",
  "Passing Score (%)": "نمره قبولی (%)",
  "Make Free": "رایگان کردن"
};

// Check if a string is English (simple heuristic)
function isEnglish(text) {
  if (!text || typeof text !== 'string') return false;
  // Check if string contains mostly ASCII letters
  const englishLetters = text.match(/[a-zA-Z]/g);
  return englishLetters && englishLetters.length > 3;
}

// Recursively find and translate English values
function translateEnglishValues(obj, path = '') {
  let changedKeys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const subChanges = translateEnglishValues(value, fullPath);
      changedKeys = changedKeys.concat(subChanges);
    } else if (typeof value === 'string' && isEnglish(value)) {
      // Check if we have a translation
      if (englishToFarsi[value]) {
        obj[key] = englishToFarsi[value];
        changedKeys.push({
          path: fullPath,
          from: value,
          to: englishToFarsi[value]
        });
        console.log(`✓ ${fullPath}: "${value}" -> "${englishToFarsi[value]}"`);
      } else {
        console.log(`⚠ ${fullPath}: "${value}" (no translation found)`);
        changedKeys.push({
          path: fullPath,
          from: value,
          to: value,
          needsTranslation: true
        });
      }
    }
  }
  
  return changedKeys;
}

// Main function
async function fixEnglishInFarsi() {
  const faAdmin = JSON.parse(fs.readFileSync('client/src/i18n/locales/fa/admin.json', 'utf8'));
  
  console.log('Scanning fa/admin.json for English values...\n');
  const changes = translateEnglishValues(faAdmin);
  
  const translated = changes.filter(c => !c.needsTranslation).length;
  const needsWork = changes.filter(c => c.needsTranslation).length;
  
  // Write back to file
  fs.writeFileSync(
    'client/src/i18n/locales/fa/admin.json',
    JSON.stringify(faAdmin, null, 2),
    'utf8'
  );
  
  console.log(`\n✅ Processed ${changes.length} English values`);
  console.log(`📝 Translated: ${translated}`);
  console.log(`⚠️  Still needs translation: ${needsWork}`);
  
  // List keys that still need translation
  if (needsWork > 0) {
    console.log(`\n⚠️  Keys needing translation:`);
    const needsList = changes.filter(c => c.needsTranslation);
    needsList.forEach(item => {
      console.log(`   ${item.path}: "${item.from}"`);
    });
  }
}

fixEnglishInFarsi().catch(console.error);
