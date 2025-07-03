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
  Trash2,
  TestTube,
  Send
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
];

export function AIManagementPage() {
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

  const testModel = async () => {
    if (!testPrompt.trim()) {
      toast({
        title: "No Test Prompt",
        description: "Please enter a test prompt",
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
          modelName: selectedModel || 'llama3.2:1b',
          prompt: testPrompt,
          temperature: 0.7,
          maxTokens: 500
        }),
      });

      setTestResponse(response.response || 'Test completed successfully');
      
      toast({
        title: "Model Test Complete",
        description: "Response generated successfully",
      });

    } catch (error: any) {
      toast({
        title: "Model Test Failed",
        description: error.message || "Failed to test the model",
        variant: "destructive",
      });
      setTestResponse('Failed to generate response');
    } finally {
      setTestingModel(false);
    }
  };

  const availableModels = ollamaStatus?.models || [];

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
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>Currently installed AI models</CardDescription>
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
                      <Badge variant="default">Installed</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No models installed</p>
                  <p className="text-sm">Install Ollama to enable local AI processing</p>
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
                Test AI models instantly to verify performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableModels.length > 0 ? (
                <>
                  <div className="space-y-4">
                    <Label className="text-base">Select Model to Test</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
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

                  <div className="space-y-4">
                    <Label className="text-base">Test Prompt</Label>
                    <Textarea
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder="Enter a test prompt to evaluate the model..."
                      rows={4}
                      className="min-h-[100px]"
                    />
                    
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

                  <div className="flex gap-4">
                    <Button 
                      className="flex-1" 
                      onClick={testModel}
                      disabled={testingModel || !testPrompt.trim()}
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

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Service Configuration</CardTitle>
              <CardDescription>
                Configure AI processing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Primary AI Provider</Label>
                  <Select
                    value={aiSettings.primaryProvider}
                    onValueChange={(value) => setAISettings({...aiSettings, primaryProvider: value})}
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
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base">Fallback Provider</Label>
                  <Select
                    value={aiSettings.fallbackProvider}
                    onValueChange={(value) => setAISettings({...aiSettings, fallbackProvider: value})}
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
                    onCheckedChange={(checked) => setAISettings({...aiSettings, responseCaching: checked})}
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
                  onCheckedChange={(checked) => setAISettings({
                    ...aiSettings, 
                    features: {...aiSettings.features, personalizedRecommendations: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Progress Analysis</span>
                <Switch
                  checked={aiSettings.features.progressAnalysis}
                  onCheckedChange={(checked) => setAISettings({
                    ...aiSettings, 
                    features: {...aiSettings.features, progressAnalysis: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversation Scenarios</span>
                <Switch
                  checked={aiSettings.features.conversationScenarios}
                  onCheckedChange={(checked) => setAISettings({
                    ...aiSettings, 
                    features: {...aiSettings.features, conversationScenarios: checked}
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cultural Insights</span>
                <Switch
                  checked={aiSettings.features.culturalInsights}
                  onCheckedChange={(checked) => setAISettings({
                    ...aiSettings, 
                    features: {...aiSettings.features, culturalInsights: checked}
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}