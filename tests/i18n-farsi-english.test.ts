import { test, expect } from '@playwright/test';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../client/public/locales/en/*.json';
import fa from '../client/public/locales/fa/*.json';

// Initialize i18n for testing
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fa: { translation: fa }
  },
  lng: 'fa',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

// Test all critical UI elements in both languages
test.describe('i18n Farsi-English Comprehensive Tests', () => {
  
  test('Language Toggle Functionality', async ({ page }) => {
    await page.goto('http://localhost:5000');
    
    // Check initial language (should be Farsi by default)
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('fa');
    
    // Check RTL direction for Farsi
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');
    
    // Toggle to English
    await page.click('[data-testid="language-toggle"]');
    await page.click('button:has-text("English")');
    
    // Check language changed
    const newHtmlLang = await page.getAttribute('html', 'lang');
    expect(newHtmlLang).toBe('en');
    
    // Check LTR direction for English
    const newHtmlDir = await page.getAttribute('html', 'dir');
    expect(newHtmlDir).toBe('ltr');
  });

  test('Authentication Page - Both Languages', async ({ page }) => {
    // Test in Farsi
    await page.goto('http://localhost:5000/auth?lang=fa');
    
    // Check Farsi translations
    await expect(page.locator('text="ورود به سیستم"')).toBeVisible();
    await expect(page.locator('text="ایمیل"')).toBeVisible();
    await expect(page.locator('text="رمز عبور"')).toBeVisible();
    await expect(page.locator('text="فراموشی رمز عبور"')).toBeVisible();
    
    // Test in English
    await page.goto('http://localhost:5000/auth?lang=en');
    
    // Check English translations
    await expect(page.locator('text="Sign In"')).toBeVisible();
    await expect(page.locator('text="Email"')).toBeVisible();
    await expect(page.locator('text="Password"')).toBeVisible();
    await expect(page.locator('text="Forgot password"')).toBeVisible();
  });

  test('Student Dashboard - Farsi', async ({ page }) => {
    await page.goto('http://localhost:5000/student/dashboard?lang=fa');
    
    const farsiTexts = [
      'داشبورد دانش‌آموز',
      'دوره‌های من',
      'جلسات آینده',
      'پیشرفت یادگیری',
      'دستاوردها',
      'کیف پول',
      'امتیاز تجربه',
      'سطح',
      'چالش‌های روزانه',
      'تکالیف'
    ];
    
    for (const text of farsiTexts) {
      await expect(page.locator(`text="${text}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Student Dashboard - English', async ({ page }) => {
    await page.goto('http://localhost:5000/student/dashboard?lang=en');
    
    const englishTexts = [
      'Student Dashboard',
      'My Courses',
      'Upcoming Sessions',
      'Learning Progress',
      'Achievements',
      'Wallet',
      'Experience Points',
      'Level',
      'Daily Challenges',
      'Homework'
    ];
    
    for (const text of englishTexts) {
      await expect(page.locator(`text="${text}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Teacher Dashboard - Both Languages', async ({ page }) => {
    // Farsi
    await page.goto('http://localhost:5000/teacher/dashboard?lang=fa');
    
    await expect(page.locator('text="داشبورد معلم"')).toBeVisible();
    await expect(page.locator('text="کلاس‌های من"')).toBeVisible();
    await expect(page.locator('text="دانش‌آموزان"')).toBeVisible();
    await expect(page.locator('text="برنامه هفتگی"')).toBeVisible();
    await expect(page.locator('text="آزمون‌ها"')).toBeVisible();
    await expect(page.locator('text="گزارش‌ها"')).toBeVisible();
    
    // English
    await page.goto('http://localhost:5000/teacher/dashboard?lang=en');
    
    await expect(page.locator('text="Teacher Dashboard"')).toBeVisible();
    await expect(page.locator('text="My Classes"')).toBeVisible();
    await expect(page.locator('text="Students"')).toBeVisible();
    await expect(page.locator('text="Weekly Schedule"')).toBeVisible();
    await expect(page.locator('text="Tests"')).toBeVisible();
    await expect(page.locator('text="Reports"')).toBeVisible();
  });

  test('Admin Dashboard - Both Languages', async ({ page }) => {
    // Farsi
    await page.goto('http://localhost:5000/admin/dashboard?lang=fa');
    
    const adminFarsiTexts = [
      'داشبورد مدیریت',
      'مدیریت کاربران',
      'مدیریت دوره‌ها',
      'گزارش‌های مالی',
      'تنظیمات',
      'آمار کلی',
      'دانش‌آموزان فعال',
      'معلمان',
      'درآمد ماهانه'
    ];
    
    for (const text of adminFarsiTexts) {
      await expect(page.locator(`text="${text}"`).first()).toBeVisible({ timeout: 5000 });
    }
    
    // English
    await page.goto('http://localhost:5000/admin/dashboard?lang=en');
    
    const adminEnglishTexts = [
      'Admin Dashboard',
      'User Management',
      'Course Management',
      'Financial Reports',
      'Settings',
      'Overall Statistics',
      'Active Students',
      'Teachers',
      'Monthly Revenue'
    ];
    
    for (const text of adminEnglishTexts) {
      await expect(page.locator(`text="${text}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Number Formatting - Farsi vs English', async ({ page }) => {
    // Test Farsi number formatting
    await page.goto('http://localhost:5000/student/payment?lang=fa');
    
    // Check Persian numerals
    const farsiNumbers = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid*="amount"], [data-testid*="balance"]');
      return Array.from(elements).map(el => el.textContent);
    });
    
    // Persian numerals should be used (۰۱۲۳۴۵۶۷۸۹)
    for (const num of farsiNumbers) {
      if (num && /\d/.test(num)) {
        expect(num).toMatch(/[۰-۹]/);
      }
    }
    
    // Test English number formatting
    await page.goto('http://localhost:5000/student/payment?lang=en');
    
    // Check English numerals
    const englishNumbers = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid*="amount"], [data-testid*="balance"]');
      return Array.from(elements).map(el => el.textContent);
    });
    
    // English numerals should be used (0123456789)
    for (const num of englishNumbers) {
      if (num && /\d/.test(num)) {
        expect(num).toMatch(/[0-9]/);
      }
    }
  });

  test('Currency Formatting - IRR', async ({ page }) => {
    // Test currency display in both languages
    await page.goto('http://localhost:5000/student/payment?lang=fa');
    
    // Check for Rial/تومان
    await expect(page.locator('text=/تومان|ریال/')).toBeVisible();
    
    await page.goto('http://localhost:5000/student/payment?lang=en');
    
    // Check for IRR/Rials
    await expect(page.locator('text=/IRR|Rials|Tomans/')).toBeVisible();
  });

  test('Date Formatting - Persian Calendar vs Gregorian', async ({ page }) => {
    // Test Persian calendar in Farsi
    await page.goto('http://localhost:5000/student/sessions?lang=fa');
    
    // Check for Persian date format (should show Persian calendar dates)
    const farsiDates = await page.locator('[data-testid*="date"]').allTextContents();
    
    // Persian dates should contain Persian month names
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    for (const date of farsiDates) {
      const hasPersiancMonth = persianMonths.some(month => date.includes(month));
      if (date) {
        expect(hasPersiancMonth).toBe(true);
      }
    }
    
    // Test Gregorian calendar in English
    await page.goto('http://localhost:5000/student/sessions?lang=en');
    
    // Check for Gregorian date format
    const englishDates = await page.locator('[data-testid*="date"]').allTextContents();
    
    const gregorianMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (const date of englishDates) {
      const hasGregorianMonth = gregorianMonths.some(month => date.includes(month));
      if (date) {
        expect(hasGregorianMonth).toBe(true);
      }
    }
  });

  test('Form Validation Messages - Both Languages', async ({ page }) => {
    // Test Farsi validation messages
    await page.goto('http://localhost:5000/auth?lang=fa');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check Farsi error messages
    await expect(page.locator('text="ایمیل الزامی است"')).toBeVisible();
    await expect(page.locator('text="رمز عبور الزامی است"')).toBeVisible();
    
    // Test English validation messages
    await page.goto('http://localhost:5000/auth?lang=en');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check English error messages
    await expect(page.locator('text="Email is required"')).toBeVisible();
    await expect(page.locator('text="Password is required"')).toBeVisible();
  });

  test('Navigation Menu - Both Languages', async ({ page }) => {
    // Test Farsi navigation
    await page.goto('http://localhost:5000?lang=fa');
    
    const farsiNavItems = [
      'خانه',
      'دوره‌ها',
      'معلمان',
      'درباره ما',
      'تماس با ما'
    ];
    
    for (const item of farsiNavItems) {
      await expect(page.locator(`nav >> text="${item}"`).first()).toBeVisible();
    }
    
    // Test English navigation
    await page.goto('http://localhost:5000?lang=en');
    
    const englishNavItems = [
      'Home',
      'Courses',
      'Teachers',
      'About Us',
      'Contact'
    ];
    
    for (const item of englishNavItems) {
      await expect(page.locator(`nav >> text="${item}"`).first()).toBeVisible();
    }
  });

  test('Toast/Alert Messages - Both Languages', async ({ page }) => {
    // Test success message in Farsi
    await page.goto('http://localhost:5000/student/courses?lang=fa');
    await page.evaluate(() => {
      // Trigger a success toast
      window.showToast?.({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    });
    await expect(page.locator('text="عملیات با موفقیت انجام شد"')).toBeVisible();
    
    // Test error message in English
    await page.goto('http://localhost:5000/student/courses?lang=en');
    await page.evaluate(() => {
      // Trigger an error toast
      window.showToast?.({ message: 'Operation failed', type: 'error' });
    });
    await expect(page.locator('text="Operation failed"')).toBeVisible();
  });

  test('Callern Service Terms - Both Languages', async ({ page }) => {
    // Farsi
    await page.goto('http://localhost:5000/student/tutors?lang=fa');
    
    await expect(page.locator('text="تماس ویدیویی"')).toBeVisible();
    await expect(page.locator('text="رزرو جلسه"')).toBeVisible();
    await expect(page.locator('text="معلم آنلاین"')).toBeVisible();
    
    // English
    await page.goto('http://localhost:5000/student/tutors?lang=en');
    
    await expect(page.locator('text="Video Call"')).toBeVisible();
    await expect(page.locator('text="Book Session"')).toBeVisible();
    await expect(page.locator('text="Online Teacher"')).toBeVisible();
  });

  test('Gamification Terms - Both Languages', async ({ page }) => {
    // Farsi
    await page.goto('http://localhost:5000/student/achievements?lang=fa');
    
    const farsIGamificationTerms = [
      'امتیاز تجربه',
      'سطح',
      'دستاورد',
      'نشان',
      'رتبه‌بندی',
      'چالش روزانه'
    ];
    
    for (const term of farsIGamificationTerms) {
      await expect(page.locator(`text="${term}"`).first()).toBeVisible();
    }
    
    // English
    await page.goto('http://localhost:5000/student/achievements?lang=en');
    
    const englishGamificationTerms = [
      'Experience Points',
      'Level',
      'Achievement',
      'Badge',
      'Leaderboard',
      'Daily Challenge'
    ];
    
    for (const term of englishGamificationTerms) {
      await expect(page.locator(`text="${term}"`).first()).toBeVisible();
    }
  });

  test('Complex Sentences Translation Quality', async ({ page }) => {
    // Test complex UI messages maintain proper grammar in both languages
    await page.goto('http://localhost:5000/student/dashboard?lang=fa');
    
    // Check sentence structure is proper Farsi (RTL, proper grammar)
    const farsiComplexText = await page.locator('text=/شما.*دوره.*ثبت‌نام/').textContent();
    if (farsiComplexText) {
      // Farsi text should read naturally from right to left
      expect(farsiComplexText).toMatch(/شما در \d+ دوره ثبت‌نام کرده‌اید/);
    }
    
    await page.goto('http://localhost:5000/student/dashboard?lang=en');
    
    // Check sentence structure is proper English (LTR, proper grammar)
    const englishComplexText = await page.locator('text=/You.*enrolled.*course/').textContent();
    if (englishComplexText) {
      // English text should read naturally from left to right
      expect(englishComplexText).toMatch(/You are enrolled in \d+ course/);
    }
  });
});

// Test for missing translations
test.describe('Translation Coverage', () => {
  test('Check for missing translations', async ({ page }) => {
    // Load both language files
    const enKeys = Object.keys(en).sort();
    const faKeys = Object.keys(fa).sort();
    
    // Check if all English keys have Farsi translations
    const missingInFarsi = enKeys.filter(key => !faKeys.includes(key));
    expect(missingInFarsi.length).toBe(0);
    
    // Check if all Farsi keys have English translations
    const missingInEnglish = faKeys.filter(key => !enKeys.includes(key));
    expect(missingInEnglish.length).toBe(0);
    
    // Log any missing translations
    if (missingInFarsi.length > 0) {
      console.log('Missing Farsi translations:', missingInFarsi);
    }
    if (missingInEnglish.length > 0) {
      console.log('Missing English translations:', missingInEnglish);
    }
  });
  
  test('Check for placeholder translations', async ({ page }) => {
    // Check that no translations are just TODO or placeholder text
    const farsiValues = Object.values(fa).flat();
    const placeholderPattern = /TODO|FIXME|XXX|\[.*\]|untranslated/i;
    
    const placeholders = farsiValues.filter(value => 
      typeof value === 'string' && placeholderPattern.test(value)
    );
    
    expect(placeholders.length).toBe(0);
    
    if (placeholders.length > 0) {
      console.log('Found placeholder translations:', placeholders);
    }
  });
});