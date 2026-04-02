import { useState, useRef, type ElementType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSystemMutations } from "@/hooks/useSystem";
import {
  Settings, Palette, Shield, Users, Plus, Edit3, Upload, Download,
  Monitor, Database, Globe, Bell, Mail, MessageSquare, Key, Lock,
  Eye, EyeOff, Activity, Loader2
} from "lucide-react";
import { SystemSecurityTab } from "@/components/admin/SystemSecurityTab";
import { SystemMaintenanceTab } from "@/components/admin/SystemMaintenanceTab";

const brandingSettings = {
  instituteName: "Meta Lingua Institute",
  primaryColor: "#2563eb", secondaryColor: "#7c3aed", accentColor: "#059669",
  customDomain: "metalingua.education", footerText: "© 2024 Meta Lingua Institute. All rights reserved.",
  supportEmail: "support@metalingua.education",
};

const userRoles = [
  { id: 1, name: "Admin", description: "Full system access", permissions: ["all"], userCount: 3, color: "red" },
  { id: 2, name: "Teacher", description: "Course creation and student management", permissions: ["courses", "students", "classes", "reports"], userCount: 89, color: "blue" },
  { id: 3, name: "Student", description: "Learning platform access", permissions: ["courses", "progress", "messaging"], userCount: 1247, color: "green" },
  { id: 4, name: "Supervisor", description: "Quality assurance and monitoring", permissions: ["quality", "reports", "sessions"], userCount: 12, color: "purple" },
  { id: 5, name: "Call Center Agent", description: "Lead management", permissions: ["leads", "communication", "prospects"], userCount: 8, color: "yellow" },
  { id: 6, name: "Accountant", description: "Financial management", permissions: ["financial", "reports", "payouts"], userCount: 4, color: "orange" },
  { id: 7, name: "Mentor", description: "Student mentoring", permissions: ["mentees", "progress", "communication"], userCount: 25, color: "teal" },
];

const integrations = [
  { name: "Anthropic API", description: "AI-powered learning assistance", status: "connected", type: "ai" },
  { name: "Shetab Payment Gateway", description: "Iranian payment processing", status: "connected", type: "payment" },
  { name: "Kavenegar SMS", description: "SMS notifications and OTP", status: "pending", type: "communication" },
  { name: "Email Service", description: "Automated email notifications", status: "connected", type: "communication" },
  { name: "WebRTC Service", description: "Live video classrooms", status: "configured", type: "video" },
];

const getRoleColor = (color: string) => {
  const colors: Record<string, string> = { red: "bg-red-100 text-red-800", blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", purple: "bg-purple-100 text-purple-800", yellow: "bg-yellow-100 text-yellow-800", orange: "bg-orange-100 text-orange-800", teal: "bg-teal-100 text-teal-800" };
  return colors[color] || "bg-gray-100 text-gray-800";
};

const getIntegrationStatusColor = (status: string) => {
  switch (status) {
    case "connected": case "configured": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const integrationIcon = (type: string) => {
  const icons: Record<string, ElementType> = { ai: Settings, payment: Key, communication: MessageSquare, video: Monitor };
  const Icon = icons[type] || Globe;
  return <Icon className="h-5 w-5 text-white" />;
};

export function AdminSystem() {
  const { t } = useTranslation(["admin", "common"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const { updateBrandingMutation, exportConfigMutation, createBackupMutation } = useSystemMutations(
    setIsBackupInProgress,
    setBackupProgress,
  );

  const handleMaintenanceModeToggle = () => {
    setMaintenanceMode((prev) => {
      const next = !prev;
      toast({ title: next ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled", description: next ? "System is now in maintenance mode." : "System is now accessible." });
      return next;
    });
  };

  const handleTestIntegration = async (name: string) => {
    try {
      await apiRequest(`/api/admin/integrations/${name}/test`, { method: "POST" });
      toast({ title: "Connection Test Successful", description: `${name} is working properly.` });
    } catch {
      toast({ title: "Connection Test Failed", description: `Failed to connect to ${name}.`, variant: "destructive" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try { JSON.parse(e.target?.result as string); toast({ title: "Configuration Imported" }); }
        catch { toast({ title: "Import Failed", description: "Invalid configuration file format.", variant: "destructive" }); }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("admin:system.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t("admin:system.description")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => exportConfigMutation.mutate()} disabled={exportConfigMutation.isPending}>
            <Download className="h-4 w-4 me-2" />{exportConfigMutation.isPending ? "Exporting..." : "Export Config"}
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 me-2" />Import Config
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "System Status", icon: Activity, content: <><div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-green-600 font-medium">Operational</span></div><p className="text-xs text-gray-600 mt-1">99.9% uptime</p></> },
          { label: "Active Users", icon: Users, content: <><div className="text-2xl font-bold">1,386</div><p className="text-xs text-green-600">+12% from last week</p></> },
          { label: "Database Health", icon: Database, content: <><div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-green-600 font-medium">Healthy</span></div><p className="text-xs text-gray-600 mt-1">Response: 45ms</p></> },
          { label: "Storage Used", icon: Monitor, content: <><div className="text-2xl font-bold">67%</div><p className="text-xs text-gray-600">2.3TB / 3.4TB</p></> },
        ].map(({ label, icon: Icon, content }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>{content}</CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">White-labeling</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Institute Branding</CardTitle><CardDescription>Customize your institute's visual identity</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {[["instituteName", "Institute Name", "text"], ["customDomain", "Custom Domain", "text"], ["supportEmail", "Support Email", "email"]].map(([id, label, type]) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} type={type} defaultValue={(brandingSettings as Record<string, string>)[id]} />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea id="footerText" defaultValue={brandingSettings.footerText} rows={2} />
                </div>
                <Button className="w-full" onClick={() => updateBrandingMutation.mutate(brandingSettings)} disabled={updateBrandingMutation.isPending}>
                  {updateBrandingMutation.isPending ? "Saving..." : "Save Branding Settings"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Color Scheme</CardTitle><CardDescription>Customize the platform's color palette</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[["primaryColor", "Primary Color"], ["secondaryColor", "Secondary Color"], ["accentColor", "Accent Color"]].map(([id, label]) => (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={id}>{label}</Label>
                      <div className="flex gap-2">
                        <Input id={id} defaultValue={(brandingSettings as Record<string, string>)[id]} />
                        <div className="w-10 h-10 rounded border" style={{ backgroundColor: (brandingSettings as Record<string, string>)[id] }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Logo Upload</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                  </div>
                </div>
                <Button className="w-full">Apply Color Scheme</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Roles & Permissions</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 me-2" />Create Custom Role</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Custom Role</DialogTitle><DialogDescription>Define a new role with specific permissions</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Role Name</Label><Input placeholder="Enter role name" /></div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                        <SelectContent>{["blue", "green", "purple", "orange"].map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Role description and responsibilities" /></div>
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["courses", "students", "financial", "reports", "communication", "quality"].map((p) => (
                        <div key={p} className="flex items-center space-x-2"><Switch id={p} /><Label htmlFor={p} className="capitalize">{p}</Label></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3"><Button variant="outline">Cancel</Button><Button>Create Role</Button></div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRoles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle><Badge className={getRoleColor(role.color)}>{role.name}</Badge></CardTitle>
                    <Button variant="outline" size="sm"><Edit3 className="h-4 w-4" /></Button>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-3"><span>Active Users:</span><span className="font-bold">{role.userCount.toLocaleString()}</span></div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((p, i) => <Badge key={i} variant="outline" className="text-xs">{p}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>External Service Integrations</CardTitle><CardDescription>Manage connections to external APIs and services</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">{integrationIcon(integration.type)}</div>
                      <div><h4 className="font-medium">{integration.name}</h4><p className="text-sm text-gray-600">{integration.description}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getIntegrationStatusColor(integration.status)}>{integration.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleTestIntegration(integration.name)}>Test</Button>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>API Configuration</CardTitle><CardDescription>Manage API keys and external service credentials</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">API Keys Visibility</h4>
                <Button variant="outline" size="sm" onClick={() => setShowApiKeys(!showApiKeys)}>
                  {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showApiKeys ? " Hide" : " Show"} Keys
                </Button>
              </div>
              <div className="space-y-3">
                {[["Anthropic API Key", "AI-powered features", "sk-ant-api03-..."], ["Kavenegar SMS Key", "SMS notifications", "kav-123456789..."]].map(([name, desc, key]) => (
                  <div key={name} className="flex items-center justify-between p-3 border rounded">
                    <div><span className="font-medium">{name}</span><p className="text-sm text-gray-600">{desc}</p></div>
                    <div className="text-sm font-mono">{showApiKeys ? key : "••••••••••••••••"}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />System Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[["Email Notifications", "System alerts via email"], ["SMS Notifications", "Critical alerts via SMS"], ["Push Notifications", "In-app notifications"]].map(([label, desc]) => (
                  <div key={label} className="flex items-center justify-between">
                    <div><span className="font-medium">{label}</span><p className="text-sm text-gray-600">{desc}</p></div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email Templates</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["Welcome Email", "Course Enrollment", "Payment Confirmation", "Password Reset"].map((tpl) => (
                  <div key={tpl} className="flex items-center justify-between p-3 border rounded">
                    <span>{tpl}</span><Button variant="outline" size="sm">Edit</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SystemSecurityTab />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <SystemMaintenanceTab
            maintenanceMode={maintenanceMode}
            onMaintenanceModeToggle={handleMaintenanceModeToggle}
            isBackupInProgress={isBackupInProgress}
            onCreateBackup={() => createBackupMutation.mutate()}
            isPendingBackup={createBackupMutation.isPending}
            onExportConfiguration={() => exportConfigMutation.mutate()}
            isExportInProgress={exportConfigMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
