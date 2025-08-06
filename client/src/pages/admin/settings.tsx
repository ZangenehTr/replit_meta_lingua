import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  CreditCard, 
  MessageSquare, 
  Database, 
  Shield, 
  Globe,
  Save,
  TestTube,
  Key,
  Server,
  Mail,
  Phone,
  DollarSign,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";

interface AdminSettings {
  id: number;
  // Payment Gateway Settings (Shetab)
  shetabMerchantId: string;
  shetabTerminalId: string;
  shetabApiKey: string;
  shetabSecretKey: string;
  shetabEnvironment: 'sandbox' | 'production';
  shetabEnabled: boolean;
  
  // SMS API Settings (Kavehnegar)
  kavehnegarApiKey: string;
  kavehnegarSender: string;
  kavehnegarEnabled: boolean;
  
  // Email Settings
  emailSmtpHost: string;
  emailSmtpPort: number;
  emailUsername: string;
  emailPassword: string;
  emailFromAddress: string;
  emailEnabled: boolean;
  
  // Database Settings
  databaseBackupEnabled: boolean;
  databaseBackupFrequency: 'daily' | 'weekly' | 'monthly';
  databaseRetentionDays: number;
  
  // Security Settings
  jwtSecretKey: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  
  // System Settings
  systemMaintenanceMode: boolean;
  systemDebugMode: boolean;
  systemLogLevel: 'error' | 'warn' | 'info' | 'debug';
  systemMaxUploadSize: number;
  
  // Notification Settings
  notificationEmailEnabled: boolean;
  notificationSmsEnabled: boolean;
  notificationPushEnabled: boolean;
  
  // API Rate Limiting
  apiRateLimit: number;
  apiRateLimitWindow: number;
  
  // File Storage
  fileStorageProvider: 'local' | 's3' | 'cloudinary';
  fileStorageConfig: Record<string, any>;
  
  updatedAt: string;
}

export default function AdminSettings() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState("payment");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
    retry: false
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<AdminSettings>) => 
      apiRequest("/api/admin/settings", {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: t('admin:settings.updateSuccess'),
        description: t('admin:settings.updateSuccessDescription')
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.updateFailed'),
        description: error.message || "Failed to update settings.",
        variant: "destructive"
      });
    }
  });

  // Test connection mutations
  const testShetabMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/test/shetab", { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: t('common:toast.shetabConnectionSuccessful'),
        description: "Payment gateway connection is working properly."
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.shetabConnectionFailed'),
        description: error.message || "Failed to connect to Shetab gateway.",
        variant: "destructive"
      });
    }
  });

  const testKavehnegarMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/test/kavehnegar", { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: t('common:toast.kavenegarConnectionSuccessful'),
        description: "SMS service connection is working properly."
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.kavenegarConnectionFailed'),
        description: error.message || "Failed to connect to SMS service.",
        variant: "destructive"
      });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/test/email", { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Email Connection Successful",
        description: "Email service connection is working properly."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Connection Failed",
        description: error.message || "Failed to connect to email service.",
        variant: "destructive"
      });
    }
  });

  const toggleSecret = (fieldName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSettingUpdate = (field: string, value: any) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`container max-w-6xl mx-auto p-6 space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BackButton href="/dashboard" />
        </div>
        <div className="flex items-center gap-4">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('admin:settings.title')}</h1>
            <p className="text-muted-foreground">
              {t('admin:settings.description')}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        {/* Payment Gateway Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Shetab Payment Gateway
              </CardTitle>
              <CardDescription>
                Configure Shetab payment gateway for processing Iranian payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shetab-enabled">Enable Shetab Gateway</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow payments through Shetab payment network
                  </p>
                </div>
                <Switch
                  id="shetab-enabled"
                  checked={settings?.shetabEnabled || false}
                  onCheckedChange={(checked) => handleSettingUpdate('shetabEnabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="merchant-id">Merchant ID</Label>
                  <Input
                    id="merchant-id"
                    placeholder="Enter merchant ID"
                    value={settings?.shetabMerchantId || ''}
                    onChange={(e) => handleSettingUpdate('shetabMerchantId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terminal-id">Terminal ID</Label>
                  <Input
                    id="terminal-id"
                    placeholder="Enter terminal ID"
                    value={settings?.shetabTerminalId || ''}
                    onChange={(e) => handleSettingUpdate('shetabTerminalId', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showSecrets.shetabApiKey ? "text" : "password"}
                      placeholder="Enter API key"
                      value={settings?.shetabApiKey || ''}
                      onChange={(e) => handleSettingUpdate('shetabApiKey', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => toggleSecret('shetabApiKey')}
                    >
                      {showSecrets.shetabApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecrets.shetabSecretKey ? "text" : "password"}
                      placeholder="Enter secret key"
                      value={settings?.shetabSecretKey || ''}
                      onChange={(e) => handleSettingUpdate('shetabSecretKey', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => toggleSecret('shetabSecretKey')}
                    >
                      {showSecrets.shetabSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <select
                  id="environment"
                  className="w-full p-2 border rounded-md"
                  value={settings?.shetabEnvironment || 'sandbox'}
                  onChange={(e) => handleSettingUpdate('shetabEnvironment', e.target.value)}
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testShetabMutation.mutate()}
                  disabled={testShetabMutation.isPending}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4" />
                  <span>{testShetabMutation.isPending ? "Testing..." : "Test Connection"}</span>
                </Button>
                <Badge variant={settings?.shetabEnabled ? "default" : "secondary"}>
                  {settings?.shetabEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Settings */}
        <TabsContent value="communication">
          <div className="space-y-6">
            {/* SMS Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Kavehnegar SMS Service
                </CardTitle>
                <CardDescription>
                  Configure SMS notifications and verification messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-enabled">Enable SMS Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Send SMS notifications and verification codes
                    </p>
                  </div>
                  <Switch
                    id="sms-enabled"
                    checked={settings?.kavehnegarEnabled || false}
                    onCheckedChange={(checked) => handleSettingUpdate('kavehnegarEnabled', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kavehnegar-api">Kavehnegar API Key</Label>
                    <div className="relative">
                      <Input
                        id="kavehnegar-api"
                        type={showSecrets.kavehnegarApiKey ? "text" : "password"}
                        placeholder="Enter Kavehnegar API key"
                        value={settings?.kavehnegarApiKey || ''}
                        onChange={(e) => handleSettingUpdate('kavehnegarApiKey', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => toggleSecret('kavehnegarApiKey')}
                      >
                        {showSecrets.kavehnegarApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-sender">SMS Sender ID</Label>
                    <Input
                      id="sms-sender"
                      placeholder="e.g., MetaLingua"
                      value={settings?.kavehnegarSender || ''}
                      onChange={(e) => handleSettingUpdate('kavehnegarSender', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => testKavehnegarMutation.mutate()}
                  disabled={testKavehnegarMutation.isPending}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4" />
                  <span>{testKavehnegarMutation.isPending ? "Testing..." : "Test SMS Service"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Service Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-enabled">Enable Email Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications and confirmations
                    </p>
                  </div>
                  <Switch
                    id="email-enabled"
                    checked={settings?.emailEnabled || false}
                    onCheckedChange={(checked) => handleSettingUpdate('emailEnabled', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.gmail.com"
                      value={settings?.emailSmtpHost || ''}
                      onChange={(e) => handleSettingUpdate('emailSmtpHost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={settings?.emailSmtpPort || ''}
                      onChange={(e) => handleSettingUpdate('emailSmtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-username">Email Username</Label>
                    <Input
                      id="email-username"
                      placeholder="your-email@domain.com"
                      value={settings?.emailUsername || ''}
                      onChange={(e) => handleSettingUpdate('emailUsername', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-password">Email Password</Label>
                    <div className="relative">
                      <Input
                        id="email-password"
                        type={showSecrets.emailPassword ? "text" : "password"}
                        placeholder="Enter email password"
                        value={settings?.emailPassword || ''}
                        onChange={(e) => handleSettingUpdate('emailPassword', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => toggleSecret('emailPassword')}
                      >
                        {showSecrets.emailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-address">From Address</Label>
                  <Input
                    id="from-address"
                    placeholder="noreply@metalingua.com"
                    value={settings?.emailFromAddress || ''}
                    onChange={(e) => handleSettingUpdate('emailFromAddress', e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => testEmailMutation.mutate()}
                  disabled={testEmailMutation.isPending}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4" />
                  <span>{testEmailMutation.isPending ? "Testing..." : "Test Email Service"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>
                Configure database backup and maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="backup-enabled">Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automated database backups
                  </p>
                </div>
                <Switch
                  id="backup-enabled"
                  checked={settings?.databaseBackupEnabled || false}
                  onCheckedChange={(checked) => handleSettingUpdate('databaseBackupEnabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <select
                    id="backup-frequency"
                    className="w-full p-2 border rounded-md"
                    value={settings?.databaseBackupFrequency || 'daily'}
                    onChange={(e) => handleSettingUpdate('databaseBackupFrequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention-days">Retention (Days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    placeholder="30"
                    value={settings?.databaseRetentionDays || ''}
                    onChange={(e) => handleSettingUpdate('databaseRetentionDays', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure authentication and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jwt-secret">JWT Secret Key</Label>
                <div className="relative">
                  <Input
                    id="jwt-secret"
                    type={showSecrets.jwtSecretKey ? "text" : "password"}
                    placeholder="Enter JWT secret key"
                    value={settings?.jwtSecretKey || ''}
                    onChange={(e) => handleSettingUpdate('jwtSecretKey', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => toggleSecret('jwtSecretKey')}
                  >
                    {showSecrets.jwtSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    placeholder="60"
                    value={settings?.sessionTimeout || ''}
                    onChange={(e) => handleSettingUpdate('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login">Max Login Attempts</Label>
                  <Input
                    id="max-login"
                    type="number"
                    placeholder="5"
                    value={settings?.maxLoginAttempts || ''}
                    onChange={(e) => handleSettingUpdate('maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-length">Min Password Length</Label>
                  <Input
                    id="password-length"
                    type="number"
                    placeholder="8"
                    value={settings?.passwordMinLength || ''}
                    onChange={(e) => handleSettingUpdate('passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all admin accounts
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings?.requireTwoFactor || false}
                  onCheckedChange={(checked) => handleSettingUpdate('requireTwoFactor', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to prevent user access
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings?.systemMaintenanceMode || false}
                  onCheckedChange={(checked) => handleSettingUpdate('systemMaintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable debug mode for development and troubleshooting
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={settings?.systemDebugMode || false}
                  onCheckedChange={(checked) => handleSettingUpdate('systemDebugMode', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select
                    id="log-level"
                    className="w-full p-2 border rounded-md"
                    value={settings?.systemLogLevel || 'info'}
                    onChange={(e) => handleSettingUpdate('systemLogLevel', e.target.value)}
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-upload">Max Upload Size (MB)</Label>
                  <Input
                    id="max-upload"
                    type="number"
                    placeholder="10"
                    value={settings?.systemMaxUploadSize || ''}
                    onChange={(e) => handleSettingUpdate('systemMaxUploadSize', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API rate limiting and external service settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit (requests/window)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    placeholder="100"
                    value={settings?.apiRateLimit || ''}
                    onChange={(e) => handleSettingUpdate('apiRateLimit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-window">Rate Limit Window (seconds)</Label>
                  <Input
                    id="rate-window"
                    type="number"
                    placeholder="60"
                    value={settings?.apiRateLimitWindow || ''}
                    onChange={(e) => handleSettingUpdate('apiRateLimitWindow', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-storage">File Storage Provider</Label>
                <select
                  id="file-storage"
                  className="w-full p-2 border rounded-md"
                  value={settings?.fileStorageProvider || 'local'}
                  onChange={(e) => handleSettingUpdate('fileStorageProvider', e.target.value)}
                >
                  <option value="local">Local Storage</option>
                  <option value="s3">Amazon S3</option>
                  <option value="cloudinary">Cloudinary</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}