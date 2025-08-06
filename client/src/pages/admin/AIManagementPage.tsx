import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TestTube,
  Send
} from "lucide-react";

interface OllamaStatus {
  success: boolean;
  status: 'running' | 'offline';
  models: string[];
  endpoint: string;
}

export function AIManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedModel, setSelectedModel] = useState("");
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testingModel, setTestingModel] = useState(false);
  
  const { toast } = useToast();

  // Fetch AI service status from API
  const { data: ollamaStatus, isLoading, refetch } = useQuery<OllamaStatus>({
    queryKey: ["/api/admin/ai-service/status"],
    refetchInterval: 10000,
  });

  // Fetch available AI models
  const { data: modelsList, isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/admin/ai-service/models"],
    staleTime: 5 * 60 * 1000
  });

  const availableModels = modelsList || ollamaStatus?.models || [];

  const testModel = async () => {
    if (!testPrompt.trim()) {
      toast({
        title: t('common:toast.noTestPrompt'),
        description: "Please enter a test prompt",
        variant: "destructive",
      });
      return;
    }

    setTestingModel(true);
    setTestResponse('');

    try {
      const response = await apiRequest(`/api/test/model`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel || 'llama3.2:1b',
          prompt: testPrompt
        }),
      });

      setTestResponse(response.response || 'Test completed successfully');
      
      toast({
        title: t('common:toast.modelTestComplete'),
        description: "Response generated successfully",
      });

    } catch (error: any) {
      toast({
        title: t('common:toast.modelTestFailed'),
        description: error.message || "Failed to test the model",
        variant: "destructive",
      });
      setTestResponse('Failed to generate response');
    } finally {
      setTestingModel(false);
    }
  };

  const StatusIndicator = ({ status }: { status: 'running' | 'offline' }) => (
    <div className="flex items-center gap-2">
      {status === 'running' ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700 font-medium">Running</span>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 font-medium">Offline</span>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:aiServices.title')}</h1>
          <p className="text-muted-foreground">
            {t('admin:aiServices.subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common:ui.refreshStatus')}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('admin:aiServices.overview')}</TabsTrigger>
          <TabsTrigger value="models">{t('admin:aiServices.models')}</TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            {t('admin:aiServices.testing')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {t('admin:aiServices.serviceStatus')}
              </CardTitle>
              <CardDescription>{t('admin:aiServices.currentStatus')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('admin:aiServices.status')}</div>
                  <StatusIndicator status={ollamaStatus?.status || 'offline'} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('admin:aiServices.modelsInstalled')}</div>
                  <div className="text-2xl font-bold">{(availableModels as string[])?.length || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('admin:aiServices.endpoint')}</div>
                  <div className="text-sm font-mono">http://localhost:11434</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:aiServices.availableModels')}</CardTitle>
              <CardDescription>{t('admin:aiServices.currentlyInstalledModels')}</CardDescription>
            </CardHeader>
            <CardContent>
              {(availableModels as string[])?.length ? (
                <div className="space-y-3">
                  {(availableModels as string[])?.map((model: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bot className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{model}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('admin:aiServices.readyForProcessing')}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">{t('admin:aiServices.installed')}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('admin:aiServices.noModelsInstalled')}</p>
                  <p className="text-sm">{t('admin:aiServices.installOllamaToEnable')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                {t('admin:aiServices.modelTesting')}
              </CardTitle>
              <CardDescription>
                {t('admin:aiServices.testModelsInstantly')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(availableModels as string[])?.length > 0 ? (
                <>
                  <div className="space-y-4">
                    <Label className="text-base">{t('admin:aiServices.selectModelToTest')}</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:aiServices.chooseModel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(availableModels as string[])?.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base">{t('admin:aiServices.testPrompt')}</Label>
                    <Textarea
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder={t('admin:aiServices.enterTestPrompt')}
                      rows={4}
                      className="min-h-[100px]"
                    />
                    
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t('admin:aiServices.quickTestExamples')}</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("Translate this English sentence to Persian: 'Hello, how are you today?'")}
                        >
                          {t('admin:aiServices.translationTest')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("Explain the basic grammar rules for Persian sentence structure.")}
                        >
                          {t('admin:aiServices.grammarTest')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("Create a conversation scenario for ordering food in a Persian restaurant.")}
                        >
                          {t('admin:aiServices.conversationTest')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("What are some important Persian cultural customs for language learners?")}
                        >
                          Cultural Test
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 flex items-center justify-center gap-2" 
                      onClick={testModel}
                      disabled={testingModel || !testPrompt.trim()}
                    >
                      <Send className="h-4 w-4" />
                      {testingModel ? "Testing..." : "Test Model"}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setTestPrompt('');
                        setTestResponse('');
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Model Response</h4>
                    <div className={`min-h-[150px] p-4 border rounded-lg ${
                      testResponse 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      {testingModel ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="text-center space-y-2">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                            <p className="text-sm text-blue-600">Testing model response...</p>
                          </div>
                        </div>
                      ) : testResponse ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Test Response:
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <div className="text-center">
                            <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No test response yet</p>
                            <p className="text-xs">Enter a prompt and click Test Model</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Testing Tips:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Test with different prompt styles to evaluate model capabilities</li>
                      <li>• Try both simple and complex queries to check performance</li>
                      <li>• Use Persian language examples for language learning tests</li>
                      <li>• Compare responses to assess quality and accuracy</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No models available for testing</p>
                  <p className="text-sm">Install Ollama and download models to enable testing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}