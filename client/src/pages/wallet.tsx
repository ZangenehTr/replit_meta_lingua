
import { Sidebar } from "@/components/layout/sidebar";
import { WalletSystem } from "@/components/dashboard/wallet-system";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from 'react-i18next';
import { BackButton } from "@/components/ui/back-button";

export default function WalletPage() {
  const { t } = useTranslation(['common']);
  const { currentLanguage, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 ${isRTL ? 'mr-64' : 'ml-64'} p-6`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <BackButton href="/dashboard" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('common:wallet.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
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