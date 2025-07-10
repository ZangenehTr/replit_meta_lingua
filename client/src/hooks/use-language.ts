import { useQuery } from '@tanstack/react-query';
import { translations, type Language } from '@/lib/i18n';

export interface LanguageSettings {
  language: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: string;
}

export function useLanguage() {
  // Get user preferences from API - fallback to localStorage for development
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/users/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Disable for now, use localStorage
  });

  // Default to English unless user has specifically selected Farsi
  const currentLanguage: Language = (userPreferences?.preferences?.language || localStorage.getItem('appLanguage') || 'en') as Language;
  const isRTL = currentLanguage === 'fa';

  // Helper function to change language
  const changeLanguage = (newLanguage: string) => {
    localStorage.setItem('appLanguage', newLanguage);
    // Refresh the page to apply changes
    window.location.reload();
  };

  // Create a translation function that returns the key if translation is missing
  const t = (key: string): string => {
    const translation = translations[currentLanguage];
    if (!translation) {
      return key;
    }
    
    // Support nested keys like 'dashboard.title'
    const keys = key.split('.');
    let value: any = translation;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return the key if translation is not found
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return {
    language: currentLanguage,
    isRTL,
    t,
    changeLanguage,
    formatDate: (date: string) => {
      const dateObj = new Date(date);
      return currentLanguage === 'fa' 
        ? dateObj.toLocaleDateString('fa-IR')
        : dateObj.toLocaleDateString('en-US');
    },
    formatNumber: (num: number) => {
      return currentLanguage === 'fa'
        ? num.toLocaleString('fa-IR')
        : num.toLocaleString('en-US');
    }
  };
}