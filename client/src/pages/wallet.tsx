import { Navigation } from "@/components/layout/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { WalletSystem } from "@/components/dashboard/wallet-system";
import { useLanguage } from "@/hooks/use-language";

export default function WalletPage() {
  const { isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 ${isRTL ? 'mr-64' : 'ml-64'} p-6`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                کیف پول
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                مدیریت کیف پول، شارژ حساب و ثبت نام در دوره‌ها
              </p>
            </div>
            
            <WalletSystem />
          </div>
        </main>
      </div>
    </div>
  );
}