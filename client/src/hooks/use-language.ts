// DEPRECATED: This file is being replaced by useLanguage.tsx
// Use import { useLanguage } from "@/hooks/useLanguage"; instead

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
  const isRTL = currentLanguage === 'fa' || currentLanguage === 'ar';

  // Helper function to change language
  const changeLanguage = (newLanguage: string) => {
    localStorage.setItem('appLanguage', newLanguage);
    // Refresh the page to apply changes
    window.location.reload();
  };

  // Create a translation function that returns the key if translation is missing
  const t = (key: string): string => {
    // Use complete translations from JSON files
    const translationMaps = {
      en: enCommon,
      fa: faCommon,
      ar: arCommon
    };
    
    const currentTranslations = translationMaps[currentLanguage] || translationMaps.en;
    
    // Support nested keys like 'dashboard.title'
    const keys = key.split('.');
    let value: any = currentTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to old translation system if not found in JSON
        const fallbackTranslation = translations[currentLanguage];
        if (fallbackTranslation) {
          let fallbackValue: any = fallbackTranslation;
          for (const fallbackKey of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
              fallbackValue = fallbackValue[fallbackKey];
            } else {
              return key; // Return the key if translation is not found
            }
          }
          return typeof fallbackValue === 'string' ? fallbackValue : key;
        }
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
      if (currentLanguage === 'fa') {
        return dateObj.toLocaleDateString('fa-IR');
      } else if (currentLanguage === 'ar') {
        return dateObj.toLocaleDateString('ar-SA');
      } else {
        return dateObj.toLocaleDateString('en-US');
      }
    },
    formatNumber: (num: number) => {
      if (currentLanguage === 'fa') {
        return num.toLocaleString('fa-IR');
      } else if (currentLanguage === 'ar') {
        return num.toLocaleString('ar-SA');
      } else {
        return num.toLocaleString('en-US');
      }
    },
    direction: isRTL ? 'rtl' : 'ltr'
  };
}