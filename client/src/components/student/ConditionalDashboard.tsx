import { useEnrollmentStatus } from "@/hooks/use-enrollment-status";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { UnifiedStudentDashboard } from "./UnifiedStudentDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ConditionalDashboard() {
  const { user } = useAuth();
  const { enrollmentStatus, isLoading } = useEnrollmentStatus();
  const { t } = useTranslation(['student', 'common']);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('student:loading.title')}
            </h3>
            <p className="text-sm text-gray-600 text-center">
              {t('student:loading.checkingEnrollment')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show conditional dashboard for students
  if (!user || user.role.toLowerCase() !== 'student') {
    return null;
  }

  // Unified dashboard handles both enrolled and non-enrolled states
  return (
    <UnifiedStudentDashboard 
      enrollmentStatus={enrollmentStatus}
      user={user}
    />
  );
}