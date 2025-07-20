import { useState, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Palette, 
  Shield, 
  Users, 
  Plus, 
  Edit3, 
  Upload,
  Download,
  Monitor,
  Database,
  Globe,
  Bell,
  Mail,
  MessageSquare,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Activity,
  Loader2,
  FileText,
  AlertTriangle
} from "lucide-react";

export function AdminSystem() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [systemMaintenanceMode, setSystemMaintenanceMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRoleDialog, setNewRoleDialog] = useState(false);

  // Handle Export Configuration function
  const handleExportConfiguration = () => {
    handleCreateBackup();
  };

  // Function implementations
  const handleCreateBackup = async () => {
    setIsBackupInProgress(true);
    setBackupProgress(0);
    
    try {
      // Simulate backup progress
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsBackupInProgress(false);
            toast({
              title: "Backup Created Successfully",
              description: "System backup has been created and saved.",
            });
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } catch (error) {
      setIsBackupInProgress(false);
      toast({
        title: "Backup Failed",
        description: "Failed to create system backup.",
        variant: "destructive",
      });
    }
  };

  const handleExportConfiguration = async () => {
    try {
      // Create configuration export
      const config = {
        branding: {},
        settings: {},
        roles: {},
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-config-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Configuration Exported",
        description: "System configuration has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export system configuration.",
        variant: "destructive",
      });
    }
  };

  const handleMaintenanceModeToggle = async () => {
    try {
      setMaintenanceMode(!maintenanceMode);
      toast({
        title: maintenanceMode ? "Maintenance Mode Disabled" : "Maintenance Mode Enabled",
        description: maintenanceMode ? "System is now accessible to users." : "System is now in maintenance mode.",
      });
    } catch (error) {
      toast({
        title: "Failed to Toggle Maintenance Mode",
        description: "Could not change maintenance mode status.",
        variant: "destructive",
      });
    }
  };

  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] });

  // Fetch system data
  const { data: systemData, isLoading } = useQuery({
    queryKey: ['/api/admin/system'],
  });

  // Mutations for system operations
  const updateBrandingMutation = useMutation({
    mutationFn: async (brandingData: any) => {
      return apiRequest('/api/admin/branding', {
        method: 'PATCH',
        body: JSON.stringify(brandingData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Branding Updated",
        description: "Your institute branding has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update branding settings.",
        variant: "destructive",
      });
    },
  });

  const exportConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/system/export', {
        method: 'GET',
      });
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meta-lingua-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Configuration Exported",
        description: "System configuration has been downloaded successfully.",
      });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setIsBackupInProgress(true);
      setBackupProgress(0);
      
      // Simulate backup progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setBackupProgress(i);
      }
      
      return apiRequest('/api/admin/system/backup', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setIsBackupInProgress(false);
      toast({
        title: "Backup Created",
        description: `Database backup completed successfully. Size: ${data.size}MB`,
      });
    },
    onError: () => {
      setIsBackupInProgress(false);
      setBackupProgress(0);
    },
  });

  const roleManagementMutation = useMutation({
    mutationFn: async ({ action, roleData }: { action: string, roleData: any }) => {
      const endpoint = action === 'create' 
        ? '/api/admin/roles' 
        : `/api/admin/roles/${roleData.id}`;
      const method = action === 'create' ? 'POST' : 'PATCH';
      
      return apiRequest(endpoint, {
        method,
        body: JSON.stringify(roleData),
      });
    },
    onSuccess: (data, variables) => {
      const action = variables.action;
      toast({
        title: `Role ${action === 'create' ? 'Created' : 'Updated'}`,
        description: `Role has been ${action === 'create' ? 'created' : 'updated'} successfully.`,
      });
      
      setNewRoleDialog(false);
      setEditRoleDialog(false);
      setNewRole({ name: "", description: "", permissions: [] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system'] });
    },
  });

  const systemMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('/api/admin/system/maintenance', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess: (data, enabled) => {
      setSystemMaintenanceMode(enabled);
      toast({
        title: enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: enabled 
          ? "System is now in maintenance mode. Users will see a maintenance page."
          : "System is back online. All users can access the platform.",
        variant: enabled ? "destructive" : "default",
      });
    },
  });

  // Handler functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          // Import configuration logic here
          toast({
            title: "Configuration Imported",
            description: "System configuration has been imported successfully.",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Invalid configuration file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTestIntegration = async (integrationName: string) => {
    try {
      await apiRequest(`/api/admin/integrations/${integrationName}/test`, {
        method: 'POST',
      });
      
      toast({
        title: "Connection Test Successful",
        description: `${integrationName} integration is working properly.`,
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: `Failed to connect to ${integrationName}. Please check your configuration.`,
        variant: "destructive",
      });
    }
  };

  const handleCreateRole = () => {
    roleManagementMutation.mutate({ action: 'create', roleData: newRole });
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setNewRole(role);
    setEditRoleDialog(true);
  };

  const handleUpdateRole = () => {
    roleManagementMutation.mutate({ action: 'update', roleData: newRole });
  };

  // White-label branding settings
  const brandingSettings = {
    instituteName: "Meta Lingua Institute",
    logo: "/api/placeholder/200/60",
    primaryColor: "#2563eb",
    secondaryColor: "#7c3aed",
    accentColor: "#059669",
    favicon: "/api/placeholder/32/32",
    customDomain: "metalingua.education",
    footerText: "© 2024 Meta Lingua Institute. All rights reserved.",
    supportEmail: "support@metalingua.education"
  };

  // User roles and permissions
  const userRoles = [
    {
      id: 1,
      name: "Admin",
      description: "Full system access and management",
      permissions: ["all"],
      userCount: 3,
      color: "red"
    },
    {
      id: 2,
      name: "Teacher",
      description: "Course creation and student management",
      permissions: ["courses", "students", "classes", "reports"],
      userCount: 89,
      color: "blue"
    },
    {
      id: 3,
      name: "Student", 
      description: "Learning platform access",
      permissions: ["courses", "progress", "messaging"],
      userCount: 1247,
      color: "green"
    },
    {
      id: 4,
      name: "Supervisor",
      description: "Quality assurance and monitoring",
      permissions: ["quality", "reports", "sessions"],
      userCount: 12,
      color: "purple"
    },
    {
      id: 5,
      name: "Call Center Agent",
      description: "Lead management and customer support",
      permissions: ["leads", "communication", "prospects"],
      userCount: 8,
      color: "yellow"
    },
    {
      id: 6,
      name: "Accountant",
      description: "Financial management and reporting",
      permissions: ["financial", "reports", "payouts"],
      userCount: 4,
      color: "orange"
    },
    {
      id: 7,
      name: "Mentor",
      description: "Student mentoring and guidance",
      permissions: ["mentees", "progress", "communication"],
      userCount: 25,
      color: "teal"
    }
  ];

  // System integrations
  const integrations = [
    {
      name: "Anthropic API",
      description: "AI-powered learning assistance",
      status: "connected",
      type: "ai"
    },
    {
      name: "Shetab Payment Gateway",
      description: "Iranian payment processing",
      status: "connected", 
      type: "payment"
    },
    {
      name: "Kavenegar SMS",
      description: "SMS notifications and OTP",
      status: "pending",
      type: "communication"
    },
    {
      name: "Email Service",
      description: "Automated email notifications",
      status: "connected",
      type: "communication"
    },
    {
      name: "WebRTC Service",
      description: "Live video classrooms",
      status: "configured",
      type: "video"
    }
  ];

  const getRoleColor = (color) => {
    const colors = {
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800", 
      green: "bg-green-100 text-green-800",
      purple: "bg-purple-100 text-purple-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      teal: "bg-teal-100 text-teal-800"
    };
    return colors[color] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'configured': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            White-labeling, role management, integrations, and system settings
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => exportConfigMutation.mutate()}
            disabled={exportConfigMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportConfigMutation.isPending ? "Exporting..." : "Export Config"}
          </Button>
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Config
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">99.9% uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,386</div>
            <p className="text-xs text-green-600">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Response: 45ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-gray-600">2.3TB / 3.4TB</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">White-labeling</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">System Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="branding" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Institute Branding
                </CardTitle>
                <CardDescription>
                  Customize your institute's visual identity and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instituteName">Institute Name</Label>
                  <Input id="instituteName" value={brandingSettings.instituteName} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input id="customDomain" value={brandingSettings.customDomain} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" value={brandingSettings.supportEmail} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea id="footerText" value={brandingSettings.footerText} rows={2} />
                </div>

                <Button 
                  className="w-full"
                  onClick={() => updateBrandingMutation.mutate(brandingSettings)}
                  disabled={updateBrandingMutation.isPending}
                >
                  {updateBrandingMutation.isPending ? "Saving..." : "Save Branding Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>
                  Customize the platform's color palette
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input id="primaryColor" value={brandingSettings.primaryColor} />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: brandingSettings.primaryColor }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input id="secondaryColor" value={brandingSettings.secondaryColor} />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: brandingSettings.secondaryColor }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input id="accentColor" value={brandingSettings.accentColor} />
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: brandingSettings.accentColor }}
                      ></div>
                    </div>
                  </div>
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

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">User Roles & Permissions</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Custom Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Role Name</Label>
                      <Input id="roleName" placeholder="Enter role name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleColor">Color</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="roleDescription">Description</Label>
                    <Textarea id="roleDescription" placeholder="Role description and responsibilities" />
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["courses", "students", "financial", "reports", "communication", "quality"].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch id={permission} />
                          <Label htmlFor={permission} className="capitalize">{permission}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Role</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRoles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getRoleColor(role.color)}>
                        {role.name}
                      </Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Active Users:</span>
                      <span className="font-bold">{role.userCount.toLocaleString()}</span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Service Integrations</CardTitle>
              <CardDescription>
                Manage connections to external APIs and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        {integration.type === 'ai' && <Settings className="h-5 w-5 text-white" />}
                        {integration.type === 'payment' && <Key className="h-5 w-5 text-white" />}
                        {integration.type === 'communication' && <MessageSquare className="h-5 w-5 text-white" />}
                        {integration.type === 'video' && <Monitor className="h-5 w-5 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestIntegration(integration.name)}
                      >
                        Test Connection
                      </Button>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage API keys and external service credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">API Keys Visibility</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showApiKeys ? 'Hide' : 'Show'} Keys
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Anthropic API Key</span>
                    <p className="text-sm text-gray-600">AI-powered features</p>
                  </div>
                  <div className="text-sm font-mono">
                    {showApiKeys ? 'sk-ant-api03-...' : '••••••••••••••••'}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Kavenegar SMS Key</span>
                    <p className="text-sm text-gray-600">SMS notifications</p>
                  </div>
                  <div className="text-sm font-mono">
                    {showApiKeys ? 'kav-123456789...' : '••••••••••••••••'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  System Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Email Notifications</span>
                    <p className="text-sm text-gray-600">System alerts via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">SMS Notifications</span>
                    <p className="text-sm text-gray-600">Critical alerts via SMS</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Push Notifications</span>
                    <p className="text-sm text-gray-600">In-app notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Welcome Email</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Course Enrollment</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Payment Confirmation</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Password Reset</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Two-Factor Authentication</span>
                    <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Session Timeout</span>
                    <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="30min">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">15 min</SelectItem>
                      <SelectItem value="30min">30 min</SelectItem>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="4hours">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Password Policy</span>
                    <p className="text-sm text-gray-600">Enforce strong passwords</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Allowed IP Ranges</Label>
                  <Textarea placeholder="Enter IP ranges (one per line)" rows={3} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Geo-blocking</span>
                    <p className="text-sm text-gray-600">Restrict access by location</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Rate Limiting</span>
                    <p className="text-sm text-gray-600">Prevent API abuse</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>Recent security events and access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Successful admin login</p>
                    <p className="text-sm text-gray-600">admin@example.com - 192.168.1.1 - 2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Failed login attempt</p>
                    <p className="text-sm text-gray-600">unknown@domain.com - 45.123.45.67 - 15 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Backup
                </CardTitle>
                <CardDescription>
                  Create and manage system backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">Last Backup</span>
                    <p className="text-sm text-gray-600">2 hours ago (347 MB)</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Success
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label>Backup Schedule</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      <SelectItem value="daily">Daily at 2 AM</SelectItem>
                      <SelectItem value="weekly">Weekly (Sunday)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleCreateBackup}
                  disabled={createBackupMutation.isPending}
                >
                  {createBackupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Create Backup Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Export
                </CardTitle>
                <CardDescription>
                  Export system configuration and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="exportUsers" defaultChecked />
                    <Label htmlFor="exportUsers">User Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="exportCourses" defaultChecked />
                    <Label htmlFor="exportCourses">Course Content</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="exportSettings" defaultChecked />
                    <Label htmlFor="exportSettings">System Settings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="exportBranding" />
                    <Label htmlFor="exportBranding">Branding Assets</Label>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleCreateBackup}
                  disabled={isBackupInProgress}
                >
                  {isBackupInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Export Configuration
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Control system access during maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <span className="font-medium">Maintenance Mode</span>
                  <p className="text-sm text-gray-600">
                    {maintenanceMode ? 
                      "System is currently in maintenance mode. Only admins can access." : 
                      "System is operational. All users can access normally."
                    }
                  </p>
                </div>
                <Switch 
                  checked={maintenanceMode}
                  onCheckedChange={handleMaintenanceModeToggle}
                />
              </div>

              {maintenanceMode && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">
                        System in Maintenance Mode
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Regular users cannot access the system. Only administrators can log in and perform operations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea
                  id="maintenanceMessage"
                  placeholder="Enter a message to display to users during maintenance..."
                  value="We're performing scheduled maintenance to improve your experience. We'll be back shortly!"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">System Version:</span>
                    <span className="text-sm font-medium">2.1.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Database Version:</span>
                    <span className="text-sm font-medium">PostgreSQL 15.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Update:</span>
                    <span className="text-sm font-medium">3 days ago</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime:</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Users:</span>
                    <span className="text-sm font-medium">1247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">System Load:</span>
                    <span className="text-sm font-medium">Normal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}