import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/use-offline-sync';

export function OfflineIndicator() {
  const { t } = useTranslation(['common']);
  const [showReconnected, setShowReconnected] = useState(false);
  const { isOnline } = useOfflineSync();

  useEffect(() => {
    if (isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowReconnected(false);
    }
  }, [isOnline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-16 inset-x-0 z-50 mx-auto w-fit px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t('pwa.reconnected', 'Back online!')}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t('pwa.offline', 'You are offline')}
          </span>
        </>
      )}
    </div>
  );
}
