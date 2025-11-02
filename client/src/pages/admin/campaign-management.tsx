import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Megaphone, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Mail,
  Phone,
  Calendar,
  Users,
  DollarSign,
  ExternalLink,
  Play,
  Pause,
  Settings,
  Plus,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Send,
  MessageSquare,
  Bot,
  Zap,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { nanoid } from "nanoid";

interface Campaign {
  id: number;
  name: string;
  type: 'enrollment' | 'retention' | 'referral' | 'awareness';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  channels: string[];
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost_per_lead: number;
    roi: number;
  };
}

export default function CampaignManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showToolConfigDialog, setShowToolConfigDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [emailContent, setEmailContent] = useState('');
  const [telegramContent, setTelegramContent] = useState('');
  const [aiResponse, setAIResponse] = useState('');
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    type: 'enrollment' as const,
    targetAudience: 'persian_learners',
    budget: 10000000,
    channels: [] as string[],
    startDate: '',
    endDate: '',
    description: ''
  });

  // SMS Campaign state
  const [audienceSegment, setAudienceSegment] = useState('unpaid_placement_test');
  const [inactiveMonths, setInactiveMonths] = useState(3);
  const [audienceCount, setAudienceCount] = useState(0);
  const [audiencePreviewLoading, setAudiencePreviewLoading] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testSMSLoading, setTestSMSLoading] = useState(false);
  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);
  const [smsSendProgress, setSmsSendProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [csvParseLoading, setCsvParseLoading] = useState(false);
  const [csvParseResult, setCsvParseResult] = useState<any>(null);
  const [customRecipients, setCustomRecipients] = useState<any[]>([]);

  // Fetch campaigns data
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/campaigns'],
  });

  // Campaign mutation hooks for real API operations
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Campaign> }) => {
      return apiRequest(`/api/admin/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({ title: t('common:toast.campaignUpdated') });
    },
    onError: () => {
      toast({ title: t('common:toast.failedToUpdateCampaign'), variant: "destructive" });
    }
  });

  // Create new campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return apiRequest('/api/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({ title: t('common:toast.newCampaignCreated') });
      setShowNewCampaignDialog(false);
      resetNewCampaignForm();
    },
    onError: () => {
      toast({ title: t('common:toast.failedToCreateCampaign'), variant: "destructive" });
    }
  });

  // Social media operations mutation
  const socialMediaMutation = useMutation({
    mutationFn: async ({ platform, action }: { platform: string; action: string }) => {
      return apiRequest(`/api/admin/social-media/${platform}/${action}`, {
        method: 'POST'
      });
    },
    onSuccess: (data, variables) => {
      toast({ title: `${variables.action} ${variables.platform} successfully` });
    },
    onError: (error, variables) => {
      toast({ title: `Failed to ${variables.action} ${variables.platform}`, variant: "destructive" });
    }
  });

  // Cross-platform campaign tools mutation
  const crossplatformMutation = useMutation({
    mutationFn: async (tool: string) => {
      return apiRequest(`/api/admin/crossplatform-tools/${tool}`, {
        method: 'POST'
      });
    },
    onSuccess: (data, variables) => {
      toast({ title: `${variables} tool configured successfully` });
    },
    onError: (error, variables) => {
      toast({ title: `Failed to configure ${variables} tool`, variant: "destructive" });
    }
  });

  // Marketing tools operation mutation
  const marketingToolMutation = useMutation({
    mutationFn: async ({ toolName, action, config }: { toolName: string; action: string; config?: any }) => {
      return apiRequest(`/api/admin/marketing-tools/${encodeURIComponent(toolName)}/${action}`, {
        method: 'POST',
        body: config ? JSON.stringify(config) : undefined
      });
    },
    onSuccess: (data, variables) => {
      toast({ title: `${variables.action} completed for ${variables.toolName}` });
      setShowToolConfigDialog(false);
    },
    onError: (error, variables) => {
      toast({ title: `Failed to ${variables.action} ${variables.toolName}`, variant: "destructive" });
    }
  });

  const pauseCampaign = (campaignId: number) => {
    updateCampaignMutation.mutate({ id: campaignId, updates: { status: 'paused' } });
  };

  const resumeCampaign = (campaignId: number) => {
    updateCampaignMutation.mutate({ id: campaignId, updates: { status: 'active' } });
  };

  // SMS Campaign handlers
  const fetchAudiencePreview = async () => {
    setAudiencePreviewLoading(true);
    try {
      const params = new URLSearchParams({
        segment: audienceSegment,
        ...(audienceSegment === 'inactive_students' && { monthsInactive: inactiveMonths.toString() })
      });
      const response = await fetch(`/api/admin/campaigns/audience-preview?${params}`);
      const data = await response.json();
      setAudienceCount(data.count || 0);
      toast({ title: `Found ${data.count || 0} recipients` });
    } catch (error) {
      toast({ title: 'Failed to preview audience', variant: 'destructive' });
    } finally {
      setAudiencePreviewLoading(false);
    }
  };

  const parseCSVContent = async (format: 'csv' | 'text') => {
    setCsvParseLoading(true);
    try {
      const response = await apiRequest('/api/admin/campaigns/upload-recipients', {
        method: 'POST',
        body: JSON.stringify({ content: csvContent, format })
      });
      const data = await response.json();
      setCsvParseResult(data);
      setCustomRecipients(data.validPhones || []);
      setAudienceCount(data.validCount || 0);
      toast({ title: `Parsed ${data.validCount} valid phone numbers` });
    } catch (error) {
      toast({ title: 'Failed to parse CSV', variant: 'destructive' });
    } finally {
      setCsvParseLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    setSmsMessage(prev => prev + variable);
  };

  const sendTestSMS = async () => {
    setTestSMSLoading(true);
    try {
      const response = await apiRequest(`/api/admin/campaigns/${selectedCampaign?.id || 0}/send-sms`, {
        method: 'POST',
        body: JSON.stringify({
          message: smsMessage,
          testMode: true,
          testPhone,
          idempotencyKey: nanoid()
        })
      });
      toast({ title: 'Test SMS sent successfully!' });
    } catch (error) {
      toast({ title: 'Failed to send test SMS', variant: 'destructive' });
    } finally {
      setTestSMSLoading(false);
    }
  };

  const sendBulkSMS = async () => {
    if (!selectedCampaign) {
      toast({ title: 'Please select a campaign first', variant: 'destructive' });
      return;
    }
    setBulkSMSLoading(true);
    setSmsSendProgress({ sent: 0, failed: 0, total: audienceCount });
    try {
      const requestBody: any = {
        message: smsMessage.replace('{discountCode}', discountCode || 'N/A'),
        segment: audienceSegment === 'custom_csv' ? undefined : audienceSegment,
        recipients: audienceSegment === 'custom_csv' ? customRecipients : undefined,
        monthsInactive: audienceSegment === 'inactive_students' ? inactiveMonths : undefined,
        idempotencyKey: nanoid()
      };

      const response = await apiRequest(`/api/admin/campaigns/${selectedCampaign.id}/send-sms`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      
      setSmsSendProgress({
        sent: data.sent || 0,
        failed: data.failed || 0,
        total: data.totalRecipients || audienceCount
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({ title: `Successfully sent ${data.sent} SMS messages!` });
    } catch (error) {
      toast({ title: 'Failed to send bulk SMS', variant: 'destructive' });
    } finally {
      setBulkSMSLoading(false);
    }
  };

  // Button event handlers for campaign management operations
  const handleNewCampaign = () => {
    setShowNewCampaignDialog(true);
  };

  const handleCreateCampaign = () => {
    if (!newCampaignData.name.trim()) {
      toast({ title: t('admin:campaigns.pleaseEnterCampaignName'), variant: "destructive" });
      return;
    }
    if (newCampaignData.channels.length === 0) {
      toast({ title: t('admin:campaigns.pleaseSelectChannels'), variant: "destructive" });
      return;
    }
    createCampaignMutation.mutate(newCampaignData);
  };

  const resetNewCampaignForm = () => {
    setNewCampaignData({
      name: '',
      type: 'enrollment',
      targetAudience: 'persian_learners',
      budget: 10000000,
      channels: [],
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleSocialMediaAction = (platform: string, action: string) => {
    socialMediaMutation.mutate({ platform: platform.toLowerCase(), action });
  };

  const handleMarketingTool = (toolName: string, action: string = 'configure') => {
    if (action === 'configure') {
      setSelectedTool(toolName);
      setShowToolConfigDialog(true);
    } else {
      marketingToolMutation.mutate({ toolName, action });
    }
  };

  const saveToolConfiguration = (config: any) => {
    marketingToolMutation.mutate({ 
      toolName: selectedTool, 
      action: 'configure',
      config 
    });
  };

  const handleCrossplatformTool = (toolType: string) => {
    crossplatformMutation.mutate(toolType);
  };

  const marketingTools = [
    {
      category: 'Social Media Management',
      tools: [
        { name: 'Instagram Integration', status: 'connected', icon: Instagram, metrics: '2.3K followers' },
        { name: 'Telegram Channel', status: 'connected', icon: Phone, metrics: '5.2K subscribers' },
        { name: 'YouTube Channel', status: 'connected', icon: Youtube, metrics: '890 subscribers' },
        { name: 'LinkedIn Page', status: 'pending', icon: Linkedin, metrics: 'Setup required' },
        { name: 'Twitter Account', status: 'connected', icon: Twitter, metrics: '1.1K followers' }
      ]
    },
    {
      category: 'Lead Generation',
      tools: [
        { name: 'Landing Page Builder', status: 'active', icon: Globe, metrics: '24 pages created' },
        { name: 'Lead Capture Forms', status: 'active', icon: Target, metrics: '89% conversion' },
        { name: 'Iranian Phone Verification', status: 'active', icon: Phone, metrics: '98.5% accuracy' },
        { name: 'Email Marketing', status: 'active', icon: Mail, metrics: '23.4% open rate' }
      ]
    },
    {
      category: 'Analytics & Tracking',
      tools: [
        { name: 'Google Analytics', status: 'connected', icon: BarChart3, metrics: 'Real-time data' },
        { name: 'Facebook Pixel', status: 'connected', icon: Target, metrics: 'Conversion tracking' },
        { name: 'Heat Map Analysis', status: 'active', icon: TrendingUp, metrics: 'User behavior' },
        { name: 'A/B Testing Suite', status: 'active', icon: Settings, metrics: '12 active tests' }
      ]
    }
  ];

  const socialMediaPlatforms = [
    {
      platform: 'Instagram',
      handle: '@metalingua_persian',
      followers: '2,340',
      engagement: '4.2%',
      lastPost: '2 hours ago',
      status: 'active',
      icon: Instagram
    },
    {
      platform: 'Telegram',
      handle: '@metalingua_channel',
      followers: '5,234',
      engagement: '8.1%',
      lastPost: '4 hours ago',
      status: 'active',
      icon: Phone
    },
    {
      platform: 'YouTube',
      handle: 'Meta Lingua Persian',
      followers: '892',
      engagement: '6.7%',
      lastPost: '1 day ago',
      status: 'active',
      icon: Youtube
    },
    {
      platform: 'LinkedIn',
      handle: 'Meta Lingua Institute',
      followers: '567',
      engagement: '3.4%',
      lastPost: '3 days ago',
      status: 'pending',
      icon: Linkedin
    }
  ];

  // Email broadcast mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { recipients: string[], subject: string, content: string }) => {
      return apiRequest('/api/admin/send-email', {
        method: 'POST',
        body: JSON.stringify(emailData)
      });
    },
    onSuccess: () => {
      toast({ title: t('common:toast.emailSentSuccessfully') });
      setShowEmailDialog(false);
      setEmailContent('');
    },
    onError: () => {
      toast({ title: "Failed to send email", variant: "destructive" });
    }
  });

  // Telegram automation mutation
  const telegramMutation = useMutation({
    mutationFn: async (telegramData: { channelId: string, message: string, autoReply: boolean }) => {
      return apiRequest('/api/admin/telegram-automation', {
        method: 'POST',
        body: JSON.stringify(telegramData)
      });
    },
    onSuccess: () => {
      toast({ title: "Telegram message sent and auto-reply configured" });
      setShowTelegramDialog(false);
      setTelegramContent('');
    },
    onError: () => {
      toast({ title: "Failed to configure Telegram automation", variant: "destructive" });
    }
  });

  // AI assistant mutation
  const aiAssistantMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest('/api/admin/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    },
    onSuccess: (data) => {
      setAIResponse(data.response);
      toast({ title: "AI assistant responded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to get AI response", variant: "destructive" });
    }
  });

  // Handle email broadcast
  const handleEmailBroadcast = async () => {
    if (!emailContent.trim()) {
      toast({ title: "Please enter email content", variant: "destructive" });
      return;
    }

    sendEmailMutation.mutate({
      recipients: ['all_students'],
      subject: 'Important Update from Meta Lingua',
      content: emailContent
    });
  };

  // Handle Telegram automation
  const handleTelegramAutomation = async () => {
    if (!telegramContent.trim()) {
      toast({ title: "Please enter Telegram message", variant: "destructive" });
      return;
    }

    telegramMutation.mutate({
      channelId: '@metalingua_channel',
      message: telegramContent,
      autoReply: true
    });
  };

  // Handle AI assistant
  const handleAIAssistant = async (query: string) => {
    aiAssistantMutation.mutate(query);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t('admin:campaigns.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('admin:campaigns.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewCampaignDialog(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:campaigns.newCampaign')}
            </Button>
          </div>
        </div>

        {/* Campaign Overview Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('admin:campaigns.campaignOverview')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('admin:campaigns.campaignOverviewDesc')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  {t('admin:campaigns.emailBroadcast')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin:campaigns.sendEmailToAllStudents')}</DialogTitle>
                  <DialogDescription>
                    {t('admin:campaigns.broadcastEmailDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emailContent">{t('admin:campaigns.emailContent')}</Label>
                    <Textarea
                      id="emailContent"
                      placeholder={t('admin:campaigns.emailPlaceholder')}
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleEmailBroadcast} disabled={sendEmailMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {sendEmailMutation.isPending ? t('admin:campaigns.sending') : t('admin:campaigns.sendEmail')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                      {t('admin:campaigns.cancel')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('admin:campaigns.telegramAutomation')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin:campaigns.telegramChannelAutomation')}</DialogTitle>
                  <DialogDescription>
                    {t('admin:campaigns.setupTelegramDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="telegramContent">{t('admin:campaigns.telegramMessage')}</Label>
                    <Textarea
                      id="telegramContent"
                      placeholder={t('admin:campaigns.telegramPlaceholder')}
                      value={telegramContent}
                      onChange={(e) => setTelegramContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>{t('admin:campaigns.enableAutoReply')}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTelegramAutomation} disabled={telegramMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {telegramMutation.isPending ? t('admin:campaigns.sending') : t('admin:campaigns.configure')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowTelegramDialog(false)}>
                      {t('admin:campaigns.cancel')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Bot className="h-4 w-4 mr-2" />
                  {t('admin:campaigns.aiAssistant')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin:campaigns.fineTunedAiAssistant')}</DialogTitle>
                  <DialogDescription>
                    {t('admin:campaigns.askAiForHelp')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aiQuery">{t('common:form.question')}</Label>
                    <Input
                      id="aiQuery"
                      placeholder={t('admin:campaigns.aiQueryPlaceholder')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAIAssistant(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                  {aiResponse && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{aiResponse}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        const input = document.getElementById('aiQuery') as HTMLInputElement;
                        if (input?.value) handleAIAssistant(input.value);
                      }}
                      disabled={aiAssistantMutation.isPending}
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      {aiAssistantMutation.isPending ? t('admin:campaigns.asking') : t('admin:campaigns.askAi')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                      {t('common:actions.close')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleNewCampaign} disabled={createCampaignMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createCampaignMutation.isPending ? t('common:actions.creating') : t('admin:campaigns.newCampaign')}
            </Button>
          </div>
        </div>

        {/* Campaign Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.activeCampaigns')}
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.totalLeads')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">
              +127 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.conversionRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.4%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.roiAverage')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">340%</div>
            <p className="text-xs text-muted-foreground">
              Excellent performance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">{t('admin:campaigns.activeCampaigns')}</TabsTrigger>
          <TabsTrigger value="social">{t('admin:campaigns.social')}</TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Campaigns
          </TabsTrigger>
          <TabsTrigger value="tools">{t('admin:campaigns.tools')}</TabsTrigger>
          <TabsTrigger value="website">{t('admin:campaigns.websiteBuilderLandingPages')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:campaigns.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:campaigns.campaignPerformanceDashboard')}</CardTitle>
              <CardDescription>
                {t('admin:campaigns.monitorAndManage')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(campaigns || []).map((campaign) => (
                  <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{campaign.name}</h3>
                            <Badge className={`text-xs ${
                              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {campaign.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {campaign.type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">{t('admin:campaigns.budgetSpent')}</p>
                              <p className="text-sm font-medium">
                                {(campaign.spent || 0).toLocaleString()} / {(campaign.budget || 0).toLocaleString()} IRR
                              </p>
                              <Progress value={campaign.budget ? ((campaign.spent || 0) / campaign.budget) * 100 : 0} className="h-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{t('admin:campaigns.conversions')}</p>
                              <p className="text-sm font-medium">{campaign.metrics?.conversions || 0}</p>
                              <p className="text-xs text-gray-400">
                                {campaign.metrics?.clicks && campaign.metrics?.conversions 
                                  ? ((campaign.metrics.conversions / campaign.metrics.clicks) * 100).toFixed(1)
                                  : '0.0'}% rate
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{t('admin:campaigns.costPerLead')}</p>
                              <p className="text-sm font-medium">{(campaign.metrics?.cost_per_lead || 0).toLocaleString()} IRR</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{t('admin:campaigns.roi')}</p>
                              <p className="text-sm font-medium text-green-600">{campaign.metrics?.roi || 0}%</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {(campaign.channels || []).map((channel) => (
                              <Badge key={channel} variant="outline" className="text-xs">
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {campaign.status === 'active' ? (
                            <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)} disabled={updateCampaignMutation.isPending}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => resumeCampaign(campaign.id)} disabled={updateCampaignMutation.isPending}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setSelectedCampaign(campaign)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:campaigns.socialMediaIntegration')}</CardTitle>
              <CardDescription>
                {t('admin:campaigns.connectManagePlatforms')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {socialMediaPlatforms.map((platform, index) => {
                  const IconComponent = platform.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-8 w-8 text-blue-600" />
                            <div>
                              <h3 className="font-medium">{platform.platform}</h3>
                              <p className="text-sm text-gray-500">{platform.handle}</p>
                            </div>
                          </div>
                          <Badge className={platform.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {platform.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">{t('admin:campaigns.followers')}</p>
                            <p className="text-lg font-bold">{platform.followers}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('admin:campaigns.engagement')}</p>
                            <p className="text-lg font-bold text-blue-600">{platform.engagement}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('admin:campaigns.lastPost')}</p>
                            <p className="text-sm">{platform.lastPost}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleSocialMediaAction(platform.platform, 'view')}
                            disabled={socialMediaMutation.isPending}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('admin:campaigns.view')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleSocialMediaAction(platform.platform, 'manage')}
                            disabled={socialMediaMutation.isPending}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {t('admin:campaigns.manage')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Cross-Platform Campaign Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium">{t('admin:campaigns.contentScheduler')}</h4>
                      <p className="text-sm text-gray-500 mb-3">{t('admin:campaigns.schedulePostsAllPlatforms')}</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCrossplatformTool('scheduler')}
                      >
                        {t('admin:campaigns.setupScheduler')}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium">{t('admin:campaigns.analyticsHub')}</h4>
                      <p className="text-sm text-gray-500 mb-3">{t('admin:campaigns.unifiedSocialAnalytics')}</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCrossplatformTool('analytics')}
                      >
                        {t('admin:campaigns.viewAnalytics')}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium">{t('admin:campaigns.leadTracking')}</h4>
                      <p className="text-sm text-gray-500 mb-3">{t('admin:campaigns.trackLeadsFromPlatforms')}</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCrossplatformTool('tracking')}
                      >
                        {t('admin:campaigns.trackLeads')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Bulk SMS Campaigns
              </CardTitle>
              <CardDescription>
                Send targeted SMS campaigns to students with discount codes and personalized messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Selection */}
              <div className="space-y-2">
                <Label>Select Campaign (Optional)</Label>
                <Select 
                  value={selectedCampaign?.id?.toString() || ''} 
                  onValueChange={(val) => {
                    const campaign = campaigns.find(c => c.id === parseInt(val));
                    setSelectedCampaign(campaign || null);
                  }}
                >
                  <SelectTrigger data-testid="select-campaign">
                    <SelectValue placeholder="Select a campaign to track SMS metrics" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.filter(c => c.status !== 'completed').map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name} ({campaign.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link SMS sends to a campaign for tracking and analytics
                </p>
              </div>

              {/* Audience Selector */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select 
                  value={audienceSegment} 
                  onValueChange={setAudienceSegment}
                >
                  <SelectTrigger data-testid="select-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid_placement_test">
                      Unpaid Placement Test Takers (Last 7 Days)
                    </SelectItem>
                    <SelectItem value="inactive_students">
                      Inactive Students (No Activity)
                    </SelectItem>
                    <SelectItem value="current_students">
                      Current Enrolled Students
                    </SelectItem>
                    <SelectItem value="custom_csv">
                      Custom List (CSV Upload)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {audienceSegment === 'inactive_students' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-sm">Inactive for (months):</Label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={inactiveMonths}
                      onChange={(e) => setInactiveMonths(parseInt(e.target.value) || 3)}
                      className="w-20"
                      data-testid="input-inactive-months"
                    />
                  </div>
                )}

                {/* Audience Preview */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAudiencePreview}
                  disabled={audiencePreviewLoading}
                  data-testid="button-preview-audience"
                  className="mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Audience ({audienceCount || 0} recipients)
                </Button>
              </div>

              {/* CSV Upload for Custom Audience */}
              {audienceSegment === 'custom_csv' && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Upload Phone Numbers</CardTitle>
                    <CardDescription className="text-xs">
                      Upload CSV file or paste phone numbers (one per line). Format: 09123456789 or 989123456789
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Paste phone numbers here (one per line) or paste CSV content..."
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      data-testid="textarea-csv-content"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => parseCSVContent('csv')}
                        disabled={!csvContent.trim() || csvParseLoading}
                        size="sm"
                        data-testid="button-parse-csv"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Parse CSV
                      </Button>
                      <Button
                        onClick={() => parseCSVContent('text')}
                        disabled={!csvContent.trim() || csvParseLoading}
                        size="sm"
                        variant="outline"
                        data-testid="button-parse-text"
                      >
                        Parse as Text
                      </Button>
                    </div>
                    {csvParseResult && (
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-4">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Valid: {csvParseResult.validCount}
                          </Badge>
                          {csvParseResult.invalidCount > 0 && (
                            <Badge variant="default" className="bg-red-100 text-red-800">
                              Invalid: {csvParseResult.invalidCount}
                            </Badge>
                          )}
                          {csvParseResult.duplicateCount > 0 && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                              Duplicates: {csvParseResult.duplicateCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Message Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message Template</Label>
                  <span className="text-xs text-muted-foreground">
                    {smsMessage.length} / 160 characters
                    {smsMessage.length > 160 && ` (${Math.ceil(smsMessage.length / 160)} SMS)`}
                  </span>
                </div>
                <Textarea
                  placeholder="Enter your message here. Use variables: {studentName}, {discountCode}, {validUntil}"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={6}
                  data-testid="textarea-sms-message"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => insertVariable('{studentName}')}
                    data-testid="button-insert-name"
                  >
                    + Student Name
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => insertVariable('{discountCode}')}
                    data-testid="button-insert-discount"
                  >
                    + Discount Code
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => insertVariable('{validUntil}')}
                    data-testid="button-insert-valid-until"
                  >
                    + Valid Until
                  </Button>
                </div>
                
                {/* Message Preview */}
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs text-muted-foreground">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {smsMessage
                      .replace('{studentName}', 'علی رضایی')
                      .replace('{discountCode}', 'SPRING2025')
                      .replace('{validUntil}', '1404/01/15')}
                  </CardContent>
                </Card>
              </div>

              {/* Discount Code Input */}
              <div className="space-y-2">
                <Label>Discount Code (Optional)</Label>
                <Input
                  placeholder="e.g., SPRING2025, YALDA30"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  data-testid="input-discount-code"
                />
                <p className="text-xs text-muted-foreground">
                  This code will replace {'{discountCode}'} variable in your message
                </p>
              </div>

              {/* Test SMS Feature */}
              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Test SMS Before Sending
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Test phone number (e.g., 09123456789)"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      data-testid="input-test-phone"
                    />
                    <Button
                      onClick={sendTestSMS}
                      disabled={!testPhone || !smsMessage.trim() || testSMSLoading}
                      data-testid="button-send-test"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send a test message to verify formatting and variable replacement
                  </p>
                </CardContent>
              </Card>

              {/* Bulk Send */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm font-medium">Ready to send to {audienceCount || 0} recipients</p>
                  <p className="text-xs text-muted-foreground">
                    Estimated cost: {(audienceCount || 0) * 50} IRR
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={sendBulkSMS}
                  disabled={!smsMessage.trim() || audienceCount === 0 || bulkSMSLoading}
                  data-testid="button-send-bulk"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Bulk SMS
                </Button>
              </div>

              {/* Progress Tracking */}
              {smsSendProgress && (
                <Card className="bg-green-50 dark:bg-green-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Sending Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={(smsSendProgress.sent / smsSendProgress.total) * 100} />
                    <div className="flex justify-between text-sm">
                      <span>Sent: {smsSendProgress.sent}</span>
                      <span>Failed: {smsSendProgress.failed}</span>
                      <span>Total: {smsSendProgress.total}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:campaigns.professionalMarketingTools')}</CardTitle>
              <CardDescription>
                {t('admin:campaigns.integratedThirdParty')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {marketingTools.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.tools.map((tool, toolIndex) => {
                        const IconComponent = tool.icon;
                        return (
                          <Card key={toolIndex} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <IconComponent className="h-6 w-6 text-gray-600" />
                                  <div>
                                    <h4 className="font-medium">{tool.name}</h4>
                                    <p className="text-sm text-gray-500">{tool.metrics}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={
                                    tool.status === 'connected' ? 'bg-green-100 text-green-800' :
                                    tool.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }>
                                    {tool.status}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleMarketingTool(tool.name, 'configure')}
                                    disabled={marketingToolMutation.isPending}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="website">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:campaigns.websiteBuilderLandingPages')}</CardTitle>
              <CardDescription>
                {t('admin:campaigns.createConversionOptimized')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Globe className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">{t('admin:campaigns.websiteBuilderIntegration')}</h3>
                <p className="text-gray-500 mb-6">
                  {t('admin:campaigns.websiteBuilderDesc')}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin:campaigns.createLandingPage')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:campaigns.campaignAnalytics')}</CardTitle>
              <CardDescription>
                {t('admin:campaigns.comprehensivePerformanceTracking')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin:campaigns.attributionTracking')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.instagramEnrollment')}</span>
                        <span className="font-medium">34%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.googleAdsEnrollment')}</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.telegramEnrollment')}</span>
                        <span className="font-medium">22%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.referralEnrollment')}</span>
                        <span className="font-medium">16%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin:campaigns.roiByChannel')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.referralProgram')}</span>
                        <span className="font-medium text-green-600">520%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.instagramAds')}</span>
                        <span className="font-medium text-green-600">380%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.emailMarketing')}</span>
                        <span className="font-medium text-green-600">290%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin:campaigns.googleAds')}</span>
                        <span className="font-medium text-blue-600">180%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tool Configuration Dialog */}
      <Dialog open={showToolConfigDialog} onOpenChange={setShowToolConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:campaigns.configureTool', { tool: selectedTool })}</DialogTitle>
            <DialogDescription>
              {t('admin:campaigns.configureToolDesc', { tool: selectedTool })}
            </DialogDescription>
          </DialogHeader>
          <ToolConfigurationForm 
            toolName={selectedTool}
            onSave={saveToolConfiguration}
            onCancel={() => setShowToolConfigDialog(false)}
            isLoading={marketingToolMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* New Campaign Creation Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:campaigns.createNewCampaign')}</DialogTitle>
            <DialogDescription>
              {t('admin:campaigns.createNewCampaignDesc')}
            </DialogDescription>
          </DialogHeader>
          <NewCampaignForm 
            campaignData={newCampaignData}
            onDataChange={setNewCampaignData}
            onSave={handleCreateCampaign}
            onCancel={() => {
              setShowNewCampaignDialog(false);
              resetNewCampaignForm();
            }}
            isLoading={createCampaignMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Campaign Settings/Edit Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:campaigns.editCampaign')}</DialogTitle>
            <DialogDescription>
              {t('admin:campaigns.editCampaignDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <NewCampaignForm 
              campaignData={{
                name: selectedCampaign.name,
                type: selectedCampaign.type,
                targetAudience: selectedCampaign.targetAudience,
                budget: selectedCampaign.budget,
                channels: selectedCampaign.channels || [],
                startDate: selectedCampaign.startDate,
                endDate: selectedCampaign.endDate,
                description: '' // Add description if available
              }}
              onDataChange={(data) => {
                setSelectedCampaign({...selectedCampaign, ...data});
              }}
              onSave={() => {
                updateCampaignMutation.mutate({ 
                  id: selectedCampaign.id, 
                  updates: {
                    name: selectedCampaign.name,
                    type: selectedCampaign.type,
                    targetAudience: selectedCampaign.targetAudience,
                    budget: selectedCampaign.budget,
                    channels: selectedCampaign.channels,
                    startDate: selectedCampaign.startDate,
                    endDate: selectedCampaign.endDate
                  } 
                });
                setSelectedCampaign(null);
              }}
              onCancel={() => setSelectedCampaign(null)}
              isLoading={updateCampaignMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tool Configuration Form Component
function ToolConfigurationForm({ 
  toolName, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  toolName: string; 
  onSave: (config: any) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const [config, setConfig] = useState<any>({});

  const handleSave = () => {
    onSave(config);
  };

  const renderConfigForm = () => {
    switch (toolName) {
      case 'Instagram Integration':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="instagramToken">{t('admin:campaigns.accessToken')}</Label>
              <Input
                id="instagramToken"
                type="password"
                placeholder={t('admin:campaigns.enterAccessToken')}
                value={config.accessToken || ''}
                onChange={(e) => setConfig({...config, accessToken: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="instagramAccount">{t('admin:campaigns.accountHandle')}</Label>
              <Input
                id="instagramAccount"
                placeholder="@your_account"
                value={config.accountHandle || ''}
                onChange={(e) => setConfig({...config, accountHandle: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoPost"
                checked={config.autoPost || false}
                onCheckedChange={(checked) => setConfig({...config, autoPost: checked})}
              />
              <Label htmlFor="autoPost">{t('admin:campaigns.enableAutoPosting')}</Label>
            </div>
          </div>
        );
      
      case 'Email Marketing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="smtpHost">{t('admin:campaigns.smtpHost')}</Label>
              <Input
                id="smtpHost"
                placeholder="smtp.gmail.com"
                value={config.smtpHost || ''}
                onChange={(e) => setConfig({...config, smtpHost: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">{t('admin:campaigns.smtpPort')}</Label>
              <Input
                id="smtpPort"
                type="number"
                placeholder="587"
                value={config.smtpPort || ''}
                onChange={(e) => setConfig({...config, smtpPort: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="emailFrom">{t('admin:campaigns.fromEmail')}</Label>
              <Input
                id="emailFrom"
                type="email"
                placeholder="noreply@metalingua.com"
                value={config.fromEmail || ''}
                onChange={(e) => setConfig({...config, fromEmail: e.target.value})}
              />
            </div>
          </div>
        );
      
      case 'Landing Page Builder':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">{t('admin:campaigns.customDomain')}</Label>
              <Input
                id="domain"
                placeholder="pages.metalingua.com"
                value={config.domain || ''}
                onChange={(e) => setConfig({...config, domain: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="template">{t('admin:campaigns.defaultTemplate')}</Label>
              <Select value={config.template || ''} onValueChange={(value) => setConfig({...config, template: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:campaigns.selectTemplate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">{t('admin:campaigns.modernTemplate')}</SelectItem>
                  <SelectItem value="classic">{t('admin:campaigns.classicTemplate')}</SelectItem>
                  <SelectItem value="persian">{t('admin:campaigns.persianTemplate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="rtlSupport"
                checked={config.rtlSupport || false}
                onCheckedChange={(checked) => setConfig({...config, rtlSupport: checked})}
              />
              <Label htmlFor="rtlSupport">{t('admin:campaigns.enableRtlSupport')}</Label>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="generalConfig">{t('admin:campaigns.configuration')}</Label>
              <Textarea
                id="generalConfig"
                placeholder={t('admin:campaigns.enterConfiguration')}
                value={config.general || ''}
                onChange={(e) => setConfig({...config, general: e.target.value})}
                rows={4}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderConfigForm()}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? t('common:actions.saving') : t('common:actions.save')}
        </Button>
      </div>
    </div>
  );
}

// New Campaign Form Component
function NewCampaignForm({ 
  campaignData, 
  onDataChange, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  campaignData: any; 
  onDataChange: (data: any) => void; 
  onSave: () => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) {
  const { t } = useTranslation(['admin', 'common']);

  const updateField = (field: string, value: any) => {
    onDataChange({ ...campaignData, [field]: value });
  };

  const toggleChannel = (channel: string) => {
    const channels = campaignData.channels.includes(channel)
      ? campaignData.channels.filter((ch: string) => ch !== channel)
      : [...campaignData.channels, channel];
    updateField('channels', channels);
  };

  const availableChannels = ['Instagram', 'Telegram', 'YouTube', 'LinkedIn', 'Email', 'Google Ads'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="campaignName">{t('admin:campaigns.campaignName')} *</Label>
          <Input
            id="campaignName"
            placeholder={t('admin:campaigns.enterCampaignName')}
            value={campaignData.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="campaignType">{t('admin:campaigns.campaignType')}</Label>
          <Select value={campaignData.type} onValueChange={(value) => updateField('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enrollment">{t('admin:campaigns.campaignTypes.enrollment')}</SelectItem>
              <SelectItem value="retention">{t('admin:campaigns.campaignTypes.retention')}</SelectItem>
              <SelectItem value="referral">{t('admin:campaigns.campaignTypes.referral')}</SelectItem>
              <SelectItem value="awareness">{t('admin:campaigns.campaignTypes.awareness')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('admin:campaigns.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('admin:campaigns.enterDescription')}
          value={campaignData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">{t('admin:campaigns.budget')} (IRR)</Label>
          <Input
            id="budget"
            type="number"
            placeholder="10,000,000"
            value={campaignData.budget}
            onChange={(e) => updateField('budget', parseInt(e.target.value) || 0)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="targetAudience">{t('admin:campaigns.targetAudience')}</Label>
          <Select value={campaignData.targetAudience} onValueChange={(value) => updateField('targetAudience', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="persian_learners">{t('admin:campaigns.persianLearners')}</SelectItem>
              <SelectItem value="new_students">{t('admin:campaigns.newStudents')}</SelectItem>
              <SelectItem value="existing_students">{t('admin:campaigns.existingStudents')}</SelectItem>
              <SelectItem value="all_users">{t('admin:campaigns.allUsers')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('admin:campaigns.startDate')}</Label>
          <Input
            id="startDate"
            type="date"
            value={campaignData.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('admin:campaigns.endDate')}</Label>
          <Input
            id="endDate"
            type="date"
            value={campaignData.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('admin:campaigns.marketingChannels')} *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableChannels.map(channel => (
            <div key={channel} className="flex items-center space-x-2">
              <Switch
                id={channel}
                checked={campaignData.channels.includes(channel)}
                onCheckedChange={() => toggleChannel(channel)}
              />
              <Label htmlFor={channel} className="text-sm">{channel}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? t('common:actions.creating') : t('admin:campaigns.createCampaign')}
        </Button>
      </div>
    </div>
  );
}
