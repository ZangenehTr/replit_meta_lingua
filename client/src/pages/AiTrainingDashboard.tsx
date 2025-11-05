/**
 * AI Training Dashboard - Manage AI models, datasets, and training jobs
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Database, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Upload,
  BarChart3,
  TrendingUp,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AiModel {
  id: number;
  modelName: string;
  baseModel: string;
  version: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  performanceMetrics?: {
    accuracy?: number;
    loss?: number;
    training_time?: number;
  };
  createdAt: string;
}

interface TrainingJob {
  id: number;
  jobId: string;
  modelName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  trainingConfig?: any;
  createdAt: string;
}

interface TrainingDataset {
  id: number;
  name: string;
  description: string;
  dataType: string;
  language: string;
  sourceType: string;
  dataCount: number;
  totalSize: number;
  isActive: boolean;
  qualityScore?: number;
  createdAt: string;
}

interface TrainingStats {
  totalTrainingData: number;
  totalModels: number;
  totalDatasets: number;
  activeJobs: number;
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    pending: { variant: "secondary" as const, icon: Clock, color: "text-orange-500" },
    running: { variant: "default" as const, icon: Play, color: "text-blue-500" },
    completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-500" },
    failed: { variant: "destructive" as const, icon: XCircle, color: "text-red-500" },
    cancelled: { variant: "secondary" as const, icon: Pause, color: "text-gray-500" }
  };

  const config = variants[status as keyof typeof variants] || variants.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function AiTrainingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [showCreateDataset, setShowCreateDataset] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);

  // Fetch training statistics
  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ["/api/ai-training-data/stats"],
    queryFn: () => apiRequest("/api/ai-training-data/stats")
  });

  // Fetch AI models
  const { data: models = [] } = useQuery<AiModel[]>({
    queryKey: ["/api/ai-models"],
    queryFn: () => apiRequest("/api/ai-models")
  });

  // Fetch training jobs
  const { data: jobs = [] } = useQuery<TrainingJob[]>({
    queryKey: ["/api/ai-training-jobs"],
    queryFn: () => apiRequest("/api/ai-training-jobs")
  });

  // Fetch training datasets
  const { data: datasets = [] } = useQuery<TrainingDataset[]>({
    queryKey: ["/api/ai-datasets"],
    queryFn: () => apiRequest("/api/ai-datasets")
  });

  // Activate model mutation
  const activateModelMutation = useMutation({
    mutationFn: (modelId: number) => 
      apiRequest(`/api/ai-models/${modelId}/activate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      toast({ title: "Model activated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to activate model", variant: "destructive" });
    }
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: (jobId: number) => 
      apiRequest(`/api/ai-training-jobs/${jobId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-training-jobs"] });
      toast({ title: "Training job cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel job", variant: "destructive" });
    }
  });

  const activeModel = models.find(m => m.isActive);
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Training Management</h1>
          <p className="text-muted-foreground">
            Manage AI models, training datasets, and training jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModel(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
          <Button onClick={() => setShowCreateDataset(true)} variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
          <Button onClick={() => setShowCreateJob(true)} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Start Training
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Training Data</p>
                <p className="text-2xl font-bold">{stats?.totalTrainingData || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Models</p>
                <p className="text-2xl font-bold">{stats?.totalModels || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{runningJobs}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedJobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Active Model */}
      {activeModel && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Currently Active Model
                </h3>
                <p className="text-green-600 dark:text-green-300">
                  {activeModel.modelName} v{activeModel.version}
                </p>
                <p className="text-sm text-green-500 dark:text-green-400">
                  {activeModel.description}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                {activeModel.performanceMetrics?.accuracy && (
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    Accuracy: {(activeModel.performanceMetrics.accuracy * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="jobs">Training Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Training Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Training Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{job.modelName}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={job.status} />
                        {job.status === 'running' && (
                          <Progress value={job.progress} className="w-20 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Models */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Available Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {models.slice(0, 5).map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{model.modelName}</p>
                        <p className="text-sm text-muted-foreground">
                          Base: {model.baseModel} v{model.version}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {model.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => activateModelMutation.mutate(model.id)}
                            disabled={activateModelMutation.isPending}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {model.modelName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Base Model: {model.baseModel} • Version: {model.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.isActive && <Badge variant="default">Active</Badge>}
                      {!model.isActive && (
                        <Button 
                          size="sm" 
                          onClick={() => activateModelMutation.mutate(model.id)}
                          disabled={activateModelMutation.isPending}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{model.description}</p>
                  {model.performanceMetrics && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {model.performanceMetrics.accuracy && (
                        <div>
                          <span className="text-muted-foreground">Accuracy:</span>
                          <p className="font-medium">{(model.performanceMetrics.accuracy * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {model.performanceMetrics.loss && (
                        <div>
                          <span className="text-muted-foreground">Loss:</span>
                          <p className="font-medium">{model.performanceMetrics.loss.toFixed(3)}</p>
                        </div>
                      )}
                      {model.performanceMetrics.training_time && (
                        <div>
                          <span className="text-muted-foreground">Training Time:</span>
                          <p className="font-medium">{Math.round(model.performanceMetrics.training_time / 60)}m</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="datasets" className="space-y-4">
          <div className="grid gap-4">
            {datasets.map((dataset) => (
              <Card key={dataset.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {dataset.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {dataset.dataType} • {dataset.language} • {dataset.sourceType}
                      </p>
                    </div>
                    <Badge variant={dataset.isActive ? "default" : "secondary"}>
                      {dataset.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{dataset.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data Count:</span>
                      <p className="font-medium">{dataset.dataCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <p className="font-medium">{(dataset.totalSize / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    {dataset.qualityScore && (
                      <div>
                        <span className="text-muted-foreground">Quality:</span>
                        <p className="font-medium">{dataset.qualityScore.toFixed(1)}/5.0</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {job.modelName} Training
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Job ID: {job.jobId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} />
                      {job.status === 'running' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => cancelJobMutation.mutate(job.id)}
                          disabled={cancelJobMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <p className="font-medium">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <p className="font-medium">
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'Running...'}
                      </p>
                    </div>
                  </div>
                  
                  {job.errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>Error:</strong> {job.errorMessage}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Model Dialog */}
      <Dialog open={showCreateModel} onOpenChange={setShowCreateModel}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New AI Model</DialogTitle>
            <DialogDescription>
              Define a new AI model configuration for training.
            </DialogDescription>
          </DialogHeader>
          <CreateModelForm onSuccess={() => setShowCreateModel(false)} />
        </DialogContent>
      </Dialog>

      {/* Create Dataset Dialog */}
      <Dialog open={showCreateDataset} onOpenChange={setShowCreateDataset}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Training Dataset</DialogTitle>
            <DialogDescription>
              Create a new dataset for training AI models.
            </DialogDescription>
          </DialogHeader>
          <CreateDatasetForm onSuccess={() => setShowCreateDataset(false)} />
        </DialogContent>
      </Dialog>

      {/* Create Training Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Training Job</DialogTitle>
            <DialogDescription>
              Configure and start a new model training job.
            </DialogDescription>
          </DialogHeader>
          <CreateTrainingJobForm onSuccess={() => setShowCreateJob(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form Components
function CreateModelForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    modelName: '',
    baseModel: 'llama3.2',
    version: '1.0.0',
    description: ''
  });

  const createModelMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("/api/ai-models", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-models"] });
      toast({ title: "AI model created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create AI model", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createModelMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="modelName">Model Name</Label>
        <Input
          id="modelName"
          value={formData.modelName}
          onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
          placeholder="e.g., persian-tutor-v1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="baseModel">Base Model</Label>
        <Select value={formData.baseModel} onValueChange={(value) => setFormData({ ...formData, baseModel: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="llama3.2">Llama 3.2</SelectItem>
            <SelectItem value="llama3.1">Llama 3.1</SelectItem>
            <SelectItem value="mistral">Mistral</SelectItem>
            <SelectItem value="codellama">CodeLlama</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="version">Version</Label>
        <Input
          id="version"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          placeholder="1.0.0"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the model's purpose and capabilities"
        />
      </div>
      
      <Button type="submit" disabled={createModelMutation.isPending}>
        {createModelMutation.isPending ? "Creating..." : "Create Model"}
      </Button>
    </form>
  );
}

function CreateDatasetForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataType: 'conversation',
    language: 'fa',
    sourceType: 'callern_calls'
  });

  const createDatasetMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("/api/ai-datasets", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-datasets"] });
      toast({ title: "Training dataset created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create dataset", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDatasetMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Dataset Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Persian Conversations Dataset"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="dataType">Data Type</Label>
        <Select value={formData.dataType} onValueChange={(value) => setFormData({ ...formData, dataType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conversation">Conversation</SelectItem>
            <SelectItem value="vocabulary">Vocabulary</SelectItem>
            <SelectItem value="grammar">Grammar</SelectItem>
            <SelectItem value="pronunciation">Pronunciation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="language">Language</Label>
        <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fa">Persian (Farsi)</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="sourceType">Source Type</Label>
        <Select value={formData.sourceType} onValueChange={(value) => setFormData({ ...formData, sourceType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="callern_calls">Callern Video Calls</SelectItem>
            <SelectItem value="user_activity">User Activities</SelectItem>
            <SelectItem value="manual_upload">Manual Upload</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the dataset content and purpose"
        />
      </div>
      
      <Button type="submit" disabled={createDatasetMutation.isPending}>
        {createDatasetMutation.isPending ? "Creating..." : "Create Dataset"}
      </Button>
    </form>
  );
}

function CreateTrainingJobForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    modelName: '',
    baseModelId: '',
    datasetIds: [] as string[],
    trainingConfig: {
      epochs: 10,
      learning_rate: 0.001,
      batch_size: 32,
      validation_split: 0.2,
      early_stopping: true,
      save_checkpoints: true
    }
  });

  const { data: models = [] } = useQuery<AiModel[]>({
    queryKey: ["/api/ai-models"],
    queryFn: () => apiRequest("/api/ai-models")
  });

  const { data: datasets = [] } = useQuery<TrainingDataset[]>({
    queryKey: ["/api/ai-datasets"],
    queryFn: () => apiRequest("/api/ai-datasets")
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("/api/ai-training-jobs", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-training-jobs"] });
      toast({ title: "Training job started successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to start training job", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJobMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="modelName">Model Name</Label>
        <Input
          id="modelName"
          value={formData.modelName}
          onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
          placeholder="e.g., persian-tutor-fine-tuned"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="baseModel">Base Model</Label>
        <Select value={formData.baseModelId} onValueChange={(value) => setFormData({ ...formData, baseModelId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select base model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id.toString()}>
                {model.modelName} v{model.version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="epochs">Epochs</Label>
          <Input
            id="epochs"
            type="number"
            value={formData.trainingConfig.epochs}
            onChange={(e) => setFormData({
              ...formData,
              trainingConfig: { ...formData.trainingConfig, epochs: parseInt(e.target.value) }
            })}
            min={1}
            max={100}
          />
        </div>
        
        <div>
          <Label htmlFor="batchSize">Batch Size</Label>
          <Input
            id="batchSize"
            type="number"
            value={formData.trainingConfig.batch_size}
            onChange={(e) => setFormData({
              ...formData,
              trainingConfig: { ...formData.trainingConfig, batch_size: parseInt(e.target.value) }
            })}
            min={1}
            max={128}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={createJobMutation.isPending}>
        {createJobMutation.isPending ? "Starting..." : "Start Training"}
      </Button>
    </form>
  );
}