import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  File, 
  Copy, 
  Plus,
  Edit,
  Trash,
  Settings,
  Save,
  Loader2
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

interface RoadmapTemplate {
  id: number;
  title: string;
  targetLanguage: string;
  targetLevel: string;
  audience?: string;
  isActive: boolean;
  createdAt: string;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fa', label: 'فارسی' },
  { value: 'ar', label: 'العربية' },
];
const AUDIENCE_OPTIONS = ['adults', 'teens', 'kids', 'business', 'ielts', 'toefl', 'gre', 'pte', 'conversation'];

export default function RoadmapTemplates() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState("templates");
  const [templateFormData, setTemplateFormData] = useState({
    title: '',
    targetLanguage: 'en',
    targetLevel: 'B1',
    audience: '',
  });

  const { data: templates = [], isLoading } = useQuery<RoadmapTemplate[]>({
    queryKey: ['/api/roadmaps/templates'],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: typeof templateFormData) =>
      apiRequest('/api/roadmaps/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: t('admin:templateSaved', 'Template saved successfully') });
      queryClient.invalidateQueries({ queryKey: ['/api/roadmaps/templates'] });
      setTemplateFormData({ title: '', targetLanguage: 'en', targetLevel: 'B1', audience: '' });
      setSelectedTab('templates');
    },
    onError: (error: any) => {
      toast({ title: t('admin:errorSaving', 'Error saving template'), description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/roadmaps/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: t('admin:templateDeleted', 'Template deleted') });
      queryClient.invalidateQueries({ queryKey: ['/api/roadmaps/templates'] });
    },
    onError: () => {
      toast({ title: t('admin:errorDeleting', 'Failed to delete template'), variant: 'destructive' });
    },
  });

  const activeCount = templates.filter(t => t.isActive).length;

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-roadmap-templates">
            {t('admin:roadmapTemplates', 'Roadmap Templates')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-roadmap-templates">
            {t('admin:roadmapTemplatesDescription', 'Create and manage reusable learning roadmap templates')}
          </p>
        </div>
        <Button onClick={() => setSelectedTab('builder')} data-testid="button-create-template">
          <Plus className="h-4 w-4 me-2" />
          {t('admin:createTemplate', 'Create Template')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-total-templates-label">
                  {t('admin:totalTemplates', 'Total Templates')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-total-templates-value">
                  {isLoading ? '—' : templates.length}
                </p>
              </div>
              <File className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-active-templates-label">
                  {t('admin:activeTemplates', 'Active Templates')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-active-templates-value">
                  {isLoading ? '—' : activeCount}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-cefr-levels-label">
                  {t('admin:cefrLevels', 'CEFR Levels')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-cefr-levels-value">
                  {isLoading ? '—' : new Set(templates.map(t => t.targetLevel)).size}
                </p>
              </div>
              <Copy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" data-testid="tab-templates">
            <File className="h-4 w-4 me-2" />
            {t('admin:templates', 'Templates')}
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-template-builder">
            <Edit className="h-4 w-4 me-2" />
            {t('admin:templateBuilder', 'Template Builder')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-template-library">
                {t('admin:templateLibrary', 'Template Library')}
              </CardTitle>
              <CardDescription>
                {t('admin:templateLibraryDescription', 'Manage and organize your roadmap templates')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('admin:noTemplatesYet', 'No templates yet. Create your first roadmap template.')}</p>
                  <Button className="mt-4" onClick={() => setSelectedTab('builder')}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('admin:createTemplate', 'Create Template')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template, index) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm" data-testid={`template-name-${index}`}>
                            {template.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                            data-testid={`button-delete-template-${index}`}
                          >
                            <Trash className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs" data-testid={`template-level-${index}`}>
                            {template.targetLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs" data-testid={`template-lang-${index}`}>
                            {template.targetLanguage.toUpperCase()}
                          </Badge>
                          {template.audience && (
                            <Badge variant="secondary" className="text-xs" data-testid={`template-audience-${index}`}>
                              {template.audience}
                            </Badge>
                          )}
                        </div>
                        <Badge 
                          variant={template.isActive ? 'default' : 'secondary'}
                          data-testid={`template-status-${index}`}
                        >
                          {template.isActive ? t('common:active', 'Active') : t('common:inactive', 'Inactive')}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-template-builder">
                {t('admin:templateBuilderTool', 'Template Builder Tool')}
              </CardTitle>
              <CardDescription>
                {t('admin:templateBuilderDescription', 'Create new roadmap templates with CEFR level targeting')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-title">{t('admin:templateTitle', 'Template Title')}</Label>
                  <Input 
                    id="template-title" 
                    placeholder={t('admin:enterTemplateTitle', 'e.g., IELTS Academic Band 7+')}
                    value={templateFormData.title}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-template-name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('admin:targetLanguage', 'Target Language')}</Label>
                    <Select
                      value={templateFormData.targetLanguage}
                      onValueChange={(v) => setTemplateFormData(prev => ({ ...prev, targetLanguage: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('admin:targetLevel', 'CEFR Level')}</Label>
                    <Select
                      value={templateFormData.targetLevel}
                      onValueChange={(v) => setTemplateFormData(prev => ({ ...prev, targetLevel: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('admin:audience', 'Audience')}</Label>
                    <Select
                      value={templateFormData.audience}
                      onValueChange={(v) => setTemplateFormData(prev => ({ ...prev, audience: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:selectAudience', 'Select audience')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('admin:general', 'General')}</SelectItem>
                        {AUDIENCE_OPTIONS.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedTab('templates')}>
                    {t('common:cancel', 'Cancel')}
                  </Button>
                  <Button 
                    onClick={() => createTemplateMutation.mutate(templateFormData)}
                    disabled={createTemplateMutation.isPending || !templateFormData.title.trim()}
                    data-testid="button-save-template"
                  >
                    {createTemplateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 me-2" />
                    )}
                    {createTemplateMutation.isPending ? t('admin:saving', 'Saving...') : t('admin:saveTemplate', 'Save Template')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
