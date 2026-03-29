import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function incrementVisitCount(): number {
  const count = parseInt(localStorage.getItem('pwa-visit-count') ?? '0', 10) + 1;
  localStorage.setItem('pwa-visit-count', String(count));
  return count;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation(['common']);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const visitCount = incrementVisitCount();
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const shouldShow = !dismissed || (Date.now() - dismissedTime) > 7 * 24 * 60 * 60 * 1000;

    if (!shouldShow || visitCount < 2) return;

    if (isIOS()) {
      setTimeout(() => setShowIOS(true), 3000);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('PWA install error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOS(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt && !showIOS) return null;

  if (showIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base">
                  {t('pwa.iosInstallTitle', 'نصب اپلیکیشن')}
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('pwa.iosStep1', 'برای نصب روی iPhone/iPad:')}</p>
            <p>۱. روی دکمه <span className="font-medium text-primary">اشتراک‌گذاری (Share ↑)</span> در پایین Safari بزنید</p>
            <p>۲. گزینه <span className="font-medium text-primary">«Add to Home Screen»</span> را انتخاب کنید</p>
            <p>۳. روی <span className="font-medium text-primary">«Add»</span> بزنید</p>
            <p className="text-xs opacity-60 pt-1">Tap Share → Add to Home Screen → Add</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">
                {t('pwa.installTitle', 'نصب متالینگوآ')}
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-4">
            {t('pwa.installDescription', 'برای دسترسی سریع‌تر، یادگیری آفلاین و تجربه بهتر اپلیکیشن را نصب کنید!')}
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1 bg-gradient-to-r from-primary to-purple-600">
              <Download className="h-4 w-4 mr-2" />
              {t('pwa.installButton', 'نصب اپلیکیشن')}
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              {t('pwa.notNow', 'بعداً')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
