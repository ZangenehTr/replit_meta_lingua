import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  MessageSquare, 
  Settings, 
  Send, 
  Clock, 
  Users,
  CheckCircle,
  AlertCircle,
  Phone,
  Plus,
  Edit,
  TestTube,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SMSTemplate {
  id: number;
  event: string;
  recipient: string;
  template: string;
  variables: string[];
  isActive: boolean;
  language: 'persian' | 'english' | 'both';
}

interface KavenegarSettings {
  apiKey: string;
  isConfigured: boolean;
  senderNumber: string;
  dailyLimit: number;
  isEnabled: boolean;
}

interface SMSAutomationSettings {
  placementSmsEnabled: boolean;
  placementSmsReminderCooldownHours: number;
  placementSmsMaxReminders: number;
  placementSmsDaysAfterTest: number;
  placementSmsQuietHoursStart: string;
  placementSmsQuietHoursEnd: string;
  placementSmsTemplate: string;
  kavenegarEnabled: boolean;
  kavenegarConfigured: boolean;
}

interface SMSStatistics {
  totalSent: number;
  successfulSent: number;
  failedSent: number;
  successRate: number;
  uniqueStudents: number;
  enrolledAfterReminder: number;
  conversionRate: number;
  period: string;
  periodLabel: string;
  dailyBreakdown: Record<string, number>;
}

export default function SMSSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { language, isRTL, direction } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [kavenegarData, setKavenegarData] = useState({
    senderNumber: '',
    dailyLimit: 1000,
    isEnabled: false
  });
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [statisticsPeriod, setStatisticsPeriod] = useState<"today" | "week" | "month">("today");

  // Fetch SMS templates
  const { data: smsTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/admin/sms-templates'],
  });

  // Fetch Kavenegar settings
  const { data: kavenegarSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/kavenegar-settings'],
  });

  // Fetch SMS automation settings
  const { data: smsAutomationSettings, isLoading: automationLoading } = useQuery<SMSAutomationSettings>({
    queryKey: ['/api/admin/sms-automation-settings'],
  });

  // Fetch SMS statistics
  const { data: smsStatistics, isLoading: statisticsLoading } = useQuery<SMSStatistics>({
    queryKey: ['/api/admin/sms-statistics', statisticsPeriod],
    queryFn: () => apiRequest(`/api/admin/sms-statistics?period=${statisticsPeriod}`)
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (kavenegarSettings) {
      setKavenegarData({
        senderNumber: kavenegarSettings.senderNumber || '',
        dailyLimit: kavenegarSettings.dailyLimit || 1000,
        isEnabled: kavenegarSettings.isEnabled || false
      });
    }
  }, [kavenegarSettings]);

  // Save Kavenegar settings mutation
  const saveKavenegarMutation = useMutation({
    mutationFn: async (data: typeof kavenegarData) => {
      return await apiRequest('/api/admin/kavenegar-settings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: t('common:toast.settingsSaved'),
        description: result.message || "Kavenegar settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kavenegar-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.saveFailed'),
        description: error.message || "Failed to save Kavenegar settings",
        variant: "destructive",
      });
    },
  });

  // Update SMS automation settings mutation
  const updateAutomationSettings = useMutation({
    mutationFn: async (updates: Partial<SMSAutomationSettings>) => {
      return await apiRequest('/api/admin/sms-automation-settings', {
        method: 'POST',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms-automation-settings'] });
      toast({
        title: "تنظیمات ذخیره شد",
        description: "تنظیمات SMS خودکار با موفقیت به‌روزرسانی شد"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ذخیره تنظیمات",
        description: error.message || "خطایی رخ داده است",
        variant: "destructive"
      });
    }
  });

  // Test SMS template mutation
  const testSMSTemplate = useMutation({
    mutationFn: async (data: { template: string; phoneNumber: string; testData?: any }) => {
      return await apiRequest('/api/admin/test-sms-template', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "پیامک آزمایشی ارسال شد",
          description: "پیامک با موفقیت ارسال شد"
        });
      } else {
        toast({
          title: "ارسال پیامک ناموفق",
          description: data.message || "خطایی رخ داده است",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ارسال پیامک آزمایشی",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const eventTypes = [
    { key: 'enrollment', label: t('admin:smsSettings.eventTypes.enrollment'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent'), t('admin:smsSettings.recipients.teacher')] },
    { key: 'session_reminder', label: t('admin:smsSettings.eventTypes.sessionReminder'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.teacher')] },
    { key: 'homework_assigned', label: t('admin:smsSettings.eventTypes.homeworkAssigned'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] },
    { key: 'homework_overdue', label: t('admin:smsSettings.eventTypes.homeworkOverdue'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] },
    { key: 'payment_due', label: t('admin:smsSettings.eventTypes.paymentDue'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] },
    { key: 'payment_received', label: t('admin:smsSettings.eventTypes.paymentReceived'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] },
    { key: 'teacher_evaluation', label: t('admin:smsSettings.eventTypes.teacherEvaluation'), recipients: [t('admin:smsSettings.recipients.teacher')] },
    { key: 'progress_report', label: t('admin:smsSettings.eventTypes.progressReport'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] },
    { key: 'session_cancelled', label: t('admin:smsSettings.eventTypes.sessionCancelled'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.teacher')] },
    { key: 'absence_warning', label: t('admin:smsSettings.eventTypes.absenceWarning'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] },
    { key: 'certificate_ready', label: t('admin:smsSettings.eventTypes.certificateReady'), recipients: [t('admin:smsSettings.recipients.student'), t('admin:smsSettings.recipients.parent')] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 space-y-6" dir={direction}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('admin:smsSettings.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            مدیریت تنظیمات سرویس پیامک Kavenegar و قالب‌های پیام
          </p>
        </div>
        <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
          <Button variant="outline" onClick={() => window.location.href = '/admin/sms-test'}>
            <TestTube className="h-4 w-4 mr-2" />
            تست SMS
          </Button>
          <Button 
            onClick={() => saveKavenegarMutation.mutate(kavenegarData)}
            disabled={saveKavenegarMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
{saveKavenegarMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </Button>
        </div>
      </div>

      {/* Kavenegar Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('admin:smsSettings.kavenegarSettings')}
          </CardTitle>
          <CardDescription>
            پیکربندی سرویس SMS Kavenegar برای ارسال پیام‌ها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('admin:smsSettings.apiKeyStatus')}</Label>
              <div className="flex items-center gap-2 mt-1">
                {kavenegarSettings?.isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{t('admin:smsSettings.configured')}</span>
                    <Badge variant="outline">{kavenegarSettings?.apiKey}</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{t('admin:smsSettings.notConfigured')}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin:smsSettings.apiKeySecurityNote')}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">{t('admin:smsSettings.senderConfiguration')}</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('admin:smsSettings.senderConfigNote')}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.href = '/admin/iranian-compliance'}
              >
                <Settings className="h-4 w-4 mr-2" />
{t('admin:smsSettings.configureSenderApi')}
              </Button>
            </div>

            <div>
              <Label htmlFor="dailyLimit">{t('admin:smsSettings.dailySmsLimit')}</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={kavenegarData.dailyLimit}
                onChange={(e) => setKavenegarData({ ...kavenegarData, dailyLimit: parseInt(e.target.value) || 1000 })}
              />
            </div>

            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
              <Switch
                id="smsEnabled"
                checked={kavenegarData.isEnabled}
                onCheckedChange={(checked) => setKavenegarData({ ...kavenegarData, isEnabled: checked })}
              />
              <Label htmlFor="smsEnabled">{t('admin:smsSettings.enableSmsService')}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:smsSettings.smsSentToday')}
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +23% نسبت به دیروز
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:smsSettings.deliveryRate')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4%</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:smsSettings.excellentDelivery')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:smsSettings.activeTemplates')}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              11 {t('admin:smsSettings.eventsCovered')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:smsSettings.accountBalance')}
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kavenegarSettings?.balance || '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('admin:smsSettings.smsCreditsRemaining')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sms-templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sms-templates">{t('admin:smsSettings.smsTemplatesTab')}</TabsTrigger>
          <TabsTrigger value="automation">{t('admin:smsSettings.automationTab')}</TabsTrigger>
          <TabsTrigger value="placement-automation" data-testid="tab-placement-automation">
            یادآوری تست تعیین سطح
          </TabsTrigger>
          <TabsTrigger value="statistics" data-testid="tab-statistics">
            آمار و گزارش
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms-templates">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:smsSettings.smsEventTemplates')}</CardTitle>
              <CardDescription>
                {t('admin:smsSettings.smsEventTemplatesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventTypes.map((eventType) => (
                  <Card key={eventType.key} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-medium">{eventType.label}</h3>
                          <div className="flex space-x-2">
                            {eventType.recipients.map((recipient) => (
                              <Badge key={recipient} variant="outline" className="text-xs">
                                {recipient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Switch defaultChecked />
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        {eventType.recipients.map((recipient) => (
                          <div key={recipient} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">{t('admin:smsSettings.templateFor')} {recipient}</Label>
                              <Badge className="text-xs bg-green-100 text-green-800">فارسی/انگلیسی</Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-gray-600">{t('admin:smsSettings.persianTemplate')}</Label>
                                <textarea 
                                  className="w-full text-sm border rounded p-2 bg-white" 
                                  rows={2}
                                  placeholder="قالب پیامک فارسی..."
                                  defaultValue={getDefaultTemplate(eventType.key, recipient, 'persian')}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">{t('admin:smsSettings.englishTemplate')}</Label>
                                <textarea 
                                  className="w-full text-sm border rounded p-2 bg-white" 
                                  rows={2}
                                  placeholder="English SMS template..."
                                  defaultValue={getDefaultTemplate(eventType.key, recipient, 'english')}
                                />
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              {t('admin:smsSettings.availableVariables')}: {'{student_name}'}, {'{course_name}'}, {'{date}'}, {'{time}'}, {'{teacher_name}'}, {'{amount}'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:smsSettings.smsAutomationRules')}</CardTitle>
              <CardDescription>
                {t('admin:smsSettings.smsAutomationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>{t('admin:smsSettings.sessionReminderTiming')}</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>{t('admin:smsSettings.timingOptions.24HoursBefore')}</option>
                      <option>{t('admin:smsSettings.timingOptions.12HoursBefore')}</option>
                      <option>{t('admin:smsSettings.timingOptions.2HoursBefore')}</option>
                      <option>{t('admin:smsSettings.timingOptions.1HourBefore')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>{t('admin:smsSettings.paymentReminderFrequency')}</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>{t('admin:smsSettings.timingOptions.3DaysBefore')}</option>
                      <option>{t('admin:smsSettings.timingOptions.1DayBefore')}</option>
                      <option>{t('admin:smsSettings.timingOptions.onDueDate')}</option>
                      <option>{t('admin:smsSettings.timingOptions.1DayAfter')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>{t('admin:smsSettings.homeworkOverdueAlerts')}</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>{t('admin:smsSettings.timingOptions.1DayAfterDeadline')}</option>
                      <option>{t('admin:smsSettings.timingOptions.3DaysAfterDeadline')}</option>
                      <option>{t('admin:smsSettings.timingOptions.1WeekAfterDeadline')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>{t('admin:smsSettings.absenceTracking')}</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>{t('admin:smsSettings.timingOptions.after2ConsecutiveAbsences')}</option>
                      <option>{t('admin:smsSettings.timingOptions.after3ConsecutiveAbsences')}</option>
                      <option>{t('admin:smsSettings.timingOptions.after5TotalAbsences')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-6">
                  <Switch defaultChecked />
                  <Label>{t('admin:smsSettings.enableAutomaticSms')}</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kavenegar">
          <Card>
            <CardHeader>
              <CardTitle>Kavenegar SMS Service Configuration</CardTitle>
              <CardDescription>
                Iranian SMS service integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>API Key</Label>
                    <Input type="password" placeholder="Kavenegar API Key" />
                  </div>
                  <div>
                    <Label>Sender Number</Label>
                    <Input placeholder="10008663" />
                  </div>
                  <div>
                    <Label>SMS Template ID</Label>
                    <Input placeholder="verify" />
                  </div>
                  <div>
                    <Label>Daily SMS Limit</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Test SMS Configuration</Label>
                  <div className="flex space-x-2">
                    <Input placeholder="Test phone number (09xxxxxxxxx)" />
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                </div>
                
                <Button className="w-full">Save Kavenegar Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placement Test SMS Automation Tab */}
        <TabsContent value="placement-automation">
          <div className="space-y-6">
            {!smsAutomationSettings?.kavenegarConfigured && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800 dark:text-yellow-200">
                    سرویس Kavenegar هنوز پیکربندی نشده است. لطفاً ابتدا تنظیمات اصلی SMS را پیکربندی کنید.
                  </span>
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  تنظیمات پیامک خودکار تست تعیین سطح
                </CardTitle>
                <CardDescription>
                  پیکربندی سیستم یادآوری خودکار برای دانش‌آموزانی که تست تعیین سطح را گذرانده‌اند
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const settings = {
                      placementSmsEnabled: formData.get("placementSmsEnabled") === "on",
                      placementSmsReminderCooldownHours: parseInt(formData.get("placementSmsReminderCooldownHours") as string) || 24,
                      placementSmsMaxReminders: parseInt(formData.get("placementSmsMaxReminders") as string) || 3,
                      placementSmsDaysAfterTest: parseInt(formData.get("placementSmsDaysAfterTest") as string) || 1,
                      placementSmsQuietHoursStart: formData.get("placementSmsQuietHoursStart") as string || "22:00",
                      placementSmsQuietHoursEnd: formData.get("placementSmsQuietHoursEnd") as string || "08:00",
                      placementSmsTemplate: formData.get("placementSmsTemplate") as string || ""
                    };
                    updateAutomationSettings.mutate(settings);
                  }}
                  className="space-y-6"
                >
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch 
                      id="placementSmsEnabled"
                      name="placementSmsEnabled"
                      defaultChecked={smsAutomationSettings?.placementSmsEnabled}
                      disabled={!smsAutomationSettings?.kavenegarConfigured}
                      data-testid="switch-placement-sms-enabled"
                    />
                    <div className="flex-1">
                      <Label htmlFor="placementSmsEnabled" className="text-base font-medium">
                        فعال‌سازی پیامک خودکار یادآوری
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ارسال خودکار پیامک یادآوری به دانش‌آموزان برای ثبت‌نام در دوره‌ها
                      </p>
                    </div>
                  </div>

                  {/* Timing Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="placementSmsReminderCooldownHours">
                        فاصله زمانی بین پیامک‌ها (ساعت)
                      </Label>
                      <Input
                        id="placementSmsReminderCooldownHours"
                        name="placementSmsReminderCooldownHours"
                        type="number"
                        min="1"
                        max="168"
                        defaultValue={smsAutomationSettings?.placementSmsReminderCooldownHours || 24}
                        disabled={!smsAutomationSettings?.kavenegarConfigured}
                        data-testid="input-cooldown-hours"
                      />
                      <p className="text-xs text-gray-500">حداقل 1 ساعت، حداکثر 168 ساعت (1 هفته)</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placementSmsMaxReminders">
                        حداکثر تعداد پیامک برای هر دانش‌آموز
                      </Label>
                      <Input
                        id="placementSmsMaxReminders"
                        name="placementSmsMaxReminders"
                        type="number"
                        min="1"
                        max="10"
                        defaultValue={smsAutomationSettings?.placementSmsMaxReminders || 3}
                        disabled={!smsAutomationSettings?.kavenegarConfigured}
                        data-testid="input-max-reminders"
                      />
                      <p className="text-xs text-gray-500">حداقل 1، حداکثر 10 پیامک</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placementSmsDaysAfterTest">
                        تعداد روز پس از تست برای شروع پیامک
                      </Label>
                      <Input
                        id="placementSmsDaysAfterTest"
                        name="placementSmsDaysAfterTest"
                        type="number"
                        min="0"
                        max="30"
                        defaultValue={smsAutomationSettings?.placementSmsDaysAfterTest || 1}
                        disabled={!smsAutomationSettings?.kavenegarConfigured}
                        data-testid="input-days-after-test"
                      />
                      <p className="text-xs text-gray-500">0 تا 30 روز</p>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">ساعات سکوت</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        در این بازه زمانی پیامک ارسال نخواهد شد
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="placementSmsQuietHoursStart">شروع ساعات سکوت</Label>
                        <Input
                          id="placementSmsQuietHoursStart"
                          name="placementSmsQuietHoursStart"
                          type="time"
                          defaultValue={smsAutomationSettings?.placementSmsQuietHoursStart || "22:00"}
                          disabled={!smsAutomationSettings?.kavenegarConfigured}
                          data-testid="input-quiet-hours-start"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="placementSmsQuietHoursEnd">پایان ساعات سکوت</Label>
                        <Input
                          id="placementSmsQuietHoursEnd"
                          name="placementSmsQuietHoursEnd"
                          type="time"
                          defaultValue={smsAutomationSettings?.placementSmsQuietHoursEnd || "08:00"}
                          disabled={!smsAutomationSettings?.kavenegarConfigured}
                          data-testid="input-quiet-hours-end"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Template Editor */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">ویرایش قالب پیامک</h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>فیلدهای قابل استفاده:</strong> {`{studentName}`}, {`{placementLevel}`}, {`{daysAgo}`}
                        </p>
                      </div>
                    </div>
                    
                    <Textarea
                      id="placementSmsTemplate"
                      name="placementSmsTemplate"
                      rows={6}
                      defaultValue={smsAutomationSettings?.placementSmsTemplate}
                      placeholder="متن پیامک خود را اینجا بنویسید..."
                      className="font-mono text-sm"
                      disabled={!smsAutomationSettings?.kavenegarConfigured}
                      data-testid="textarea-sms-template"
                    />
                    <p className="text-xs text-gray-500">
                      حداکثر 1000 کاراکتر (توصیه: حداکثر 160 کاراکتر برای 1 پیامک)
                    </p>

                    {/* Template Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">پیش‌نمای پیامک:</h4>
                      <div className="text-sm bg-white dark:bg-gray-900 p-3 rounded border border-dashed">
                        {smsAutomationSettings?.placementSmsTemplate
                          ?.replace(/{studentName}/g, "احمد رضایی")
                          ?.replace(/{placementLevel}/g, "B1")
                          ?.replace(/{daysAgo}/g, "2 روز پیش") || "قالب پیامک را وارد کنید..."}
                      </div>
                    </div>

                    {/* Test SMS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="testPhoneNumber">شماره تلفن آزمایشی</Label>
                        <Input
                          id="testPhoneNumber"
                          type="tel"
                          placeholder="09123456789"
                          value={testPhoneNumber}
                          onChange={(e) => setTestPhoneNumber(e.target.value)}
                          disabled={!smsAutomationSettings?.kavenegarConfigured}
                          data-testid="input-test-phone"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button"
                          onClick={() => {
                            if (!testPhoneNumber || !smsAutomationSettings?.placementSmsTemplate) {
                              toast({
                                title: "اطلاعات ناقص",
                                description: "شماره تلفن و قالب پیام الزامی است",
                                variant: "destructive"
                              });
                              return;
                            }
                            testSMSTemplate.mutate({
                              template: smsAutomationSettings.placementSmsTemplate,
                              phoneNumber: testPhoneNumber,
                              testData: {
                                studentName: "احمد رضایی",
                                placementLevel: "B1",
                                daysAgo: "2 روز پیش"
                              }
                            });
                          }}
                          disabled={testSMSTemplate.isPending || !smsAutomationSettings?.kavenegarConfigured}
                          data-testid="button-test-template"
                        >
                          <TestTube className="h-4 w-4 ml-2" />
                          {testSMSTemplate.isPending ? "در حال ارسال..." : "ارسال آزمایشی"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateAutomationSettings.isPending || !smsAutomationSettings?.kavenegarConfigured}
                      data-testid="button-save-settings"
                    >
                      <Save className="h-4 w-4 ml-2" />
                      {updateAutomationSettings.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="space-y-6">
            {/* Statistics Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">آمار پیامک‌های یادآوری</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  عملکرد سیستم پیامک خودکار در دوره {smsStatistics?.periodLabel}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={statisticsPeriod} 
                  onChange={(e) => setStatisticsPeriod(e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm"
                  data-testid="select-stats-period"
                >
                  <option value="today">امروز</option>
                  <option value="week">هفته گذشته</option>
                  <option value="month">ماه جاری</option>
                </select>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">کل پیامک‌های ارسالی</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-sent">
                        {statisticsLoading ? "..." : smsStatistics?.totalSent || 0}
                      </p>
                    </div>
                    <Send className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">نرخ موفقیت</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-success-rate">
                        {statisticsLoading ? "..." : `${smsStatistics?.successRate || 0}%`}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">دانش‌آموزان تماس‌گرفته</p>
                      <p className="text-2xl font-bold" data-testid="stat-unique-students">
                        {statisticsLoading ? "..." : smsStatistics?.uniqueStudents || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">نرخ تبدیل به ثبت‌نام</p>
                      <p className="text-2xl font-bold text-purple-600" data-testid="stat-conversion-rate">
                        {statisticsLoading ? "..." : `${smsStatistics?.conversionRate || 0}%`}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>جزئیات ارسال</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <span>پیامک‌های موفق</span>
                      <span className="font-bold text-green-600" data-testid="detail-successful">
                        {smsStatistics?.successfulSent || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <span>پیامک‌های ناموفق</span>
                      <span className="font-bold text-red-600" data-testid="detail-failed">
                        {smsStatistics?.failedSent || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span>ثبت‌نام پس از یادآوری</span>
                      <span className="font-bold text-blue-600" data-testid="detail-enrolled">
                        {smsStatistics?.enrolledAfterReminder || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>وضعیت سیستم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>سرویس پیامک</span>
                      <Badge variant={smsAutomationSettings?.kavenegarConfigured ? "default" : "secondary"}>
                        {smsAutomationSettings?.kavenegarConfigured ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>پیامک خودکار</span>
                      <Badge variant={smsAutomationSettings?.placementSmsEnabled ? "default" : "secondary"}>
                        {smsAutomationSettings?.placementSmsEnabled ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>فاصله پیامک‌ها</span>
                      <span className="text-sm font-medium">
                        {smsAutomationSettings?.placementSmsReminderCooldownHours || 24} ساعت
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>حداکثر تعداد پیامک</span>
                      <span className="text-sm font-medium">
                        {smsAutomationSettings?.placementSmsMaxReminders || 3}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function for default templates
function getDefaultTemplate(event: string, recipient: string, language: 'persian' | 'english'): string {
  const templates: Record<string, Record<string, Record<string, string>>> = {
    enrollment: {
      Student: {
        persian: "سلام {student_name}، با موفقیت در دوره {course_name} ثبت نام شدید. تاریخ شروع: {date}",
        english: "Hello {student_name}, you have successfully enrolled in {course_name}. Start date: {date}"
      },
      Parent: {
        persian: "فرزندتان {student_name} در دوره {course_name} ثبت نام شده است.",
        english: "Your child {student_name} has been enrolled in {course_name}."
      },
      Teacher: {
        persian: "دانش آموز جدید {student_name} به کلاس {course_name} شما اضافه شد.",
        english: "New student {student_name} has been added to your {course_name} class."
      }
    },
    session_reminder: {
      Student: {
        persian: "یادآوری: کلاس {course_name} فردا ساعت {time} با استاد {teacher_name}",
        english: "Reminder: Your {course_name} class is tomorrow at {time} with {teacher_name}"
      },
      Teacher: {
        persian: "یادآوری: کلاس {course_name} فردا ساعت {time} با دانش آموز {student_name}",
        english: "Reminder: Your {course_name} class is tomorrow at {time} with {student_name}"
      }
    },
    teacher_evaluation: {
      Teacher: {
        persian: "ارزیابی کیفیت تدریس شما آماده شد. لطفا پنل معلم را مشاهده کنید.",
        english: "Your teaching quality evaluation is ready. Please check your teacher portal."
      }
    }
  };
  
  return templates[event]?.[recipient]?.[language] || `Template for ${event} - ${recipient} (${language})`;
}