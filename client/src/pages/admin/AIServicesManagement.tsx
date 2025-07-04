import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Server, 
  CheckCircle, 
  XCircle, 
  Download,
  Settings,
  Activity,
  Users,
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);

  // Query service status
  const { data: serviceStatus, isLoading: statusLoading } = useQuery<{
    isRunning: boolean;
    isEnabled: boolean;
  }>({
    queryKey: ['/api/admin/ai/service-status'],
    refetchInterval: 5000
  });

  // Query installed models
  const { data: installedModels = [], isLoading: modelsLoading } = useQuery<Array<{
    id: string;
    name: string;
    size: string;
    downloadProgress?: number;
  }>>({
    queryKey: ['/api/admin/ai/installed-models'],
    refetchInterval: downloadingModel ? 2000 : 10000
  });

  // Query active model
  const { data: activeModelData } = useQuery<{
    modelId: string;
  }>({
    queryKey: ['/api/admin/ai/active-model']
  });

  // Query usage statistics
  const { data: usageStats } = useQuery<{
    activeStudents: number;
    totalConversations: number;
    avgDuration: number;
    recentSessions?: Array<{
      studentName: string;
      duration: number;
    }>;
  }>({
    queryKey: ['/api/admin/ai/usage-stats']
  });

  // Start service mutation
  const startService = useMutation({
    mutationFn: () => apiRequest('/api/admin/ai/start-service', {
      method: 'POST'
    }),
    onSuccess: () => {
      toast({ title: "AI service started successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/service-status'] });
    },
    onError: () => {
      toast({ 
        title: "Failed to start AI service", 
        variant: "destructive" 
      });
    }
  });

  // Install model mutation
  const installModel = useMutation({
    mutationFn: (modelId: string) => apiRequest('/api/admin/ai/install-model', {
      method: 'POST',
      body: JSON.stringify({ modelId })
    }),
    onMutate: (modelId) => {
      setDownloadingModel(modelId);
    },
    onSuccess: () => {
      toast({ title: "Model installation started" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/installed-models'] });
    },
    onError: () => {
      toast({ 
        title: "Failed to start model installation", 
        variant: "destructive" 
      });
      setDownloadingModel(null);
    }
  });

  // Set active model mutation
  const setActiveModel = useMutation({
    mutationFn: (modelId: string) => apiRequest('/api/admin/ai/set-active-model', {
      method: 'POST',
      body: JSON.stringify({ modelId })
    }),
    onSuccess: () => {
      toast({ title: "Active model updated" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/active-model'] });
    }
  });

  // Toggle service mutation
  const toggleService = useMutation({
    mutationFn: (enable: boolean) => apiRequest('/api/admin/ai/toggle-service', {
      method: 'POST',
      body: JSON.stringify({ enable })
    }),
    onSuccess: (_, enable) => {
      toast({ title: `AI service ${enable ? 'enabled' : 'disabled'}` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/service-status'] });
    }
  });

  const isModelInstalled = (modelId: string) => {
    return installedModels.some((m: any) => m.id === modelId);
  };

  const getModelInstallProgress = (modelId: string) => {
    const model = installedModels.find((m: any) => m.id === modelId);
    return model?.downloadProgress || 0;
  };

  return (
    <div className="space-y-6">
      {/* Service Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            AI Service Status
          </CardTitle>
          <CardDescription>
            Manage the AI service that powers student conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Service Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  serviceStatus?.isRunning ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {serviceStatus?.isRunning ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Service Status</p>
                  <p className="text-sm text-muted-foreground">
                    {serviceStatus?.isRunning ? 'Running' : 'Stopped'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceStatus?.isEnabled || false}
                  onCheckedChange={(checked) => toggleService.mutate(checked)}
                  disabled={toggleService.isPending}
                />
                {!serviceStatus?.isRunning && serviceStatus?.isEnabled && (
                  <Button
                    size="sm"
                    onClick={() => startService.mutate()}
                    disabled={startService.isPending}
                  >
                    <Rocket className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}
              </div>
            </div>

            {/* Active Model Selection */}
            {serviceStatus?.isRunning && (
              <div className="space-y-2">
                <Label>Active Model for Student Conversations</Label>
                <div className="flex gap-2">
                  <Select
                    value={activeModelData?.modelId || selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select active model" />
                    </SelectTrigger>
                    <SelectContent>
                      {installedModels.map((model: any) => (
                        <SelectItem key={model.id} value={model.id}>
                          {RECOMMENDED_MODELS.find(m => m.id === model.id)?.name || model.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setActiveModel.mutate(selectedModel)}
                    disabled={!selectedModel || setActiveModel.isPending}
                  >
                    Set Active
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Language Models
          </CardTitle>
          <CardDescription>
            Install and manage AI models for student language learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {RECOMMENDED_MODELS.map((model) => {
              const installed = isModelInstalled(model.id);
              const isDownloading = downloadingModel === model.id;
              const progress = getModelInstallProgress(model.id);
              const isActive = activeModelData?.modelId === model.id;

              return (
                <div
                  key={model.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{model.name}</h4>
                        {model.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Size: {model.size}</span>
                        <span>Languages: {model.languages.join(", ")}</span>
                      </div>
                    </div>
                    
                    <div>
                      {installed ? (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Installed
                        </Badge>
                      ) : isDownloading ? (
                        <Badge variant="outline">
                          <Download className="w-3 h-3 mr-1 animate-pulse" />
                          Downloading
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => installModel.mutate(model.id)}
                          disabled={!serviceStatus?.isRunning}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Install
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isDownloading && progress > 0 && (
                    <Progress value={progress} className="h-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>
            Monitor how students are using the AI conversation feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
              <p className="text-2xl font-bold">
                {usageStats?.activeStudents || 0}
              </p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Conversations</p>
              </div>
              <p className="text-2xl font-bold">
                {usageStats?.totalConversations || 0}
              </p>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
              </div>
              <p className="text-2xl font-bold">
                {usageStats?.avgDuration || "0"}m
              </p>
              <p className="text-xs text-muted-foreground">Per conversation</p>
            </div>
          </div>

          {/* Recent Activity Summary */}
          {usageStats?.recentSessions && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Recent Activity</p>
              <div className="space-y-1">
                {usageStats.recentSessions.map((session: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{session.studentName}</span>
                    <span className="text-muted-foreground">
                      {session.duration}m conversation
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Student AI Conversation Feature</p>
              <p className="text-sm text-muted-foreground">
                Students can practice conversations by holding the microphone button and speaking. 
                The AI will respond with voice in their selected language (English/Farsi).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}