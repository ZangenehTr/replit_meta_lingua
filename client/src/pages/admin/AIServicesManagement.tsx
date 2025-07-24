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
const RECOMMENDED_MODELS = [
  { 
    id: "llama3.2:3b", 
    name: "Llama 3.2 (3B)",
    description: "Balanced model for English/Farsi conversations",
    size: "2.0 GB",
    languages: ["English", "Farsi"],
    recommended: true
  },
  { 
    id: "llama3:8b", 
    name: "Llama 3 (8B)",
    description: "High-quality multilingual conversations",
    size: "4.7 GB",
    languages: ["English", "Farsi", "Arabic"],
    recommended: true
  },
  { 
    id: "mistral:7b", 
    name: "Mistral (7B)",
    description: "Efficient for language learning tasks",
    size: "4.1 GB",
    languages: ["English", "Farsi"],
    recommended: false
  },
  { 
    id: "mixtral:8x7b", 
    name: "Mixtral (8x7B)",
    description: "Advanced model for complex conversations",
    size: "26 GB",
    languages: ["English", "Farsi", "Arabic"],
    recommended: false
  },
  { 
    id: "persian-llm:latest", 
    name: "Persian LLM",
    description: "Specialized for Persian/Farsi language",
    size: "3.5 GB",
    languages: ["Farsi", "English"],
    recommended: true
  }
];

export default function AIServicesManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>("Hello, please introduce yourself in both English and Persian.");

  // Ollama Status Query
  const { data: ollamaStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/admin/ollama/status"],
    refetchInterval: 10000 // Check every 10 seconds
  });

  // Installed Models Query
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
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
        title: isReplitError ? "Development Environment Notice" : "Ollama Installation",
        description: isReplitError 
          ? "Ollama installation requires a production server environment. This interface will work correctly when deployed."
          : data.success 
            ? "Ollama installed successfully" 
            : `Installation failed: ${data.message}`,
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
        title: "Ollama Service",
        description: data.success ? "Service started successfully" : `Failed to start: ${data.message}`,
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
        title: "Model Download",
        description: data.success ? `${modelName} downloaded successfully` : `Download failed: ${data.message}`,
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
        title: "Model Removal",
        description: data.success ? `${modelName} removed successfully` : `Removal failed: ${data.message}`,
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
        body: { prompt, model } 
      }),
    onSuccess: (data) => {
      toast({
        title: "AI Test Successful",
        description: "Model responded correctly. Check console for full response.",
        variant: "default"
      });
      console.log("AI Response:", data.response);
    },
    onError: (error) => {
      toast({
        title: "AI Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const availableModels = modelsData?.models || [];
  const isOllamaReady = ollamaStatus?.isInstalled && ollamaStatus?.isRunning;

  return (
    <div className="space-y-6">
      {/* Ollama Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ollama Status</CardTitle>
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
                {statusLoading ? "Checking..." : ollamaStatus?.isInstalled ? "Installed" : "Not Installed"}
              </span>
            </div>
            {ollamaStatus?.installationPath && (
              <p className="text-xs text-muted-foreground mt-1">
                Path: {ollamaStatus.installationPath}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
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
                {ollamaStatus?.isRunning ? "Running" : "Stopped"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              URL: {ollamaStatus?.baseUrl || "http://localhost:11434"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Models</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableModels.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableModels.length > 0 ? `${availableModels[0]} ready` : "No models installed"}
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
              Bootstrap Ollama AI Services
            </CardTitle>
            <CardDescription className="text-orange-700">
              Install and configure Ollama for local AI processing and Iranian compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-100 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Why Ollama?</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Complete data sovereignty - no external AI dependencies</li>
                <li>• Persian/Farsi language support for Iranian students</li>
                <li>• Self-hosted AI processing for privacy and compliance</li>
                <li>• Cost-effective - no per-request charges</li>
              </ul>
            </div>
            
            <div className="bg-blue-100 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🚀 Production Deployment</h4>
              <p className="text-sm text-blue-700 mb-2">
                For production deployment on your server, run this command:
              </p>
              <code className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs">
                curl -fsSL https://ollama.ai/install.sh | sh
              </code>
              <p className="text-xs text-blue-600 mt-2">
                This interface will work automatically once Ollama is installed on your production server.
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
                  Installing Ollama...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Test Installation (Development Only)
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
            <CardTitle className="text-blue-800">Start Ollama Service</CardTitle>
            <CardDescription className="text-blue-700">
              Ollama is installed but not running. Start the service to enable AI features.
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
                  Starting Service...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Ollama Service
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
            <CardTitle>AI Model Management</CardTitle>
            <CardDescription>
              Download and manage AI models for Persian language learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Models */}
            <div>
              <h4 className="font-medium mb-4">Available Models for Download</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RECOMMENDED_MODELS.map((model) => {
                  const isInstalled = availableModels.includes(model.id);
                  const isDownloading = downloadingModel === model.id;
                  
                  return (
                    <Card key={model.id} className={isInstalled ? "border-green-200 bg-green-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{model.name}</h5>
                          {model.recommended && (
                            <Badge variant="secondary">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{model.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>Size: {model.size}</span>
                          <span>Languages: {model.languages.join(", ")}</span>
                        </div>
                        
                        {isInstalled ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700">Installed</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeModelMutation.mutate(model.id)}
                              disabled={removeModelMutation.isPending}
                            >
                              Remove
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
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download {model.size}
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
                <h4 className="font-medium mb-4">Test AI Generation</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model-select">Select Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a model to test" />
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
                    <Label htmlFor="test-prompt">Test Prompt</Label>
                    <textarea
                      id="test-prompt"
                      className="w-full h-20 p-3 border rounded-md resize-none"
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder="Enter a test prompt..."
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
                        Generating...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Test AI Generation
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
          <CardTitle className="text-green-800">Iranian Market Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-green-800 mb-2">✅ Compliance Features</h5>
              <ul className="space-y-1 text-green-700">
                <li>• Complete data sovereignty</li>
                <li>• No external AI service dependencies</li>
                <li>• Persian/Farsi language processing</li>
                <li>• Local model storage and execution</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-green-800 mb-2">🚀 Recommended Setup</h5>
              <ul className="space-y-1 text-green-700">
                <li>• Start with Llama 3.2 (3B) model</li>
                <li>• Download Persian LLM for best results</li>
                <li>• Test generation before student use</li>
                <li>• Monitor performance and upgrade as needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}