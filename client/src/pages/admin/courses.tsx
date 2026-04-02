import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/services/endpoints";
import { formatCurrency } from "@/lib/utils";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Users,
  Star,
  Upload,
  Loader2
} from "lucide-react";
import DynamicForm from "@/components/forms/DynamicForm";

interface FormDefinition {
  id: number;
  title: string;
  fields: any[];
  [key: string]: any;
}

// Create Course Dialog Component
type SubLevelItem = { id: number; code: string; name: string };
type ExamTagItem = { id: number; name: string; code: string; is_active: boolean };

const SKILL_SCOPE_OPTIONS = [
  { value: '', label: 'All skills' },
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'writing', label: 'Writing' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'quantitative_only', label: 'Quantitative only (GRE/GMAT)' },
];

function SubLevelConfigSection({
  minSubLevelCode, setMinSubLevelCode,
  maxSubLevelCode, setMaxSubLevelCode,
  selectedExamTagIds, setSelectedExamTagIds,
  skillScope, setSkillScope,
  subLevels,
  examTags,
}: {
  minSubLevelCode: string; setMinSubLevelCode: (v: string) => void;
  maxSubLevelCode: string; setMaxSubLevelCode: (v: string) => void;
  selectedExamTagIds: number[]; setSelectedExamTagIds: (v: number[]) => void;
  skillScope: string; setSkillScope: (v: string) => void;
  subLevels: SubLevelItem[];
  examTags: ExamTagItem[];
}) {
  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <p className="text-sm font-semibold text-gray-700">Smart Discovery Settings</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Min Sub-Level</label>
          <Select value={minSubLevelCode} onValueChange={setMinSubLevelCode}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="No minimum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No minimum</SelectItem>
              {subLevels.map((sl) => (
                <SelectItem key={sl.id} value={sl.code}>{sl.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Max Sub-Level</label>
          <Select value={maxSubLevelCode} onValueChange={setMaxSubLevelCode}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="No maximum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No maximum</SelectItem>
              {subLevels.map((sl) => (
                <SelectItem key={sl.id} value={sl.code}>{sl.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Skill Scope</label>
        <Select value={skillScope} onValueChange={setSkillScope}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="All skills" />
          </SelectTrigger>
          <SelectContent>
            {SKILL_SCOPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Exam Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {examTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                setSelectedExamTagIds(
                  selectedExamTagIds.includes(tag.id)
                    ? selectedExamTagIds.filter((id) => id !== tag.id)
                    : [...selectedExamTagIds, tag.id]
                );
              }}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                selectedExamTagIds.includes(tag.id)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateCourseDialog({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation(['admin', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [minSubLevelCode, setMinSubLevelCode] = useState('');
  const [maxSubLevelCode, setMaxSubLevelCode] = useState('');
  const [selectedExamTagIds, setSelectedExamTagIds] = useState<number[]>([]);
  const [skillScope, setSkillScope] = useState('');

  // Fetch Course Creation form definition (Form ID 10)
  const { data: formDefinition, isLoading: formLoading } = useQuery<FormDefinition>({
    queryKey: ['/api/forms', 10],
    enabled: isOpen
  });

  // Fetch curriculum categories for the selector
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/cms/curriculum-categories'],
    enabled: isOpen
  });

  // Fetch sub-levels
  const { data: subLevelsRaw = [] } = useQuery<SubLevelItem[]>({
    queryKey: ['/api/curriculum-sublevels'],
    staleTime: 10 * 60 * 1000,
    enabled: isOpen,
  });
  const subLevels: SubLevelItem[] = Array.isArray(subLevelsRaw) ? subLevelsRaw : [];

  // Fetch exam tags
  const { data: examTagsRaw = [] } = useQuery<ExamTagItem[]>({
    queryKey: ['/api/courses/exam-tags'],
    staleTime: 10 * 60 * 1000,
    enabled: isOpen,
  });
  const examTags: ExamTagItem[] = (Array.isArray(examTagsRaw) ? examTagsRaw : []).filter((tg) => tg.is_active !== false);

  const createCourseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest(API_ENDPOINTS.admin.courses, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : null,
          minSubLevelCode: minSubLevelCode || null,
          maxSubLevelCode: maxSubLevelCode || null,
          examTagIds: selectedExamTagIds,
          skillScope: skillScope || null,
        })
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:courses.createdSuccessfully') });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.courses] });
      setIsOpen(false);
      setSelectedCategoryId(null);
      setMinSubLevelCode('');
      setMaxSubLevelCode('');
      setSelectedExamTagIds([]);
      setSkillScope('');
    },
    onError: (error: Error) => {
      console.error('Error creating course:', error);
      toast({ 
        title: t('admin:courses.failedToCreate'), 
        description: error.message || t('common:errors.unknownError'),
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    return createCourseMutation.mutateAsync(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" data-testid="button-create-course">
          <Plus className="h-4 w-4" />
          {t('admin:courses.createCourse')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin:courses.createNewCourse')}</DialogTitle>
          <DialogDescription>
            {t('admin:courses.createCourseDescription')}
          </DialogDescription>
        </DialogHeader>
        
        {formLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : formDefinition ? (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                {t('admin:courses.category')}
              </label>
              <Select value={selectedCategoryId || ''} onValueChange={setSelectedCategoryId}>
                <SelectTrigger data-testid="select-course-category">
                  <SelectValue placeholder={t('admin:courses.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t('admin:courses.noCategory', 'No Category')}
                  </SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DynamicForm
              formDefinition={formDefinition}
              onSubmit={handleSubmit}
              disabled={createCourseMutation.isPending}
              showTitle={false}
            />
            <SubLevelConfigSection
              minSubLevelCode={minSubLevelCode}
              setMinSubLevelCode={setMinSubLevelCode}
              maxSubLevelCode={maxSubLevelCode}
              setMaxSubLevelCode={setMaxSubLevelCode}
              selectedExamTagIds={selectedExamTagIds}
              setSelectedExamTagIds={setSelectedExamTagIds}
              skillScope={skillScope}
              setSkillScope={setSkillScope}
              subLevels={subLevels}
              examTags={examTags}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {t('admin:courses.cancel')}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            {t('common:formNotFound', 'Form definition not found')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type CourseRecord = {
  id: number;
  title: string;
  categoryId?: number;
  min_sub_level_code?: string;
  max_sub_level_code?: string;
  exam_tag_ids?: number[];
  skill_scope?: string;
  [key: string]: unknown;
};

type CategoryItem = { id: number; name: string };

// Edit Course Dialog Component
function EditCourseDialog({ course, onClose, queryClient }: { course: CourseRecord, onClose: () => void, queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    course.categoryId ? course.categoryId.toString() : null
  );

  // Sub-level config state
  const [minSubLevelCode, setMinSubLevelCode] = useState<string>(course.min_sub_level_code ?? '');
  const [maxSubLevelCode, setMaxSubLevelCode] = useState<string>(course.max_sub_level_code ?? '');
  const [selectedExamTagIds, setSelectedExamTagIds] = useState<number[]>(Array.isArray(course.exam_tag_ids) ? course.exam_tag_ids : []);
  const [skillScope, setSkillScope] = useState<string>(course.skill_scope ?? '');

  // Fetch Course Creation form definition (Form ID 10) - same form used for editing
  const { data: formDefinition, isLoading: formLoading } = useQuery<FormDefinition>({
    queryKey: ['/api/forms', 10]
  });

  // Fetch curriculum categories for the selector
  const { data: categoriesRaw } = useQuery<CategoryItem[]>({
    queryKey: ['/api/cms/curriculum-categories']
  });
  const categories: CategoryItem[] = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  // Fetch sub-levels for range selectors
  const { data: subLevelsRaw = [] } = useQuery<SubLevelItem[]>({
    queryKey: ['/api/curriculum-sublevels'],
    staleTime: 10 * 60 * 1000,
  });
  const subLevels: SubLevelItem[] = Array.isArray(subLevelsRaw) ? subLevelsRaw : [];

  // Fetch exam tags
  const { data: examTagsRaw = [] } = useQuery<ExamTagItem[]>({
    queryKey: ['/api/courses/exam-tags'],
    staleTime: 10 * 60 * 1000,
  });
  const examTags: ExamTagItem[] = (Array.isArray(examTagsRaw) ? examTagsRaw : []).filter((tg) => tg.is_active !== false);

  // Sub-level config save mutation
  const subLevelConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/admin/courses/${course.id}/sublevel-config`, {
        method: 'PATCH',
        body: JSON.stringify({ minSubLevelCode: minSubLevelCode || null, maxSubLevelCode: maxSubLevelCode || null, examTagIds: selectedExamTagIds, skillScope: skillScope || null }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Sub-level config saved', description: 'Course prerequisite settings updated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save sub-level config', variant: 'destructive' });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest(`${API_ENDPOINTS.admin.courses}/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : null })
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:courses.updatedSuccessfully') });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.courses] });
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: t('admin:courses.updateFailed'), 
        description: error?.message || t('admin:courses.updateError'),
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = async (data: Record<string, any>) => {
    return updateCourseMutation.mutateAsync(data);
  };

  // Prepare initial values from the course object
  const initialValues = {
    title: course.title || "",
    description: course.description || "",
    category: course.category || "Language Learning",
    language: course.language || "English",
    level: course.level || "Beginner",
    isActive: course.isActive !== undefined ? course.isActive : true
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto" role="dialog">
        <DialogHeader>
          <DialogTitle>{t('admin:courses.editCourse')}</DialogTitle>
          <DialogDescription>{t('admin:courses.editCourseDescription')}</DialogDescription>
        </DialogHeader>
        
        {formLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : formDefinition ? (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                {t('admin:courses.category')}
              </label>
              <Select value={selectedCategoryId || ''} onValueChange={setSelectedCategoryId}>
                <SelectTrigger data-testid="select-course-category-edit">
                  <SelectValue placeholder={t('admin:courses.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t('admin:courses.noCategory', 'No Category')}
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DynamicForm
              formDefinition={formDefinition}
              onSubmit={handleSubmit}
              initialValues={initialValues}
              disabled={updateCourseMutation.isPending}
              showTitle={false}
            />

            <SubLevelConfigSection
              minSubLevelCode={minSubLevelCode}
              setMinSubLevelCode={setMinSubLevelCode}
              maxSubLevelCode={maxSubLevelCode}
              setMaxSubLevelCode={setMaxSubLevelCode}
              selectedExamTagIds={selectedExamTagIds}
              setSelectedExamTagIds={setSelectedExamTagIds}
              skillScope={skillScope}
              setSkillScope={setSkillScope}
              subLevels={subLevels}
              examTags={examTags}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={subLevelConfigMutation.isPending}
              onClick={() => subLevelConfigMutation.mutate()}
              className="w-full text-xs mt-2"
            >
              {subLevelConfigMutation.isPending ? 'Saving…' : 'Save Discovery Settings'}
            </Button>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('admin:courses.cancel')}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            {t('common:formNotFound', 'Form definition not found')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// View Course Dialog Component  
function ViewCourseDialog({ course, onClose }: { course: any, onClose: () => void }) {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto" role="dialog">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>{t('admin:courses.courseDetails')}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.category')}</label>
              <p className="text-sm text-gray-900">{course.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.language')}</label>
              <p className="text-sm text-gray-900">{course.language}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.level')}</label>
              <p className="text-sm text-gray-900">{course.level}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.status')}</label>
              <Badge className={course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {course.isActive ? t('admin:courses.active') : t('admin:courses.inactive')}
              </Badge>
            </div>
          </div>
          
          {course.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.description')}</label>
              <p className="text-sm text-gray-900 mt-1">{course.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.createdAt')}</label>
              <p className="text-sm text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.updatedAt')}</label>
              <p className="text-sm text-gray-900">{new Date(course.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>
            {t('common:close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCourses() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [viewingCourse, setViewingCourse] = useState<any>(null);

  // Fetch courses data - simplified query without parameters
  const { data: courses, isLoading, isError, error } = useQuery({
    queryKey: [API_ENDPOINTS.admin.courses],
    enabled: !!user && ['admin', 'Admin', 'supervisor', 'Supervisor'].some(role => role.toLowerCase() === user?.role?.toLowerCase()),
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) {
        console.error('Authentication error, not retrying:', error?.status);
        return false;
      }
      return failureCount < 3;
    }
  });
  
  const courseData = Array.isArray(courses) ? courses : [];

  const filteredCourses = courseData.filter((course: any) => {
    const matchesSearch = !searchTerm || 
                         course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === "all" || course.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading courses: {error?.message || 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:courses.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin:courses.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Course
          </Button>
          <CreateCourseDialog queryClient={queryClient} />
        </div>
      </div>

      {/* Search and Filters - Mobile First */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 rtl:end-3 rtl:start-auto top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('admin:courses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-10 rtl:ps-3 rtl:pe-10 w-full"
          />
        </div>
        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 ms-2 rtl:me-2 rtl:ms-0" />
            <SelectValue placeholder={t('admin:courses.allLanguages')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:courses.allLanguages')}</SelectItem>
            <SelectItem value="Persian">{t('admin:courses.persian')}</SelectItem>
            <SelectItem value="English">{t('admin:courses.english')}</SelectItem>
            <SelectItem value="Arabic">{t('admin:courses.arabic')}</SelectItem>
            <SelectItem value="French">{t('admin:courses.french')}</SelectItem>
            <SelectItem value="Spanish">{t('admin:courses.spanish')}</SelectItem>
            <SelectItem value="German">{t('admin:courses.german')}</SelectItem>
            <SelectItem value="Chinese">{t('admin:courses.chinese')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCourses.map((course: any) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{course.instructor}</p>
                </div>
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('admin:courses.level')}:</span>
                  <Badge className={`ms-2 ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">{t('admin:courses.duration')}:</span>
                  <span className="ms-2 font-medium">{course.duration}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('admin:courses.students')}:</span>
                  <span className="ms-2 font-bold">{course.enrolledStudents || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('admin:courses.rating')}:</span>
                  <span className="ms-2 font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {course.rating || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-2">
                <div className="text-lg font-bold">
                  {formatCurrency(course.price || 0, 'IRR')}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1"
                    onClick={() => setViewingCourse(course)}
                    data-testid={`view-course-${course.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common:view')}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1"
                    onClick={() => setEditingCourse(course)}
                    data-testid={`edit-course-${course.id}`}
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common:edit')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Course Dialog */}
      {editingCourse && (
        <EditCourseDialog 
          course={editingCourse} 
          onClose={() => setEditingCourse(null)} 
          queryClient={queryClient} 
        />
      )}

      {/* View Course Dialog */}
      {viewingCourse && (
        <ViewCourseDialog 
          course={viewingCourse} 
          onClose={() => setViewingCourse(null)} 
        />
      )}

      {/* Statistics Summary - Mobile First */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.totalCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{Array.isArray(courseData) ? courseData.length : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin:courses.totalDesc')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.activeCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {Array.isArray(courseData) ? courseData.filter((c: any) => c.status === 'active').length : 0}
            </div>
            <p className="text-xs text-green-600">{t('admin:courses.currentlyAvailable')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.categories')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {Array.isArray(courseData) ? new Set(courseData.map((c: any) => c.category)).size : 0}
            </div>
            <p className="text-xs text-blue-600">{t('admin:courses.uniqueCategories')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.courseRevenue')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(Array.isArray(courseData) ? courseData.reduce((sum: number, course: any) => sum + (course.price || 0), 0) : 0, 'IRR')}
            </div>
            <p className="text-xs text-green-600">{t('admin:courses.totalPotential')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}