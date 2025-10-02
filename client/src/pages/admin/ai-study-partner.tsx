import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  BarChart3,
  Brain,
  Users,
  Zap,
  MessageCircle,
  Play,
  Pause
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function AIStudyPartner() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';
  const { toast } = useToast();

  const [selectedTab, setSelectedTab] = useState("configuration");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testPrompt, setTestPrompt] = useState("");
  const [testResponse, setTestResponse] = useState("");

  // Test AI mutation
  const testAIMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const data = await apiRequest("/api/ollama/generate", {
        method: "POST",
        body: {
          prompt,
          model: "llama3.2:3b",
          stream: false
        }
      });
      return data;
    },
    onSuccess: (data) => {
      setTestResponse(data.response || "No response");
      toast({
        title: "AI Test Successful",
        description: "AI responded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Test Failed",
        description: error.message || "Failed to get AI response",
        variant: "destructive"
      });
      setTestResponse("Error: " + (error.message || "Failed to get response"));
    }
  });

  const handleTestAI = () => {
    if (!testPrompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a test prompt",
        variant: "destructive"
      });
      return;
    }
    testAIMutation.mutate(testPrompt);
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-ai-study-partner">
            {t('admin:aiStudyPartner', 'AI Study Partner')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-ai-study-partner">
            {t('admin:aiStudyPartnerDescription', 'Configure and manage the AI-powered conversational study assistant')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" data-testid="badge-ai-status">
            <Bot className="h-4 w-4 mr-1" />
            {t('admin:aiOnline', 'AI Online')}
          </Badge>
          <Button variant="outline" data-testid="button-test-ai" onClick={() => setTestDialogOpen(true)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('admin:testAI', 'Test AI')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-active-sessions-label">
                  {t('admin:activeSessions', 'Active Sessions')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-active-sessions-value">24</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-daily-conversations-label">
                  {t('admin:dailyConversations', 'Daily Conversations')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-daily-conversations-value">156</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-response-time-label">
                  {t('admin:avgResponseTime', 'Avg Response Time')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-response-time-value">1.2s</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-satisfaction-label">
                  {t('admin:userSatisfaction', 'User Satisfaction')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-satisfaction-value">4.8/5</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration" data-testid="tab-ai-configuration">
            <Settings className="h-4 w-4 mr-2" />
            {t('admin:configuration', 'Configuration')}
          </TabsTrigger>
          <TabsTrigger value="personality" data-testid="tab-ai-personality">
            <Bot className="h-4 w-4 mr-2" />
            {t('admin:personality', 'Personality')}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-ai-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('admin:analytics', 'Analytics')}
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-ai-training">
            <Brain className="h-4 w-4 mr-2" />
            {t('admin:training', 'Training')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-ai-configuration">
                {t('admin:aiConfiguration', 'AI Configuration')}
              </CardTitle>
              <CardDescription>
                {t('admin:aiConfigurationDescription', 'Configure AI model settings and behavior parameters')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-model">{t('admin:aiModel', 'AI Model')}</Label>
                    <Select defaultValue="gpt-4">
                      <SelectTrigger data-testid="select-ai-model">
                        <SelectValue placeholder={t('admin:selectModel', 'Select model')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="response-length">{t('admin:responseLength', 'Response Length')}</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger data-testid="select-response-length">
                        <SelectValue placeholder={t('admin:selectLength', 'Select length')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">{t('admin:short', 'Short (50-100 words)')}</SelectItem>
                        <SelectItem value="medium">{t('admin:medium', 'Medium (100-200 words)')}</SelectItem>
                        <SelectItem value="long">{t('admin:long', 'Long (200+ words)')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="temperature">{t('admin:creativity', 'Creativity Level')}</Label>
                    <Input 
                      id="temperature" 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      defaultValue="0.7"
                      data-testid="slider-creativity"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {t('admin:creativityHint', 'Higher values make responses more creative but less predictable')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ai-enabled">{t('admin:aiEnabled', 'AI Study Partner Enabled')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:aiEnabledHint', 'Turn AI study partner on/off')}</p>
                    </div>
                    <Switch id="ai-enabled" defaultChecked data-testid="switch-ai-enabled" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="memory-enabled">{t('admin:conversationMemory', 'Conversation Memory')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:memoryEnabledHint', 'Remember previous conversations')}</p>
                    </div>
                    <Switch id="memory-enabled" defaultChecked data-testid="switch-memory-enabled" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="progress-tracking">{t('admin:progressTracking', 'Progress Tracking')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:progressTrackingHint', 'Track student learning progress')}</p>
                    </div>
                    <Switch id="progress-tracking" defaultChecked data-testid="switch-progress-tracking" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-ai-personality">
                {t('admin:aiPersonality', 'AI Personality')}
              </CardTitle>
              <CardDescription>
                {t('admin:aiPersonalityDescription', 'Define how the AI study partner interacts with students')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="ai-name">{t('admin:aiName', 'AI Study Partner Name')}</Label>
                <Input 
                  id="ai-name" 
                  defaultValue="Alex" 
                  placeholder={t('admin:enterAIName', 'Enter AI name')}
                  data-testid="input-ai-name"
                />
              </div>

              <div>
                <Label htmlFor="personality-style">{t('admin:personalityStyle', 'Personality Style')}</Label>
                <Select defaultValue="friendly">
                  <SelectTrigger data-testid="select-personality-style">
                    <SelectValue placeholder={t('admin:selectStyle', 'Select style')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">{t('admin:friendly', 'Friendly & Encouraging')}</SelectItem>
                    <SelectItem value="professional">{t('admin:professional', 'Professional')}</SelectItem>
                    <SelectItem value="casual">{t('admin:casual', 'Casual & Fun')}</SelectItem>
                    <SelectItem value="formal">{t('admin:formal', 'Formal & Academic')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="system-prompt">{t('admin:systemPrompt', 'System Prompt')}</Label>
                <Textarea 
                  id="system-prompt" 
                  rows={6}
                  defaultValue="You are Alex, a friendly and knowledgeable AI study partner helping students learn English. You should be encouraging, patient, and adapt your teaching style to each student's level and needs."
                  placeholder={t('admin:enterSystemPrompt', 'Enter system prompt')}
                  data-testid="textarea-system-prompt"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('admin:systemPromptHint', 'This defines the AI\'s role and behavior')}
                </p>
              </div>

              <div>
                <Label htmlFor="conversation-starters">{t('admin:conversationStarters', 'Conversation Starters')}</Label>
                <Textarea 
                  id="conversation-starters" 
                  rows={4}
                  defaultValue="Hi there! I'm Alex, your AI study partner. What would you like to practice today?\nGreat to see you again! How did your last lesson go?\nReady for some English practice? I'm here to help!"
                  placeholder={t('admin:enterStarters', 'Enter conversation starters (one per line)')}
                  data-testid="textarea-conversation-starters"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-ai-analytics">
                {t('admin:aiAnalytics', 'AI Analytics')}
              </CardTitle>
              <CardDescription>
                {t('admin:aiAnalyticsDescription', 'Track AI performance and user engagement metrics')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-ai-analytics-loading">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingAIAnalytics', 'Loading AI analytics data...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-ai-training">
                {t('admin:aiTraining', 'AI Training')}
              </CardTitle>
              <CardDescription>
                {t('admin:aiTrainingDescription', 'Improve AI responses through training and fine-tuning')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold" data-testid="heading-training-data">
                      {t('admin:trainingData', 'Training Data')}
                    </h3>
                    <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>{t('admin:uploadTrainingData', 'Upload training data files')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold" data-testid="heading-training-status">
                      {t('admin:trainingStatus', 'Training Status')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{t('admin:lastTraining', 'Last Training:')}</span>
                        <span className="text-sm text-gray-600">3 days ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{t('admin:trainingAccuracy', 'Accuracy:')}</span>
                        <span className="text-sm text-green-600">92.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{t('admin:trainingExamples', 'Training Examples:')}</span>
                        <span className="text-sm text-gray-600">2,847</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" data-testid="button-validate-model">
                    {t('admin:validateModel', 'Validate Model')}
                  </Button>
                  <Button data-testid="button-start-training">
                    <Play className="h-4 w-4 mr-2" />
                    {t('admin:startTraining', 'Start Training')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" data-testid="button-reset-ai-settings">
          {t('admin:resetToDefault', 'Reset to Default')}
        </Button>
        <Button data-testid="button-save-ai-settings">
          {t('admin:saveSettings', 'Save Settings')}
        </Button>
      </div>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-test-ai">
              {t('admin:testAI', 'Test AI')}
            </DialogTitle>
            <DialogDescription>
              {t('admin:testAIDescription', 'Test the AI service by sending a prompt and viewing the response')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-prompt">{t('admin:testPrompt', 'Test Prompt')}</Label>
              <Textarea
                id="test-prompt"
                data-testid="textarea-test-prompt"
                placeholder={t('admin:testPromptPlaceholder', 'Enter your test prompt here...')}
                rows={4}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTestAI} 
                disabled={testAIMutation.isPending || !testPrompt.trim()}
                data-testid="button-send-test-prompt"
              >
                {testAIMutation.isPending ? (
                  <>
                    <Pause className="h-4 w-4 mr-2 animate-spin" />
                    {t('admin:testing', 'Testing...')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('admin:sendTest', 'Send Test')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTestPrompt("");
                  setTestResponse("");
                }}
                disabled={testAIMutation.isPending}
                data-testid="button-clear-test"
              >
                {t('admin:clear', 'Clear')}
              </Button>
            </div>

            {testResponse && (
              <div>
                <Label>{t('admin:aiResponse', 'AI Response')}</Label>
                <div 
                  className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  data-testid="text-test-response"
                >
                  <p className="whitespace-pre-wrap text-sm">{testResponse}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}