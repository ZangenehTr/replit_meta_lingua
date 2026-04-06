import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Target, TrendingUp, BarChart3, Globe, Mail, Phone, Calendar, DollarSign, ExternalLink, Play, Pause, Settings, Plus, Instagram, Youtube, Linkedin, Twitter, MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/utils";
import { nanoid } from "nanoid";
import { ToolConfigurationForm } from "@/components/admin/ToolConfigurationForm";
import { NewCampaignForm } from "@/components/admin/NewCampaignForm";
import { SMSCampaignTab } from "@/components/admin/SMSCampaignTab";
import { CampaignHeaderActions } from "@/components/admin/CampaignHeaderActions";
import { useCampaigns, useCampaignMutations } from "@/hooks/useCampaigns";

interface Campaign {
  id: number; name: string; type: "enrollment"|"retention"|"referral"|"awareness"; status: "draft"|"active"|"paused"|"completed";
  budget: number; spent: number; startDate: string; endDate: string; targetAudience: string; channels: string[];
  metrics: { impressions: number; clicks: number; conversions: number; cost_per_lead: number; roi: number };
}

const SOCIAL_PLATFORMS = [
  { platform: "Instagram", handle: "@metalingua_persian", followers: "2,340", engagement: "4.2%", lastPost: "2 hours ago", status: "active", icon: Instagram },
  { platform: "Telegram", handle: "@metalingua_channel", followers: "5,234", engagement: "8.1%", lastPost: "4 hours ago", status: "active", icon: Phone },
  { platform: "YouTube", handle: "MetaLingo Persian", followers: "892", engagement: "6.7%", lastPost: "1 day ago", status: "active", icon: Youtube },
  { platform: "LinkedIn", handle: "MetaLingo Institute", followers: "567", engagement: "3.4%", lastPost: "3 days ago", status: "pending", icon: Linkedin },
];

const MARKETING_TOOLS = [
  { category: "Social Media Management", tools: [{ name: "Instagram Integration", status: "connected", icon: Instagram, metrics: "2.3K followers" }, { name: "Telegram Channel", status: "connected", icon: Phone, metrics: "5.2K subscribers" }, { name: "YouTube Channel", status: "connected", icon: Youtube, metrics: "890 subscribers" }, { name: "Twitter Account", status: "connected", icon: Twitter, metrics: "1.1K followers" }] },
  { category: "Lead Generation", tools: [{ name: "Landing Page Builder", status: "active", icon: Globe, metrics: "24 pages created" }, { name: "Lead Capture Forms", status: "active", icon: Target, metrics: "89% conversion" }, { name: "Email Marketing", status: "active", icon: Mail, metrics: "23.4% open rate" }] },
  { category: "Analytics & Tracking", tools: [{ name: "Google Analytics", status: "connected", icon: BarChart3, metrics: "Real-time data" }, { name: "A/B Testing Suite", status: "active", icon: Settings, metrics: "12 active tests" }] },
];

const INITIAL_CAMPAIGN = { name: "", type: "enrollment" as const, targetAudience: "persian_learners", budget: 10000000, channels: [] as string[], startDate: "", endDate: "", description: "" };

export default function CampaignManagementPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showToolConfigDialog, setShowToolConfigDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [newCampaignData, setNewCampaignData] = useState(INITIAL_CAMPAIGN);
  const [audienceSegment, setAudienceSegment] = useState("unpaid_placement_test");
  const [inactiveMonths, setInactiveMonths] = useState(3);
  const [audienceCount, setAudienceCount] = useState(0);
  const [audiencePreviewLoading, setAudiencePreviewLoading] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testSMSLoading, setTestSMSLoading] = useState(false);
  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);
  const [smsSendProgress, setSmsSendProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [csvContent, setCsvContent] = useState("");
  const [csvParseLoading, setCsvParseLoading] = useState(false);
  const [csvParseResult, setCsvParseResult] = useState<{ validCount: number; invalidCount: number } | null>(null);
  const [customRecipients, setCustomRecipients] = useState<string[]>([]);

  const { campaigns, isLoading } = useCampaigns();
  const { updateCampaignMutation, createCampaignMutation, socialMediaMutation, crossplatformMutation, marketingToolMutation } = useCampaignMutations(
    () => { setShowNewCampaignDialog(false); setNewCampaignData(INITIAL_CAMPAIGN); },
  );

  const fetchAudiencePreview = async () => {
    setAudiencePreviewLoading(true);
    try {
      const params = new URLSearchParams({ segment: audienceSegment, ...(audienceSegment === "inactive_students" && { monthsInactive: inactiveMonths.toString() }) });
      const res = await fetch(`/api/admin/campaigns/audience-preview?${params}`);
      const data = await res.json();
      setAudienceCount(data.count || 0);
      toast({ title: `Found ${data.count || 0} recipients` });
    } catch { toast({ title: "Failed to preview audience", variant: "destructive" }); }
    finally { setAudiencePreviewLoading(false); }
  };

  const parseCSVContent = async (format: "csv"|"text") => {
    setCsvParseLoading(true);
    try {
      const data = await apiRequest("/api/admin/campaigns/upload-recipients", { method: "POST", body: JSON.stringify({ content: csvContent, format }) }) as { validCount: number; invalidCount: number; validPhones?: string[] };
      setCsvParseResult({ validCount: data.validCount, invalidCount: data.invalidCount });
      setCustomRecipients(data.validPhones || []);
      setAudienceCount(data.validCount || 0);
      toast({ title: `Parsed ${data.validCount} valid phone numbers` });
    } catch { toast({ title: "Failed to parse CSV", variant: "destructive" }); }
    finally { setCsvParseLoading(false); }
  };

  const sendTestSMS = async () => {
    setTestSMSLoading(true);
    try {
      await apiRequest(`/api/admin/campaigns/${selectedCampaign?.id || 0}/send-sms`, { method: "POST", body: JSON.stringify({ message: smsMessage, testMode: true, testPhone, idempotencyKey: nanoid() }) });
      toast({ title: "Test SMS sent successfully!" });
    } catch { toast({ title: "Failed to send test SMS", variant: "destructive" }); }
    finally { setTestSMSLoading(false); }
  };

  const sendBulkSMS = async () => {
    if (!selectedCampaign) { toast({ title: "Please select a campaign first", variant: "destructive" }); return; }
    setBulkSMSLoading(true);
    setSmsSendProgress({ sent: 0, failed: 0, total: audienceCount });
    try {
      const body: Record<string, unknown> = { message: smsMessage.replace("{discountCode}", discountCode || "N/A"), segment: audienceSegment !== "custom_csv" ? audienceSegment : undefined, recipients: audienceSegment === "custom_csv" ? customRecipients : undefined, monthsInactive: audienceSegment === "inactive_students" ? inactiveMonths : undefined, idempotencyKey: nanoid() };
      const data = await apiRequest(`/api/admin/campaigns/${selectedCampaign.id}/send-sms`, { method: "POST", body: JSON.stringify(body) });
      setSmsSendProgress({ sent: data.sent || 0, failed: data.failed || 0, total: data.totalRecipients || audienceCount });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: `Successfully sent ${data.sent} SMS messages!` });
    } catch { toast({ title: "Failed to send bulk SMS", variant: "destructive" }); }
    finally { setBulkSMSLoading(false); }
  };

  const handleCreateCampaign = () => {
    if (!newCampaignData.name.trim()) { toast({ title: t("admin:campaigns.pleaseEnterCampaignName"), variant: "destructive" }); return; }
    if (newCampaignData.channels.length === 0) { toast({ title: t("admin:campaigns.pleaseSelectChannels"), variant: "destructive" }); return; }
    createCampaignMutation.mutate(newCampaignData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t("admin:campaigns.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("admin:campaigns.subtitle")}</p>
        </div>
        <CampaignHeaderActions onNewCampaign={() => setShowNewCampaignDialog(true)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t("admin:campaigns.activeCampaigns"), value: "12", note: "+3 from last month", icon: Megaphone },
          { label: t("admin:campaigns.totalLeads"), value: "847", note: "+127 this week", icon: Target },
          { label: t("admin:campaigns.conversionRate"), value: "23.4%", note: "+2.1% from last month", icon: TrendingUp },
          { label: t("admin:campaigns.roiAverage"), value: "340%", note: "Excellent performance", icon: DollarSign },
        ].map(({ label, value, note, icon: Icon }) => (
          <Card key={label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground">{note}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">{t("admin:campaigns.activeCampaigns")}</TabsTrigger>
          <TabsTrigger value="social">{t("admin:campaigns.social")}</TabsTrigger>
          <TabsTrigger value="sms"><MessageSquare className="h-4 w-4 me-2" />SMS Campaigns</TabsTrigger>
          <TabsTrigger value="tools">{t("admin:campaigns.tools")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("admin:campaigns.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader><CardTitle>{t("admin:campaigns.campaignPerformanceDashboard")}</CardTitle><CardDescription>{t("admin:campaigns.monitorAndManage")}</CardDescription></CardHeader>
            <CardContent>
              {isLoading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div> : (
                <div className="space-y-4">
                  {(campaigns || []).map((campaign) => (
                    <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium">{campaign.name}</h3>
                              <Badge className={campaign.status === "active" ? "bg-green-100 text-green-800" : campaign.status === "paused" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}>{campaign.status}</Badge>
                              <Badge variant="outline" className="text-xs">{campaign.type}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div><p className="text-xs text-gray-500">{t("admin:campaigns.budgetSpent")}</p><p className="text-sm font-medium">{formatCurrency(campaign.spent || 0, "IRR")} / {formatCurrency(campaign.budget || 0, "IRR")}</p><Progress value={campaign.budget ? ((campaign.spent || 0) / campaign.budget) * 100 : 0} className="h-2 mt-1" /></div>
                              <div><p className="text-xs text-gray-500">{t("admin:campaigns.conversions")}</p><p className="text-sm font-medium">{campaign.metrics?.conversions || 0}</p></div>
                              <div><p className="text-xs text-gray-500">{t("admin:campaigns.costPerLead")}</p><p className="text-sm font-medium">{formatCurrency(campaign.metrics?.cost_per_lead || 0, "IRR")}</p></div>
                              <div><p className="text-xs text-gray-500">{t("admin:campaigns.roi")}</p><p className="text-sm font-medium text-green-600">{campaign.metrics?.roi || 0}%</p></div>
                            </div>
                            <div className="flex space-x-2">{(campaign.channels || []).map((ch) => <Badge key={ch} variant="outline" className="text-xs">{ch}</Badge>)}</div>
                          </div>
                          <div className="flex space-x-2">
                            {campaign.status === "active" ? (
                              <Button size="sm" variant="outline" onClick={() => updateCampaignMutation.mutate({ id: campaign.id, updates: { status: "paused" } })} disabled={updateCampaignMutation.isPending}><Pause className="h-4 w-4" /></Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => updateCampaignMutation.mutate({ id: campaign.id, updates: { status: "active" } })} disabled={updateCampaignMutation.isPending}><Play className="h-4 w-4" /></Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setSelectedCampaign(campaign)}><Settings className="h-4 w-4" /></Button>
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
            <CardHeader><CardTitle>{t("admin:campaigns.socialMediaIntegration")}</CardTitle><CardDescription>{t("admin:campaigns.connectManagePlatforms")}</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <Card key={platform.platform}><CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3"><Icon className="h-8 w-8 text-blue-600" /><div><h3 className="font-medium">{platform.platform}</h3><p className="text-sm text-gray-500">{platform.handle}</p></div></div>
                        <Badge className={platform.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{platform.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div><p className="text-xs text-gray-500">{t("admin:campaigns.followers")}</p><p className="text-lg font-bold">{platform.followers}</p></div>
                        <div><p className="text-xs text-gray-500">{t("admin:campaigns.engagement")}</p><p className="text-lg font-bold text-blue-600">{platform.engagement}</p></div>
                        <div><p className="text-xs text-gray-500">{t("admin:campaigns.lastPost")}</p><p className="text-sm">{platform.lastPost}</p></div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => socialMediaMutation.mutate({ platform: platform.platform.toLowerCase(), action: "view" })} disabled={socialMediaMutation.isPending}><ExternalLink className="h-4 w-4 me-2" />{t("admin:campaigns.view")}</Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => socialMediaMutation.mutate({ platform: platform.platform.toLowerCase(), action: "manage" })} disabled={socialMediaMutation.isPending}><Settings className="h-4 w-4 me-2" />{t("admin:campaigns.manage")}</Button>
                      </div>
                    </CardContent></Card>
                  );
                })}
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Cross-Platform Campaign Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[["scheduler", Calendar, t("admin:campaigns.contentScheduler"), t("admin:campaigns.setupScheduler")], ["analytics", BarChart3, t("admin:campaigns.analyticsHub"), t("admin:campaigns.viewAnalytics")], ["tracking", Target, t("admin:campaigns.leadTracking"), t("admin:campaigns.trackLeads")]].map(([key, Icon, label, btn]) => (
                    <Card key={key as string}><CardContent className="p-4 text-center"><Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" /><h4 className="font-medium">{label as string}</h4><Button size="sm" className="w-full mt-3" onClick={() => crossplatformMutation.mutate(key as string)}>{btn as string}</Button></CardContent></Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <SMSCampaignTab
            campaigns={campaigns as Campaign[]}
            selectedCampaign={selectedCampaign}
            onSelectCampaign={setSelectedCampaign}
            audienceSegment={audienceSegment}
            onAudienceSegmentChange={setAudienceSegment}
            inactiveMonths={inactiveMonths}
            onInactiveMonthsChange={setInactiveMonths}
            audienceCount={audienceCount}
            audiencePreviewLoading={audiencePreviewLoading}
            onPreviewAudience={fetchAudiencePreview}
            csvContent={csvContent}
            onCsvContentChange={setCsvContent}
            csvParseLoading={csvParseLoading}
            onParseCSV={parseCSVContent}
            csvParseResult={csvParseResult}
            smsMessage={smsMessage}
            onSmsMessageChange={setSmsMessage}
            discountCode={discountCode}
            onDiscountCodeChange={setDiscountCode}
            testPhone={testPhone}
            onTestPhoneChange={setTestPhone}
            testSMSLoading={testSMSLoading}
            onSendTestSMS={sendTestSMS}
            bulkSMSLoading={bulkSMSLoading}
            onSendBulkSMS={sendBulkSMS}
            smsSendProgress={smsSendProgress}
          />
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader><CardTitle>{t("admin:campaigns.professionalMarketingTools")}</CardTitle><CardDescription>{t("admin:campaigns.integratedThirdParty")}</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {MARKETING_TOOLS.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <Card key={tool.name} className="border-l-4 border-l-green-500"><CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3"><Icon className="h-6 w-6 text-gray-600" /><div><h4 className="font-medium">{tool.name}</h4><p className="text-sm text-gray-500">{tool.metrics}</p></div></div>
                              <div className="flex items-center space-x-2">
                                <Badge className={tool.status === "connected" ? "bg-green-100 text-green-800" : tool.status === "active" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}>{tool.status}</Badge>
                                <Button size="sm" variant="outline" onClick={() => { setSelectedTool(tool.name); setShowToolConfigDialog(true); }} disabled={marketingToolMutation.isPending}><Settings className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </CardContent></Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader><CardTitle>{t("admin:campaigns.campaignAnalytics")}</CardTitle><CardDescription>{t("admin:campaigns.comprehensivePerformanceTracking")}</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="text-lg">{t("admin:campaigns.attributionTracking")}</CardTitle></CardHeader>
                  <CardContent><div className="space-y-3">{[["Instagram", "34%"], ["Google Ads", "28%"], ["Telegram", "22%"], ["Referral", "16%"]].map(([ch, pct]) => <div key={ch} className="flex justify-between"><span>{ch}</span><span className="font-medium">{pct}</span></div>)}</div></CardContent>
                </Card>
                <Card><CardHeader><CardTitle className="text-lg">{t("admin:campaigns.roiByChannel")}</CardTitle></CardHeader>
                  <CardContent><div className="space-y-3">{[["Referral Program", "520%"], ["Instagram Ads", "380%"], ["Email Marketing", "290%"], ["Google Ads", "180%"]].map(([ch, roi]) => <div key={ch} className="flex justify-between"><span>{ch}</span><span className="font-medium text-green-600">{roi}</span></div>)}</div></CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tool Config Dialog */}
      <Dialog open={showToolConfigDialog} onOpenChange={setShowToolConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin:campaigns.configureTool", { tool: selectedTool })}</DialogTitle><DialogDescription>{t("admin:campaigns.configureToolDesc", { tool: selectedTool })}</DialogDescription></DialogHeader>
          <ToolConfigurationForm toolName={selectedTool} onSave={(config) => marketingToolMutation.mutate({ toolName: selectedTool, action: "configure", config })} onCancel={() => setShowToolConfigDialog(false)} isLoading={marketingToolMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin:campaigns.createNewCampaign")}</DialogTitle><DialogDescription>{t("admin:campaigns.createNewCampaignDesc")}</DialogDescription></DialogHeader>
          <NewCampaignForm campaignData={newCampaignData} onDataChange={(data) => setNewCampaignData(data as typeof INITIAL_CAMPAIGN)} onSave={handleCreateCampaign} onCancel={() => { setShowNewCampaignDialog(false); setNewCampaignData(INITIAL_CAMPAIGN); }} isLoading={createCampaignMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(v) => { if (!v) setSelectedCampaign(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin:campaigns.editCampaign")}</DialogTitle><DialogDescription>{t("admin:campaigns.editCampaignDesc")}</DialogDescription></DialogHeader>
          {selectedCampaign && (
            <NewCampaignForm
              campaignData={{ name: selectedCampaign.name, type: selectedCampaign.type, targetAudience: selectedCampaign.targetAudience, budget: selectedCampaign.budget, channels: selectedCampaign.channels || [], startDate: selectedCampaign.startDate, endDate: selectedCampaign.endDate, description: "" }}
              onDataChange={(data) => setSelectedCampaign({ ...selectedCampaign, ...data })}
              onSave={() => { updateCampaignMutation.mutate({ id: selectedCampaign.id, updates: { name: selectedCampaign.name, type: selectedCampaign.type, targetAudience: selectedCampaign.targetAudience, budget: selectedCampaign.budget, channels: selectedCampaign.channels, startDate: selectedCampaign.startDate, endDate: selectedCampaign.endDate } }); setSelectedCampaign(null); }}
              onCancel={() => setSelectedCampaign(null)}
              isLoading={updateCampaignMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
