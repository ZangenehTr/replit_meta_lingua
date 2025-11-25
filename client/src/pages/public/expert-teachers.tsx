import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Globe, Clock, Users, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Teacher {
  id: number;
  name: string;
  bio?: string;
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number;
  specializations?: string[];
  photo?: string;
  availability?: string;
}

export default function ExpertTeachersPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['expert-teachers'],
    queryFn: async () => {
      const res = await fetch('/api/teachers/directory');
      if (!res.ok) throw new Error('Failed to fetch teachers');
      return res.json();
    },
  });

  useEffect(() => {
    if (!teachers) return;

    let filtered = [...teachers];

    if (selectedLanguage !== 'all') {
      filtered = filtered.filter((t: Teacher) =>
        t.languages?.some(lang => lang.toLowerCase().includes(selectedLanguage.toLowerCase()))
      );
    }

    if (sortBy === 'rating') {
      filtered.sort((a: Teacher, b: Teacher) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price') {
      filtered.sort((a: Teacher, b: Teacher) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    }

    setFilteredTeachers(filtered);
  }, [teachers, selectedLanguage, sortBy]);

  const uniqueLanguages = teachers
    ? Array.from(new Set(teachers.flatMap((t: Teacher) => t.languages || [])))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:backToHome', 'Back to Home')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('common:expertTeachers.title', 'Expert Teachers')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common:expertTeachers.subtitle', 'Connect with professional language teachers from around the world')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common:expertTeachers.filterLanguage', 'Filter by Language')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{t('common:all', 'All Languages')}</option>
                {uniqueLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common:expertTeachers.sortBy', 'Sort By')}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="rating">{t('common:expertTeachers.highestRated', 'Highest Rated')}</option>
                <option value="price">{t('common:expertTeachers.lowestPrice', 'Lowest Price')}</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('common:expertTeachers.showing', 'Showing')} <span className="font-bold text-gray-900 dark:text-white">{filteredTeachers.length}</span> {t('common:expertTeachers.teachers', 'teachers')}
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher: Teacher) => (
              <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{teacher.name}</CardTitle>
                      {teacher.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(teacher.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({teacher.reviewCount || 0})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {teacher.bio && (
                    <CardDescription className="line-clamp-2">{teacher.bio}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Languages */}
                  {teacher.languages && teacher.languages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-2 text-sm font-medium">
                        <Globe className="h-4 w-4" />
                        {t('common:expertTeachers.languages', 'Languages')}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teacher.languages.map(lang => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specializations */}
                  {teacher.specializations && teacher.specializations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-2 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        {t('common:expertTeachers.specializations', 'Specializations')}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teacher.specializations.slice(0, 3).map(spec => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability and Price */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {teacher.availability && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">{teacher.availability}</span>
                      </div>
                    )}
                    {teacher.hourlyRate && (
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${teacher.hourlyRate}/hr
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button className="w-full mt-4" variant="default">
                    {t('common:expertTeachers.bookLesson', 'Book Lesson')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('common:expertTeachers.noTeachers', 'No Teachers Found')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common:expertTeachers.tryDifferentFilters', 'Try adjusting your filters')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
