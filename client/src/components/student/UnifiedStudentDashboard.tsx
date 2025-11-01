/**
 * Unified Student Dashboard
 * Handles both enrolled and non-enrolled students with smart feature visibility
 */

import { usePublicFeatures } from "@/hooks/use-public-features";
import { EnrolledStudentDashboard } from "./EnrolledStudentDashboard";
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";
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
  user: any;
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
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Hero Section - Placement Test CTA */}
        {publicFeatures.placementTest && !hasCompletedPlacementTest && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <CardContent className="relative z-10 py-12 px-6">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  {t('student:freeAssessment')}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  {t('student:discoverYourLevel')}
                </h1>
                
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  {t('student:placementTestDescription')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-8 py-6 text-lg shadow-xl"
                    onClick={() => setLocation('/placement-test')}
                    data-testid="button-take-placement-test"
                  >
                    <Trophy className="mr-2 h-5 w-5" />
                    {t('student:takePlacementTest')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg"
                    onClick={() => setLocation('/courses')}
                    data-testid="button-browse-courses"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    {t('student:browseCourses')}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-6 justify-center pt-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>{t('student:aiPowered')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>{t('student:15MinutesOnly')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>{t('student:instantResults')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results Section - Show after completion */}
        {hasCompletedPlacementTest && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-yellow-500" />
                {t('student:yourPlacementResults')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  B1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('student:intermediateLevel')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('student:greatFoundation')}
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {t('student:recommendedCourses')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Course recommendations will be loaded from API */}
                  <Card>
                    <CardContent className="p-4">
                      <Badge className="mb-2">Recommended</Badge>
                      <h5 className="font-semibold mb-1">Intermediate English Course</h5>
                      <p className="text-sm text-gray-600">Perfect for your B1 level</p>
                      <Button size="sm" className="mt-3 w-full">
                        {t('student:enrollNow')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Course Catalog */}
          {publicFeatures.courseCatalog && (
            <FeatureCard
              icon={BookOpen}
              title={t('student:courseCatalog')}
              description={t('student:browseCoursesCTA')}
              isUnlocked={true}
              onClick={() => setLocation('/courses')}
              testId="feature-course-catalog"
            />
          )}

          {/* Teacher Directory */}
          {publicFeatures.teacherDirectory && (
            <FeatureCard
              icon={Users}
              title={t('student:expertTeachers')}
              description={t('student:browseTeachersCTA')}
              isUnlocked={true}
              onClick={() => setLocation('/teachers')}
              testId="feature-teacher-directory"
            />
          )}

          {/* Video Courses */}
          {publicFeatures.videoCourses && (
            <FeatureCard
              icon={Video}
              title={t('student:videoCourses')}
              description={t('student:videoLibraryCTA')}
              isUnlocked={true}
              onClick={() => setLocation('/videos')}
              testId="feature-video-courses"
            />
          )}

          {/* Locked Features with Upgrade CTAs */}
          {!publicFeatures.liveClasses && (
            <FeatureCard
              icon={Users}
              title={t('student:liveClasses')}
              description={t('student:joinLiveClassesCTA')}
              isUnlocked={false}
              onClick={() => setLocation('/enroll')}
              testId="feature-live-classes-locked"
            />
          )}

          {!publicFeatures.progressTracking && (
            <FeatureCard
              icon={Trophy}
              title={t('student:progressTracking')}
              description={t('student:trackYourProgressCTA')}
              isUnlocked={false}
              onClick={() => setLocation('/enroll')}
              testId="feature-progress-locked"
            />
          )}

          {!publicFeatures.linguaquestGames && (
            <FeatureCard
              icon={GraduationCap}
              title={t('student:linguaquestGames')}
              description={t('student:funLearningGamesCTA')}
              isUnlocked={false}
              onClick={() => setLocation('/enroll')}
              testId="feature-linguaquest-locked"
            />
          )}
        </div>

        {/* CTA Banner */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="py-8 px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t('student:readyToStartLearning')}
            </h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              {t('student:enrollTodayUnlockFeatures')}
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8 py-6 text-lg"
              onClick={() => setLocation('/enroll')}
              data-testid="button-enroll-cta"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {t('student:enrollNow')}
              <ArrowRight className="ml-2 h-5 w-5" />
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
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-xl ${
        isUnlocked ? 'border-blue-200' : 'border-gray-200 relative overflow-hidden'
      }`}
      onClick={onClick}
      data-testid={testId}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/80 to-gray-200/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">Enroll to Unlock</p>
          </div>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              {title}
              {isUnlocked && <Unlock className="h-4 w-4 text-green-500" />}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {description}
            </p>
            <Button 
              variant={isUnlocked ? "default" : "outline"} 
              size="sm" 
              className="mt-4"
            >
              {isUnlocked ? 'Explore' : 'Learn More'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
