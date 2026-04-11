import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLLayoutProps {
  children: React.ReactNode;
}

export function RTLLayout({ children }: RTLLayoutProps) {
  const { i18n } = useTranslation();
  const language = i18n.language || 'en';
  const isRTL = language === 'fa' || language === 'ar';

  useEffect(() => {
    const rtl = ['fa', 'ar'].includes(language);
    const dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.documentElement.classList.toggle('rtl', rtl);
    document.documentElement.classList.toggle('ltr', !rtl);
    document.body.style.direction = dir;
  }, [language]);

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'} lang-${language}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}
