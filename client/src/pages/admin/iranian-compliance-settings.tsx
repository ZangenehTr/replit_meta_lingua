import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Save, TestTube, Phone, CreditCard, MessageSquare, Settings, CheckCircle2, CheckCircle, AlertCircle, Info, Eye, EyeOff } from "lucide-react";

export function IranianComplianceSettings() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"voip" | "shetab" | "sms" | "general">("voip");
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch current admin settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: t('common:toast.success'), description: t('common:toast.settingsUpdated') });
    },
    onError: (error: any) => {
      toast({ title: t('common:toast.error'), description: error.message, variant: "destructive" });
    }
  });

  // Diagnostic VoIP mutation
  const diagnosticVoipConnection = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/diagnostic-voip', { method: 'POST' });
    },
    onSuccess: (data) => {
      console.log('VoIP diagnostic success:', data);
      const response = data as any;
      const summary = response.summary;
      const recommendations = response.recommendations;
      
      toast({ 
        title: response.success ? t('admin:iranianCompliance.voipDiagnosticComplete') : t('admin:iranianCompliance.voipDiagnosticIssues'), 
        description: `${summary.testsPassed}/${summary.testsRun} tests passed. Server: ${summary.serverInfo}. ${recommendations.length > 0 ? t('admin:iranianCompliance.checkConsoleRecommendations') : ''}`,
        variant: response.success ? "default" : "destructive"
      });
      
      if (recommendations.length > 0) {
        console.log(t('admin:iranianCompliance.voipServerRecommendations'));
        recommendations.forEach((rec: string, i: number) => console.log(`${i + 1}. ${rec}`));
      }
    },
    onError: (error) => {
      console.error('VoIP diagnostic error:', error);
      toast({ title: t('common:toast.voipDiagnosticFailed'), description: error.message, variant: "destructive" });
    }
  });

  // Test connection mutations
  const testVoipConnection = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/test-voip', { method: 'POST' });
    },
    onSuccess: (data) => {
      console.log('VoIP test success:', data);
      const response = data as any;
      if (response.success) {
        toast({ 
          title: t('common:toast.voipTestSuccessful'), 
          description: `${response.provider} connected successfully. Server: ${response.server}, Status: ${response.status}` 
        });
      } else {
        toast({ 
          title: t('common:toast.voipTest'), 
          description: response.message || "Connection validated but external test failed",
          variant: "default"
        });
      }
    },
    onError: (error) => {
      console.error('VoIP test error:', error);
      toast({ title: t('common:toast.voipTestFailed'), description: error.message, variant: "destructive" });
    }
  });

  const testShetabConnection = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/test-shetab', { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: t('common:toast.shetabTest'), description: "Payment gateway connection successful" });
    },
    onError: (error) => {
      toast({ title: t('common:toast.shetabTestFailed'), description: error.message, variant: "destructive" });
    }
  });

  const testSmsConnection = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/test-sms', { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "SMS Test", description: "Kavenegar SMS service connection successful" });
    },
    onError: (error) => {
      toast({ title: "SMS Test Failed", description: error.message, variant: "destructive" });
    }
  });

  const testVoipCall = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return apiRequest('/api/voip/initiate-call', { 
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          contactName: 'VoIP Test Call',
          callType: 'outbound',
          recordCall: true
        })
      });
    },
    onSuccess: (data) => {
      console.log('VoIP call test success:', data);
      const response = data as any;
      toast({ 
        title: t('admin:iranianCompliance.voipCallTestSuccessful'), 
        description: `Test call initiated successfully. Call ID: ${response.callId}. Recording: ${response.recordingEnabled ? 'enabled' : 'disabled'}` 
      });
    },
    onError: (error) => {
      console.error('VoIP call test error:', error);
      let errorMessage = error.message;
      if (errorMessage.includes('not configured')) {
        errorMessage = "Please save VoIP settings first, then try the test call";
      }
      toast({ title: t('admin:iranianCompliance.voipCallTestFailed'), description: errorMessage, variant: "destructive" });
    }
  });

  const handleSave = (section: string, data: any) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin:iranianCompliance.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin:iranianCompliance.subtitle')}</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
{t('admin:iranianCompliance.selfHostedReady')}
        </Badge>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('admin:iranianCompliance.localComplianceMessage')}
        </AlertDescription>
      </Alert>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { key: "voip", label: t('admin:iranianCompliance.voipTab'), icon: Phone },
          { key: "shetab", label: t('admin:iranianCompliance.shetabTab'), icon: CreditCard },
          { key: "sms", label: t('admin:iranianCompliance.smsTab'), icon: MessageSquare },
          { key: "general", label: t('admin:iranianCompliance.generalTab'), icon: Settings }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? "default" : "ghost"}
            onClick={() => setActiveTab(key as any)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* VoIP Settings */}
      {activeTab === "voip" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {t('admin:iranianCompliance.voipConfiguration')}
            </CardTitle>
            <CardDescription>{t('admin:iranianCompliance.voipDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voip-server">{t('admin:iranianCompliance.voipServerAddress')}</Label>
                <Input
                  id="voip-server"
                  placeholder="sip.isabel.ir"
                  defaultValue={settings?.voipServerAddress || ""}
                />
              </div>
              <div>
                <Label htmlFor="voip-port">{t('admin:iranianCompliance.port')}</Label>
                <Input
                  id="voip-port"
                  type="number"
                  placeholder="5060"
                  defaultValue={settings?.voipPort || "5060"}
                />
              </div>
              <div>
                <Label htmlFor="voip-username">{t('admin:iranianCompliance.username')}</Label>
                <Input
                  id="voip-username"
                  placeholder="Your Isabel username"
                  defaultValue={settings?.voipUsername || ""}
                />
              </div>
              <div>
                <Label htmlFor="voip-password">{t('admin:iranianCompliance.password')}</Label>
                <Input
                  id="voip-password"
                  type="password"
                  placeholder="Your Isabel password"
                  defaultValue={settings?.voipPassword || ""}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="voip-enabled"
                defaultChecked={settings?.voipEnabled || false}
              />
              <Label htmlFor="voip-enabled">{t('admin:iranianCompliance.enableVoipIntegration')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="call-recording"
                defaultChecked={settings?.callRecordingEnabled || false}
              />
              <Label htmlFor="call-recording">{t('admin:iranianCompliance.enableCallRecording')}</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="recording-storage">{t('admin:iranianCompliance.recordingStoragePath')}</Label>
              <Input
                id="recording-storage"
                placeholder="/var/recordings"
                defaultValue={settings?.recordingStoragePath || "/var/recordings"}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="test-phone-number">{t('admin:iranianCompliance.testPhoneNumber')}</Label>
              <div className="flex gap-2">
                <Input
                  id="test-phone-number"
                  placeholder="+989123456789"
                  type="tel"
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    const phoneNumber = (document.getElementById("test-phone-number") as HTMLInputElement)?.value;
                    if (!phoneNumber || phoneNumber.length < 10) {
                      toast({ title: t('admin:iranianCompliance.invalidPhoneNumber'), description: t('admin:iranianCompliance.enterValidPhoneNumber'), variant: "destructive" });
                      return;
                    }
                    testVoipCall.mutate(phoneNumber);
                  }}
                  disabled={testVoipCall.isPending}
                  variant="outline"
                  className="min-w-[140px]"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {t('admin:iranianCompliance.testCall')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('admin:iranianCompliance.phoneNumberInstructions')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => diagnosticVoipConnection.mutate()}
                disabled={diagnosticVoipConnection.isPending}
                variant="outline"
                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {diagnosticVoipConnection.isPending ? t('admin:iranianCompliance.diagnosing') : t('admin:iranianCompliance.fullDiagnostic')}
              </Button>
              <Button 
                onClick={() => testVoipConnection.mutate()}
                disabled={testVoipConnection.isPending}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {t('admin:iranianCompliance.testConnection')}
              </Button>
              <Button 
                onClick={() => handleSave("voip", {
                  voipServerAddress: (document.getElementById("voip-server") as HTMLInputElement)?.value,
                  voipPort: (document.getElementById("voip-port") as HTMLInputElement)?.value,
                  voipUsername: (document.getElementById("voip-username") as HTMLInputElement)?.value,
                  voipPassword: (document.getElementById("voip-password") as HTMLInputElement)?.value,
                  voipEnabled: (document.getElementById("voip-enabled") as HTMLInputElement)?.checked,
                  callRecordingEnabled: (document.getElementById("call-recording") as HTMLInputElement)?.checked,
                  recordingStoragePath: (document.getElementById("recording-storage") as HTMLInputElement)?.value
                })}
                disabled={updateSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('admin:iranianCompliance.saveVoipSettings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shetab Banking Settings */}
      {activeTab === "shetab" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('admin:iranianCompliance.shetabConfiguration')}
            </CardTitle>
            <CardDescription>{t('admin:iranianCompliance.shetabDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shetab-merchant-id">{t('admin:iranianCompliance.merchantId')}</Label>
                <Input
                  id="shetab-merchant-id"
                  placeholder="Your Shetab merchant ID"
                  defaultValue={settings?.shetabMerchantId || ""}
                />
              </div>
              <div>
                <Label htmlFor="shetab-terminal-id">{t('admin:iranianCompliance.terminalId')}</Label>
                <Input
                  id="shetab-terminal-id"
                  placeholder="Your terminal ID"
                  defaultValue={settings?.shetabTerminalId || ""}
                />
              </div>
              <div>
                <Label htmlFor="shetab-api-key">{t('admin:iranianCompliance.apiKey')}</Label>
                <Input
                  id="shetab-api-key"
                  type="password"
                  placeholder="Your Shetab API key"
                  defaultValue={settings?.shetabApiKey || ""}
                />
              </div>
              <div>
                <Label htmlFor="shetab-secret-key">{t('admin:iranianCompliance.secretKey')}</Label>
                <Input
                  id="shetab-secret-key"
                  type="password"
                  placeholder="Your Shetab secret key"
                  defaultValue={settings?.shetabSecretKey || ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shetab-environment">{t('admin:iranianCompliance.environment')}</Label>
              <Select defaultValue={settings?.shetabEnvironment || "production"}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:iranianCompliance.selectEnvironment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">{t('admin:iranianCompliance.production')}</SelectItem>
                  <SelectItem value="sandbox">{t('admin:iranianCompliance.sandbox')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="shetab-enabled"
                defaultChecked={settings?.shetabEnabled || false}
              />
              <Label htmlFor="shetab-enabled">{t('admin:iranianCompliance.enableShetabIntegration')}</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="callback-url">{t('admin:iranianCompliance.callbackUrl')}</Label>
              <Input
                id="callback-url"
                placeholder="https://your-domain.com/api/payment/callback"
                defaultValue={settings?.shetabCallbackUrl || ""}
              />
            </div>

            <div>
              <Label htmlFor="return-url">{t('admin:iranianCompliance.returnUrl')}</Label>
              <Input
                id="return-url"
                placeholder="https://your-domain.com/payment/success"
                defaultValue={settings?.shetabReturnUrl || ""}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => testShetabConnection.mutate()}
                disabled={testShetabConnection.isPending}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {t('admin:iranianCompliance.testConnection')}
              </Button>
              <Button 
                onClick={() => handleSave("shetab", {
                  shetabMerchantId: (document.getElementById("shetab-merchant-id") as HTMLInputElement)?.value,
                  shetabTerminalId: (document.getElementById("shetab-terminal-id") as HTMLInputElement)?.value,
                  shetabApiKey: (document.getElementById("shetab-api-key") as HTMLInputElement)?.value,
                  shetabSecretKey: (document.getElementById("shetab-secret-key") as HTMLInputElement)?.value,
                  shetabEnabled: (document.getElementById("shetab-enabled") as HTMLInputElement)?.checked,
                  shetabCallbackUrl: (document.getElementById("callback-url") as HTMLInputElement)?.value,
                  shetabReturnUrl: (document.getElementById("return-url") as HTMLInputElement)?.value
                })}
                disabled={updateSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('admin:iranianCompliance.saveShetabSettings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMS Settings Overview */}
      {activeTab === "sms" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('admin:iranianCompliance.smsServiceStatus')}
            </CardTitle>
            <CardDescription>{t('admin:iranianCompliance.kavenegarDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">{t('admin:iranianCompliance.kavenegarIntegration')}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {settings?.kavenegarEnabled ? t('admin:iranianCompliance.smsServiceEnabled') : t('admin:iranianCompliance.smsServiceDisabled')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {settings?.kavenegarEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <Button
                    onClick={() => window.location.href = '/admin/sms-settings'}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t('admin:iranianCompliance.manageSmsSettings')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('admin:iranianCompliance.serviceStatus')}</div>
                <div className="font-medium">
                  {settings?.kavenegarEnabled ? t('admin:iranianCompliance.active') : t('admin:iranianCompliance.inactive')}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('admin:iranianCompliance.senderNumber')}</div>
                <div className="font-medium">
                  {settings?.kavenegarSender || t('admin:iranianCompliance.notConfigured')}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('admin:iranianCompliance.provider')}</div>
                <div className="font-medium">Kavenegar</div>
              </div>
            </div>

            <Separator />

            {/* SMS API Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">{t('admin:iranianCompliance.smsApiConfiguration')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kavenegar-api-key">{t('admin:iranianCompliance.kavenegarApiKey')}</Label>
                  <div className="relative">
                    <Input
                      id="kavenegar-api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter your Kavenegar API key"
                      defaultValue={settings?.kavenegarApiKey || ""}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Get your API key from Kavenegar panel → API Settings
                  </p>
                </div>
                <div>
                  <Label htmlFor="kavenegar-sender">{t('admin:iranianCompliance.senderNumber')}</Label>
                  <Input
                    id="kavenegar-sender"
                    placeholder="10008663"
                    defaultValue={settings?.kavenegarSender || "10008663"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your Kavenegar sender number or line
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="kavenegar-enabled"
                  defaultChecked={settings?.kavenegarEnabled || false}
                />
                <Label htmlFor="kavenegar-enabled">{t('admin:iranianCompliance.enableKavenegarSms')}</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => testSmsConnection.mutate()}
                  disabled={testSmsConnection.isPending}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
{t('admin:iranianCompliance.testSmsConnection')}
                </Button>
                <Button 
                  onClick={() => handleSave("sms", {
                    kavenegarApiKey: (document.getElementById("kavenegar-api-key") as HTMLInputElement)?.value,
                    kavenegarSender: (document.getElementById("kavenegar-sender") as HTMLInputElement)?.value,
                    kavenegarEnabled: (document.getElementById("kavenegar-enabled") as HTMLInputElement)?.checked
                  })}
                  disabled={updateSettings.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
{t('admin:iranianCompliance.saveSmsSettings')}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>For advanced SMS configuration including templates, bulk messaging, and detailed analytics, use the dedicated SMS Settings page.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Settings */}
      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('admin:iranianCompliance.generalIranianSettings')}
            </CardTitle>
            <CardDescription>{t('admin:iranianCompliance.generalIranianDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="institute-name">{t('admin:iranianCompliance.instituteNamePersian')}</Label>
              <Input
                id="institute-name"
                placeholder="مؤسسه زبان‌های خارجی متالینگوآ"
                defaultValue={settings?.instituteNamePersian || ""}
              />
            </div>

            <div>
              <Label htmlFor="institute-name-english">{t('admin:iranianCompliance.instituteNameEnglish')}</Label>
              <Input
                id="institute-name-english"
                placeholder="Meta Lingua Language Institute"
                defaultValue={settings?.instituteNameEnglish || ""}
              />
            </div>

            <div>
              <Label htmlFor="business-license">{t('admin:iranianCompliance.businessLicense')}</Label>
              <Input
                id="business-license"
                placeholder="Iran business license number"
                defaultValue={settings?.businessLicenseNumber || ""}
              />
            </div>

            <div>
              <Label htmlFor="tax-id">{t('admin:iranianCompliance.taxId')}</Label>
              <Input
                id="tax-id"
                placeholder="Iranian tax identification number"
                defaultValue={settings?.taxId || ""}
              />
            </div>

            <div>
              <Label htmlFor="default-currency">{t('admin:iranianCompliance.defaultCurrency')}</Label>
              <Select defaultValue={settings?.defaultCurrency || "IRR"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IRR">Iranian Rial (IRR)</SelectItem>
                  <SelectItem value="IRT">Iranian Toman (IRT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">{t('admin:iranianCompliance.timezone')}</Label>
              <Select defaultValue={settings?.timezone || "Asia/Tehran"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tehran">Asia/Tehran (Iran Standard Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="persian-calendar"
                defaultChecked={settings?.persianCalendarEnabled || false}
              />
              <Label htmlFor="persian-calendar">{t('admin:iranianCompliance.enablePersianCalendar')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="rtl-layout"
                defaultChecked={settings?.rtlLayoutEnabled || false}
              />
              <Label htmlFor="rtl-layout">{t('admin:iranianCompliance.enableRtlLayout')}</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="contact-address">{t('admin:iranianCompliance.contactAddressPersian')}</Label>
              <Textarea
                id="contact-address"
                placeholder="آدرس دفتر مرکزی مؤسسه در ایران"
                defaultValue={settings?.contactAddressPersian || ""}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="support-phone">{t('admin:iranianCompliance.supportPhone')}</Label>
              <Input
                id="support-phone"
                placeholder="+98 21 1234 5678"
                defaultValue={settings?.supportPhone || ""}
              />
            </div>

            <Button 
              onClick={() => handleSave("general", {
                instituteNamePersian: (document.getElementById("institute-name") as HTMLInputElement)?.value,
                instituteNameEnglish: (document.getElementById("institute-name-english") as HTMLInputElement)?.value,
                businessLicenseNumber: (document.getElementById("business-license") as HTMLInputElement)?.value,
                taxId: (document.getElementById("tax-id") as HTMLInputElement)?.value,
                defaultCurrency: settings?.defaultCurrency || "IRR",
                timezone: settings?.timezone || "Asia/Tehran",
                persianCalendarEnabled: (document.getElementById("persian-calendar") as HTMLInputElement)?.checked,
                rtlLayoutEnabled: (document.getElementById("rtl-layout") as HTMLInputElement)?.checked,
                contactAddressPersian: (document.getElementById("contact-address") as HTMLTextAreaElement)?.value,
                supportPhone: (document.getElementById("support-phone") as HTMLInputElement)?.value
              })}
              disabled={updateSettings.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
{t('admin:iranianCompliance.saveGeneralSettings')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin:iranianCompliance.thirdPartyServicesStatus')}</CardTitle>
          <CardDescription>{t('admin:iranianCompliance.currentStatusIntegrations')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings?.voipEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Isabel VoIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings?.shetabEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Shetab Banking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings?.kavenegarEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Kavenegar SMS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings?.persianCalendarEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">{t('admin:iranianCompliance.persianCalendar')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}