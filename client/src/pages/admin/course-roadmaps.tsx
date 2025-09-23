import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  BookOpen, 
  GraduationCap, 
  Plus,
  Edit,
  Trash,
  Target,
  Award,
  Route
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function CourseRoadmaps() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("levels");

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-course-roadmaps">
            {t('admin:courseRoadmaps', 'Course Roadmaps')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-course-roadmaps">
            {t('admin:courseRoadmapsDescription', 'Manage CEFR-based learning paths and course hierarchy (A1.1, A1.2, A2.1, etc.)')}
          </p>
        </div>
        <Button data-testid="button-create-roadmap">
          <Plus className="h-4 w-4 mr-2" />
          {t('admin:createRoadmap', 'Create Roadmap')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'].map((level) => (
          <Card key={level}>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <GraduationCap className="h-8 w-8 text-blue-500" />
                <p className="font-bold" data-testid={`level-${level.toLowerCase().replace('.', '-')}`}>{level}</p>
                <Badge variant="secondary" data-testid={`badge-level-${level.toLowerCase().replace('.', '-')}`}>
                  12 courses
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="levels" data-testid="tab-cefr-levels">
            <GraduationCap className="h-4 w-4 mr-2" />
            {t('admin:cefrLevels', 'CEFR Levels')}
          </TabsTrigger>
          <TabsTrigger value="pathways" data-testid="tab-learning-pathways">
            <Route className="h-4 w-4 mr-2" />
            {t('admin:learningPathways', 'Learning Pathways')}
          </TabsTrigger>
          <TabsTrigger value="prerequisites" data-testid="tab-prerequisites">
            <Target className="h-4 w-4 mr-2" />
            {t('admin:prerequisites', 'Prerequisites')}
          </TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">
            <Award className="h-4 w-4 mr-2" />
            {t('admin:achievements', 'Achievements')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-cefr-structure">
                {t('admin:cefrStructure', 'CEFR Level Structure')}
              </CardTitle>
              <CardDescription>
                {t('admin:cefrStructureDescription', 'Configure Common European Framework of Reference levels')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { level: 'A1.1', name: 'Beginner 1', courses: 8, color: 'bg-red-100 border-red-200' },
                    { level: 'A1.2', name: 'Beginner 2', courses: 10, color: 'bg-red-100 border-red-200' },
                    { level: 'A2.1', name: 'Elementary 1', courses: 12, color: 'bg-orange-100 border-orange-200' },
                    { level: 'A2.2', name: 'Elementary 2', courses: 14, color: 'bg-orange-100 border-orange-200' },
                    { level: 'B1.1', name: 'Intermediate 1', courses: 16, color: 'bg-yellow-100 border-yellow-200' },
                    { level: 'B1.2', name: 'Intermediate 2', courses: 18, color: 'bg-yellow-100 border-yellow-200' }
                  ].map((item) => (
                    <Card key={item.level} className={`${item.color} cursor-pointer hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg" data-testid={`level-title-${item.level.toLowerCase().replace('.', '-')}`}>
                            {item.level}
                          </h3>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-${item.level.toLowerCase().replace('.', '-')}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2" data-testid={`level-name-${item.level.toLowerCase().replace('.', '-')}`}>
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" data-testid={`course-count-${item.level.toLowerCase().replace('.', '-')}`}>
                            {item.courses} courses
                          </span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pathways" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-learning-pathways">
                {t('admin:learningPathwaysManagement', 'Learning Pathways Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:learningPathwaysDescription', 'Design structured learning paths with course sequences')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-pathways-empty">
                <Route className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:noPathwaysFound', 'No learning pathways configured. Create your first pathway to get started.')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prerequisites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-prerequisites">
                {t('admin:prerequisitesManagement', 'Prerequisites Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:prerequisitesDescription', 'Define course dependencies and skill requirements')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-completion-rate">{t('admin:minCompletionRate', 'Minimum Completion Rate (%)')}</Label>
                    <Input 
                      id="min-completion-rate" 
                      type="number" 
                      defaultValue="80" 
                      data-testid="input-min-completion-rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-assessment-score">{t('admin:minAssessmentScore', 'Minimum Assessment Score (%)')}</Label>
                    <Input 
                      id="min-assessment-score" 
                      type="number" 
                      defaultValue="75" 
                      data-testid="input-min-assessment-score"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-achievements">
                {t('admin:achievementsSystem', 'Achievements System')}
              </CardTitle>
              <CardDescription>
                {t('admin:achievementsDescription', 'Configure badges and certificates for course completion')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-achievements-empty">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:noAchievementsFound', 'No achievements configured. Set up badges and certificates.')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}