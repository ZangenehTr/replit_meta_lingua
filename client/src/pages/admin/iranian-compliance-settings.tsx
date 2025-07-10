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
import { Save, TestTube, Phone, CreditCard, MessageSquare, Settings, CheckCircle2, CheckCircle, AlertCircle, Info, Eye, EyeOff } from "lucide-react";

export function IranianComplianceSettings() {
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
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          title: "VoIP Test Successful", 
          description: `${response.provider} connected successfully. Server: ${response.server}, Status: ${response.status}` 
        });
      } else {
        toast({ 
          title: "VoIP Test", 
          description: response.message || "Connection validated but external test failed",
          variant: "default"
        });
      }
    },
    onError: (error) => {
      console.error('VoIP test error:', error);
      toast({ title: "VoIP Test Failed", description: error.message, variant: "destructive" });
    }
  });

  const testShetabConnection = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/test-shetab', { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "Shetab Test", description: "Payment gateway connection successful" });
    },
    onError: (error) => {
      toast({ title: "Shetab Test Failed", description: error.message, variant: "destructive" });
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
        title: "VoIP Call Test Successful", 
        description: `Test call initiated successfully. Call ID: ${response.callId}. Recording: ${response.recordingEnabled ? 'enabled' : 'disabled'}` 
      });
    },
    onError: (error) => {
      console.error('VoIP call test error:', error);
      toast({ title: "VoIP Call Test Failed", description: error.message, variant: "destructive" });
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
          <h1 className="text-2xl font-bold">Third Party Settings</h1>
          <p className="text-muted-foreground mt-1">Configure third-party Iranian services for local deployment</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Self-Hosted Ready
        </Badge>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All configurations are stored locally for Iranian market compliance. No external dependencies required.
        </AlertDescription>
      </Alert>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { key: "voip", label: "Isabel VoIP", icon: Phone },
          { key: "shetab", label: "Shetab Banking", icon: CreditCard },
          { key: "sms", label: "Kavenegar SMS", icon: MessageSquare },
          { key: "general", label: "General", icon: Settings }
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
              Isabel VoIP Line Configuration
            </CardTitle>
            <CardDescription>Configure your Isabel VoIP line for call recording and management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voip-server">VoIP Server Address</Label>
                <Input
                  id="voip-server"
                  placeholder="sip.isabel.ir"
                  defaultValue={settings?.voipServerAddress || ""}
                />
              </div>
              <div>
                <Label htmlFor="voip-port">Port</Label>
                <Input
                  id="voip-port"
                  type="number"
                  placeholder="5060"
                  defaultValue={settings?.voipPort || "5060"}
                />
              </div>
              <div>
                <Label htmlFor="voip-username">Username</Label>
                <Input
                  id="voip-username"
                  placeholder="Your Isabel username"
                  defaultValue={settings?.voipUsername || ""}
                />
              </div>
              <div>
                <Label htmlFor="voip-password">Password</Label>
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
              <Label htmlFor="voip-enabled">Enable VoIP Integration</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="call-recording"
                defaultChecked={settings?.callRecordingEnabled || false}
              />
              <Label htmlFor="call-recording">Enable Call Recording</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="recording-storage">Recording Storage Path</Label>
              <Input
                id="recording-storage"
                placeholder="/var/recordings"
                defaultValue={settings?.recordingStoragePath || "/var/recordings"}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="test-phone-number">Test Phone Number</Label>
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
                      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number", variant: "destructive" });
                      return;
                    }
                    testVoipCall.mutate(phoneNumber);
                  }}
                  disabled={testVoipCall.isPending}
                  variant="outline"
                  className="min-w-[140px]"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Test Call
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a phone number to test Isabel VoIP calling capability. Format: +989123456789
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => testVoipConnection.mutate()}
                disabled={testVoipConnection.isPending}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
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
                Save VoIP Settings
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
              Shetab Payment Gateway Configuration
            </CardTitle>
            <CardDescription>Configure Shetab banking integration for Iranian payment processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shetab-merchant-id">Merchant ID</Label>
                <Input
                  id="shetab-merchant-id"
                  placeholder="Your Shetab merchant ID"
                  defaultValue={settings?.shetabMerchantId || ""}
                />
              </div>
              <div>
                <Label htmlFor="shetab-terminal-id">Terminal ID</Label>
                <Input
                  id="shetab-terminal-id"
                  placeholder="Your terminal ID"
                  defaultValue={settings?.shetabTerminalId || ""}
                />
              </div>
              <div>
                <Label htmlFor="shetab-api-key">API Key</Label>
                <Input
                  id="shetab-api-key"
                  type="password"
                  placeholder="Your Shetab API key"
                  defaultValue={settings?.shetabApiKey || ""}
                />
              </div>
              <div>
                <Label htmlFor="shetab-secret-key">Secret Key</Label>
                <Input
                  id="shetab-secret-key"
                  type="password"
                  placeholder="Your Shetab secret key"
                  defaultValue={settings?.shetabSecretKey || ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shetab-environment">Environment</Label>
              <Select defaultValue={settings?.shetabEnvironment || "production"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="shetab-enabled"
                defaultChecked={settings?.shetabEnabled || false}
              />
              <Label htmlFor="shetab-enabled">Enable Shetab Integration</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="callback-url">Callback URL</Label>
              <Input
                id="callback-url"
                placeholder="https://your-domain.com/api/payment/callback"
                defaultValue={settings?.shetabCallbackUrl || ""}
              />
            </div>

            <div>
              <Label htmlFor="return-url">Return URL</Label>
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
                Test Connection
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
                Save Shetab Settings
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
              SMS Service Status
            </CardTitle>
            <CardDescription>Overview of Kavenegar SMS service integration for Iranian mobile communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Kavenegar SMS Integration</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    SMS service is {settings?.kavenegarEnabled ? 'enabled' : 'disabled'} for Iranian market compliance
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
                    Manage SMS Settings
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Service Status</div>
                <div className="font-medium">
                  {settings?.kavenegarEnabled ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Sender Number</div>
                <div className="font-medium">
                  {settings?.kavenegarSender || 'Not configured'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Provider</div>
                <div className="font-medium">Kavenegar</div>
              </div>
            </div>

            <Separator />

            {/* SMS API Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">SMS API Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kavenegar-api-key">Kavenegar API Key</Label>
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
                  <Label htmlFor="kavenegar-sender">Sender Number</Label>
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
                <Label htmlFor="kavenegar-enabled">Enable Kavenegar SMS Service</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => testSmsConnection.mutate()}
                  disabled={testSmsConnection.isPending}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test SMS Connection
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
                  Save SMS Settings
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
              General Iranian Market Settings
            </CardTitle>
            <CardDescription>Configure general settings for Iranian market compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="institute-name">Institute Name (Persian)</Label>
              <Input
                id="institute-name"
                placeholder="مؤسسه زبان‌های خارجی متالینگوآ"
                defaultValue={settings?.instituteNamePersian || ""}
              />
            </div>

            <div>
              <Label htmlFor="institute-name-english">Institute Name (English)</Label>
              <Input
                id="institute-name-english"
                placeholder="Meta Lingua Language Institute"
                defaultValue={settings?.instituteNameEnglish || ""}
              />
            </div>

            <div>
              <Label htmlFor="business-license">Business License Number</Label>
              <Input
                id="business-license"
                placeholder="Iran business license number"
                defaultValue={settings?.businessLicenseNumber || ""}
              />
            </div>

            <div>
              <Label htmlFor="tax-id">Tax ID</Label>
              <Input
                id="tax-id"
                placeholder="Iranian tax identification number"
                defaultValue={settings?.taxId || ""}
              />
            </div>

            <div>
              <Label htmlFor="default-currency">Default Currency</Label>
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
              <Label htmlFor="timezone">Timezone</Label>
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
              <Label htmlFor="persian-calendar">Enable Persian Calendar</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="rtl-layout"
                defaultChecked={settings?.rtlLayoutEnabled || false}
              />
              <Label htmlFor="rtl-layout">Enable RTL Layout for Persian</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="contact-address">Contact Address (Persian)</Label>
              <Textarea
                id="contact-address"
                placeholder="آدرس دفتر مرکزی مؤسسه در ایران"
                defaultValue={settings?.contactAddressPersian || ""}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="support-phone">Support Phone</Label>
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
              Save General Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Third Party Services Status</CardTitle>
          <CardDescription>Current status of all Iranian market integrations</CardDescription>
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
              <span className="text-sm">Persian Calendar</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}