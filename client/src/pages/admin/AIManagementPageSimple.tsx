import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";

export function AIManagementPageSimple() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  console.log("Simple AI Management page loading...");
  
  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:aiServices.title')}</h1>
          <p className="text-muted-foreground">
            {t('admin:aiServices.subtitle')}
          </p>
        </div>
        <Button variant="outline">
          Refresh Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Service Status
          </CardTitle>
          <CardDescription>Current status of local AI processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-green-600 font-medium">Service Running</div>
        </CardContent>
      </Card>
    </div>
  );
}