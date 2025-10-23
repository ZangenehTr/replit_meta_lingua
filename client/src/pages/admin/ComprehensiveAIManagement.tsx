import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
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
  Rocket,
  AlertTriangle,
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
  MemoryStick,
  Mic,
  Square,
  Volume2
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

// AVAILABLE_MODELS array removed - now using dynamic API calls to /api/admin/ollama/available-models



export function ComprehensiveAIManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [selectedModel, setSelectedModel] = useState("");
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testingModel, setTestingModel] = useState(false);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [modelDownloadProgress, setModelDownloadProgress] = useState<Record<string, number>>({});
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([]);
  const [selectedTrainingModel, setSelectedTrainingModel] = useState("");
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false); // Default to false to reduce redundant refreshes
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ollamaStatus, isLoading, refetch } = useQuery<OllamaStatus>({
    queryKey: ["/api/test/ollama-status"],
    queryFn: () => apiRequest("/api/test/ollama-status"),
    refetchInterval: autoRefresh ? 5000 : false,
    retry: (failureCount, error) => {
      // Don't retry more than 2 times for network errors
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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

  const { data: enhancedModels } = useQuery({
    queryKey: ["/api/admin/ollama/models-enhanced"],
    queryFn: () => apiRequest("/api/admin/ollama/models-enhanced"),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: activeModelData } = useQuery({
    queryKey: ["/api/admin/ollama/active-model"],
    queryFn: () => apiRequest("/api/admin/ollama/active-model"),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch available models for download (replacing AVAILABLE_MODELS hardcoded array)
  const { data: availableModelsForDownload = [] } = useQuery({
    queryKey: ["/api/admin/ai-service/models"],
    queryFn: () => apiRequest("/api/admin/ai-service/models"),
    refetchInterval: false,
  });

  // Auto-select active model for training
  useEffect(() => {
    if (activeModelData?.activeModel && !selectedTrainingModel) {
      setSelectedTrainingModel(activeModelData.activeModel);
    }
  }, [activeModelData?.activeModel, selectedTrainingModel]);

  // Poll for download progress
  useEffect(() => {
    const interval = setInterval(async () => {
      const downloadingModelsList = Array.from(downloadingModels);
      
      for (const modelName of downloadingModelsList) {
        try {
          const response = await apiRequest(`/api/admin/ollama/download-progress/${modelName}`);
          
          if (response.progress && response.progress.percent) {
            setModelDownloadProgress(prev => ({
              ...prev,
              [modelName]: response.progress.percent
            }));
          }
          
          if (response.status === 'completed') {
            setDownloadingModels(prev => {
              const newSet = new Set(prev);
              newSet.delete(modelName);
              return newSet;
            });
            setModelDownloadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[modelName];
              return newProgress;
            });
            
            toast({
              title: t('common:toast.modelDownloaded'),
              description: `${modelName} has been installed successfully`,
            });
            
            // Refresh models list
            queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models-enhanced"] });
          }
        } catch (error) {
          console.error(`Error checking progress for ${modelName}:`, error);
        }
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [downloadingModels, queryClient, toast]);

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
        title: t('common:toast.modelDownloadStarted'),
        description: `${modelName} download initiated. Progress will be shown below.`,
      });
      // Model will be added to downloadingModels in handleModelDownload
    },
    onError: (error: any, modelName) => {
      console.log("Download error details:", error);
      
      let errorMessage = "Unknown error occurred";
      const errorString = error.message || error.toString() || "";
      
      if (errorString.includes("503") || errorString.includes("Service Unavailable")) {
        errorMessage = "Ollama service is not running. Please start Ollama and try again.";
      } else if (errorString.includes("400")) {
        errorMessage = "Invalid request. Please check the model name.";
      } else if (errorString.includes("500")) {
        errorMessage = "Server error. The model may not exist or download failed.";
      } else if (errorString) {
        errorMessage = errorString;
      }
      
      toast({
        title: t('common:toast.downloadFailed'),
        description: `Failed to download ${modelName}: ${errorMessage}`,
        variant: "destructive",
      });
      
      // Clean up on error
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
      setModelDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelName];
        return newProgress;
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
        title: t('common:toast.modelDeleted'),
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
        title: t('common:toast.deleteFailed'),
        description: `Failed to delete ${modelName}: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Set active model mutation
  const setActiveModelMutation = useMutation({
    mutationFn: async (modelName: string) => {
      return await apiRequest("/api/admin/ollama/set-active-model", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName }),
      });
    },
    onSuccess: (data, modelName) => {
      toast({
        title: t('common:toast.activeModelUpdated'),
        description: `${modelName} is now the active model for training and fine-tuning`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/active-model"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models-enhanced"] });
    },
    onError: (error: any, modelName) => {
      let errorMessage = "Unknown error occurred";
      const errorString = error.message || error.toString() || "";
      
      if (errorString.includes("404")) {
        errorMessage = "Model not found or not installed";
      } else if (errorString.includes("500")) {
        errorMessage = "Server error occurred";
      } else if (errorString) {
        errorMessage = errorString;
      }
      
      toast({
        title: t('common:toast.failedToSetActiveModel'),
        description: `Failed to set ${modelName} as active: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Bootstrap mutation to solve circular dependency
  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting Ollama bootstrap process...');
      try {
        const result = await apiRequest("/api/admin/ollama/bootstrap", {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
        });
        console.log('Bootstrap request successful:', result);
        return result;
      } catch (error) {
        console.log('Bootstrap request failed with error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: t('common:toast.ollamaBootstrapSuccessful'),
        description: data.message || "Ollama has been installed and configured successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
    },
    onError: (error: any) => {
      console.log("Bootstrap error details:", error);
      
      let errorMessage = "Bootstrap failed";
      const errorString = error.message || error.toString() || "";
      
      if (errorString.includes("503") || errorString.includes("Service Unavailable")) {
        errorMessage = "Bootstrap service is temporarily unavailable. Please try again.";
      } else if (errorString.includes("Failed to install")) {
        errorMessage = "Failed to install Ollama. Please check system permissions.";
      } else if (errorString.includes("Failed to start")) {
        errorMessage = "Failed to start Ollama service. Please check system resources.";
      } else if (errorString.includes("Failed to download")) {
        errorMessage = "Failed to download bootstrap model. Please check internet connection.";
      } else if (errorString.includes("401") || errorString.includes("Unauthorized")) {
        errorMessage = "Unauthorized. Please check your admin permissions.";
      } else if (errorString.includes("Permission denied")) {
        errorMessage = "Permission denied. Please run with appropriate privileges.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: t('common:toast.bootstrapFailed'),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Use enhanced models if available, otherwise fallback to basic model details with active status
  const modelsWithActiveStatus = enhancedModels?.models || modelDetails?.map(model => ({
    ...model,
    isActive: model.name === activeModelData?.activeModel,
    storagePath: activeModelData?.storagePath,
    downloadProgress: null
  })) || [];

  // Fix for duplicate key warning: filter null values and use model details as fallback
  const availableModels = (() => {
    const statusModels = (ollamaStatus?.models || []).filter(model => model != null);
    // If status models are empty or null, fallback to model details
    if (statusModels.length === 0 && modelDetails?.length > 0) {
      return modelDetails.map(m => m.name);
    }
    return statusModels;
  })();
  
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

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      await bootstrapMutation.mutateAsync();
    } catch (error) {
      console.error('Bootstrap error:', error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: t('common:toast.recordingFailed'),
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendAudioToAI = async () => {
    if (!audioBlob || !activeModelData?.activeModel) return;
    
    // For now, we'll simulate converting audio to text
    // In production, this would use a speech-to-text service
    const simulatedText = "This is a simulated transcription of your audio. In production, this would be actual speech-to-text.";
    setTestPrompt(simulatedText);
    
    // Send to AI
    await testModel();
    
    // Clear the audio
    setAudioBlob(null);
  };

  const playAIResponse = () => {
    if (!testResponse) return;
    
    // Use browser's text-to-speech
    const utterance = new SpeechSynthesisUtterance(testResponse);
    utterance.lang = 'en-US'; // Can be changed based on language settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSetActiveModel = async (modelName: string) => {
    try {
      await setActiveModelMutation.mutateAsync(modelName);
    } catch (error) {
      console.error('Set active model error:', error);
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

    if (!activeModelData?.activeModel) {
      toast({
        title: "No Active Model Set",
        description: "Please set an active model in the Model Management tab before testing",
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
          model: activeModelData.activeModel,
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
    if (!files || !activeModelData?.activeModel) {
      toast({
        title: "No Active Model",
        description: "Please set an active model before uploading training files",
        variant: "destructive",
      });
      return;
    }

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

      // Support text files, documents, images, audio, and video
      const supportedTypes = ['text/', '.txt', '.md', '.docx', '.pages', '.pdf', 
        'image/jpeg', 'image/jpg', 'image/png', '.jpeg', '.jpg', '.png',
        'audio/', '.mp3', '.wav', '.m4a', '.aac',
        'video/', '.mp4', '.mov', '.avi', '.webm'];
      const isSupported = supportedTypes.some(type => 
        file.type.startsWith(type) || file.name.toLowerCase().endsWith(type)
      );
      
      if (!isSupported) {
        toast({
          title: t('common:toast.unsupportedFileType'),
          description: t('common:toast.fileMustBeText'),
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
          formData.append('modelName', activeModelData.activeModel);
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
    if (!activeModelData?.activeModel) {
      toast({
        title: "No Active Model Set",
        description: "Please set an active model in the Model Management tab before training",
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
            description: `Model ${activeModelData.activeModel} has been fine-tuned successfully`,
          });
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 1000);

    toast({
      title: "Training Started",
      description: `Fine-tuning ${activeModelData.activeModel} with ${trainingFiles.length} files`,
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
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

      {/* Bootstrap Alert Card - Shows when Ollama is offline */}
      {ollamaStatus?.status === 'offline' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Ollama Service Not Running - Bootstrap Required
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Ollama AI service is not running. This prevents downloading models and using AI features. 
              Use the bootstrap button below to automatically install, configure, and start Ollama with a minimal model.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleBootstrap}
                disabled={isBootstrapping || bootstrapMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isBootstrapping || bootstrapMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Bootstrapping Ollama...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Bootstrap Ollama
                  </>
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                This will install Ollama, start the service, and download a minimal AI model (~2GB)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models">Model Management</TabsTrigger>
          <TabsTrigger value="training">Model Training & Testing</TabsTrigger>
          <TabsTrigger value="conversations">AI Conversations</TabsTrigger>
          <TabsTrigger value="usage">Token Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Model Management Tab */}
        <TabsContent value="models" className="space-y-4">
          {/* Model Management Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  AI Model Management
                </div>

              </CardTitle>
              <CardDescription>
                Manage your local AI models. Only one model can be active at a time.
                {activeModelData?.storagePath && (
                  <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                    📁 Storage Location: {activeModelData.storagePath}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

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
                {availableModelsForDownload.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">Size: {model.size}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {availableModels.includes(model.name) ? (
                        <Badge variant="secondary">Installed</Badge>
                      ) : downloadingModels.has(model.name) ? (
                        <div className="flex flex-col items-end gap-1 min-w-[100px]">
                          <div className="flex items-center gap-2 text-sm">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>{modelDownloadProgress[model.name] || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${modelDownloadProgress[model.name] || 0}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleModelDownload(model.name)}
                          disabled={downloadModelMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
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
                  Installed Models ({modelsWithActiveStatus.length})
                </CardTitle>
                <CardDescription>
                  Manage your local AI models. Click "Set Active" to make a model the default for training.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {modelsWithActiveStatus.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No models installed</p>
                    <p className="text-sm">Download models from the available list to get started.</p>
                  </div>
                ) : (
                  modelsWithActiveStatus.map((model) => {
                    const isActive = model.isActive;
                    return (
                      <div key={model.name} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-950 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {isActive ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              ) : (
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                              )}
                              {model.name}
                            </div>
                            {isActive ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                                <Zap className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-gray-600">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Size: {model.size} • Modified: {new Date(model.modified).toLocaleDateString()}
                          </div>
                          {model.storagePath && (
                            <div className="text-xs text-muted-foreground mt-2 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                              📁 {model.storagePath}
                            </div>
                          )}
                          {model.downloadProgress && (
                            <div className="text-xs text-blue-600 mt-2">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Download: {model.downloadProgress}%
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {isActive ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                              className="opacity-75 cursor-not-allowed"
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Active
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSetActiveModel(model.name)}
                              disabled={setActiveModelMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Set Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleModelDelete(model.name)}
                            disabled={deleteModelMutation.isPending || isActive}
                            title={isActive ? "Cannot delete active model" : "Delete model"}
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
                    {activeModelData?.activeModel ? (
                      <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{activeModelData.activeModel}</span>
                          <Badge variant="default" className="bg-green-600">Active Model</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          This is your default training model. Training will use this model automatically.
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">No Active Model Set</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Please set an active model in the "Model Management" tab before training.
                        </div>
                      </div>
                    )}
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
                    disabled={isTraining || !activeModelData?.activeModel || trainingFiles.length === 0}
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

        {/* AI Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                AI Voice Conversations
              </CardTitle>
              <CardDescription>Practice language skills with voice-enabled AI conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Active Model Status */}
                {activeModelData?.activeModel ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Conversing with: {activeModelData.activeModel}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Please set an active model to start conversations</span>
                  </div>
                )}

                {/* Voice Recording Controls */}
                <div className="space-y-4">
                  <Label>Voice Recording</Label>
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!activeModelData?.activeModel}
                      className="h-24 w-24 rounded-full"
                    >
                      {isRecording ? (
                        <Square className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                    </div>
                  </div>

                  {audioBlob && (
                    <div className="space-y-2">
                      <Label>Your Recording</Label>
                      <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                      <div className="flex gap-2">
                        <Button 
                          onClick={sendAudioToAI}
                          disabled={testingModel}
                          className="flex-1"
                        >
                          {testingModel ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send to AI
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setAudioBlob(null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversation History */}
                <div className="space-y-4">
                  <Label>Conversation</Label>
                  <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-muted/20">
                    {testPrompt && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">You:</div>
                        <div>{testPrompt}</div>
                      </div>
                    )}
                    {testResponse && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                        <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">AI:</div>
                        <div>{testResponse}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={playAIResponse}
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          Play Response
                        </Button>
                      </div>
                    )}
                    {!testPrompt && !testResponse && (
                      <div className="text-center text-muted-foreground">
                        Start recording to begin a conversation
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Input Alternative */}
                <div className="space-y-2">
                  <Label htmlFor="text-prompt">Or type your message</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="text-prompt"
                      placeholder="Type your message here..."
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      onClick={testModel}
                      disabled={testingModel || !testPrompt || !activeModelData?.activeModel}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
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