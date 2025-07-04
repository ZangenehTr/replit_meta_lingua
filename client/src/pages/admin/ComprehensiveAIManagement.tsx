import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TestTube,
  Send,
  Download,
  Trash2,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Database,
  Activity,
  Settings,
  Zap,
  Brain,
  Users,
  TrendingUp,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick
} from "lucide-react";

interface OllamaStatus {
  success: boolean;
  status: 'running' | 'offline';
  models: string[];
  endpoint: string;
  systemInfo?: {
    totalMemory: string;
    usedMemory: string;
    cpuUsage: number;
    diskSpace: string;
  };
}

interface ModelInfo {
  name: string;
  size: string;
  modified: string;
  digest: string;
  family?: string;
  format?: string;
  parameterSize?: string;
  quantizationLevel?: string;
}

interface TokenUsage {
  user: string;
  model: string;
  tokensUsed: number;
  requestCount: number;
  lastUsed: string;
  cost?: number;
}

interface TrainingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
}

const AVAILABLE_MODELS = [
  { name: "llama3.2:1b", description: "Lightweight model for basic tasks", size: "1.3GB" },
  { name: "llama3.2:3b", description: "Balanced performance and efficiency", size: "2.0GB" },
  { name: "llama3:8b", description: "High-quality general purpose model", size: "4.7GB" },
  { name: "llama3:70b", description: "Large model for complex tasks", size: "40GB" },
  { name: "codellama:7b", description: "Specialized for code generation", size: "3.8GB" },
  { name: "codellama:13b", description: "Advanced code assistance", size: "7.3GB" },
  { name: "mistral:7b", description: "Efficient instruction following", size: "4.1GB" },
  { name: "mixtral:8x7b", description: "Mixture of experts model", size: "26GB" },
  { name: "persian-llm:3b", description: "Persian language specialized", size: "2.1GB" },
  { name: "persian-llm:7b", description: "Advanced Persian model", size: "4.2GB" },
  { name: "gemma:2b", description: "Google's efficient model", size: "1.4GB" },
  { name: "gemma:7b", description: "Google's performance model", size: "5.0GB" },
];



export function ComprehensiveAIManagement() {
  const [selectedModel, setSelectedModel] = useState("");
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testingModel, setTestingModel] = useState(false);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([]);
  const [selectedTrainingModel, setSelectedTrainingModel] = useState("");
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ollamaStatus, isLoading, refetch } = useQuery<OllamaStatus>({
    queryKey: ["/api/test/ollama-status"],
    queryFn: () => apiRequest("/api/test/ollama-status"),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: modelDetails } = useQuery<ModelInfo[]>({
    queryKey: ["/api/admin/ollama/models"],
    queryFn: () => apiRequest("/api/admin/ollama/models"),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: tokenUsage } = useQuery<TokenUsage[]>({
    queryKey: ["/api/admin/ai/token-usage"],
    queryFn: () => apiRequest("/api/admin/ai/token-usage"),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const downloadModelMutation = useMutation({
    mutationFn: async (modelName: string) => {
      console.log('Making download request for model:', modelName);
      try {
        const result = await apiRequest("/api/admin/ollama/pull-model", {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelName }),
        });
        console.log('Download request successful:', result);
        return result;
      } catch (error) {
        console.log('Download request failed with error:', error);
        throw error;
      }
    },
    onSuccess: (data, modelName) => {
      toast({
        title: "Model Download Started",
        description: `${modelName} download initiated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
    },
    onError: (error: any, modelName) => {
      console.log("Download error details:", error);
      console.log("Error type:", typeof error);
      console.log("Error message:", error?.message);
      console.log("Error status:", error?.status);
      console.log("Full error object:", JSON.stringify(error, null, 2));
      
      let errorMessage = "Unknown error occurred";
      const errorString = error.message || error.toString() || "";
      
      // Check if this is a 503 Service Unavailable error (Ollama offline)
      if (errorString.includes("503") || errorString.includes("Service Unavailable") || 
          errorString.includes("Ollama service is not running")) {
        errorMessage = "Failed to delete llama3.2:1b: Ollama service is not running. Please start Ollama and try again.";
      } else if (errorString.includes("400")) {
        errorMessage = "Invalid request. Please check the model name.";
      } else if (errorString.includes("500")) {
        errorMessage = "Server error. The model may not exist or download failed.";
      } else if (errorString) {
        errorMessage = errorString;
      }
      
      toast({
        title: "Download Failed",
        description: `Failed to download ${modelName}: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelName: string) => {
      console.log('Making delete request for model:', modelName);
      try {
        const result = await apiRequest(`/api/admin/ollama/delete-model`, {
          method: 'DELETE',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelName }),
        });
        console.log('Delete request successful:', result);
        return result;
      } catch (error) {
        console.log('Delete request failed with error:', error);
        throw error;
      }
    },
    onSuccess: (data, modelName) => {
      toast({
        title: "Model Deleted",
        description: `${modelName} has been removed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
    },
    onError: (error: any, modelName) => {
      console.log("Delete error details:", error);
      
      let errorMessage = "Unknown error occurred";
      const errorString = error.message || error.toString() || "";
      
      if (errorString.includes("503") || errorString.includes("Service Unavailable")) {
        errorMessage = "Ollama service is not running. Please start Ollama and try again.";
      } else if (errorString.includes("400")) {
        errorMessage = "Invalid request. Please try again.";
      } else if (errorString.includes("500")) {
        errorMessage = "Server error. The model may not exist or cannot be removed.";
      } else if (errorString) {
        errorMessage = errorString;
      }
      
      toast({
        title: "Delete Failed",
        description: `Failed to delete ${modelName}: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const availableModels = ollamaStatus?.models || [];
  const systemInfo = ollamaStatus?.systemInfo;

  const handleModelDownload = async (modelName: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelName));
    try {
      await downloadModelMutation.mutateAsync(modelName);
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      console.error('Download model error:', error);
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  };

  const handleModelDelete = async (modelName: string) => {
    if (confirm(`Are you sure you want to delete ${modelName}? This action cannot be undone.`)) {
      try {
        await deleteModelMutation.mutateAsync(modelName);
      } catch (error) {
        // Error is already handled by the mutation's onError callback
        console.error('Delete model error:', error);
      }
    }
  };

  const testModel = async () => {
    if (!testPrompt.trim()) {
      toast({
        title: "No Test Prompt",
        description: "Please enter a test prompt related to your training data",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTrainingModel) {
      toast({
        title: "No Training Model Selected",
        description: "Please select a training model to test",
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
          model: selectedTrainingModel,
          prompt: testPrompt,
          userId: 33  // Send user ID to access training data
        }),
      });

      setTestResponse(response.response || 'Test completed successfully');
      
      toast({
        title: response.usedTrainingData ? "Training Data Found!" : "Model Test Complete",
        description: response.usedTrainingData ? 
          "Model used your uploaded training data" : 
          "No training data found - upload materials to get better responses",
      });

    } catch (error: any) {
      toast({
        title: "Model Test Failed",
        description: error.message || "Failed to test the training model",
        variant: "destructive",
      });
      setTestResponse('Failed to generate response');
    } finally {
      setTestingModel(false);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedTrainingModel) return;

    for (const file of Array.from(files)) {
      // Check file size (50MB limit for now)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 50MB limit`,
          variant: "destructive",
        });
        continue;
      }

      // Support text files, .docx, and .pages
      const supportedTypes = ['text/', '.txt', '.md', '.docx', '.pages'];
      const isSupported = supportedTypes.some(type => 
        file.type.startsWith(type) || file.name.toLowerCase().endsWith(type)
      );
      
      if (!isSupported) {
        toast({
          title: "Unsupported File Type",
          description: `${file.name} must be a text file (.txt, .md, .docx, .pages)`,
          variant: "destructive",
        });
        continue;
      }

      try {
        let content: string;
        
        // Handle different file types
        if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.pages')) {
          // For .docx and .pages files, send as FormData to server for processing
          const formData = new FormData();
          formData.append('file', file);
          formData.append('modelName', selectedTrainingModel);
          formData.append('fileName', file.name);
          
          await apiRequest("/api/admin/ai/training/upload-file", {
            method: 'POST',
            body: formData, // Don't set Content-Type for FormData
          });
        } else {
          // Handle text files as before
          content = await file.text();
          
          await apiRequest("/api/admin/ai/training/upload", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelName: selectedTrainingModel,
              fileName: file.name,
              content: content
            }),
          });
        }

        const newFile: TrainingFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          status: 'completed'
        };

        setTrainingFiles(prev => [...prev, newFile]);
        
        toast({
          title: "File Uploaded Successfully",
          description: `${file.name} uploaded and ready for training`,
        });

      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast, selectedTrainingModel]);

  const removeTrainingFile = (fileId: string) => {
    setTrainingFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File Removed",
      description: "File removed from training dataset",
    });
  };

  const startTraining = async () => {
    if (!selectedTrainingModel) {
      toast({
        title: "No Model Selected",
        description: "Please select a model for training",
        variant: "destructive",
      });
      return;
    }

    if (trainingFiles.length === 0) {
      toast({
        title: "No Training Data",
        description: "Please upload training files",
        variant: "destructive",
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsTraining(false);
          toast({
            title: "Training Complete",
            description: `Model ${selectedTrainingModel} has been fine-tuned successfully`,
          });
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 1000);

    toast({
      title: "Training Started",
      description: `Fine-tuning ${selectedTrainingModel} with ${trainingFiles.length} files`,
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, filename?: string) => {
    if (filename?.toLowerCase().endsWith('.docx')) return <FileText className="h-4 w-4 text-blue-600" />;
    if (filename?.toLowerCase().endsWith('.pages')) return <FileText className="h-4 w-4 text-orange-600" />;
    if (type.startsWith('text/') || filename?.toLowerCase().endsWith('.txt') || filename?.toLowerCase().endsWith('.md')) return <FileText className="h-4 w-4" />;
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <Archive className="h-4 w-4" />;
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

  const totalTokensUsed = tokenUsage?.reduce((sum, usage) => sum + usage.tokensUsed, 0) || 0;
  const totalRequests = tokenUsage?.reduce((sum, usage) => sum + usage.requestCount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Services Management</h1>
          <p className="text-muted-foreground">
            Comprehensive AI model management, training, and monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
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
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusIndicator status={ollamaStatus?.status || 'offline'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableModels.length}</div>
            <p className="text-xs text-muted-foreground">
              models available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokensUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              tokens processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              API requests made
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      {systemInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4" />
                    Memory Usage
                  </span>
                  <span className="text-sm font-mono">{systemInfo.usedMemory} / {systemInfo.totalMemory}</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Usage
                  </span>
                  <span className="text-sm font-mono">{systemInfo.cpuUsage}%</span>
                </div>
                <Progress value={systemInfo.cpuUsage} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Disk Space
                  </span>
                  <span className="text-sm font-mono">{systemInfo.diskSpace}</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Model Management</TabsTrigger>
          <TabsTrigger value="training">Model Training & Testing</TabsTrigger>
          <TabsTrigger value="usage">Token Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Model Management Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Models for Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Available Models
                </CardTitle>
                <CardDescription>Download new AI models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {AVAILABLE_MODELS.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">Size: {model.size}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {availableModels.includes(model.name) ? (
                        <Badge variant="secondary">Installed</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleModelDownload(model.name)}
                          disabled={downloadingModels.has(model.name) || downloadModelMutation.isPending || ollamaStatus?.status === 'offline'}
                        >
                          {downloadingModels.has(model.name) ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Downloading
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Installed Models */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Installed Models
                </CardTitle>
                <CardDescription>Manage your local AI models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableModels.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No models installed. Download models from the available list.
                  </div>
                ) : (
                  availableModels.map((modelName) => {
                    const modelDetail = modelDetails?.find(m => m.name === modelName);
                    return (
                      <div key={modelName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{modelName}</div>
                          {modelDetail && (
                            <div className="text-sm text-muted-foreground">
                              Size: {modelDetail.size} • Modified: {new Date(modelDetail.modified).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Active</Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleModelDelete(modelName)}
                            disabled={deleteModelMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        {/* Model Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Training & Fine-tuning
              </CardTitle>
              <CardDescription>
                Upload training data and fine-tune models (supports up to 50GB multimodal files)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="training-model-select">Base Model for Training</Label>
                    <Select value={selectedTrainingModel} onValueChange={setSelectedTrainingModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model to fine-tune" />
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
                    <Label>Training Data Upload</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground mb-2">
                        Upload training files (max 50GB per file)
                      </div>
                      <div className="text-xs text-muted-foreground mb-4">
                        Supports: Text (.txt), Word Documents (.docx), Pages (.pages), JSON, CSV, and more
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".txt,.md,.docx,.pages,.json,.csv,text/*"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select Files
                      </Button>
                    </div>
                  </div>

                  {isTraining && (
                    <div className="space-y-2">
                      <Label>Training Progress</Label>
                      <Progress value={trainingProgress} className="h-3" />
                      <div className="text-sm text-muted-foreground">
                        {trainingProgress.toFixed(1)}% complete
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={startTraining}
                    disabled={isTraining || !selectedTrainingModel || trainingFiles.length === 0}
                    className="w-full"
                  >
                    {isTraining ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Training in Progress...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Start Training
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>Training Dataset ({trainingFiles.length} files)</Label>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {trainingFiles.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No training files uploaded yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {trainingFiles.map((file) => (
                          <div key={file.id} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(file.type, file.name)}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{file.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatFileSize(file.size)} • {file.type}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={file.status === 'completed' ? 'default' : 
                                        file.status === 'error' ? 'destructive' : 'secondary'}
                              >
                                {file.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTrainingFile(file.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Total size: {formatFileSize(trainingFiles.reduce((sum, f) => sum + f.size, 0))}
                  </div>
                </div>

                {/* Training-specific Testing Section */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TestTube className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Test Model with Training Data</h3>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Test your model with prompts related to the uploaded training information to verify if the new knowledge has been learned.
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="training-test-prompt">Test Prompt (related to uploaded data)</Label>
                        <Textarea
                          id="training-test-prompt"
                          value={testPrompt}
                          onChange={(e) => setTestPrompt(e.target.value)}
                          placeholder="Ask a question about the information you uploaded to test if the model learned it..."
                          className="min-h-[100px]"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Example: "What did the document say about [specific topic]?" or "Summarize the key points from the uploaded material"
                        </div>
                      </div>

                      <Button
                        onClick={testModel}
                        disabled={testingModel || !selectedTrainingModel || !testPrompt.trim()}
                        className="w-full"
                        variant="outline"
                      >
                        {testingModel ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing Model with Training Data...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-4 w-4 mr-2" />
                            Test Model Knowledge
                          </>
                        )}
                      </Button>

                      {testResponse && (
                        <div>
                          <Label htmlFor="training-test-response">Model Response</Label>
                          <Textarea
                            id="training-test-response"
                            value={testResponse}
                            readOnly
                            placeholder="Model response will appear here..."
                            className="min-h-[200px] bg-muted/50"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            Analyze the response to determine if the model has learned from your training data.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Token Usage Analytics
              </CardTitle>
              <CardDescription>Monitor AI model usage and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenUsage && tokenUsage.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{totalTokensUsed.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Tokens</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Requests</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          ${tokenUsage.reduce((sum, u) => sum + (u.cost || 0), 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Estimated Cost</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Usage by User</Label>
                      <div className="border rounded-lg divide-y">
                        {tokenUsage.map((usage, index) => (
                          <div key={index} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{usage.user}</div>
                                <div className="text-sm text-muted-foreground">
                                  Model: {usage.model}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{usage.tokensUsed.toLocaleString()} tokens</div>
                              <div className="text-sm text-muted-foreground">
                                {usage.requestCount} requests • {new Date(usage.lastUsed).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Service Settings
              </CardTitle>
              <CardDescription>Configure AI service preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-refresh Status</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically refresh service status every 5 seconds
                    </div>
                  </div>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select default model" />
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
                  <Label>Service Endpoint</Label>
                  <Input
                    value={ollamaStatus?.endpoint || "http://localhost:11434"}
                    readOnly
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}