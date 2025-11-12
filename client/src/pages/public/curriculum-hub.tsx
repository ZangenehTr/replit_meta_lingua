import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  Briefcase,
  Users,
  Target,
  ArrowRight,
  Loader2,
  Award,
  Clock,
  Star
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface CurriculumCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function CurriculumHub() {
  const { t } = useTranslation(['common']);

  // Fetch active curriculum categories
  const { data: categories = [], isLoading } = useQuery<CurriculumCategory[]>({
    queryKey: ['/api/cms/curriculum-categories/active'],
  });

  // Fetch courses to count per category
  const { data: allCourses = [] } = useQuery<any[]>({
    queryKey: ['/api/courses'],
  });

  // Get icon component from lucide-react
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return BookOpen;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || BookOpen;
  };

  // Count courses per category
  const getCourseCount = (categoryId: number) => {
    return allCourses.filter(course => course.categoryId === categoryId).length;
  };

  return (
    <PublicLayout>
      <SEOHead
        title={t('curriculum.seoTitle', 'Our Courses - Meta Lingua Academy')}
        description={t('curriculum.seoDescription', 'Explore our comprehensive language learning programs including test preparation, conversation courses, business English, and specialized programs for all levels.')}
        keywords="language courses, English courses, test preparation, IELTS, TOEFL, business English, conversation English"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('curriculum.heroTitle', 'Explore Our Courses')}
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
              {t('curriculum.heroSubtitle', 'Choose from our expertly designed curriculum categories to achieve your language learning goals')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t('curriculum.certified', 'Certified Programs')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t('curriculum.expertInstructors', 'Expert Instructors')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t('curriculum.flexible', 'Flexible Schedule')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {t('curriculum.noCategories', 'No Course Categories Available')}
              </h3>
              <p className="text-muted-foreground">
                {t('curriculum.noCategoriesDesc', 'Check back soon for our upcoming course categories')}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  {t('curriculum.categoriesTitle', 'Course Categories')}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {t('curriculum.categoriesDesc', 'Browse our specialized programs designed to meet your specific learning objectives')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  const courseCount = getCourseCount(category.id);

                  return (
                    <Link key={category.id} href={`/curriculum/${category.slug}`}>
                      <Card 
                        className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50"
                        data-testid={`card-curriculum-category-${category.slug}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <IconComponent className="h-8 w-8 text-primary" />
                            </div>
                            {courseCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {courseCount} {courseCount === 1 ? t('curriculum.course', 'Course') : t('curriculum.courses', 'Courses')}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {category.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm mb-4 line-clamp-3">
                            {category.description || t('curriculum.noDescription', 'Explore courses in this category')}
                          </CardDescription>
                          <Button 
                            variant="ghost" 
                            className="w-full group-hover:bg-primary/10"
                            data-testid={`button-view-category-${category.slug}`}
                          >
                            {t('curriculum.viewCourses', 'View Courses')}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Target className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            {t('curriculum.ctaTitle', 'Not Sure Which Course is Right for You?')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('curriculum.ctaDesc', 'Take our free placement test to get personalized course recommendations')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2" data-testid="button-placement-test">
              <Link href="/take-test">
                <a className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  {t('curriculum.takePlacementTest', 'Take Placement Test')}
                </a>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2" data-testid="button-contact">
              <Link href="/contact">
                <a className="flex items-center gap-2">
                  {t('curriculum.contactUs', 'Contact Us')}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
