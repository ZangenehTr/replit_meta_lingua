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
    const updateLayout = () => {
      const isRTL = ['fa', 'ar'].includes(language);
      console.log(`Applied ${isRTL ? 'RTL' : 'LTR'} for language: ${language}`);

      const html = document.documentElement;
      html.dir = isRTL ? 'rtl' : 'ltr';
      html.lang = language;

      // Clear both classes first to prevent conflicts
      html.classList.remove('rtl', 'ltr');

      if (isRTL) {
        html.classList.add('rtl');
        console.log(`Applied RTL styles for ${language}`);
      } else {
        html.classList.add('ltr');
        console.log(`Applied LTR styles for ${language}`);
      }

      // Force a small reflow to ensure styles are applied
      requestAnimationFrame(() => {
        document.body.style.direction = isRTL ? 'rtl' : 'ltr';
      });
    };

    updateLayout();
  }, [language]);

  useEffect(() => {
    const shouldBeRTL = language === 'fa' || language === 'ar';
    console.log(`Applied ${shouldBeRTL ? 'RTL' : 'LTR'} for language: ${language}`);
    document.documentElement.dir = shouldBeRTL ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('rtl', shouldBeRTL);
    document.documentElement.classList.toggle('ltr', !shouldBeRTL);
  }, [language]);

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'} lang-${language}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}