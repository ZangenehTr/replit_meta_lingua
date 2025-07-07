import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
  Twitter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);

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
      toast({ title: "Campaign updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update campaign", variant: "destructive" });
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
      toast({ title: "New campaign created successfully" });
      setShowNewCampaignDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
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
    switch(toolType) {
      case 'scheduler':
        toast({ title: "Opening Content Scheduler...", description: "Setting up cross-platform posting" });
        break;
      case 'analytics':
        toast({ title: "Loading Analytics Hub...", description: "Unified social media analytics" });
        break;
      case 'tracking':
        toast({ title: "Initializing Lead Tracking...", description: "Cross-platform lead monitoring" });
        break;
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            360° Campaign Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Professional marketing tools & social media integration
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={handleNewCampaign} disabled={createCampaignMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
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
  );
}