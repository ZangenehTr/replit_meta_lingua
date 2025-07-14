
import { Sidebar } from "@/components/layout/sidebar";
import { WalletSystem } from "@/components/dashboard/wallet-system";
import { useLanguage } from "@/hooks/use-language";
import { BackButton } from "@/components/ui/back-button";

export default function WalletPage() {
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
                {currentLanguage === 'fa' ? 'کیف پول' :
                 currentLanguage === 'ar' ? 'المحفظة' :
                 'Wallet'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {currentLanguage === 'fa' ? 'مدیریت کیف پول، شارژ حساب و ثبت نام در دوره‌ها' :
                 currentLanguage === 'ar' ? 'إدارة المحفظة وشحن الحساب والتسجيل في الدورات' :
                 'Manage wallet, account top-up and course enrollment'}
              </p>
            </div>
            
            <WalletSystem />
          </div>
        </main>
      </div>
    </div>
  );
}