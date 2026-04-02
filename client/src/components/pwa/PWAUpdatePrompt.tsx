import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWA } from '@/hooks/use-pwa';

export function PWAUpdatePrompt() {
  const { t } = useTranslation(['common']);
  const { offlineReady, needRefresh, updateServiceWorker, close } = usePWA();

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 start-4 end-4 z-50 md:start-auto md:end-4 md:w-96">
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-950 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">
                {needRefresh 
                  ? t('pwa.updateTitle', 'Update Available')
                  : t('pwa.offlineTitle', 'Ready for Offline')
                }
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={close}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-4">
            {needRefresh
              ? t('pwa.updateDescription', 'A new version is available. Refresh to get the latest features!')
              : t('pwa.offlineDescription', 'App is ready to work offline. You can learn even without internet!')
            }
          </CardDescription>
          {needRefresh && (
            <Button
              onClick={() => updateServiceWorker(true)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <RefreshCw className="h-4 w-4 me-2" />
              {t('pwa.updateButton', 'Refresh Now')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
