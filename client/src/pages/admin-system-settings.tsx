import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/layout/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useLanguage } from "@/hooks/use-language";
import { Settings, Shield, MessageSquare, CreditCard, Bot, Users, AlertTriangle, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SystemConfig {
  id?: number;
  // SMS API Configuration (Kavenegar)
  kavenegarApiKey: string | null;
  kavenegarSenderNumber: string | null;
  smsEnabled: boolean;
  
  // Payment Gateway Configuration (Shetab)
  shetabMerchantId: string | null;
  shetabTerminalId: string | null;
  shetabApiKey: string | null;
  shetabGatewayUrl: string | null;
  paymentEnabled: boolean;
  
  // Email Configuration
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  emailEnabled: boolean;
  
  // AI Configuration (Ollama)
  ollamaApiUrl: string;
  ollamaModel: string;
  aiEnabled: boolean;
  
  // General Settings
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxUsersPerInstitute: number;
}

interface CustomRole {
  id?: number;
  name: string;
  description: string | null;
  permissions: string[];
  isSystemRole: boolean;
}

export default function AdminSystemSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentLanguage, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systemConfig, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ["/api/admin/system-config"],
  });

  const { data: customRoles, isLoading: rolesLoading } = useQuery<CustomRole[]>({
    queryKey: ["/api/admin/custom-roles"],
  });

  const [configData, setConfigData] = useState<SystemConfig>({
    kavenegarApiKey: null,
    kavenegarSenderNumber: null,
    smsEnabled: false,
    shetabMerchantId: null,
    shetabTerminalId: null,
    shetabApiKey: null,
    shetabGatewayUrl: null,
    paymentEnabled: false,
    smtpHost: null,
    smtpPort: null,
    smtpUser: null,
    smtpPassword: null,
    emailEnabled: false,
    ollamaApiUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
    aiEnabled: true,
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerInstitute: 1000
  });

  // Update form when config data loads
  useState(() => {
    if (systemConfig) {
      setConfigData(systemConfig);
    }
  }, [systemConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<SystemConfig>) => 
      apiRequest("/api/admin/system-config", {
        method: "PUT",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-config"] });
      toast({
        title: currentLanguage === 'fa' ? "تنظیمات ذخیره شد" : "Settings Saved",
        description: currentLanguage === 'fa' 
          ? "تنظیمات سیستم با موفقیت به‌روزرسانی شد"
          : "System settings have been updated successfully"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: currentLanguage === 'fa' ? "خطا" : "Error",
        description: currentLanguage === 'fa' 
          ? "خطا در به‌روزرسانی تنظیمات سیستم"
          : "Failed to update system settings"
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: (service: string) => 
      apiRequest(`/api/admin/test-connection/${service}`, {
        method: "POST",
        body: configData
      }),
    onSuccess: (_, service) => {
      toast({
        title: currentLanguage === 'fa' ? "اتصال موفق" : "Connection Successful",
        description: currentLanguage === 'fa' 
          ? `اتصال به ${service} با موفقیت برقرار شد`
          : `Successfully connected to ${service}`
      });
    },
    onError: (_, service) => {
      toast({
        variant: "destructive",
        title: currentLanguage === 'fa' ? "خطا در اتصال" : "Connection Failed",
        description: currentLanguage === 'fa' 
          ? `خطا در اتصال به ${service}`
          : `Failed to connect to ${service}`
      });
    }
  });

  const handleConfigUpdate = (field: keyof SystemConfig, value: any) => {
    setConfigData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = () => {
    updateConfigMutation.mutate(configData);
  };

  const availablePermissions = [
    "users.read", "users.create", "users.update", "users.delete",
    "courses.read", "courses.create", "courses.update", "courses.delete",
    "sessions.read", "sessions.create", "sessions.update", "sessions.delete",
    "analytics.read", "analytics.export",
    "system.read", "system.update",
    "branding.read", "branding.update",
    "roles.read", "roles.create", "roles.update", "roles.delete"
  ];

  if (configLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>{currentLanguage === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {currentLanguage === 'fa' ? 'تنظیمات سیستم' : 'System Settings'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentLanguage === 'fa' 
                  ? 'مدیریت وابستگی‌های فنی و پیکربندی سیستم'
                  : 'Manage technical dependencies and system configuration'
                }
              </p>
            </div>
            <Button 
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateConfigMutation.isPending 
                ? (currentLanguage === 'fa' ? 'در حال ذخیره...' : 'Saving...') 
                : (currentLanguage === 'fa' ? 'ذخیره تغییرات' : 'Save Changes')
              }
            </Button>
          </div>

          <Tabs defaultValue="integrations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {currentLanguage === 'fa' ? 'ادغام‌ها' : 'Integrations'}
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {currentLanguage === 'fa' ? 'نقش‌ها' : 'Roles'}
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {currentLanguage === 'fa' ? 'هوش مصنوعی' : 'AI Settings'}
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {currentLanguage === 'fa' ? 'عمومی' : 'General'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="space-y-6">
              {/* SMS Integration (Kavenegar) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {currentLanguage === 'fa' ? 'ادغام پیامک (کاوه نگار)' : 'SMS Integration (Kavenegar)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smsEnabled">
                      {currentLanguage === 'fa' ? 'فعال‌سازی پیامک' : 'Enable SMS'}
                    </Label>
                    <Switch
                      id="smsEnabled"
                      checked={configData.smsEnabled}
                      onCheckedChange={(checked) => handleConfigUpdate('smsEnabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="kavenegarApiKey">
                        {currentLanguage === 'fa' ? 'کلید API کاوه نگار' : 'Kavenegar API Key'}
                      </Label>
                      <Input
                        id="kavenegarApiKey"
                        type="password"
                        value={configData.kavenegarApiKey || ''}
                        onChange={(e) => handleConfigUpdate('kavenegarApiKey', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'کلید API خود را وارد کنید' : 'Enter your API key'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="kavenegarSenderNumber">
                        {currentLanguage === 'fa' ? 'شماره فرستنده' : 'Sender Number'}
                      </Label>
                      <Input
                        id="kavenegarSenderNumber"
                        value={configData.kavenegarSenderNumber || ''}
                        onChange={(e) => handleConfigUpdate('kavenegarSenderNumber', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'شماره فرستنده' : 'Sender number'}
                      />
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate('kavenegar')}
                    disabled={testConnectionMutation.isPending}
                  >
                    {currentLanguage === 'fa' ? 'تست اتصال' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Integration (Shetab) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {currentLanguage === 'fa' ? 'ادغام پرداخت (شتاب)' : 'Payment Integration (Shetab)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="paymentEnabled">
                      {currentLanguage === 'fa' ? 'فعال‌سازی پرداخت' : 'Enable Payments'}
                    </Label>
                    <Switch
                      id="paymentEnabled"
                      checked={configData.paymentEnabled}
                      onCheckedChange={(checked) => handleConfigUpdate('paymentEnabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shetabMerchantId">
                        {currentLanguage === 'fa' ? 'شناسه پذیرنده' : 'Merchant ID'}
                      </Label>
                      <Input
                        id="shetabMerchantId"
                        value={configData.shetabMerchantId || ''}
                        onChange={(e) => handleConfigUpdate('shetabMerchantId', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'شناسه پذیرنده' : 'Merchant ID'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="shetabTerminalId">
                        {currentLanguage === 'fa' ? 'شناسه ترمینال' : 'Terminal ID'}
                      </Label>
                      <Input
                        id="shetabTerminalId"
                        value={configData.shetabTerminalId || ''}
                        onChange={(e) => handleConfigUpdate('shetabTerminalId', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'شناسه ترمینال' : 'Terminal ID'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="shetabApiKey">
                        {currentLanguage === 'fa' ? 'کلید API' : 'API Key'}
                      </Label>
                      <Input
                        id="shetabApiKey"
                        type="password"
                        value={configData.shetabApiKey || ''}
                        onChange={(e) => handleConfigUpdate('shetabApiKey', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'کلید API' : 'API Key'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="shetabGatewayUrl">
                        {currentLanguage === 'fa' ? 'آدرس درگاه' : 'Gateway URL'}
                      </Label>
                      <Input
                        id="shetabGatewayUrl"
                        value={configData.shetabGatewayUrl || ''}
                        onChange={(e) => handleConfigUpdate('shetabGatewayUrl', e.target.value)}
                        placeholder="https://gateway.shetab.ir"
                      />
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate('shetab')}
                    disabled={testConnectionMutation.isPending}
                  >
                    {currentLanguage === 'fa' ? 'تست اتصال' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>

              {/* Email Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {currentLanguage === 'fa' ? 'تنظیمات ایمیل' : 'Email Configuration'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailEnabled">
                      {currentLanguage === 'fa' ? 'فعال‌سازی ایمیل' : 'Enable Email'}
                    </Label>
                    <Switch
                      id="emailEnabled"
                      checked={configData.emailEnabled}
                      onCheckedChange={(checked) => handleConfigUpdate('emailEnabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">
                        {currentLanguage === 'fa' ? 'میزبان SMTP' : 'SMTP Host'}
                      </Label>
                      <Input
                        id="smtpHost"
                        value={configData.smtpHost || ''}
                        onChange={(e) => handleConfigUpdate('smtpHost', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpPort">
                        {currentLanguage === 'fa' ? 'پورت SMTP' : 'SMTP Port'}
                      </Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={configData.smtpPort || ''}
                        onChange={(e) => handleConfigUpdate('smtpPort', parseInt(e.target.value))}
                        placeholder="587"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpUser">
                        {currentLanguage === 'fa' ? 'نام کاربری' : 'Username'}
                      </Label>
                      <Input
                        id="smtpUser"
                        value={configData.smtpUser || ''}
                        onChange={(e) => handleConfigUpdate('smtpUser', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'نام کاربری' : 'Username'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpPassword">
                        {currentLanguage === 'fa' ? 'رمز عبور' : 'Password'}
                      </Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={configData.smtpPassword || ''}
                        onChange={(e) => handleConfigUpdate('smtpPassword', e.target.value)}
                        placeholder={currentLanguage === 'fa' ? 'رمز عبور' : 'Password'}
                      />
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate('email')}
                    disabled={testConnectionMutation.isPending}
                  >
                    {currentLanguage === 'fa' ? 'تست اتصال' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              {/* AI Configuration (Ollama) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {currentLanguage === 'fa' ? 'تنظیمات هوش مصنوعی (اولاما)' : 'AI Configuration (Ollama)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aiEnabled">
                      {currentLanguage === 'fa' ? 'فعال‌سازی هوش مصنوعی' : 'Enable AI'}
                    </Label>
                    <Switch
                      id="aiEnabled"
                      checked={configData.aiEnabled}
                      onCheckedChange={(checked) => handleConfigUpdate('aiEnabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ollamaApiUrl">
                        {currentLanguage === 'fa' ? 'آدرس API اولاما' : 'Ollama API URL'}
                      </Label>
                      <Input
                        id="ollamaApiUrl"
                        value={configData.ollamaApiUrl}
                        onChange={(e) => handleConfigUpdate('ollamaApiUrl', e.target.value)}
                        placeholder="http://localhost:11434"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ollamaModel">
                        {currentLanguage === 'fa' ? 'مدل هوش مصنوعی' : 'AI Model'}
                      </Label>
                      <Input
                        id="ollamaModel"
                        value={configData.ollamaModel}
                        onChange={(e) => handleConfigUpdate('ollamaModel', e.target.value)}
                        placeholder="llama3.2"
                      />
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate('ollama')}
                    disabled={testConnectionMutation.isPending}
                  >
                    {currentLanguage === 'fa' ? 'تست اتصال' : 'Test Connection'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {currentLanguage === 'fa' ? 'تنظیمات عمومی' : 'General Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceMode">
                      {currentLanguage === 'fa' ? 'حالت تعمیر و نگهداری' : 'Maintenance Mode'}
                    </Label>
                    <Switch
                      id="maintenanceMode"
                      checked={configData.maintenanceMode}
                      onCheckedChange={(checked) => handleConfigUpdate('maintenanceMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="registrationEnabled">
                      {currentLanguage === 'fa' ? 'فعال‌سازی ثبت‌نام' : 'Enable Registration'}
                    </Label>
                    <Switch
                      id="registrationEnabled"
                      checked={configData.registrationEnabled}
                      onCheckedChange={(checked) => handleConfigUpdate('registrationEnabled', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxUsersPerInstitute">
                      {currentLanguage === 'fa' ? 'حداکثر کاربران در هر موسسه' : 'Max Users Per Institute'}
                    </Label>
                    <Input
                      id="maxUsersPerInstitute"
                      type="number"
                      value={configData.maxUsersPerInstitute}
                      onChange={(e) => handleConfigUpdate('maxUsersPerInstitute', parseInt(e.target.value))}
                      placeholder="1000"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-6">
              {/* Custom Roles Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {currentLanguage === 'fa' ? 'مدیریت نقش‌های سفارشی' : 'Custom Roles Management'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {currentLanguage === 'fa' 
                      ? 'نقش‌های سفارشی جدید با مجوزهای مختلف تعریف کنید'
                      : 'Define new custom roles with different permission sets'
                    }
                  </p>
                  <Button>
                    {currentLanguage === 'fa' ? 'افزودن نقش جدید' : 'Add New Role'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}