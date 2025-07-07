import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Save, TestTube, Phone, CreditCard, MessageSquare, Settings, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function IranianComplianceSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"voip" | "shetab" | "sms" | "general">("voip");

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
    onSuccess: () => {
      toast({ title: "VoIP Test", description: "Isabel VoIP connection successful" });
    },
    onError: (error) => {
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

  const handleSave = (section: string, data: any) => {
    updateSettings.mutate({ [section]: data });
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
          <h1 className="text-2xl font-bold">Iranian Market Compliance Settings</h1>
          <p className="text-muted-foreground mt-1">Configure local Iranian services for full compliance and self-hosting</p>
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

      {/* SMS Settings */}
      {activeTab === "sms" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Kavenegar SMS Service Configuration
            </CardTitle>
            <CardDescription>Configure Kavenegar SMS service for Iranian mobile communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="kavenegar-api-key">Kavenegar API Key</Label>
              <Input
                id="kavenegar-api-key"
                type="password"
                placeholder="Your Kavenegar API key"
                defaultValue={settings?.kavehnegarApiKey || ""}
              />
            </div>

            <div>
              <Label htmlFor="sender-number">Sender Number</Label>
              <Input
                id="sender-number"
                placeholder="10004346"
                defaultValue={settings?.smsSenderNumber || ""}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sms-enabled"
                defaultChecked={settings?.smsEnabled || false}
              />
              <Label htmlFor="sms-enabled">Enable SMS Integration</Label>
            </div>

            <Separator />

            <div>
              <Label htmlFor="sms-templates">SMS Templates</Label>
              <Textarea
                id="sms-templates"
                placeholder="Welcome: Welcome to Meta Lingua!&#10;Verification: Your verification code is {code}&#10;Reminder: You have a class starting in 30 minutes"
                defaultValue={settings?.smsTemplates || ""}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => testSmsConnection.mutate()}
                disabled={testSmsConnection.isPending}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button 
                onClick={() => handleSave("sms", {
                  kavehnegarApiKey: (document.getElementById("kavenegar-api-key") as HTMLInputElement)?.value,
                  smsSenderNumber: (document.getElementById("sender-number") as HTMLInputElement)?.value,
                  smsEnabled: (document.getElementById("sms-enabled") as HTMLInputElement)?.checked,
                  smsTemplates: (document.getElementById("sms-templates") as HTMLTextAreaElement)?.value
                })}
                disabled={updateSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save SMS Settings
              </Button>
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
          <CardTitle>Iranian Compliance Status</CardTitle>
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
              <div className={`w-3 h-3 rounded-full ${settings?.smsEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
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