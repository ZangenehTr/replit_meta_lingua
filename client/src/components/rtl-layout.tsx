import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface RTLLayoutProps {
  children: React.ReactNode;
}

export function RTLLayout({ children }: RTLLayoutProps) {
  const { language, isRTL } = useLanguage();

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
    } else {
      document.body.classList.add('ltr');
    }
    
    document.body.classList.add(`lang-${language}`);
  }, [language, isRTL]);

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'} lang-${language}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}