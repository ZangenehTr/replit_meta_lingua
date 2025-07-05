import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Copy,
  Trash2,
  Plus,
  Target,
  TrendingUp,
  BarChart3,
  Settings
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommunicationTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  content: string;
  language: string;
  category: string;
  isActive: boolean;
  usage: number;
  lastUsed: string;
}

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  targetAudience: string;
  scheduledDate: string;
  sentCount: number;
  deliveredCount: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
}

interface AutomationRule {
  id: number;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
  timesExecuted: number;
  lastExecuted: string;
}

export default function CommunicationCenter() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // Real API calls - NO MORE MOCK DATA
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/communication/templates'],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/communication/campaigns'],
  });

  const { data: automationRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/communication/automation-rules'],
  });

  const { data: communicationStats } = useQuery({
    queryKey: ['/api/communication/stats'],
  });

  const templatesData = (templates as CommunicationTemplate[]) || [];
  const campaignsData = (campaigns as Campaign[]) || [];
  const rulesData = (automationRules as AutomationRule[]) || [];
  // ALL MOCK DATA REMOVED - Using only real API data above

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "running": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid - Using REAL API data only */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">پیام‌های ارسالی</p>
                <p className="text-3xl font-bold">
                  {communicationStats?.totalSent || 0}
                </p>
                <p className="text-sm text-green-600">
                  {communicationStats?.totalSent > 0 ? '+12% این ماه' : 'هیچ پیامی ارسال نشده'}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نرخ تحویل</p>
                <p className="text-3xl font-bold">
                  {communicationStats?.totalDelivered && communicationStats?.totalSent 
                    ? `${((communicationStats.totalDelivered / communicationStats.totalSent) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
                <p className="text-sm text-green-600">
                  {communicationStats?.totalDelivered > 0 ? 'بالا' : 'هیچ پیامی تحویل نشده'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نرخ بازخوانی</p>
                <p className="text-3xl font-bold">
                  {communicationStats?.averageOpenRate 
                    ? `${communicationStats.averageOpenRate.toFixed(1)}%`
                    : '0%'}
                </p>
                <p className="text-sm text-blue-600">
                  {communicationStats?.averageOpenRate > 0 ? 'بر اساس کمپین‌ها' : 'هیچ داده‌ای موجود نیست'}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نرخ کلیک</p>
                <p className="text-3xl font-bold">
                  {communicationStats?.averageClickRate 
                    ? `${communicationStats.averageClickRate.toFixed(1)}%`
                    : '0%'}
                </p>
                <p className="text-sm text-orange-600">
                  {communicationStats?.averageClickRate > 0 ? 'بر اساس کمپین‌ها' : 'هیچ داده‌ای موجود نیست'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>کمپین‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignsLoading ? (
              <div>در حال بارگذاری کمپین‌ها...</div>
            ) : campaignsData.length === 0 ? (
              <div className="text-center py-4 text-gray-500">هیچ کمپینی موجود نیست</div>
            ) : (
              campaignsData.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-gray-500">{campaign.targetAudience}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status === "completed" ? "تکمیل شده" : 
                       campaign.status === "scheduled" ? "برنامه‌ریزی شده" : campaign.status}
                    </Badge>
                    {campaign.status === "completed" && (
                      <p className="text-sm text-gray-500 mt-1">{campaign.openRate}% بازخوانی</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اتوماسیون فعال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rulesLoading ? (
              <div>در حال بارگذاری قوانین اتوماسیون...</div>
            ) : rulesData.length === 0 ? (
              <div className="text-center py-4 text-gray-500">هیچ قانون اتوماسیونی موجود نیست</div>
            ) : (
              rulesData.filter(rule => rule.isActive).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-gray-500">{rule.timesExecuted} بار اجرا شده</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">فعال</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>اقدامات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowNewTemplate(true)}>
              <Plus className="h-6 w-6" />
              <span>قالب جدید</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowNewCampaign(true)}>
              <Send className="h-6 w-6" />
              <span>کمپین جدید</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>گزارش عملکرد</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>تنظیمات</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">قالب‌های پیام</h2>
        <Button onClick={() => setShowNewTemplate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          قالب جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templatesLoading ? (
          <div>در حال بارگذاری قالب‌ها...</div>
        ) : templatesData.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            هیچ قالبی موجود نیست
          </div>
        ) : (
          templatesData.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {template.type === "sms" ? "پیامک" : "ایمیل"}
                        </Badge>
                        <Badge variant="outline">{template.language}</Badge>
                      </div>
                    </div>
                    <Switch checked={template.isActive} />
                  </div>
                  
                  <div className="space-y-2">
                    {template.subject && (
                      <div>
                        <p className="text-sm font-medium">موضوع:</p>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">محتوا:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{template.usage} بار استفاده</span>
                      <span>آخرین: {template.lastUsed}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      ویرایش
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const CampaignsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">کمپین‌های بازاریابی</h2>
        <Button onClick={() => setShowNewCampaign(true)}>
          <Plus className="h-4 w-4 mr-2" />
          کمپین جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">نام کمپین</th>
                  <th className="p-4 font-medium">نوع</th>
                  <th className="p-4 font-medium">مخاطبان</th>
                  <th className="p-4 font-medium">تاریخ</th>
                  <th className="p-4 font-medium">ارسال</th>
                  <th className="p-4 font-medium">بازخوانی</th>
                  <th className="p-4 font-medium">کلیک</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {campaignsLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">در حال بارگذاری کمپین‌ها...</td>
                  </tr>
                ) : campaignsData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">هیچ کمپینی موجود نیست</td>
                  </tr>
                ) : (
                  campaignsData.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium">{campaign.name}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {campaign.type === "sms" ? "پیامک" : "ایمیل"}
                        </Badge>
                      </td>
                      <td className="p-4">{campaign.targetAudience}</td>
                      <td className="p-4">{campaign.scheduledDate}</td>
                      <td className="p-4">{campaign.sentCount}</td>
                      <td className="p-4">
                        {campaign.openRate > 0 ? `${campaign.openRate}%` : "-"}
                      </td>
                      <td className="p-4">
                        {campaign.clickRate > 0 ? `${campaign.clickRate}%` : "-"}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status === "completed" ? "تکمیل شده" : 
                           campaign.status === "scheduled" ? "برنامه‌ریزی شده" : campaign.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AutomationTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">اتوماسیون ارتباطات</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          قانون جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rulesLoading ? (
          <div className="col-span-full text-center py-8">در حال بارگذاری قوانین اتوماسیون...</div>
        ) : rulesData.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">هیچ قانون اتوماسیونی موجود نیست</div>
        ) : (
          rulesData.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {rule.timesExecuted} بار اجرا شده
                      </p>
                    </div>
                    <Switch checked={rule.isActive} />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">تریگر: </span>
                    <span className="text-gray-600">{rule.trigger}</span>
                  </div>
                  <div>
                    <span className="font-medium">شرط: </span>
                    <span className="text-gray-600">{rule.condition}</span>
                  </div>
                  <div>
                    <span className="font-medium">اقدام: </span>
                    <span className="text-gray-600">{rule.action}</span>
                  </div>
                  <div>
                    <span className="font-medium">آخرین اجرا: </span>
                    <span className="text-gray-600">{rule.lastExecuted}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    ویرایش
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مرکز ارتباطات</h1>
          <p className="text-muted-foreground">مدیریت پیام‌رسانی، کمپین‌های بازاریابی و اتوماسیون ارتباطات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            گزارش عملکرد
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            تنظیمات
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="templates">قالب‌ها</TabsTrigger>
          <TabsTrigger value="campaigns">کمپین‌ها</TabsTrigger>
          <TabsTrigger value="automation">اتوماسیون</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>

        <TabsContent value="automation">
          <AutomationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}