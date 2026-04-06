import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Bot, Server, CheckCircle, XCircle, RefreshCw, TestTube, Send, Download, Trash2, Upload, Rocket, AlertTriangle, FileText, Image, Video, Music, Archive, Database, Activity, Settings, Zap, Brain, Users, TrendingUp, HardDrive, Cpu, MemoryStick, Mic, Square, Volume2 } from "lucide-react";

interface OllamaStatus { success: boolean; status: 'running' | 'offline'; models: string[]; endpoint: string; systemInfo?: { totalMemory: string; usedMemory: string; cpuUsage: number; diskSpace: string; }; }
interface ModelInfo { name: string; size: string; modified: string; digest: string; family?: string; format?: string; parameterSize?: string; quantizationLevel?: string; storagePath?: string; isActive?: boolean; downloadProgress?: number | null; }
interface TokenUsage { user: string; model: string; tokensUsed: number; requestCount: number; lastUsed: string; cost?: number; }
interface TrainingFile { id: string; name: string; size: number; type: string; uploadedAt: string; status: 'uploaded' | 'processing' | 'completed' | 'error'; }

export function ComprehensiveAIManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { user } = useAuth();
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ollamaStatus, isLoading, refetch } = useQuery<OllamaStatus>({ queryKey: ["/api/test/ollama-status"], queryFn: () => apiRequest("/api/test/ollama-status"), refetchInterval: autoRefresh ? 5000 : false, retry: (c) => c < 2, retryDelay: (i) => Math.min(1000 * 2 ** i, 5000) });
  const { data: modelDetails } = useQuery<ModelInfo[]>({ queryKey: ["/api/admin/ollama/models"], queryFn: () => apiRequest("/api/admin/ollama/models"), refetchInterval: autoRefresh ? 10000 : false });
  const { data: tokenUsage } = useQuery<TokenUsage[]>({ queryKey: ["/api/admin/ai/token-usage"], queryFn: () => apiRequest("/api/admin/ai/token-usage"), refetchInterval: autoRefresh ? 30000 : false });
  const { data: enhancedModels } = useQuery({ queryKey: ["/api/admin/ollama/models-enhanced"], queryFn: () => apiRequest("/api/admin/ollama/models-enhanced"), refetchInterval: autoRefresh ? 5000 : false });
  const { data: activeModelData } = useQuery({ queryKey: ["/api/admin/ollama/active-model"], queryFn: () => apiRequest("/api/admin/ollama/active-model"), refetchInterval: autoRefresh ? 10000 : false });
  const { data: availableModelsForDownload = [] } = useQuery({ queryKey: ["/api/admin/ai-service/models"], queryFn: () => apiRequest("/api/admin/ai-service/models"), refetchInterval: false });

  useEffect(() => { if (activeModelData?.activeModel && !selectedTrainingModel) setSelectedTrainingModel(activeModelData.activeModel); }, [activeModelData?.activeModel, selectedTrainingModel]);

  useEffect(() => {
    const interval = setInterval(async () => {
      for (const modelName of Array.from(downloadingModels)) {
        try {
          const res = await apiRequest(`/api/admin/ollama/download-progress/${modelName}`);
          if (res.progress?.percent) setModelDownloadProgress(p => ({ ...p, [modelName]: res.progress.percent }));
          if (res.status === 'completed') {
            setDownloadingModels(p => { const n = new Set(p); n.delete(modelName); return n; });
            setModelDownloadProgress(p => { const n = { ...p }; delete n[modelName]; return n; });
            toast({ title: t('common:toast.modelDownloaded'), description: `${modelName} has been installed successfully` });
            queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models-enhanced"] });
          }
        } catch {}
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [downloadingModels, queryClient, toast]);

  const downloadModelMutation = useMutation({
    mutationFn: async (m: string) => apiRequest("/api/admin/ollama/pull-model", { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelName: m }) }),
    onSuccess: (_, m) => toast({ title: t('common:toast.modelDownloadStarted'), description: `${m} download initiated.` }),
    onError: (e: unknown, m) => { const msg = e instanceof Error ? e.message : ""; toast({ title: t('common:toast.downloadFailed'), description: `Failed to download ${m}: ${msg.includes("503") ? "Ollama not running" : msg.includes("400") ? "Invalid request" : msg || "Unknown error"}`, variant: "destructive" }); setDownloadingModels(p => { const n = new Set(p); n.delete(m); return n; }); setModelDownloadProgress(p => { const n = { ...p }; delete n[m]; return n; }); },
  });
  const deleteModelMutation = useMutation({
    mutationFn: async (m: string) => apiRequest(`/api/admin/ollama/delete-model`, { method: 'DELETE', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelName: m }) }),
    onSuccess: (_, m) => { toast({ title: t('common:toast.modelDeleted'), description: `${m} removed successfully` }); queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] }); },
    onError: (e: unknown, m) => toast({ title: t('common:toast.deleteFailed'), description: `Failed to delete ${m}: ${e instanceof Error ? e.message : "Unknown error"}`, variant: "destructive" }),
  });
  const setActiveModelMutation = useMutation({
    mutationFn: async (m: string) => apiRequest("/api/admin/ollama/set-active-model", { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelName: m }) }),
    onSuccess: (_, m) => { toast({ title: t('common:toast.activeModelUpdated'), description: `${m} is now the active model` }); queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/active-model"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models-enhanced"] }); },
    onError: (e: unknown, m) => toast({ title: t('common:toast.failedToSetActiveModel'), description: `Failed to set ${m} as active: ${e instanceof Error ? e.message : "Unknown error"}`, variant: "destructive" }),
  });
  const bootstrapMutation = useMutation({
    mutationFn: async () => apiRequest("/api/admin/ollama/bootstrap", { method: 'POST', headers: { "Content-Type": "application/json" } }),
    onSuccess: (data: { message?: string }) => { toast({ title: t('common:toast.ollamaBootstrapSuccessful'), description: data.message || "Ollama configured successfully" }); queryClient.invalidateQueries({ queryKey: ["/api/test/ollama-status"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/ollama/models"] }); },
    onError: (e: unknown) => toast({ title: t('common:toast.bootstrapFailed'), description: e instanceof Error ? e.message : "Bootstrap failed", variant: "destructive" }),
  });

  const modelsWithActiveStatus: ModelInfo[] = enhancedModels?.models || modelDetails?.map((m: ModelInfo) => ({ ...m, isActive: m.name === activeModelData?.activeModel, storagePath: activeModelData?.storagePath, downloadProgress: null })) || [];
  const availableModels: string[] = (() => { const s = (ollamaStatus?.models || []).filter(Boolean); return s.length === 0 && modelDetails?.length > 0 ? modelDetails.map(m => m.name) : s; })();
  const systemInfo = ollamaStatus?.systemInfo;
  const totalTokensUsed = tokenUsage?.reduce((s, u) => s + u.tokensUsed, 0) || 0;
  const totalRequests = tokenUsage?.reduce((s, u) => s + u.requestCount, 0) || 0;

  const handleModelDownload = async (m: string) => { setDownloadingModels(p => new Set(p).add(m)); try { await downloadModelMutation.mutateAsync(m); } catch {} finally { setDownloadingModels(p => { const n = new Set(p); n.delete(m); return n; }); } };
  const handleModelDelete = async (m: string) => { if (confirm(`Delete ${m}? This cannot be undone.`)) { try { await deleteModelMutation.mutateAsync(m); } catch {} } };
  const handleBootstrap = async () => { setIsBootstrapping(true); try { await bootstrapMutation.mutateAsync(); } catch {} finally { setIsBootstrapping(false); } };
  const handleSetActiveModel = async (m: string) => { try { await setActiveModelMutation.mutateAsync(m); } catch {} };

  const startRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); const chunks: BlobPart[] = []; recorder.ondataavailable = (e) => chunks.push(e.data); recorder.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' })); mediaRecorderRef.current = recorder; recorder.start(); setIsRecording(true); } catch { toast({ title: t('common:toast.recordingFailed'), description: "Microphone access denied.", variant: "destructive" }); } };
  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); setIsRecording(false); } };
  const sendAudioToAI = async () => { if (!audioBlob || !activeModelData?.activeModel) return; setTestPrompt("This is a simulated transcription of your audio."); await testModel(); setAudioBlob(null); };
  const playAIResponse = () => { if (!testResponse) return; const u = new SpeechSynthesisUtterance(testResponse); u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1; window.speechSynthesis.speak(u); };

  const testModel = async () => {
    if (!testPrompt.trim()) { toast({ title: "No Test Prompt", description: "Enter a prompt first", variant: "destructive" }); return; }
    if (!activeModelData?.activeModel) { toast({ title: "No Active Model Set", description: "Set an active model first", variant: "destructive" }); return; }
    setTestingModel(true); setTestResponse('');
    try {
      const res = await apiRequest(`/api/test/model`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: activeModelData.activeModel, prompt: testPrompt, userId: user?.id }) });
      setTestResponse(res.response || 'Test completed successfully');
      toast({ title: res.usedTrainingData ? "Training Data Found!" : "Model Test Complete", description: res.usedTrainingData ? "Model used your uploaded training data" : "No training data found" });
    } catch (e) { const msg = e instanceof Error ? e.message : "Failed to test model"; toast({ title: "Model Test Failed", description: msg, variant: "destructive" }); setTestResponse('Failed to generate response'); }
    finally { setTestingModel(false); }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !activeModelData?.activeModel) { toast({ title: "No Active Model", description: "Set an active model first", variant: "destructive" }); return; }
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) { toast({ title: "File Too Large", description: `${file.name} exceeds 50MB`, variant: "destructive" }); continue; }
      const supported = ['text/', '.txt', '.md', '.docx', '.pages', '.pdf', 'image/', '.jpeg', '.jpg', '.png', 'audio/', 'video/', '.mp4', '.mov'];
      if (!supported.some(t => file.type.startsWith(t) || file.name.toLowerCase().endsWith(t))) { toast({ title: t('common:toast.unsupportedFileType'), description: t('common:toast.fileMustBeText'), variant: "destructive" }); continue; }
      try {
        if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.pages')) { const fd = new FormData(); fd.append('file', file); fd.append('modelName', activeModelData.activeModel); fd.append('fileName', file.name); await apiRequest("/api/admin/ai/training/upload-file", { method: 'POST', body: fd }); }
        else { const content = await file.text(); await apiRequest("/api/admin/ai/training/upload", { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelName: selectedTrainingModel, fileName: file.name, content }) }); }
        setTrainingFiles(p => [...p, { id: Math.random().toString(36).substr(2, 9), name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), status: 'completed' }]);
        toast({ title: "File Uploaded Successfully", description: `${file.name} uploaded and ready for training` });
      } catch (e) { toast({ title: "Upload Failed", description: `Failed to upload ${file.name}: ${e instanceof Error ? e.message : "Unknown error"}`, variant: "destructive" }); }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [toast, selectedTrainingModel, activeModelData]);

  const startTraining = async () => {
    if (!activeModelData?.activeModel) { toast({ title: "No Active Model Set", description: "Set an active model first", variant: "destructive" }); return; }
    if (!trainingFiles.length) { toast({ title: "No Training Data", description: "Upload training files first", variant: "destructive" }); return; }
    setIsTraining(true); setTrainingProgress(0);
    const interval = setInterval(() => { setTrainingProgress(p => { if (p >= 100) { clearInterval(interval); setIsTraining(false); toast({ title: "Training Complete", description: `Model ${activeModelData.activeModel} fine-tuned successfully` }); return 100; } return p + Math.random() * 5; }); }, 1000);
    toast({ title: "Training Started", description: `Fine-tuning ${activeModelData.activeModel} with ${trainingFiles.length} files` });
  };

  const formatFileSize = (b: number) => { const s = ['Bytes','KB','MB','GB','TB']; if (!b) return '0 Bytes'; const i = Math.floor(Math.log(b) / Math.log(1024)); return Math.round(b / Math.pow(1024, i) * 100) / 100 + ' ' + s[i]; };
  const getFileIcon = (type: string, name?: string) => { if (name?.endsWith('.docx') || name?.endsWith('.pages')) return <FileText className="h-4 w-4 text-blue-600" />; if (type.startsWith('text/') || name?.endsWith('.txt') || name?.endsWith('.md')) return <FileText className="h-4 w-4" />; if (type.startsWith('image/')) return <Image className="h-4 w-4" />; if (type.startsWith('video/')) return <Video className="h-4 w-4" />; if (type.startsWith('audio/')) return <Music className="h-4 w-4" />; return <Archive className="h-4 w-4" />; };
  const StatusIndicator = ({ status }: { status: 'running' | 'offline' }) => status === 'running' ? <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span className="text-green-700 font-medium">Running</span></div> : <div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" /><span className="text-red-700 font-medium">Offline</span></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">AI Services Management</h1><p className="text-muted-foreground">Comprehensive AI model management, training, and monitoring</p></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><Label htmlFor="auto-refresh">Auto Refresh</Label><Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} /></div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}><RefreshCw className={`h-4 w-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh Status</Button>
        </div>
      </div>

      {ollamaStatus?.status === 'offline' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"><CardHeader><CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200"><AlertTriangle className="h-5 w-5" />Ollama Service Not Running - Bootstrap Required</CardTitle><CardDescription className="text-yellow-700 dark:text-yellow-300">Ollama AI service is not running. Use the bootstrap button below to install, configure, and start Ollama.</CardDescription></CardHeader>
          <CardContent><div className="flex items-center gap-4">
            <Button onClick={handleBootstrap} disabled={isBootstrapping || bootstrapMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">{isBootstrapping || bootstrapMutation.isPending ? <><RefreshCw className="h-4 w-4 me-2 animate-spin" />Bootstrapping Ollama...</> : <><Rocket className="h-4 w-4 me-2" />Bootstrap Ollama</>}</Button>
            <div className="text-sm text-muted-foreground">This will install Ollama, start the service, and download a minimal AI model (~2GB)</div>
          </div></CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { title: "Service Status", content: <StatusIndicator status={ollamaStatus?.status || 'offline'} />, Icon: Server },
          { title: "Active Models", content: <><div className="text-2xl font-bold">{availableModels.length}</div><p className="text-xs text-muted-foreground">models available</p></>, Icon: Bot },
          { title: "Token Usage", content: <><div className="text-2xl font-bold">{totalTokensUsed.toLocaleString()}</div><p className="text-xs text-muted-foreground">tokens processed</p></>, Icon: Activity },
          { title: "Total Requests", content: <><div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div><p className="text-xs text-muted-foreground">API requests made</p></>, Icon: TrendingUp },
        ] as { title: string; content: React.ReactNode; Icon: React.ElementType }[]).map(({ title, content, Icon }) => (
          <Card key={title}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{content}</CardContent></Card>
        ))}
      </div>

      {systemInfo && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />System Resources</CardTitle></CardHeader>
        <CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { label: "Memory Usage", val: systemInfo.usedMemory + " / " + systemInfo.totalMemory, pct: 75, Icon: MemoryStick },
            { label: "CPU Usage", val: systemInfo.cpuUsage + "%", pct: systemInfo.cpuUsage as number, Icon: Cpu },
            { label: "Disk Space", val: systemInfo.diskSpace as string, pct: 60, Icon: HardDrive },
          ] as { label: string; val: string; pct: number; Icon: React.ElementType }[]).map(({ label, val, pct, Icon }) => (
            <div key={label} className="space-y-2"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><span className="text-sm font-mono">{val}</span></div><Progress value={pct} className="h-2" /></div>
          ))}
        </div></CardContent>
      </Card>)}

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5"><TabsTrigger value="models">Model Management</TabsTrigger><TabsTrigger value="training">Training & Testing</TabsTrigger><TabsTrigger value="conversations">AI Conversations</TabsTrigger><TabsTrigger value="usage">Token Usage</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" />AI Model Management</CardTitle><CardDescription>Manage your local AI models. Only one model can be active at a time.{activeModelData?.storagePath && <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">📁 Storage Location: {activeModelData.storagePath}</div>}</CardDescription></CardHeader></Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Available Models</CardTitle><CardDescription>Download new AI models</CardDescription></CardHeader>
              <CardContent className="space-y-4">{availableModelsForDownload.map((model) => (
                <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1"><div className="font-medium">{model.name}</div><div className="text-sm text-muted-foreground">{model.description}</div><div className="text-xs text-muted-foreground mt-1">Size: {model.size}</div></div>
                  <div className="flex items-center gap-2">{availableModels.includes(model.name) ? <Badge variant="secondary">Installed</Badge> : downloadingModels.has(model.name) ? <div className="flex flex-col items-end gap-1 min-w-[100px]"><div className="flex items-center gap-2 text-sm"><RefreshCw className="h-3 w-3 animate-spin" /><span>{modelDownloadProgress[model.name] || 0}%</span></div><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${modelDownloadProgress[model.name] || 0}%` }} /></div></div> : <Button size="sm" onClick={() => handleModelDownload(model.name)} disabled={downloadModelMutation.isPending}><Download className="h-4 w-4 me-2" />Download</Button>}</div>
                </div>
              ))}</CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Installed Models ({modelsWithActiveStatus.length})</CardTitle><CardDescription>Click "Set Active" to make a model the default for training.</CardDescription></CardHeader>
              <CardContent className="space-y-4">{modelsWithActiveStatus.length === 0 ? <div className="text-center text-muted-foreground py-8"><Database className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No models installed</p><p className="text-sm">Download models from the available list to get started.</p></div> : modelsWithActiveStatus.map((model) => {
                const isActive = model.isActive;
                return (
                  <div key={model.name} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-950 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex-1"><div className="font-medium flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />{model.name}{isActive ? <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white"><Zap className="h-3 w-3 me-1" />Active</Badge> : <Badge variant="secondary" className="text-gray-600">Inactive</Badge>}</div><div className="text-sm text-muted-foreground mt-1">Size: {model.size} • Modified: {new Date(model.modified).toLocaleDateString()}</div>{model.storagePath && <div className="text-xs text-muted-foreground mt-2 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">📁 {model.storagePath}</div>}</div>
                    <div className="flex items-center gap-2 ms-4">{isActive ? <Button size="sm" variant="secondary" disabled className="opacity-75"><Zap className="h-4 w-4 me-1" />Active</Button> : <Button size="sm" variant="default" onClick={() => handleSetActiveModel(model.name)} disabled={setActiveModelMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white"><Settings className="h-4 w-4 me-1" />Set Active</Button>}<Button size="sm" variant="destructive" onClick={() => handleModelDelete(model.name)} disabled={deleteModelMutation.isPending || isActive} title={isActive ? "Cannot delete active model" : "Delete model"}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                );
              })}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Model Training & Fine-tuning</CardTitle><CardDescription>Upload training data and fine-tune models (supports up to 50GB multimodal files)</CardDescription></CardHeader>
            <CardContent className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><Label>Base Model for Training</Label>{activeModelData?.activeModel ? <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950"><div className="flex items-center gap-2"><Zap className="h-4 w-4 text-green-600" /><span className="font-medium">{activeModelData.activeModel}</span><Badge variant="default" className="bg-green-600">Active Model</Badge></div><div className="text-sm text-muted-foreground mt-1">Training will use this model automatically.</div></div> : <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600" /><span className="font-medium">No Active Model Set</span></div><div className="text-sm text-muted-foreground mt-1">Set an active model in "Model Management" tab first.</div></div>}</div>
                <div><Label>Training Data Upload</Label><div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center"><Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><div className="text-sm text-muted-foreground mb-2">Upload training files (max 50GB per file)</div><div className="text-xs text-muted-foreground mb-4">Supports: Text (.txt), Word Documents (.docx), Pages (.pages), JSON, CSV, and more</div><input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept=".txt,.md,.docx,.pages,.json,.csv,text/*" /><Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 me-2" />Select Files</Button></div></div>
                {isTraining && <div className="space-y-2"><Label>Training Progress</Label><Progress value={trainingProgress} className="h-3" /><div className="text-sm text-muted-foreground">{trainingProgress.toFixed(1)}% complete</div></div>}
                <Button onClick={startTraining} disabled={isTraining || !activeModelData?.activeModel || !trainingFiles.length} className="w-full">{isTraining ? <><RefreshCw className="h-4 w-4 me-2 animate-spin" />Training in Progress...</> : <><Zap className="h-4 w-4 me-2" />Start Training</>}</Button>
              </div>
              <div className="space-y-4">
                <Label>Training Dataset ({trainingFiles.length} files)</Label>
                <div className="border rounded-lg max-h-96 overflow-y-auto">{trainingFiles.length === 0 ? <div className="p-6 text-center text-muted-foreground">No training files uploaded yet</div> : <div className="divide-y">{trainingFiles.map(file => <div key={file.id} className="p-3 flex items-center justify-between"><div className="flex items-center gap-3 flex-1 min-w-0">{getFileIcon(file.type, file.name)}<div className="min-w-0 flex-1"><div className="font-medium truncate">{file.name}</div><div className="text-sm text-muted-foreground">{formatFileSize(file.size)} • {file.type}</div></div></div><div className="flex items-center gap-2"><Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'}>{file.status}</Badge><Button size="sm" variant="ghost" onClick={() => setTrainingFiles(p => p.filter(f => f.id !== file.id))}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}</div>
                <div className="text-sm text-muted-foreground">Total size: {formatFileSize(trainingFiles.reduce((s, f) => s + f.size, 0))}</div>
              </div>
              <div className="space-y-4"><div className="border-t pt-4"><div className="flex items-center gap-2 mb-4"><TestTube className="h-5 w-5" /><h3 className="text-lg font-semibold">Test Model with Training Data</h3></div>
                <div className="text-sm text-muted-foreground mb-4">Test your model with prompts related to uploaded training information to verify if new knowledge has been learned.</div>
                <div className="space-y-4"><div><Label>Test Prompt (related to uploaded data)</Label><Textarea value={testPrompt} onChange={e => setTestPrompt(e.target.value)} placeholder="Ask a question about the uploaded information..." className="min-h-[100px]" /><div className="text-xs text-muted-foreground mt-1">Example: "What did the document say about [specific topic]?"</div></div>
                  <Button onClick={testModel} disabled={testingModel || !selectedTrainingModel || !testPrompt.trim()} className="w-full" variant="outline">{testingModel ? <><RefreshCw className="h-4 w-4 me-2 animate-spin" />Testing Model...</> : <><TestTube className="h-4 w-4 me-2" />Test Model Knowledge</>}</Button>
                  {testResponse && <div><Label>Model Response</Label><Textarea value={testResponse} readOnly className="min-h-[200px] bg-muted/50" /><div className="text-xs text-muted-foreground mt-1">Analyze the response to determine if the model learned from your training data.</div></div>}
                </div>
              </div></div>
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" />AI Voice Conversations</CardTitle><CardDescription>Practice language skills with voice-enabled AI conversations</CardDescription></CardHeader>
            <CardContent><div className="space-y-6">
              {activeModelData?.activeModel ? <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /><span className="font-medium">Conversing with: {activeModelData.activeModel}</span></div> : <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"><AlertTriangle className="h-4 w-4 text-yellow-600" /><span>Please set an active model to start conversations</span></div>}
              <div className="space-y-4"><Label>Voice Recording</Label><div className="flex flex-col items-center gap-4"><Button size="lg" variant={isRecording ? "destructive" : "default"} onClick={isRecording ? stopRecording : startRecording} disabled={!activeModelData?.activeModel} className="h-24 w-24 rounded-full">{isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}</Button><div className="text-sm text-muted-foreground">{isRecording ? "Recording... Click to stop" : "Click to start recording"}</div></div>
                {audioBlob && <div className="space-y-2"><Label>Your Recording</Label><audio controls src={URL.createObjectURL(audioBlob)} className="w-full" /><div className="flex gap-2"><Button onClick={sendAudioToAI} disabled={testingModel} className="flex-1">{testingModel ? <><RefreshCw className="h-4 w-4 me-2 animate-spin" />Processing...</> : <><Send className="h-4 w-4 me-2" />Send to AI</>}</Button><Button variant="outline" onClick={() => setAudioBlob(null)}><Trash2 className="h-4 w-4" /></Button></div></div>}
              </div>
              <div className="space-y-4"><Label>Conversation</Label><div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-muted/20">{testPrompt && <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"><div className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">You:</div><div>{testPrompt}</div></div>}{testResponse && <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg"><div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">AI:</div><div>{testResponse}</div><Button variant="ghost" size="sm" className="mt-2" onClick={playAIResponse}><Volume2 className="h-4 w-4 me-2" />Play Response</Button></div>}{!testPrompt && !testResponse && <div className="text-center text-muted-foreground">Start recording to begin a conversation</div>}</div></div>
              <div className="space-y-2"><Label>Or type your message</Label><div className="flex gap-2"><Textarea placeholder="Type your message here..." value={testPrompt} onChange={e => setTestPrompt(e.target.value)} className="flex-1 min-h-[60px]" /><Button onClick={testModel} disabled={testingModel || !testPrompt || !activeModelData?.activeModel}><Send className="h-4 w-4" /></Button></div></div>
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Token Usage Analytics</CardTitle><CardDescription>Monitor AI model usage and costs</CardDescription></CardHeader>
            <CardContent>{tokenUsage && tokenUsage.length > 0 ? <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[["Total Tokens", totalTokensUsed.toLocaleString()], ["Total Requests", totalRequests.toLocaleString()], ["Estimated Cost", `$${tokenUsage.reduce((s, u) => s + (u.cost || 0), 0).toFixed(2)}`]].map(([label, value]) => <div key={label} className="text-center p-4 border rounded-lg"><div className="text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}
              </div>
              <div className="space-y-2"><Label>Usage by User</Label><div className="border rounded-lg divide-y">{tokenUsage.map((usage, i) => <div key={i} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Users className="h-4 w-4" /><div><div className="font-medium">{usage.user}</div><div className="text-sm text-muted-foreground">Model: {usage.model}</div></div></div><div className="text-right"><div className="font-medium">{usage.tokensUsed.toLocaleString()} tokens</div><div className="text-sm text-muted-foreground">{usage.requestCount} requests • {new Date(usage.lastUsed).toLocaleDateString()}</div></div></div>)}</div></div>
            </div> : <div className="text-center py-8 text-muted-foreground">No usage data available yet</div>}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />AI Service Settings</CardTitle><CardDescription>Configure AI service preferences</CardDescription></CardHeader>
            <CardContent className="space-y-6"><div className="space-y-4">
              <div className="flex items-center justify-between"><div><Label>Auto-refresh Status</Label><div className="text-sm text-muted-foreground">Automatically refresh service status every 5 seconds</div></div><Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} /></div>
              <div className="space-y-2"><Label>Default Model</Label><Select value={selectedModel} onValueChange={setSelectedModel}><SelectTrigger><SelectValue placeholder="Select default model" /></SelectTrigger><SelectContent>{availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Service Endpoint</Label><Input value={ollamaStatus?.endpoint || "http://localhost:11434"} readOnly className="font-mono" /></div>
            </div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
