import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  Target, 
  Users, 
  Clock, 
  Star, 
  Search, 
  Filter,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  BookOpen,
  Award,
  Video,
  UserCheck,
  Languages,
  Globe2,
  Brain,
  Trophy,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { TeacherDirectory } from "./TeacherDirectory";
import { TrialBookingInterface } from "./TrialBookingInterface";
import { CourseCatalog } from "./CourseCatalog";
import { ContactForm } from "./ContactForm";
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  specializations: string[];
  experience: number;
  rating: number;
  totalStudents: number;
  languages: string[];
  bio: string;
  availability: string[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  duration: string;
  price: number;
  thumbnail?: string;
  features: string[];
  instructorName: string;
  rating: number;
  studentsCount: number;
}

interface Props {
  enrollmentStatus: EnrollmentStatus | undefined;
  user: any;
}

export function NonEnrolledStudentDashboard({ enrollmentStatus, user }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const [activeSection, setActiveSection] = useState<'overview' | 'teachers' | 'courses' | 'trial' | 'contact'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch teachers
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/directory'],
    staleTime: 10 * 60 * 1000,
  });

  // Fetch available courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses/catalog'],
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 font-bold text-xl">{t('student:brand')}</h1>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
                    {t('student:prospectiveStudent')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button variant="outline" size="sm" data-testid="button-login">
                  {t('auth:login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="px-4 py-3 bg-white/20 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: t('student:overview'), icon: Globe2 },
            { id: 'teachers', label: t('student:teachers'), icon: Users },
            { id: 'courses', label: t('student:courses'), icon: BookOpen },
            { id: 'trial', label: t('student:trialLesson'), icon: Video },
            { id: 'contact', label: t('student:contact'), icon: MessageCircle },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeSection === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-700 hover:bg-white/50'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {activeSection === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16 border-3 border-white">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {t('student:welcomeProspective', { firstName: user?.firstName })}
                    </h2>
                    <p className="text-white/90">
                      {t('student:discoverLanguageLearning')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{teachers.length}+</div>
                    <div className="text-sm text-white/80">{t('student:expertTeachers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{courses.length}+</div>
                    <div className="text-sm text-white/80">{t('student:coursesAvailable')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-sm text-white/80">{t('student:supportAvailable')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">95%</div>
                    <div className="text-sm text-white/80">{t('student:successRate')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment CTA */}
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      {t('student:discoverYourLevel')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('student:freeAssessmentDescription')}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{t('student:tenMinutes')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        <span>{t('student:instantResults')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        <span>{t('student:personalizedPath')}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/mst">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8"
                      data-testid="button-start-assessment"
                    >
                      <Target className="h-5 w-5 mr-2" />
                      {t('student:startAssessment')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('teachers')}>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">{t('student:meetOurTeachers')}</h4>
                  <p className="text-sm text-gray-600">{t('student:exploreTeacherProfiles')}</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('trial')}>
                <CardContent className="p-6 text-center">
                  <Video className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">{t('student:bookTrialLesson')}</h4>
                  <p className="text-sm text-gray-600">{t('student:experienceOurTeaching')}</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('courses')}>
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">{t('student:browseCourses')}</h4>
                  <p className="text-sm text-gray-600">{t('student:findPerfectCourse')}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeSection === 'teachers' && (
          <TeacherDirectory teachers={teachers} />
        )}

        {activeSection === 'courses' && (
          <CourseCatalog courses={courses} />
        )}

        {activeSection === 'trial' && (
          <TrialBookingInterface teachers={teachers} />
        )}

        {activeSection === 'contact' && (
          <ContactForm />
        )}
      </div>
    </div>
  );
}