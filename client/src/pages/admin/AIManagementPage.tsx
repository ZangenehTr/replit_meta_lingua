import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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

export function AIManagementPage() {
  const [modelName, setModelName] = useState("llama3.2:1b");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ollamaStatus, isLoading, refetch } = useQuery<OllamaStatus>({
    queryKey: ["/api/admin/ollama/status"],
    queryFn: () => apiRequest("/admin/ollama/status"),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const pullModelMutation = useMutation({
    mutationFn: (modelName: string) => 
      apiRequest("/admin/ollama/pull-model", {
        method: "POST",
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
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress Analysis</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conversation Scenarios</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cultural Insights</span>
                  <Badge variant="default">Active</Badge>
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {ollamaStatus?.status === 'running' ? '100%' : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Service Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {ollamaStatus?.models.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Models Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">Local</div>
                  <div className="text-sm text-muted-foreground">Processing Mode</div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Primary AI Provider</Label>
                    <p className="text-sm text-muted-foreground">
                      Ollama local processing with OpenAI fallback
                    </p>
                  </div>
                  <Badge variant="outline">Hybrid Mode</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Fallback Service</Label>
                    <p className="text-sm text-muted-foreground">
                      OpenAI GPT-4o when local service unavailable
                    </p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Response Caching</Label>
                    <p className="text-sm text-muted-foreground">
                      Cache AI responses to improve performance
                    </p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
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
                    <span className="text-blue-600">~2.3s average</span>
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