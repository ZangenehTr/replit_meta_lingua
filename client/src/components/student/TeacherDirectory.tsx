import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Star, 
  Users, 
  Award, 
  Languages, 
  Calendar,
  MessageCircle,
  Video,
  Clock
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

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

interface Props {
  teachers: Teacher[];
}

export function TeacherDirectory({ teachers }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = !selectedSpecialization || 
      teacher.specializations.includes(selectedSpecialization);
    
    const matchesLanguage = !selectedLanguage || 
      teacher.languages.includes(selectedLanguage);

    return matchesSearch && matchesSpecialization && matchesLanguage;
  });

  // Get unique specializations and languages for filters
  const allSpecializations = [...new Set(teachers.flatMap(t => t.specializations))];
  const allLanguages = [...new Set(teachers.flatMap(t => t.languages))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('student:meetOurTeachers')}
        </h2>
        <p className="text-gray-600">
          {t('student:expertLanguageInstructors')}
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('student:searchTeachers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-teachers"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-40">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  data-testid="select-specialization"
                >
                  <option value="">{t('student:allSpecializations')}</option>
                  {allSpecializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 min-w-40">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  data-testid="select-language"
                >
                  <option value="">{t('student:allLanguages')}</option>
                  {allLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                {/* Teacher Avatar and Basic Info */}
                <div className="text-center mb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-blue-100">
                    <AvatarImage src={teacher.profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg text-gray-900">
                    {teacher.firstName} {teacher.lastName}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700">
                      {teacher.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({teacher.totalStudents} {t('student:students')})
                    </span>
                  </div>
                </div>

                {/* Experience and Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {teacher.experience}+
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('student:yearsExperience')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {teacher.languages.length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('student:languages')}
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {teacher.specializations.slice(0, 3).map((spec, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-blue-100 text-blue-800"
                      >
                        {spec}
                      </Badge>
                    ))}
                    {teacher.specializations.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{teacher.specializations.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                    <Languages className="h-4 w-4" />
                    <span>{teacher.languages.join(', ')}</span>
                  </div>
                </div>

                {/* Bio Preview */}
                <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">
                  {teacher.bio || t('student:noTeacherBio')}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    data-testid={`button-book-trial-${teacher.id}`}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {t('student:bookTrialLesson')}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-view-profile-${teacher.id}`}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {t('student:viewProfile')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-contact-teacher-${teacher.id}`}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {t('student:contact')}
                    </Button>
                  </div>
                </div>

                {/* Availability indicator */}
                {teacher.availability.length > 0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <Clock className="h-3 w-3" />
                      <span>{t('student:availableToday')}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredTeachers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('student:noTeachersFound')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('student:tryAdjustingFilters')}
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialization('');
                setSelectedLanguage('');
              }}
              data-testid="button-clear-filters"
            >
              {t('student:clearFilters')}
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}