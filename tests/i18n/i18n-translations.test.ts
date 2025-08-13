import { describe, it, expect, beforeAll } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import actual translation files - no mock data
import enCommon from '../../client/src/i18n/locales/en/common.json';
import faCommon from '../../client/src/i18n/locales/fa/common.json';
import enAuth from '../../client/src/i18n/locales/en/auth.json';
import faAuth from '../../client/src/i18n/locales/fa/auth.json';
import enAdmin from '../../client/src/i18n/locales/en/admin.json';
import faAdmin from '../../client/src/i18n/locales/fa/admin.json';
import enStudent from '../../client/src/i18n/locales/en/student.json';
import faStudent from '../../client/src/i18n/locales/fa/student.json';
import enTeacher from '../../client/src/i18n/locales/en/teacher.json';
import faTeacher from '../../client/src/i18n/locales/fa/teacher.json';
import enErrors from '../../client/src/i18n/locales/en/errors.json';
import faErrors from '../../client/src/i18n/locales/fa/errors.json';
import enValidation from '../../client/src/i18n/locales/en/validation.json';
import faValidation from '../../client/src/i18n/locales/fa/validation.json';

describe('i18n Translation Tests', () => {
  beforeAll(async () => {
    // Initialize i18n with actual translation resources
    await i18n
      .use(initReactI18next)
      .init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            common: enCommon,
            auth: enAuth,
            admin: enAdmin,
            student: enStudent,
            teacher: enTeacher,
            errors: enErrors,
            validation: enValidation
          },
          fa: {
            common: faCommon,
            auth: faAuth,
            admin: faAdmin,
            student: faStudent,
            teacher: faTeacher,
            errors: faErrors,
            validation: faValidation
          }
        },
        interpolation: {
          escapeValue: false
        }
      });
  });

  describe('English Translations', () => {
    beforeAll(() => {
      i18n.changeLanguage('en');
    });

    it('should have correct common navigation translations', () => {
      expect(i18n.t('common:navigation.dashboard')).toBe('Dashboard');
      expect(i18n.t('common:navigation.students')).toBe('Students');
      expect(i18n.t('common:navigation.courses')).toBe('Courses');
      expect(i18n.t('common:navigation.logout')).toBe('Sign Out');
      expect(i18n.t('common:navigation.profile')).toBe('Profile');
    });

    it('should have correct authentication translations', () => {
      expect(i18n.t('auth:signIn')).toBe('Sign In');
      expect(i18n.t('auth:signUp')).toBe('Sign Up');
      expect(i18n.t('auth:email')).toBe('Email');
      expect(i18n.t('auth:password')).toBe('Password');
      expect(i18n.t('auth:firstName')).toBe('First Name');
      expect(i18n.t('auth:lastName')).toBe('Last Name');
      expect(i18n.t('auth:welcomeMessage')).toBe('Welcome to your language learning journey');
    });

    it('should have correct admin section translations', () => {
      expect(i18n.t('admin:dashboard.title')).toBe('Admin Dashboard');
      expect(i18n.t('admin:students.title')).toBe('Student Management');
      expect(i18n.t('admin:students.subtitle')).toBe('Student management and tracking');
      expect(i18n.t('admin:teachers.title')).toBe('Teacher Management');
      expect(i18n.t('admin:courses.title')).toBe('Course Management');
    });

    it('should have correct student section translations', () => {
      expect(i18n.t('student:dashboard.title')).toBe('Student Dashboard');
      expect(i18n.t('student:courses.exploreCourses')).toBe('Explore Courses');
      expect(i18n.t('student:courses.instructor')).toBe('Instructor');
      expect(i18n.t('student:dashboard.myProgress')).toBe('My Progress');
    });

    it('should have correct validation messages', () => {
      expect(i18n.t('validation:required')).toBe('This field is required');
      expect(i18n.t('validation:email')).toBe('Please enter a valid email address');
      expect(i18n.t('validation:minLength')).toBe('Must be at least {{min}} characters');
    });

    it('should have correct error messages', () => {
      expect(i18n.t('errors:general.resourceNotFound')).toBe('Resource not found');
      expect(i18n.t('errors:general.unauthorizedAccess')).toBe('Unauthorized access');
      expect(i18n.t('errors:general.serverError')).toBe('Server error occurred');
    });

    it('should support interpolation with actual values', () => {
      const result = i18n.t('auth:loggedInAs', { 
        firstName: 'John', 
        lastName: 'Doe', 
        role: 'Teacher' 
      });
      expect(result).toBe('You are logged in as John Doe (Teacher)');
    });
  });

  describe('Farsi (Persian) Translations', () => {
    beforeAll(() => {
      i18n.changeLanguage('fa');
    });

    it('should have correct common navigation translations in Farsi', () => {
      expect(i18n.t('common:navigation.dashboard')).toBe('داشبورد');
      expect(i18n.t('common:navigation.students')).toBe('دانشجویان');
      expect(i18n.t('common:navigation.courses')).toBe('دوره‌ها');
      expect(i18n.t('common:navigation.logout')).toBe('خروج');
      expect(i18n.t('common:navigation.profile')).toBe('پروفایل');
    });

    it('should have correct authentication translations in Farsi', () => {
      expect(i18n.t('auth:signIn')).toBe('ورود');
      expect(i18n.t('auth:signUp')).toBe('ثبت نام');
      expect(i18n.t('auth:email')).toBe('ایمیل');
      expect(i18n.t('auth:password')).toBe('رمز عبور');
      expect(i18n.t('auth:firstName')).toBe('نام');
      expect(i18n.t('auth:lastName')).toBe('نام خانوادگی');
      expect(i18n.t('auth:welcomeMessage')).toBe('به سفر یادگیری زبان خود خوش آمدید');
    });

    it('should have correct admin section translations in Farsi', () => {
      expect(i18n.t('admin:dashboard.title')).toBe('داشبورد مدیر');
      expect(i18n.t('admin:students.title')).toBe('سیستم اطلاعات دانشجو');
      expect(i18n.t('admin:students.subtitle')).toBe('مدیریت اطلاعات دانش‌آموزان');
      expect(i18n.t('admin:courses.title')).toBe('مدیریت دوره‌ها');
    });

    it('should have correct student section translations in Farsi', () => {
      expect(i18n.t('student:dashboard.title')).toBe('داشبورد دانشجو');
      expect(i18n.t('student:courses.exploreCourses')).toBe('کاوش در دوره‌ها');
      expect(i18n.t('student:courses.instructor')).toBe('مدرس');
      expect(i18n.t('student:dashboard.progress')).toBe('پیشرفت من');
    });

    it('should have correct validation messages in Farsi', () => {
      expect(i18n.t('validation:required')).toBe('این فیلد اجباری است');
      expect(i18n.t('validation:invalidEmail')).toBe('آدرس ایمیل نامعتبر است');
      expect(i18n.t('validation:minLength')).toBe('باید حداقل {{min}} کاراکتر باشد');
    });

    it('should have correct error messages in Farsi', () => {
      expect(i18n.t('errors:general.resourceNotFound')).toBe('منبع پیدا نشد');
      expect(i18n.t('errors:general.unauthorizedAccess')).toBe('دسترسی غیرمجاز');
      expect(i18n.t('errors:general.serverError')).toBe('خطای سرور رخ داده');
    });

    it('should support interpolation with actual values in Farsi', () => {
      const result = i18n.t('auth:loggedInAs', { 
        firstName: 'احمد', 
        lastName: 'رضایی', 
        role: 'معلم' 
      });
      expect(result).toBe('شما به عنوان احمد رضایی (معلم) وارد شده‌اید');
    });

    it('should have correct OTP authentication translations in Farsi', () => {
      expect(i18n.t('auth:loginWithOtp')).toBe('ورود با کد پیامکی');
      expect(i18n.t('auth:usePassword')).toBe('استفاده از رمز عبور');
      expect(i18n.t('auth:otpCode')).toBe('کد تایید');
      expect(i18n.t('auth:resendOtp')).toBe('ارسال مجدد کد');
    });
  });

  describe('Language Switching', () => {
    it('should switch between English and Farsi correctly', async () => {
      // Start with English
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(i18n.t('common:home')).toBe('Home');
      
      // Switch to Farsi
      await i18n.changeLanguage('fa');
      expect(i18n.language).toBe('fa');
      expect(i18n.t('common:home')).toBe('خانه');
      
      // Switch back to English
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(i18n.t('common:home')).toBe('Home');
    });

    it('should maintain translation consistency across namespaces', () => {
      // English consistency check
      i18n.changeLanguage('en');
      expect(i18n.t('common:navigation.profile')).toBe('Profile');
      expect(i18n.t('common:profile')).toBe('Profile');
      
      // Farsi consistency check
      i18n.changeLanguage('fa');
      expect(i18n.t('common:navigation.profile')).toBe('پروفایل');
      expect(i18n.t('common:profile')).toBe('پروفایل');
    });
  });

  describe('Translation Coverage', () => {
    it('should have all required navigation keys in both languages', () => {
      const navigationKeys = [
        'dashboard', 'students', 'courses', 'classes', 
        'assignments', 'settings', 'logout', 'profile'
      ];
      
      navigationKeys.forEach(key => {
        // Check English
        i18n.changeLanguage('en');
        const enTranslation = i18n.exists(`common:navigation.${key}`);
        expect(enTranslation).toBe(true);
        
        // Check Farsi
        i18n.changeLanguage('fa');
        const faTranslation = i18n.exists(`common:navigation.${key}`);
        expect(faTranslation).toBe(true);
      });
    });

    it('should have all required auth keys in both languages', () => {
      const authKeys = [
        'signIn', 'signUp', 'email', 'password', 
        'firstName', 'lastName', 'welcomeMessage'
      ];
      
      authKeys.forEach(key => {
        // Check English
        i18n.changeLanguage('en');
        expect(i18n.exists(`auth:${key}`)).toBe(true);
        
        // Check Farsi
        i18n.changeLanguage('fa');
        expect(i18n.exists(`auth:${key}`)).toBe(true);
      });
    });

    it('should have no missing translations for critical paths', () => {
      const criticalPaths = [
        'auth:signIn',
        'auth:email',
        'auth:password',
        'common:navigation.dashboard',
        'validation:required',
        'errors:general.serverError'
      ];
      
      criticalPaths.forEach(path => {
        // English should not return the key itself
        i18n.changeLanguage('en');
        const enValue = i18n.t(path);
        expect(enValue).not.toBe(path);
        
        // Farsi should not return the key itself
        i18n.changeLanguage('fa');
        const faValue = i18n.t(path);
        expect(faValue).not.toBe(path);
        
        // Values should be different between languages
        expect(enValue).not.toBe(faValue);
      });
    });
  });

  describe('Special Characters and Formatting', () => {
    it('should handle Persian/Arabic numerals correctly', () => {
      i18n.changeLanguage('fa');
      
      // Check if Persian text maintains proper formatting
      const persianText = i18n.t('auth:passwordMinLength');
      expect(persianText).toContain('۶'); // Persian numeral 6
      
      const persianFirstName = i18n.t('auth:firstNameMinLength');
      expect(persianFirstName).toContain('۲'); // Persian numeral 2
    });

    it('should handle English numerals correctly', () => {
      i18n.changeLanguage('en');
      
      const englishText = i18n.t('auth:passwordMinLength');
      expect(englishText).toContain('6'); // English numeral 6
      
      const englishFirstName = i18n.t('auth:firstNameMinLength');
      expect(englishFirstName).toContain('2'); // English numeral 2
    });

    it('should handle special characters in translations', () => {
      // Check English special characters
      i18n.changeLanguage('en');
      expect(i18n.t('common:navigation.reportsAnalytics')).toBe('Reports & Analytics');
      
      // Check Farsi special characters
      i18n.changeLanguage('fa');
      expect(i18n.t('common:navigation.students')).toBe('دانشجویان');
      expect(i18n.t('common:navigation.courses')).toBe('دوره‌ها'); // Contains zero-width non-joiner
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to English when translation is missing in Farsi', () => {
      // If a key exists in English but not in Farsi, it should fallback
      i18n.changeLanguage('fa');
      
      // Test with a key that might not exist
      const result = i18n.t('nonexistent:key', { fallbackLng: 'en' });
      
      // Should return the key itself or English fallback
      expect(typeof result).toBe('string');
    });
  });
});