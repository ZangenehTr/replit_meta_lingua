import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Bot, 
  Server, 
  CheckCircle, 
  XCircle, 
  Download,
  Activity,
  AlertTriangle,
  RefreshCw,
  Rocket
} from "lucide-react";

// Define only the 5 high-quality models for English/Farsi communication
const RECOMMENDED_MODELS = (t: any) => [
  { 
    id: "llama3.2:3b", 
    name: "Llama 3.2 (3B)",
    description: t('admin:aiServices.balancedModel'),
    size: "2.0 GB",
    languages: ["English", "Farsi"],
    recommended: true
  },
  { 
    id: "llama3:8b", 
    name: "Llama 3 (8B)",
    description: t('admin:aiServices.highQuality'),
    size: "4.7 GB",
    languages: ["English", "Farsi", "Arabic"],
    recommended: true
  },
  { 
    id: "mistral:7b", 
    name: "Mistral (7B)",
    description: t('admin:aiServices.efficientTasks'),
    size: "4.1 GB",
    languages: ["English", "Farsi"],
    recommended: false
  },
  { 
    id: "mixtral:8x7b", 
    name: "Mixtral (8x7B)",
    description: t('admin:aiServices.advancedConversations'),
    size: "26 GB",
    languages: ["English", "Farsi", "Arabic"],
    recommended: false
  },
  { 
    id: "persian-llm:latest", 
    name: "Persian LLM",
    description: t('admin:aiServices.specializedPersian'),
    size: "3.5 GB",
    languages: ["Farsi", "English"],
    recommended: true
  }
];

export default function AIServicesManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>("");

  // Type definitions
  type OllamaStatus = {
    isInstalled: boolean;
    isRunning: boolean;
    installationPath?: string;
    baseUrl?: string;
  };

  type ModelsData = {
    models: string[];
  };

  // Ollama Status Query
  const { data: ollamaStatus, isLoading: statusLoading } = useQuery<OllamaStatus>({
    queryKey: ["/api/admin/ollama/status"],
    refetchInterval: 10000 // Check every 10 seconds
  });

  // Installed Models Query
  const { data: modelsData, isLoading: modelsLoading } = useQuery<ModelsData>({
    queryKey: ["/api/admin/ollama/models"],
    enabled: ollamaStatus?.isRunning,
    refetchInterval: 30000
  });

  // Install Ollama Mutation
  const installOllamaMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/ollama/install", { method: "POST" }),
    onSuccess: (data) => {
      const isReplitError = data.message?.includes('Replit') || data.message?.includes('permission');
      
      toast({
        title: isReplitError ? t('admin:aiServices.developmentNotice') : t('admin:aiServices.ollamaInstallation'),
        description: isReplitError 
          ? t('admin:aiServices.requiresProduction')
          : data.success 
            ? t('admin:aiServices.installSuccess')
            : `${t('admin:aiServices.installFailed')}: ${data.message}`,
        variant: isReplitError ? "default" : (data.success ? "default" : "destructive")
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/status"] });
    }
  });

  // Start Ollama Service Mutation
  const startOllamaMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/ollama/start", { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: t('admin:aiServices.startOllamaService'),
        description: data.success ? t('admin:aiServices.installSuccess') : `${t('admin:aiServices.installFailed')}: ${data.message}`,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/status"] });
    }
  });

  // Download Model Mutation
  const downloadModelMutation = useMutation({
    mutationFn: (modelName: string) => {
      setDownloadingModel(modelName);
      return apiRequest(`/api/admin/ollama/models/${modelName}/download`, { method: "POST" });
    },
    onSuccess: (data, modelName) => {
      setDownloadingModel(null);
      toast({
        title: t('admin:aiServices.modelManagement'),
        description: data.success ? `${modelName} ${t('admin:aiServices.installSuccess')}` : `${t('admin:aiServices.installFailed')}: ${data.message}`,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
    },
    onError: () => {
      setDownloadingModel(null);
    }
  });

  // Remove Model Mutation
  const removeModelMutation = useMutation({
    mutationFn: (modelName: string) => apiRequest(`/api/admin/ollama/models/${modelName}`, { method: "DELETE" }),
    onSuccess: (data, modelName) => {
      toast({
        title: t('admin:aiServices.modelManagement'),
        description: data.success ? `${modelName} ${t('admin:aiServices.remove')} ${t('admin:aiServices.installSuccess')}` : `${t('admin:aiServices.installFailed')}: ${data.message}`,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
    }
  });

  // Test Generation Mutation
  const testGenerationMutation = useMutation({
    mutationFn: ({ prompt, model }: { prompt: string; model: string }) => 
      apiRequest("/api/admin/ollama/generate", { 
        method: "POST", 
        body: JSON.stringify({ prompt, model })
      }),
    onSuccess: (data) => {
      toast({
        title: t('admin:aiServices.testAIGeneration'),
        description: t('admin:aiServices.installSuccess'),
        variant: "default"
      });
      console.log("AI Response:", data.response);
    },
    onError: (error) => {
      toast({
        title: t('admin:aiServices.testAIGeneration'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const availableModels = modelsData?.models || [];
  const isOllamaReady = ollamaStatus?.isInstalled && ollamaStatus?.isRunning;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Ollama Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:aiServices.ollamaStatus')}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {statusLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : ollamaStatus?.isInstalled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {statusLoading ? t('admin:aiServices.checking') : ollamaStatus?.isInstalled ? t('admin:aiServices.installed') : t('admin:aiServices.notInstalled')}
              </span>
            </div>
            {ollamaStatus?.installationPath && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin:aiServices.path')}: {ollamaStatus.installationPath}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:aiServices.serviceStatus')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {ollamaStatus?.isRunning ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {ollamaStatus?.isRunning ? t('admin:aiServices.running') : t('admin:aiServices.stopped')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin:aiServices.url')}: {ollamaStatus?.baseUrl || "http://localhost:11434"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:aiServices.availableModels')}</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableModels.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableModels.length > 0 ? `${availableModels[0]} ${t('admin:aiServices.ready')}` : t('admin:aiServices.noModelsInstalled')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bootstrap Section */}
      {!ollamaStatus?.isInstalled && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Rocket className="h-5 w-5" />
              {t('admin:aiServices.bootstrapTitle')}
            </CardTitle>
            <CardDescription className="text-orange-700">
              {t('admin:aiServices.bootstrapDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-100 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">{t('admin:aiServices.whyOllama')}</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• {t('admin:aiServices.dataSovereignty')}</li>
                <li>• {t('admin:aiServices.persianSupport')}</li>
                <li>• {t('admin:aiServices.selfHosted')}</li>
                <li>• {t('admin:aiServices.costEffective')}</li>
              </ul>
            </div>
            
            <div className="bg-blue-100 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🚀 {t('admin:aiServices.productionDeployment')}</h4>
              <p className="text-sm text-blue-700 mb-2">
                {t('admin:aiServices.productionInstructions')}
              </p>
              <code className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs">
                curl -fsSL https://ollama.ai/install.sh | sh
              </code>
              <p className="text-xs text-blue-600 mt-2">
                {t('admin:aiServices.interfaceAutoWork')}
              </p>
            </div>
            
            <Button 
              onClick={() => installOllamaMutation.mutate()}
              disabled={installOllamaMutation.isPending}
              className="w-full"
            >
              {installOllamaMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('admin:aiServices.installingOllama')}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin:aiServices.testInstallation')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Service Control */}
      {ollamaStatus?.isInstalled && !ollamaStatus?.isRunning && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">{t('admin:aiServices.startOllamaService')}</CardTitle>
            <CardDescription className="text-blue-700">
              {t('admin:aiServices.startServiceDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => startOllamaMutation.mutate()}
              disabled={startOllamaMutation.isPending}
              className="w-full"
            >
              {startOllamaMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('admin:aiServices.startingService')}
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  {t('admin:aiServices.startService')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Model Management */}
      {isOllamaReady && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin:aiServices.modelManagement')}</CardTitle>
            <CardDescription>
              {t('admin:aiServices.modelManagementDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Models */}
            <div>
              <h4 className="font-medium mb-4">{t('admin:aiServices.availableForDownload')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RECOMMENDED_MODELS(t).map((model) => {
                  const isInstalled = availableModels.includes(model.id);
                  const isDownloading = downloadingModel === model.id;
                  
                  return (
                    <Card key={model.id} className={isInstalled ? "border-green-200 bg-green-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{model.name}</h5>
                          {model.recommended && (
                            <Badge variant="secondary">{t('admin:aiServices.recommended')}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{model.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>{t('admin:aiServices.size')}: {model.size}</span>
                          <span>{t('admin:aiServices.languages')}: {model.languages.join(", ")}</span>
                        </div>
                        
                        {isInstalled ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700">{t('admin:aiServices.installed')}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeModelMutation.mutate(model.id)}
                              disabled={removeModelMutation.isPending}
                            >
                              {t('admin:aiServices.remove')}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => downloadModelMutation.mutate(model.id)}
                            disabled={isDownloading || downloadModelMutation.isPending}
                            className="w-full"
                            size="sm"
                          >
                            {isDownloading ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                {t('admin:aiServices.downloading')}
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                {t('admin:aiServices.download')} {model.size}
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Test AI Generation */}
            {availableModels.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">{t('admin:aiServices.testAIGeneration')}</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model-select">{t('admin:aiServices.selectModel')}</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:aiServices.chooseModel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="test-prompt">{t('admin:aiServices.testPrompt')}</Label>
                    <textarea
                      id="test-prompt"
                      className="w-full h-20 p-3 border rounded-md resize-none"
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder={t('admin:aiServices.enterTestPrompt')}
                    />
                  </div>
                  
                  <Button
                    onClick={() => testGenerationMutation.mutate({ prompt: testPrompt, model: selectedModel })}
                    disabled={!selectedModel || testGenerationMutation.isPending}
                    className="w-full"
                  >
                    {testGenerationMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('admin:aiServices.generating')}
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        {t('admin:aiServices.testGeneration')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Iranian Compliance Information */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">{t('admin:aiServices.iranianCompliance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-green-800 mb-2">✅ {t('admin:aiServices.complianceFeatures')}</h5>
              <ul className="space-y-1 text-green-700">
                <li>• {t('admin:aiServices.completeSovereignty')}</li>
                <li>• {t('admin:aiServices.noExternalDependencies')}</li>
                <li>• {t('admin:aiServices.persianProcessing')}</li>
                <li>• {t('admin:aiServices.localModelStorage')}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-green-800 mb-2">🚀 {t('admin:aiServices.recommendedSetup')}</h5>
              <ul className="space-y-1 text-green-700">
                <li>• {t('admin:aiServices.startWithLlama')}</li>
                <li>• {t('admin:aiServices.downloadPersianLLM')}</li>
                <li>• {t('admin:aiServices.testBeforeUse')}</li>
                <li>• {t('admin:aiServices.monitorPerformance')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}