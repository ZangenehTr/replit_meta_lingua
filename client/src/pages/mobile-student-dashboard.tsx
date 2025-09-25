import React from "react";
import { useTranslation } from 'react-i18next';
import {
  GamificationWidget,
  LearningProgressWidget,
  UpcomingSessionsWidget,
  AssignmentsWidget,
  AchievementWidget,
  QuickActionsWidget
} from "@/components/student/widgets";


export function MobileStudentDashboard() {
  const { t } = useTranslation(['student', 'common']);

  return (
    <div className="space-y-6 p-4 pb-6" data-testid="mobile-student-dashboard">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold" data-testid="welcome-title">
          {t('student:dashboard.welcomeBack')}
        </h1>
        <p className="text-muted-foreground" data-testid="welcome-message">
          {t('student:dashboard.welcomeMessage')}
        </p>
      </div>

      {/* Gamification Widget */}
      <GamificationWidget theme="learner" />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <QuickActionsWidget theme="learner" columns={2} />
      </div>

      {/* Learning Progress */}
      <LearningProgressWidget theme="learner" />

      {/* Upcoming Sessions */}
      <UpcomingSessionsWidget theme="learner" />

      {/* Assignments */}
      <AssignmentsWidget theme="learner" />

      {/* Achievement Showcase */}
      <AchievementWidget theme="learner" maxDisplay={5} />
    </div>
  );
}

export default MobileStudentDashboard;