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
  File, 
  Copy, 
  Plus,
  Edit,
  Trash,
  Settings,
  Download,
  Upload,
  Save
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function RoadmapTemplates() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("templates");

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
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
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-import-template">
            <Upload className="h-4 w-4 mr-2" />
            {t('admin:importTemplate', 'Import')}
          </Button>
          <Button data-testid="button-create-template">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin:createTemplate', 'Create Template')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-total-templates-label">
                  {t('admin:totalTemplates', 'Total Templates')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-total-templates-value">12</p>
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
                <p className="text-2xl font-bold" data-testid="metric-active-templates-value">8</p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-template-instances-label">
                  {t('admin:templateInstances', 'Template Instances')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-template-instances-value">45</p>
              </div>
              <Copy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" data-testid="tab-templates">
            <File className="h-4 w-4 mr-2" />
            {t('admin:templates', 'Templates')}
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <Settings className="h-4 w-4 mr-2" />
            {t('admin:categories', 'Categories')}
          </TabsTrigger>
          <TabsTrigger value="builder" data-testid="tab-template-builder">
            <Edit className="h-4 w-4 mr-2" />
            {t('admin:templateBuilder', 'Template Builder')}
          </TabsTrigger>
          <TabsTrigger value="import-export" data-testid="tab-import-export">
            <Download className="h-4 w-4 mr-2" />
            {t('admin:importExport', 'Import/Export')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'General English', category: 'Language', instances: 12, status: 'Active' },
                  { name: 'Business English', category: 'Professional', instances: 8, status: 'Active' },
                  { name: 'IELTS Preparation', category: 'Test Prep', instances: 15, status: 'Active' },
                  { name: 'Conversation Skills', category: 'Speaking', instances: 6, status: 'Draft' }
                ].map((template, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm" data-testid={`template-name-${index}`}>
                          {template.name}
                        </h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-template-${index}`}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-copy-template-${index}`}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2" data-testid={`template-category-${index}`}>
                        {template.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" data-testid={`template-instances-${index}`}>
                          {template.instances} instances
                        </span>
                        <Badge 
                          variant={template.status === 'Active' ? 'default' : 'secondary'}
                          data-testid={`template-status-${index}`}
                        >
                          {template.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-template-categories">
                {t('admin:templateCategories', 'Template Categories')}
              </CardTitle>
              <CardDescription>
                {t('admin:templateCategoriesDescription', 'Organize templates by subject and skill focus')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'General Language', templates: 5, color: 'bg-blue-50 border-blue-200' },
                    { name: 'Professional English', templates: 3, color: 'bg-green-50 border-green-200' },
                    { name: 'Test Preparation', templates: 2, color: 'bg-yellow-50 border-yellow-200' },
                    { name: 'Conversation Skills', templates: 2, color: 'bg-purple-50 border-purple-200' }
                  ].map((category, index) => (
                    <Card key={index} className={`${category.color}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold" data-testid={`category-name-${index}`}>
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-600" data-testid={`category-count-${index}`}>
                              {category.templates} templates
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-category-${index}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
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
                {t('admin:templateBuilderDescription', 'Create new templates with drag-and-drop interface')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">{t('admin:templateName', 'Template Name')}</Label>
                  <Input 
                    id="template-name" 
                    placeholder={t('admin:enterTemplateName', 'Enter template name')}
                    data-testid="input-template-name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">{t('admin:templateDescription', 'Description')}</Label>
                  <Input 
                    id="template-description" 
                    placeholder={t('admin:enterTemplateDescription', 'Describe the template purpose')}
                    data-testid="input-template-description"
                  />
                </div>
                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg" data-testid="template-builder-canvas">
                  <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin:templateBuilderReady', 'Template builder canvas - drag components here')}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" data-testid="button-preview-template">
                    {t('admin:preview', 'Preview')}
                  </Button>
                  <Button data-testid="button-save-template">
                    <Save className="h-4 w-4 mr-2" />
                    {t('admin:saveTemplate', 'Save Template')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle data-testid="card-title-import-templates">
                  <Upload className="h-5 w-5 mr-2 inline" />
                  {t('admin:importTemplates', 'Import Templates')}
                </CardTitle>
                <CardDescription>
                  {t('admin:importTemplatesDescription', 'Import templates from JSON files')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center" data-testid="import-drop-zone">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">{t('admin:dropFilesHere', 'Drop JSON files here or click to browse')}</p>
                  </div>
                  <Button className="w-full" data-testid="button-import-files">
                    {t('admin:selectFiles', 'Select Files to Import')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle data-testid="card-title-export-templates">
                  <Download className="h-5 w-5 mr-2 inline" />
                  {t('admin:exportTemplates', 'Export Templates')}
                </CardTitle>
                <CardDescription>
                  {t('admin:exportTemplatesDescription', 'Export templates as JSON files')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t('admin:selectTemplatesToExport', 'Select templates to export:')}</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {['General English', 'Business English', 'IELTS Preparation', 'Conversation Skills'].map((template, index) => (
                        <label key={index} className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked data-testid={`checkbox-export-${index}`} />
                          <span className="text-sm">{template}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" data-testid="button-export-selected">
                    <Download className="h-4 w-4 mr-2" />
                    {t('admin:exportSelected', 'Export Selected')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}