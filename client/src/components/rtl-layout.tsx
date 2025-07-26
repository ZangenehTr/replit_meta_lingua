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
    // Apply RTL/LTR direction to document
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add language-specific classes to body
    document.body.className = document.body.className
      .replace(/\b(rtl|ltr|lang-\w+)\b/g, '')
      .trim();
    
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.style.direction = 'rtl';
      document.body.style.textAlign = 'right';
    } else {
      document.body.classList.add('ltr');
      document.body.style.direction = 'ltr';
      document.body.style.textAlign = 'left';
    }
    
    document.body.classList.add(`lang-${language}`);
  }, [language, isRTL]);

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'} lang-${language}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}