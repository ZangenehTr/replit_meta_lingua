import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Server, 
  Download, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Monitor,
  Settings,
  Zap,
  AlertCircle,
  Trash2,
  TestTube,
  Send,
  Upload
} from "lucide-react";

interface OllamaStatus {
  success: boolean;
  status: 'running' | 'offline';
  models: string[];
  endpoint: string;
}

interface AISettings {
  primaryProvider: string;
  fallbackProvider: string;
  responseCaching: boolean;
  features: {
    personalizedRecommendations: boolean;
    progressAnalysis: boolean;
    conversationScenarios: boolean;
    culturalInsights: boolean;
  };
}

interface UsageStats {
  totalTokensUsed: number;
  averageResponseTime: number;
  requestsToday: number;
}

const POPULAR_MODELS = [
  { name: 'llama3.2:1b', description: 'Llama 3.2 1B - Fast, lightweight model' },
  { name: 'llama3.2:3b', description: 'Llama 3.2 3B - Balanced performance' },
  { name: 'llama3:8b', description: 'Llama 3 8B - High quality responses' },
  { name: 'deepseek-coder:1.3b', description: 'DeepSeek Coder 1.3B - Code generation' },
  { name: 'deepseek-coder:6.7b', description: 'DeepSeek Coder 6.7B - Advanced coding' },
  { name: 'deepseek-llm:7b', description: 'DeepSeek LLM 7B - General purpose' },
  { name: 'qwen2:1.5b', description: 'Qwen2 1.5B - Multilingual support' },
  { name: 'phi3:3.8b', description: 'Phi-3 3.8B - Microsoft model' },
];

export function AIManagementPage() {
  console.log("AIManagementPage component loading...");
  
  const [modelName, setModelName] = useState("llama3.2:1b");
  const [selectedModel, setSelectedModel] = useState("");
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testingModel, setTestingModel] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings>({
    primaryProvider: "ollama",
    fallbackProvider: "openai",
    responseCaching: true,
    features: {
      personalizedRecommendations: true,
      progressAnalysis: true,
      conversationScenarios: true,
      culturalInsights: true,
    }
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ollamaStatus, isLoading, refetch } = useQuery<OllamaStatus>({
    queryKey: ["/api/test/ollama-status"],
    queryFn: () => apiRequest("/api/test/ollama-status"),
    refetchInterval: 10000,
  });

  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ["/api/admin/ai/usage-stats"],
    queryFn: () => apiRequest("/admin/ai/usage-stats"),
    refetchInterval: 30000,
  });

  const { data: currentSettings } = useQuery<AISettings>({
    queryKey: ["/api/admin/ai/settings"],
    queryFn: () => apiRequest("/admin/ai/settings"),
  });

  useEffect(() => {
    if (currentSettings) {
      setAISettings(currentSettings);
    }
  }, [currentSettings]);

  const pullModelMutation = useMutation({
    mutationFn: (modelName: string) => 
      apiRequest("/api/test/model-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName })
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Model downloaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
      setModelName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download model",
        variant: "destructive",
      });
    },
  });

  const uninstallModelMutation = useMutation({
    mutationFn: (modelName: string) => 
      apiRequest("/api/test/model-uninstall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName })
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Model uninstalled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to uninstall model",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<AISettings>) => 
      apiRequest("/api/admin/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      }),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "AI configuration has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handlePullModel = () => {
    if (!modelName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a model name",
        variant: "destructive",
      });
      return;
    }
    pullModelMutation.mutate(modelName);
  };

  const testModel = async () => {
    if (!testPrompt.trim()) {
      toast({
        title: "No Test Prompt",
        description: "Please enter a test prompt to evaluate the model",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "No Model Selected",
        description: "Please select a trained model to test",
        variant: "destructive",
      });
      return;
    }

    setTestingModel(true);
    setTestResponse('');

    try {
      const response = await apiRequest(`/api/test/model-test`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: selectedModel,
          prompt: testPrompt,
          temperature: 0.7,
          maxTokens: 500
        }),
      });

      setTestResponse(response.response || 'Test completed successfully');
      
      toast({
        title: "Model Test Complete",
        description: "Check the response to evaluate training success",
      });

    } catch (error: any) {
      toast({
        title: "Model Test Failed",
        description: error.message || "Failed to test the trained model",
        variant: "destructive",
      });
      setTestResponse('Failed to generate response');
    } finally {
      setTestingModel(false);
    }
  };

  const updateSettings = (newSettings: Partial<AISettings>) => {
    const updatedSettings = { ...aiSettings, ...newSettings };
    setAISettings(updatedSettings);
    updateSettingsMutation.mutate(updatedSettings);
  };

  const toggleFeature = (feature: keyof AISettings['features']) => {
    updateSettings({
      features: {
        ...aiSettings.features,
        [feature]: !aiSettings.features[feature]
      }
    });
  };

  const availableModels = ollamaStatus?.models || [];
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
          <h1 className="text-3xl font-bold">AI Services Management</h1>
          <p className="text-muted-foreground">
            Manage local AI processing with Ollama and monitor service status
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="testing">
            <TestTube className="h-4 w-4 mr-2" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Ollama Service Status
              </CardTitle>
              <CardDescription>Current status of local AI processing service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <StatusIndicator status={ollamaStatus?.status || 'offline'} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Models Installed</div>
                  <div className="text-2xl font-bold">{availableModels.length}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Endpoint</div>
                  <div className="text-sm font-mono">http://localhost:11434</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
              <CardDescription>AI processing metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Tokens Used Today</div>
                  <div className="text-2xl font-bold">{formatNumber(usageStats?.totalTokensUsed || 0)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-2xl font-bold">{usageStats?.averageResponseTime || 0}ms</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Requests Today</div>
                  <div className="text-2xl font-bold">{usageStats?.requestsToday || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {/* Model Download */}
          <Card>
            <CardHeader>
              <CardTitle>Download Models</CardTitle>
              <CardDescription>Download and manage AI models for local processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Popular Models */}
              <div className="space-y-4">
                <Label className="text-base">Popular Models</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {POPULAR_MODELS.map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setModelName(model.name)}
                    >
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">{model.description}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          pullModelMutation.mutate(model.name);
                        }}
                        disabled={pullModelMutation.isPending}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Model */}
              <div className="space-y-4">
                <Label className="text-base">Custom Model</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Enter model name (e.g., llama3.2:1b)"
                    />
                  </div>
                  <Button
                    onClick={handlePullModel}
                    disabled={pullModelMutation.isPending || !modelName.trim()}
                  >
                    <Download className={`h-4 w-4 mr-2 ${pullModelMutation.isPending ? 'animate-spin' : ''}`} />
                    {pullModelMutation.isPending ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Models */}
          <Card>
            <CardHeader>
              <CardTitle>Installed Models</CardTitle>
              <CardDescription>Currently available AI models</CardDescription>
            </CardHeader>
            <CardContent>
              {availableModels.length ? (
                <div className="space-y-3">
                  {availableModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bot className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{model}</div>
                          <div className="text-sm text-muted-foreground">
                            Ready for AI processing
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => uninstallModelMutation.mutate(model)}
                          disabled={uninstallModelMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Uninstall
                        </Button>
                        <Badge variant="default">Installed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No models installed</p>
                  <p className="text-sm">Download a model to enable local AI processing</p>
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
                Model Testing
              </CardTitle>
              <CardDescription>
                Test trained models instantly to verify performance and effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableModels.length > 0 ? (
                <>
                  {/* Model Selection */}
                  <div className="space-y-4">
                    <Label className="text-base">Select Model to Test</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a trained model" />
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

                  {/* Test Prompt */}
                  <div className="space-y-4">
                    <Label className="text-base">Test Prompt</Label>
                    <Textarea
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder="Enter a test prompt to evaluate the model's training effectiveness..."
                      rows={4}
                      className="min-h-[100px]"
                    />
                    
                    {/* Quick Test Examples */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Quick Test Examples:</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("Translate this English sentence to Persian: 'Hello, how are you today?'")}
                        >
                          Translation Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("Explain the basic grammar rules for Persian sentence structure.")}
                        >
                          Grammar Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestPrompt("Create a conversation scenario for ordering food in a Persian restaurant.")}
                        >
                          Conversation Test
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

                  {/* Test Controls */}
                  <div className="flex gap-4">
                    <Button 
                      className="flex-1" 
                      onClick={testModel}
                      disabled={testingModel || !selectedModel || !testPrompt.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {testingModel ? "Testing..." : "Test Model"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setTestPrompt('');
                        setTestResponse('');
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>

                  {/* Test Response */}
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

                  {/* Test Evaluation Tips */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Testing Tips:</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Test with prompts similar to your training data to verify learning</li>
                      <li>• Try edge cases to check model robustness</li>
                      <li>• Compare responses before and after training for improvement</li>
                      <li>• Test different prompt styles to evaluate versatility</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No models available for testing</p>
                  <p className="text-sm">Download and train a model first to enable testing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Service Configuration</CardTitle>
              <CardDescription>
                Configure AI processing preferences and fallback options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Primary AI Provider</Label>
                  <Select
                    value={aiSettings.primaryProvider}
                    onValueChange={(value) => updateSettings({ primaryProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                      <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Primary service for AI processing
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base">Fallback Provider</Label>
                  <Select
                    value={aiSettings.fallbackProvider}
                    onValueChange={(value) => updateSettings({ fallbackProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fallback provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Backup service when primary is unavailable
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Response Caching</Label>
                    <p className="text-sm text-muted-foreground">
                      Cache AI responses to improve performance
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.responseCaching}
                    onCheckedChange={(checked) => updateSettings({ responseCaching: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Features
              </CardTitle>
              <CardDescription>Meta Lingua AI capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Personalized Recommendations</span>
                <Switch
                  checked={aiSettings.features.personalizedRecommendations}
                  onCheckedChange={() => toggleFeature('personalizedRecommendations')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Progress Analysis</span>
                <Switch
                  checked={aiSettings.features.progressAnalysis}
                  onCheckedChange={() => toggleFeature('progressAnalysis')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversation Scenarios</span>
                <Switch
                  checked={aiSettings.features.conversationScenarios}
                  onCheckedChange={() => toggleFeature('conversationScenarios')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cultural Insights</span>
                <Switch
                  checked={aiSettings.features.culturalInsights}
                  onCheckedChange={() => toggleFeature('culturalInsights')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}