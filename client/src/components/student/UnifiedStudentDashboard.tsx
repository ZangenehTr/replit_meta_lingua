/**
 * Unified Student Dashboard
 * Handles both enrolled and non-enrolled students with smart feature visibility
 */

import { usePublicFeatures } from "@/hooks/use-public-features";
import { EnrolledStudentDashboard } from "./EnrolledStudentDashboard";
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";
import type { User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  GraduationCap, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Users, 
  Video,
  CheckCircle,
  Lock,
  Unlock
} from "lucide-react";

interface Props {
  enrollmentStatus: EnrollmentStatus | undefined;
  user: User | null;
}

export function UnifiedStudentDashboard({ enrollmentStatus, user }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { publicFeatures, isLoading: featuresLoading } = usePublicFeatures();
  const [, setLocation] = useLocation();
  
  const isEnrolled = enrollmentStatus?.isEnrolled ?? false;
  const hasCompletedPlacementTest = enrollmentStatus?.hasCompletedPlacementTest ?? false;

  // If enrolled, show the full dashboard
  if (isEnrolled) {
    return <EnrolledStudentDashboard enrollmentStatus={enrollmentStatus} user={user} />;
  }

  // For non-enrolled students: Show placement test CTA and locked features preview
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Hero Section - Placement Test CTA */}
        {publicFeatures.placementTest && !hasCompletedPlacementTest && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <CardContent className="relative z-10 py-6 sm:py-8 md:py-12 px-3 sm:px-6">
              <div className="max-w-3xl mx-auto text-center space-y-3 sm:space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
                  <Sparkles className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                  {t('student:unifiedDashboard.freeAssessment')}
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {t('student:unifiedDashboard.discoverYourLevel')}
                </h1>
                
                <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                  {t('student:unifiedDashboard.placementTestDescription')}
                </p>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center items-center pt-2 sm:pt-4">
                  <Button 
                    size="sm"
                    className="bg-white text-purple-600 hover:bg-white/90 font-semibold w-full sm:w-auto px-4 sm:px-8 py-2.5 sm:py-6 text-sm sm:text-base shadow-xl"
                    onClick={() => setLocation('/placement-test')}
                    data-testid="button-take-placement-test"
                  >
                    <Trophy className="me-2 h-3 sm:h-5 w-3 sm:w-5 flex-shrink-0" />
                    {t('student:unifiedDashboard.takePlacementTest')}
                    <ArrowRight className="ms-2 h-3 sm:h-5 w-3 sm:w-5 flex-shrink-0" />
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold w-full sm:w-auto px-4 sm:px-8 py-2.5 sm:py-6 text-sm sm:text-base"
                    onClick={() => setLocation('/courses')}
                    data-testid="button-browse-courses"
                  >
                    <BookOpen className="me-2 h-3 sm:h-5 w-3 sm:w-5 flex-shrink-0" />
                    {t('student:unifiedDashboard.browseCourses')}
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-6 justify-center pt-4 sm:pt-8 text-white/80 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                    <span>{t('student:unifiedDashboard.aiPowered')}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                    <span>{t('student:unifiedDashboard.15MinutesOnly')}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                    <span>{t('student:unifiedDashboard.instantResults')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results Section - Show after completion */}
        {hasCompletedPlacementTest && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                <Trophy className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-500 flex-shrink-0" />
                {t('student:unifiedDashboard.yourPlacementResults')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                  B1
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {t('student:unifiedDashboard.intermediateLevel')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('student:unifiedDashboard.greatFoundation')}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 sm:pt-4">
                <h4 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-3">
                  {t('student:unifiedDashboard.recommendedCourses')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Course recommendations will be loaded from API */}
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <Badge className="mb-2 text-xs">Recommended</Badge>
                      <h5 className="font-semibold mb-1 text-sm sm:text-base">Intermediate English Course</h5>
                      <p className="text-xs sm:text-sm text-gray-600">Perfect for your B1 level</p>
                      <Button size="sm" className="mt-3 w-full text-xs sm:text-sm">
                        {t('student:unifiedDashboard.enrollNow')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Course Catalog */}
          {publicFeatures.courseCatalog && (
            <FeatureCard
              icon={BookOpen}
              title={t('student:unifiedDashboard.courseCatalog')}
              description={t('student:unifiedDashboard.browseCoursesCTA')}
              isUnlocked={true}
              onClick={() => setLocation('/courses')}
              testId="feature-course-catalog"
            />
          )}

          {/* Teacher Directory */}
          {publicFeatures.teacherDirectory && (
            <FeatureCard
              icon={Users}
              title={t('student:unifiedDashboard.expertTeachers')}
              description={t('student:unifiedDashboard.browseTeachersCTA')}
              isUnlocked={true}
              onClick={() => setLocation('/teachers')}
              testId="feature-teacher-directory"
            />
          )}

          {/* Video Courses */}
          {publicFeatures.videoCourses && (
            <FeatureCard
              icon={Video}
              title={t('student:unifiedDashboard.videoCourses')}
              description={t('student:unifiedDashboard.videoLibraryCTA')}
              isUnlocked={true}
              onClick={() => setLocation('/videos')}
              testId="feature-video-courses"
            />
          )}

          {/* Locked Features with Upgrade CTAs */}
          {!publicFeatures.liveClasses && (
            <FeatureCard
              icon={Users}
              title={t('student:unifiedDashboard.liveClasses')}
              description={t('student:unifiedDashboard.joinLiveClassesCTA')}
              isUnlocked={false}
              onClick={() => setLocation('/enroll')}
              testId="feature-live-classes-locked"
            />
          )}

          {!publicFeatures.progressTracking && (
            <FeatureCard
              icon={Trophy}
              title={t('student:unifiedDashboard.progressTracking')}
              description={t('student:unifiedDashboard.trackYourProgressCTA')}
              isUnlocked={false}
              onClick={() => setLocation('/enroll')}
              testId="feature-progress-locked"
            />
          )}

          {!publicFeatures.linguaquestGames && (
            <FeatureCard
              icon={GraduationCap}
              title={t('student:unifiedDashboard.linguaquestGames')}
              description={t('student:unifiedDashboard.funLearningGamesCTA')}
              isUnlocked={false}
              onClick={() => setLocation('/enroll')}
              testId="feature-linguaquest-locked"
            />
          )}
        </div>

        {/* CTA Banner */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="py-6 sm:py-8 md:py-12 px-3 sm:px-6 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              {t('student:unifiedDashboard.readyToStartLearning')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-4 sm:mb-6 max-w-2xl mx-auto">
              {t('student:unifiedDashboard.enrollTodayUnlockFeatures')}
            </p>
            <Button 
              size="sm"
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold w-full sm:w-auto px-4 sm:px-8 py-2.5 sm:py-6 text-sm sm:text-base"
              onClick={() => setLocation('/enroll')}
              data-testid="button-enroll-cta"
            >
              <Sparkles className="me-2 h-3 sm:h-5 w-3 sm:w-5 flex-shrink-0" />
              {t('student:unifiedDashboard.enrollNow')}
              <ArrowRight className="ms-2 h-3 sm:h-5 w-3 sm:w-5 flex-shrink-0" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  isUnlocked: boolean;
  onClick: () => void;
  testId: string;
}

function FeatureCard({ icon: Icon, title, description, isUnlocked, onClick, testId }: FeatureCardProps) {
  const { t } = useTranslation(['student', 'common']);
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-xl ${
        isUnlocked ? 'border-blue-200' : 'border-gray-200 relative overflow-hidden'
      }`}
      onClick={onClick}
      data-testid={testId}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/80 to-gray-200/80 backdrop-blur-sm z-10 flex items-center justify-center p-3">
          <div className="text-center">
            <Lock className="h-6 sm:h-8 w-6 sm:w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-gray-600">{t('unifiedDashboard.enrollToUnlock')}</p>
          </div>
        </div>
      )}
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className={`p-2.5 sm:p-3 rounded-lg flex-shrink-0 ${
            isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            <Icon className="h-5 sm:h-6 w-5 sm:w-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-base sm:text-lg mb-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:justify-start justify-center">
              {title}
              {isUnlocked && <Unlock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500" />}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3">
              {description}
            </p>
            <Button 
              variant={isUnlocked ? "default" : "outline"} 
              size="sm" 
              className="w-full sm:w-auto mt-2 text-xs sm:text-sm h-8 sm:h-9"
            >
              {isUnlocked ? t('unifiedDashboard.explore') : t('unifiedDashboard.learnMore')}
              <ArrowRight className="ms-2 h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
