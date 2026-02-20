import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation(['common', 'errors']);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 px-4 sm:px-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{t('errors.pageNotFound')}</h1>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-gray-600">
            {t('errors.pageNotFoundDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
