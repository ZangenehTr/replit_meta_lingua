import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface CalendarSettings {
  usePersianCalendar: boolean;
}

export function useCalendarSettings(): CalendarSettings {
  const { language } = useLanguage();
  const [usePersianCalendar, setUsePersianCalendar] = useState(language === 'fa');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('calendarSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.usePersianCalendar === 'boolean') {
          setUsePersianCalendar(parsed.usePersianCalendar);
          return;
        }
      }
    } catch {
    }
    setUsePersianCalendar(language === 'fa');
  }, [language]);

  return { usePersianCalendar };
}
