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
  Trash2
} from "lucide-react";

interface OllamaStatus {
  success: boolean;
  status: 'running' | 'offline';
  models: string[];
  endpoint: string;
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

export function AIManagementPage() {
  const [modelName, setModelName] = useState("llama3.2:1b");
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

  // Update local settings when data is fetched
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
  const availableProviders = ['ollama', 'openai', 'anthropic'];
  
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
          <TabsTrigger value="overview">
            <Monitor className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="models">
            <Bot className="h-4 w-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger value="training">
            <Zap className="h-4 w-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Service Status Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Ollama Service
                </CardTitle>
                <CardDescription>Local AI processing service status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking status...</span>
                  </div>
                ) : ollamaStatus ? (
                  <>
                    <StatusIndicator status={ollamaStatus.status} />
                    <div className="text-sm text-muted-foreground">
                      <div>Endpoint: {ollamaStatus.endpoint}</div>
                      <div>Models loaded: {ollamaStatus.models.length}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Unable to connect to Ollama service</span>
                  </div>
                )}
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
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>AI service usage and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {ollamaStatus?.status === 'running' ? '100%' : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Service Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(usageStats?.totalTokensUsed || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tokens Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {usageStats?.requestsToday || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Requests Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(usageStats?.averageResponseTime || 2.3).toFixed(1)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {/* Model Management */}
          <Card>
            <CardHeader>
              <CardTitle>Download AI Model</CardTitle>
              <CardDescription>
                Download and install AI models for local processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Popular Models Grid */}
              <div>
                <h4 className="text-sm font-medium mb-3">Popular Models</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {POPULAR_MODELS.map((model) => (
                    <Button
                      key={model.name}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setModelName(model.name)}
                      disabled={availableModels.includes(model.name)}
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                        {availableModels.includes(model.name) && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Installed
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Model Input */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Custom Model</h4>
                <div className="flex gap-4">
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
              {ollamaStatus?.models.length ? (
                <div className="space-y-3">
                  {ollamaStatus.models.map((model, index) => (
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
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Add training modal */}}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Train
                        </Button>
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

        <TabsContent value="training" className="space-y-6">
          {/* Model Training */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Training & Fine-tuning</CardTitle>
              <CardDescription>
                Train your AI models with specialized data for Persian language learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {availableModels.length > 0 ? (
                <>
                  {/* Training Dataset Upload */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Training Dataset</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Upload training data (JSON, CSV, or TXT format)
                        </div>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Upload Training Data
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Training Configuration */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Select Model to Train</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a model" />
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
                    <div className="space-y-2">
                      <Label>Training Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select training type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persian-language">Persian Language Enhancement</SelectItem>
                          <SelectItem value="cultural-context">Cultural Context Training</SelectItem>
                          <SelectItem value="conversation">Conversation Patterns</SelectItem>
                          <SelectItem value="grammar">Grammar Correction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Training Parameters */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Learning Rate</Label>
                      <Input placeholder="0.001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Epochs</Label>
                      <Input placeholder="10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Batch Size</Label>
                      <Input placeholder="32" />
                    </div>
                  </div>

                  {/* Training Controls */}
                  <div className="flex gap-4">
                    <Button className="flex-1">
                      <Zap className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Parameters
                    </Button>
                  </div>

                  {/* Training Progress */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Training Progress</h4>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>No training in progress</span>
                        <span className="text-muted-foreground">Ready to train</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No models available for training</p>
                  <p className="text-sm">Download a model first to enable training features</p>
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
                  <div>
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

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Service Health</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Local Processing:</span>
                    <span className={ollamaStatus?.status === 'running' ? 'text-green-600' : 'text-red-600'}>
                      {ollamaStatus?.status === 'running' ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fallback Service:</span>
                    <span className="text-green-600">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="text-blue-600">
                      ~{(usageStats?.averageResponseTime || 2.3).toFixed(1)}s average
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Status:</span>
                    <span className={aiSettings.responseCaching ? 'text-green-600' : 'text-gray-600'}>
                      {aiSettings.responseCaching ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}