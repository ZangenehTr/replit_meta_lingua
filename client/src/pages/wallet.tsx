
import { Sidebar } from "@/components/layout/sidebar";
import { WalletSystem } from "@/components/dashboard/wallet-system";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from 'react-i18next';
import { BackButton } from "@/components/ui/back-button";

export default function WalletPage() {
  const { t } = useTranslation(['common']);
  const { isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        
        <main className={`flex-1 ${isRTL ? 'mr-0 md:mr-64' : 'ml-0 md:ml-64'} px-4 sm:px-6 lg:px-8 py-4 sm:py-6`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-4 mb-4">
                <BackButton href="/dashboard" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {t('common:wallet.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
                {t('common:wallet.subtitle')}
              </p>
            </div>
            
            <WalletSystem />
          </div>
        </main>
      </div>
    </div>
  );
}