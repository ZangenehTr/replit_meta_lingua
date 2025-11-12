import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Award,
  TrendingUp,
  Calendar,
  Video,
  CheckCircle
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

interface Course {
  id: number;
  title: string;
  description: string | null;
  level: string | null;
  price: number | null;
  duration: number | null;
  totalLessons: number | null;
  categoryId: number | null;
  isActive: boolean;
  isFeatured: boolean;
  thumbnail: string | null;
}

export default function CurriculumCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation(['common']);

  // Fetch category by slug
  const { data: category, isLoading: categoryLoading } = useQuery<CurriculumCategory>({
    queryKey: ['/api/cms/curriculum-categories/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/cms/curriculum-categories/slug/${slug}`);
      if (!response.ok) throw new Error('Category not found');
      return response.json();
    },
    enabled: !!slug
  });

  // Fetch all courses
  const { data: allCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Filter courses by category
  const categoryCourses = allCourses.filter(
    course => course.categoryId === category?.id && course.isActive
  );

  // Get icon component from lucide-react
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return BookOpen;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || BookOpen;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return t('curriculum.free', 'Free');
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getLevelColor = (level: string | null) => {
    const levelMap: Record<string, string> = {
      'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'All Levels': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return levelMap[level || ''] || levelMap['All Levels'];
  };

  if (categoryLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!category) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('curriculum.categoryNotFound', 'Category Not Found')}</h2>
            <p className="text-muted-foreground mb-6">{t('curriculum.categoryNotFoundDesc', 'The requested category does not exist')}</p>
            <Link href="/curriculum">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('curriculum.backToCurriculum', 'Back to Curriculum')}
              </Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const IconComponent = getIconComponent(category.icon);

  return (
    <PublicLayout>
      <SEOHead
        title={`${category.name} - Meta Lingua Academy`}
        description={category.description || `Explore our ${category.name} courses and programs`}
        keywords={`${category.name}, language courses, language learning, Meta Lingua`}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href="/curriculum">
            <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back-to-curriculum">
              <ArrowLeft className="h-4 w-4" />
              {t('curriculum.backToCurriculum', 'Back to Curriculum')}
            </Button>
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
              <IconComponent className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {category.name}
                </span>
              </h1>
              {category.description && (
                <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
                  {category.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">
                    {categoryCourses.length} {categoryCourses.length === 1 ? t('curriculum.course', 'Course') : t('curriculum.courses', 'Courses')}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{t('curriculum.certified', 'Certified Programs')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {coursesLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : categoryCourses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {t('curriculum.noCourses', 'No Courses Available')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('curriculum.noCoursesDesc', 'Check back soon for new courses in this category')}
              </p>
              <Link href="/contact">
                <Button variant="outline">
                  {t('curriculum.contactForInfo', 'Contact Us for More Information')}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {t('curriculum.availableCourses', 'Available Courses')}
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {categoryCourses.length} {categoryCourses.length === 1 ? t('curriculum.result', 'Result') : t('curriculum.results', 'Results')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryCourses.map((course) => (
                  <Card 
                    key={course.id}
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    data-testid={`card-course-${course.id}`}
                  >
                    {course.thumbnail && (
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {course.isFeatured && (
                          <Badge className="absolute top-3 right-3 gap-1">
                            <Star className="h-3 w-3" />
                            {t('curriculum.featured', 'Featured')}
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg line-clamp-2 flex-1">
                          {course.title}
                        </CardTitle>
                      </div>
                      {course.level && (
                        <Badge className={`w-fit ${getLevelColor(course.level)}`}>
                          {course.level}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      {course.description && (
                        <CardDescription className="text-sm mb-4 line-clamp-2">
                          {course.description}
                        </CardDescription>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        {course.duration && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration} {t('curriculum.minutes', 'minutes')}</span>
                          </div>
                        )}
                        {course.totalLessons && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Video className="h-4 w-4" />
                            <span>{course.totalLessons} {t('curriculum.lessons', 'lessons')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(course.price)}
                        </span>
                        <Button 
                          size="sm" 
                          className="gap-2"
                          data-testid={`button-view-course-${course.id}`}
                        >
                          {t('curriculum.viewCourse', 'View Course')}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            {t('curriculum.readyToStart', 'Ready to Start Learning?')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('curriculum.readyToStartDesc', 'Join thousands of students already learning with Meta Lingua Academy')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2" data-testid="button-enroll">
              <Link href="/contact">
                <a className="flex items-center gap-2">
                  {t('curriculum.enrollNow', 'Enroll Now')}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2" data-testid="button-placement-test-cta">
              <Link href="/take-test">
                <a className="flex items-center gap-2">
                  {t('curriculum.takePlacementTest', 'Take Placement Test')}
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
