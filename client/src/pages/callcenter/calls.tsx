import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";

export default function CallLogsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('callcenter:calls.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('callcenter:calls.subtitle')}
        </p>
      </div>
    </div>
  );
}