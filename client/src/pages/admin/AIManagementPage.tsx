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
  AlertCircle
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
    queryKey: ["/api/admin/ollama/status"],
    queryFn: () => apiRequest("/admin/ollama/status"),
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download model",
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
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g., llama3.2:1b, llama3.2:3b"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handlePullModel}
                    disabled={pullModelMutation.isPending || !modelName.trim()}
                  >
                    <Download className={`h-4 w-4 mr-2 ${pullModelMutation.isPending ? 'animate-spin' : ''}`} />
                    {pullModelMutation.isPending ? 'Downloading...' : 'Download Model'}
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Recommended models for Persian language:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code>llama3.2:1b</code> - Lightweight, fast processing (1GB)</li>
                  <li><code>llama3.2:3b</code> - Better quality, moderate size (2GB)</li>
                  <li><code>llama3.1:8b</code> - High quality, larger size (4.7GB)</li>
                </ul>
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
                      <Badge variant="default">Installed</Badge>
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