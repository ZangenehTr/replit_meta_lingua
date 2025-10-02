import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AiModel, AiTrainingDataset, AiTrainingJob } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Database, 
  Settings, 
  Activity,
  Plus,
  Download,
  Upload,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AITrainingDashboard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';
  const { toast } = useToast();

  const [selectedTab, setSelectedTab] = useState("models");
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [showAddDatasetDialog, setShowAddDatasetDialog] = useState(false);
  const [selectedModelToPull, setSelectedModelToPull] = useState("");

  // Fetch AI models
  const { data: models = [], isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  // Fetch datasets
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<AiTrainingDataset[]>({
    queryKey: ['/api/ai-datasets'],
  });

  // Fetch training jobs
  const { data: trainingJobs = [], isLoading: jobsLoading } = useQuery<AiTrainingJob[]>({
    queryKey: ['/api/ai-training-jobs'],
  });

  // Check AI health
  const { data: aiHealth, isLoading: healthLoading } = useQuery<{ status: string }>({
    queryKey: ['/api/ollama/health'],
    refetchInterval: 10000, // Refetch every 10 seconds for real-time monitoring
  });

  const isAIOnline = aiHealth?.status === 'online';

  // Model pull/download mutation
  const pullModelMutation = useMutation({
    mutationFn: async (modelName: string) => {
      const data = await apiRequest("/api/ollama/models/pull", {
        method: "POST",
        body: { modelName }
      });
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Model Downloaded",
        description: "The model has been downloaded successfully",
      });
      setShowAddModelDialog(false);
      setSelectedModelToPull("");
      queryClient.invalidateQueries({ queryKey: ['/api/ai-models'] });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download model",
        variant: "destructive"
      });
    }
  });

  const handlePullModel = () => {
    if (!selectedModelToPull) {
      toast({
        title: "No Model Selected",
        description: "Please select a model to download",
        variant: "destructive"
      });
      return;
    }
    pullModelMutation.mutate(selectedModelToPull);
  };

  // Popular Llama models for download
  const popularModels = [
    { name: "llama3.2:1b", size: "1B parameters", description: "Fast and lightweight model" },
    { name: "llama3.2:3b", size: "3B parameters", description: "Balanced performance and speed" },
    { name: "llama3.1:8b", size: "8B parameters", description: "High quality responses" },
    { name: "llama3.1:70b", size: "70B parameters", description: "Best quality, slower" },
    { name: "mistral:7b", size: "7B parameters", description: "Excellent general purpose model" },
    { name: "mixtral:8x7b", size: "8x7B parameters", description: "Mixture of experts model" },
  ];

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-ai-training">
            {t('admin:aiTrainingManagement', 'AI Training Management')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-ai-training">
            {t('admin:aiTrainingDescription', 'Manage AI models, datasets, and training processes')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {healthLoading ? (
            <Badge variant="secondary" data-testid="badge-ai-health-loading" className="flex items-center gap-1">
              <Activity className="h-4 w-4 animate-pulse" />
              {t('common:checking', 'Checking...')}
            </Badge>
          ) : (
            <Badge 
              variant={isAIOnline ? "default" : "destructive"} 
              data-testid="badge-ai-health"
              className="flex items-center gap-1"
            >
              {isAIOnline ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t('admin:aiOnline', 'AI Online')}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {t('admin:aiOffline', 'AI Offline')}
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-total-models-label">
                  {t('admin:totalModels', 'Total Models')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-total-models-value">
                  {modelsLoading ? '...' : models.length}
                </p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-datasets-label">
                  {t('admin:totalDatasets', 'Total Datasets')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-datasets-value">
                  {datasetsLoading ? '...' : datasets.length}
                </p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-active-jobs-label">
                  {t('admin:activeTrainingJobs', 'Active Training Jobs')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-active-jobs-value">
                  {jobsLoading ? '...' : trainingJobs.filter((j: any) => j.status === 'running').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-trained-models-label">
                  {t('admin:trainedModels', 'Trained Models')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-trained-models-value">
                  {modelsLoading ? '...' : models.filter((m: any) => m.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" data-testid="tab-models">
            <Bot className="h-4 w-4 mr-2" />
            {t('admin:models', 'Models')}
          </TabsTrigger>
          <TabsTrigger value="datasets" data-testid="tab-datasets">
            <Database className="h-4 w-4 mr-2" />
            {t('admin:datasets', 'Datasets')}
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">
            <Activity className="h-4 w-4 mr-2" />
            {t('admin:trainingJobs', 'Training Jobs')}
          </TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('admin:aiModels', 'AI Models')}</h2>
            <Button onClick={() => setShowAddModelDialog(true)} data-testid="button-add-model">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:addModel', 'Add Model')}
            </Button>
          </div>

          <div className="grid gap-4">
            {modelsLoading ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('common:loading', 'Loading...')}
                </CardContent>
              </Card>
            ) : models.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('admin:noModelsYet', 'No models yet. Add your first model to get started.')}
                </CardContent>
              </Card>
            ) : (
              models.map((model: any) => (
                <Card key={model.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {model.name}
                          {model.status === 'completed' && (
                            <Badge variant="default" data-testid={`badge-model-trained-${model.id}`}>
                              {t('admin:trained', 'Trained')}
                            </Badge>
                          )}
                          {model.status === 'training' && (
                            <Badge variant="secondary" data-testid={`badge-model-training-${model.id}`}>
                              {t('admin:training', 'Training...')}
                            </Badge>
                          )}
                          {model.isActive && (
                            <Badge variant="outline" data-testid={`badge-model-active-${model.id}`}>
                              {t('admin:active', 'Active')}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{model.description || t('admin:noDescription', 'No description')}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-edit-model-${model.id}`}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-model-${model.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:type', 'Type')}:</span>
                        <span className="ml-2 font-medium">{model.modelType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:version', 'Version')}:</span>
                        <span className="ml-2 font-medium">{model.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:language', 'Language')}:</span>
                        <span className="ml-2 font-medium">{model.language}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:status', 'Status')}:</span>
                        <span className="ml-2 font-medium">{model.status}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('admin:trainingDatasets', 'Training Datasets')}</h2>
            <Button onClick={() => setShowAddDatasetDialog(true)} data-testid="button-add-dataset">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:addDataset', 'Add Dataset')}
            </Button>
          </div>

          <div className="grid gap-4">
            {datasetsLoading ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('common:loading', 'Loading...')}
                </CardContent>
              </Card>
            ) : datasets.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('admin:noDatasetsYet', 'No datasets yet. Add your first dataset to get started.')}
                </CardContent>
              </Card>
            ) : (
              datasets.map((dataset: any) => (
                <Card key={dataset.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{dataset.name}</CardTitle>
                        <CardDescription>{dataset.description || t('admin:noDescription', 'No description')}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-edit-dataset-${dataset.id}`}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-dataset-${dataset.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:type', 'Type')}:</span>
                        <span className="ml-2 font-medium">{dataset.datasetType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:language', 'Language')}:</span>
                        <span className="ml-2 font-medium">{dataset.language}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:samples', 'Samples')}:</span>
                        <span className="ml-2 font-medium">{dataset.totalSamples || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:status', 'Status')}:</span>
                        <span className="ml-2 font-medium">{dataset.processingStatus}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Training Jobs Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('admin:trainingJobs', 'Training Jobs')}</h2>
          </div>

          <div className="grid gap-4">
            {jobsLoading ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('common:loading', 'Loading...')}
                </CardContent>
              </Card>
            ) : trainingJobs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  {t('admin:noTrainingJobsYet', 'No training jobs yet.')}
                </CardContent>
              </Card>
            ) : (
              trainingJobs.map((job: any) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{job.jobName}</CardTitle>
                        <CardDescription>
                          {t('admin:jobType', 'Job Type')}: {job.jobType} | {t('admin:priority', 'Priority')}: {job.priority}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'failed' ? 'destructive' :
                          job.status === 'running' ? 'secondary' :
                          'outline'
                        }
                        data-testid={`badge-job-status-${job.id}`}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('admin:progress', 'Progress')}</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={parseFloat(job.progress)} className="h-2" />
                        {job.currentEpoch && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('admin:epoch', 'Epoch')}: {job.currentEpoch} / {job.totalEpochs}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:started', 'Started')}:</span>
                        <span className="ml-2 font-medium">
                          {job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:duration', 'Duration')}:</span>
                        <span className="ml-2 font-medium">
                          {job.estimatedTimeRemaining ? `${job.estimatedTimeRemaining}s` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('admin:cpuUsage', 'CPU Usage')}:</span>
                        <span className="ml-2 font-medium">{job.cpuUsage || '-'}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Model Dialog - Download Llama Models */}
      <Dialog open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-download-model">
              {t('admin:downloadModel', 'Download AI Model')}
            </DialogTitle>
            <DialogDescription>
              {t('admin:downloadModelDescription', 'Select a Llama model to download from Ollama')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin:selectModel', 'Select Model')}</Label>
              <RadioGroup 
                value={selectedModelToPull} 
                onValueChange={setSelectedModelToPull}
                className="mt-4 space-y-3"
              >
                {popularModels.map((model) => (
                  <div key={model.name} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem 
                      value={model.name} 
                      id={model.name}
                      data-testid={`radio-model-${model.name}`}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={model.name}
                        className="font-medium cursor-pointer"
                        data-testid={`label-model-${model.name}`}
                      >
                        {model.name}
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {model.size} • {model.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {pullModelMutation.isPending && (
              <div className="space-y-2">
                <Label>{t('admin:downloading', 'Downloading...')}</Label>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 animate-pulse" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('admin:downloadingModelPleaseWait', 'Downloading model, this may take several minutes...')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddModelDialog(false);
                  setSelectedModelToPull("");
                }}
                disabled={pullModelMutation.isPending}
                data-testid="button-cancel-download"
              >
                {t('common:cancel', 'Cancel')}
              </Button>
              <Button 
                onClick={handlePullModel}
                disabled={pullModelMutation.isPending || !selectedModelToPull}
                data-testid="button-confirm-download"
              >
                {pullModelMutation.isPending ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    {t('admin:downloading', 'Downloading...')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('admin:download', 'Download')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dataset Dialog - Placeholder */}
      <Dialog open={showAddDatasetDialog} onOpenChange={setShowAddDatasetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin:addNewDataset', 'Add New Dataset')}</DialogTitle>
            <DialogDescription>
              {t('admin:addDatasetDescription', 'Upload training data files (PDF, Word, Text)')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">
              {t('admin:comingSoon', 'Dataset upload coming soon...')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
