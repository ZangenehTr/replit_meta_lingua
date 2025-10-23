import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Plus, 
  Edit, 
  Trash,
  Settings,
  FileText,
  Timer,
  BookOpen,
  Target,
  Brain
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function MSTTestBuilder() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("tests");

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-mst-test-builder">
            {t('admin:mstTestBuilder', 'MST Test Builder')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-mst-test-builder">
            {t('admin:mstTestBuilderDescription', 'Create and manage MST placement tests with AI-powered question generation')}
          </p>
        </div>
        <Button data-testid="button-create-new-test">
          <Plus className="h-4 w-4 mr-2" />
          {t('admin:createNewTest', 'Create New Test')}
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests" data-testid="tab-tests">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {t('admin:tests', 'Tests')}
          </TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">
            <FileText className="h-4 w-4 mr-2" />
            {t('admin:questions', 'Questions')}
          </TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills">
            <Target className="h-4 w-4 mr-2" />
            {t('admin:skills', 'Skills')}
          </TabsTrigger>
          <TabsTrigger value="ai-generation" data-testid="tab-ai-generation">
            <Brain className="h-4 w-4 mr-2" />
            {t('admin:aiGeneration', 'AI Generation')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-test-management">
                {t('admin:testManagement', 'Test Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:testManagementDescription', 'Manage existing MST tests and create new ones')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-8" data-testid="status-no-tests">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin:noTestsFound', 'No MST tests found. Create your first test to get started.')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-question-bank">
                {t('admin:questionBank', 'Question Bank')}
              </CardTitle>
              <CardDescription>
                {t('admin:questionBankDescription', 'Manage test questions for different skills and levels')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-8" data-testid="status-no-questions">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin:noQuestionsFound', 'No questions found. Add questions to build your test bank.')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-skill-configuration">
                {t('admin:skillConfiguration', 'Skill Configuration')}
              </CardTitle>
              <CardDescription>
                {t('admin:skillConfigDescription', 'Configure skill assessment parameters and CEFR levels')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="listening-weight">{t('admin:listeningWeight', 'Listening Weight')}</Label>
                    <Input id="listening-weight" type="number" defaultValue="25" data-testid="input-listening-weight" />
                  </div>
                  <div>
                    <Label htmlFor="reading-weight">{t('admin:readingWeight', 'Reading Weight')}</Label>
                    <Input id="reading-weight" type="number" defaultValue="25" data-testid="input-reading-weight" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="speaking-weight">{t('admin:speakingWeight', 'Speaking Weight')}</Label>
                    <Input id="speaking-weight" type="number" defaultValue="25" data-testid="input-speaking-weight" />
                  </div>
                  <div>
                    <Label htmlFor="writing-weight">{t('admin:writingWeight', 'Writing Weight')}</Label>
                    <Input id="writing-weight" type="number" defaultValue="25" data-testid="input-writing-weight" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-ai-generation">
                {t('admin:aiQuestionGeneration', 'AI Question Generation')}
              </CardTitle>
              <CardDescription>
                {t('admin:aiGenerationDescription', 'Use AI to automatically generate test questions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-gray-500 py-8" data-testid="status-ai-generation-ready">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin:aiGenerationReady', 'AI question generation is ready. Configure parameters and start generating.')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}