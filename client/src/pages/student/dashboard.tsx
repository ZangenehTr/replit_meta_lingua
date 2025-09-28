import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { ConditionalDashboard } from "@/components/student/ConditionalDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['student', 'common']);

  // Redirect non-students to their appropriate dashboards
  if (user && user.role.toLowerCase() !== 'student') {
    return null; // Let the unified dashboard handle role-based routing
  }

  // Loading state for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('student:loading.title')}
            </h3>
            <p className="text-sm text-gray-600 text-center">
              {t('student:loading.authenticating')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the conditional dashboard based on enrollment status
  return <ConditionalDashboard />;
}