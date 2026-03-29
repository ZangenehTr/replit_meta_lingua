import { useTranslation } from 'react-i18next';

export function SkipToContent() {
  const { t } = useTranslation(['common']);
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {t('common:accessibility.skipToContent', 'رفتن به محتوای اصلی')}
    </a>
  );
}
