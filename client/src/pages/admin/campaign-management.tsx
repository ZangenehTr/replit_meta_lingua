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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [telegramContent, setTelegramContent] = useState('');
  const [aiResponse, setAIResponse] = useState('');

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
    mutationFn: async ({ toolName, action }: { toolName: string; action: string }) => {
      return apiRequest(`/api/admin/marketing-tools/${encodeURIComponent(toolName)}/${action}`, {
        method: 'POST'
      });
    },
    onSuccess: (data, variables) => {
      toast({ title: `${variables.action} ${variables.toolName} successfully` });
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

  // Button event handlers for campaign management operations
  const handleNewCampaign = () => {
    const newCampaignData = {
      name: `کمپین جدید ${Date.now()}`, // New Campaign with timestamp
      type: 'enrollment',
      targetAudience: 'persian_learners',
      budget: 10000000, // 10M IRR default budget
      channels: ['Instagram', 'Telegram']
    };
    createCampaignMutation.mutate(newCampaignData);
  };

  const handleSocialMediaAction = (platform: string, action: string) => {
    socialMediaMutation.mutate({ platform: platform.toLowerCase(), action });
  };

  const handleMarketingTool = (toolName: string, action: string = 'configure') => {
    marketingToolMutation.mutate({ toolName, action });
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
        body: emailData
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
        body: telegramData
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
        body: { query }
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
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 space-y-6">
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
              New Campaign
            </Button>
          </div>
        </div>

        {/* Campaign Overview Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              360° Campaign Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Professional marketing tools & social media integration
            </p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Email to All Students</DialogTitle>
                  <DialogDescription>
                    Broadcast email to all registered students
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emailContent">Email Content</Label>
                    <Textarea
                      id="emailContent"
                      placeholder="Enter your email message..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleEmailBroadcast} disabled={sendEmailMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Telegram Automation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Telegram Channel Automation</DialogTitle>
                  <DialogDescription>
                    Post to Telegram channel with auto-reply enabled
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="telegramContent">Message Content</Label>
                    <Textarea
                      id="telegramContent"
                      placeholder="Enter your Telegram message..."
                      value={telegramContent}
                      onChange={(e) => setTelegramContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Enable AI Auto-Reply</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTelegramAutomation} disabled={telegramMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {telegramMutation.isPending ? 'Sending...' : 'Send & Configure'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowTelegramDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fine-tuned AI Assistant</DialogTitle>
                  <DialogDescription>
                    Query the AI assistant for marketing insights
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aiQuery">Your Question</Label>
                    <Input
                      id="aiQuery"
                      placeholder="e.g., How can I improve student engagement?"
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
                      {aiAssistantMutation.isPending ? 'Asking...' : 'Ask AI'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleNewCampaign} disabled={createCampaignMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {createCampaignMutation.isPending ? 'Creating...' : 'New Campaign'}
            </Button>
          </div>
        </div>

        {/* Campaign Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
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
              Total Leads
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
              Conversion Rate
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
              ROI Average
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
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="tools">Marketing Tools</TabsTrigger>
          <TabsTrigger value="website">Website Builder</TabsTrigger>
          <TabsTrigger value="analytics">360° Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Dashboard</CardTitle>
              <CardDescription>
                Monitor and manage all marketing campaigns
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
                  {campaigns.map((campaign) => (
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
                              <p className="text-xs text-gray-500">Budget Spent</p>
                              <p className="text-sm font-medium">
                                {campaign.spent.toLocaleString()} / {campaign.budget.toLocaleString()} IRR
                              </p>
                              <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Conversions</p>
                              <p className="text-sm font-medium">{campaign.metrics.conversions}</p>
                              <p className="text-xs text-gray-400">
                                {((campaign.metrics.conversions / campaign.metrics.clicks) * 100).toFixed(1)}% rate
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Cost per Lead</p>
                              <p className="text-sm font-medium">{campaign.metrics.cost_per_lead.toLocaleString()} IRR</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ROI</p>
                              <p className="text-sm font-medium text-green-600">{campaign.metrics.roi}%</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {campaign.channels.map((channel) => (
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
              <CardTitle>Social Media Integration</CardTitle>
              <CardDescription>
                Manage Instagram, Telegram, YouTube, LinkedIn, and Twitter
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
                            <p className="text-xs text-gray-500">Followers</p>
                            <p className="text-lg font-bold">{platform.followers}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Engagement</p>
                            <p className="text-lg font-bold text-blue-600">{platform.engagement}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Post</p>
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
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleSocialMediaAction(platform.platform, 'manage')}
                            disabled={socialMediaMutation.isPending}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
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
                      <h4 className="font-medium">Content Scheduler</h4>
                      <p className="text-sm text-gray-500 mb-3">Schedule posts across all platforms</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCrossplatformTool('scheduler')}
                      >
                        Setup Scheduler
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium">Analytics Hub</h4>
                      <p className="text-sm text-gray-500 mb-3">Unified social media analytics</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCrossplatformTool('analytics')}
                      >
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium">Lead Tracking</h4>
                      <p className="text-sm text-gray-500 mb-3">Track leads from each platform</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCrossplatformTool('tracking')}
                      >
                        Track Leads
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Professional Marketing Tools</CardTitle>
              <CardDescription>
                Integrated third-party services and native tools
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
              <CardTitle>Website Builder & Landing Pages</CardTitle>
              <CardDescription>
                Create conversion-optimized pages for campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Globe className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">Website Builder Integration</h3>
                <p className="text-gray-500 mb-6">
                  This will be implemented as a comprehensive website builder for creating course showcase pages, landing pages, and campaign-specific websites.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Landing Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>360° Campaign Analytics</CardTitle>
              <CardDescription>
                Comprehensive performance tracking across all channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attribution Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Instagram → Enrollment</span>
                        <span className="font-medium">34%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Google Ads → Enrollment</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Telegram → Enrollment</span>
                        <span className="font-medium">22%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Referral → Enrollment</span>
                        <span className="font-medium">16%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ROI by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Referral Program</span>
                        <span className="font-medium text-green-600">520%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Instagram Ads</span>
                        <span className="font-medium text-green-600">380%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email Marketing</span>
                        <span className="font-medium text-green-600">290%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Google Ads</span>
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
      </div>
    </AppLayout>
  );
}