import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  DollarSign,
  BookOpen,
  Video,
  User,
  Trophy,
  Calendar,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { Course } from "@shared/schema";


interface Props {
  courses: Course[];
}

export function CourseCatalog({ courses }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    const matchesMode = !selectedMode || course.deliveryMode === selectedMode;
    
    let matchesPrice = true;
    if (priceRange) {
      const price = course.price;
      switch (priceRange) {
        case 'free':
          matchesPrice = price === 0;
          break;
        case 'low':
          matchesPrice = price > 0 && price <= 1000000;
          break;
        case 'mid':
          matchesPrice = price > 1000000 && price <= 3000000;
          break;
        case 'high':
          matchesPrice = price > 3000000;
          break;
      }
    }

    return matchesSearch && matchesLevel && matchesMode && matchesPrice;
  });

  const levels = ['beginner', 'intermediate', 'advanced'];
  const deliveryModes = ['online', 'in_person', 'self_paced'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('student:courseCatalog')}
        </h2>
        <p className="text-gray-600">
          {t('student:exploreLanguageCourses')}
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('student:searchCourses')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-courses"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  data-testid="select-level"
                >
                  <option value="">{t('student:allLevels')}</option>
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {t(`student:${level}`)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  data-testid="select-delivery-mode"
                >
                  <option value="">{t('student:allModes')}</option>
                  {deliveryModes.map(mode => (
                    <option key={mode} value={mode}>
                      {t(`student:${mode}`)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  data-testid="select-price-range"
                >
                  <option value="">{t('student:allPrices')}</option>
                  <option value="free">{t('student:free')}</option>
                  <option value="low">{t('student:under1M')}</option>
                  <option value="mid">1M - 3M {t('common:currency')}</option>
                  <option value="high">{t('student:over3M')}</option>
                </select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('');
                  setSelectedMode('');
                  setPriceRange('');
                }}
                data-testid="button-clear-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('student:clearFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {t('student:foundCourses', { count: filteredCourses.length })}
        </p>
        <div className="text-sm text-gray-600">
          {t('student:sortBy')}: {t('student:popularity')}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader className="p-0">
                {/* Course Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white text-gray-900 font-bold">
                      {course.price === 0 
                        ? t('student:free')
                        : `${course.price.toLocaleString()} ${t('common:currency')}`
                      }
                    </Badge>
                  </div>
                  
                  {/* Level Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      className={`font-bold ${
                        course.level === 'beginner' ? 'bg-green-500' :
                        course.level === 'intermediate' ? 'bg-yellow-500' :
                        'bg-red-500'
                      } text-white`}
                    >
                      {t(`student:${course.level}`)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Course Title and Rating */}
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{Number(course.rating).toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {t('student:newCourse')}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      {course.deliveryMode === 'online' ? (
                        <Video className="h-4 w-4 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-xs text-gray-600">
                        {t(`student:${course.deliveryMode}`)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Course Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{course.totalSessions} {t('student:sessions')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{course.sessionDuration} {t('student:minutes')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{t(`student:${course.classFormat}`)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.courseCode}</span>
                  </div>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {course.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{course.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    data-testid={`button-enroll-${course.id}`}
                  >
                    {course.price === 0 ? t('student:enrollFree') : t('student:enrollNow')}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-view-details-${course.id}`}
                    >
                      {t('student:viewDetails')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-trial-lesson-${course.id}`}
                    >
                      {t('student:trialLesson')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('student:noCoursesFound')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('student:tryAdjustingFilters')}
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('');
                setSelectedMode('');
                setPriceRange('');
              }}
              data-testid="button-clear-filters-no-results"
            >
              {t('student:clearFilters')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold mb-2">
            {t('student:cantFindRightCourse')}
          </h3>
          <p className="text-white/90 mb-4">
            {t('student:consultationDescription')}
          </p>
          <Button 
            size="lg" 
            className="bg-white text-purple-600 hover:bg-gray-50"
            data-testid="button-free-consultation"
          >
            <Trophy className="h-5 w-5 mr-2" />
            {t('student:freeConsultation')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}