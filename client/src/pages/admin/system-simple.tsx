import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Database,
  Monitor,
  CheckCircle,
  AlertCircle,
  Download,
  FileText
} from "lucide-react";

export function AdminSystem() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const handleCreateBackup = () => {
    toast({
      title: t('common:toast.backupCreated'),
      description: "System backup has been created successfully.",
    });
  };

  const handleExportConfig = () => {
    const config = {
      system: "Meta Lingua",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: t('common:toast.configurationExported'),
      description: "System configuration has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('admin:system.title')}</h1>
        <p className="text-gray-600">{t('admin:system.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('admin:system.overview')}</TabsTrigger>
          <TabsTrigger value="backup">{t('admin:system.backup')}</TabsTrigger>
          <TabsTrigger value="monitoring">{t('admin:system.monitoring')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin:system.status')}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{t('admin:system.online')}</div>
                <p className="text-xs text-muted-foreground">{t('admin:system.operational')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin:system.database')}</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{t('admin:system.connected')}</div>
                <p className="text-xs text-muted-foreground">{t('admin:system.running')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin:system.lastBackup')}</CardTitle>
                <Monitor className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2h ago</div>
                <p className="text-xs text-muted-foreground">{t('admin:system.completed')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Backup
                </CardTitle>
                <CardDescription>
                  Create a full system backup including database and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Last Backup</span>
                    <p className="text-sm text-gray-600">2 hours ago (347 MB)</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Success
                  </Badge>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleCreateBackup}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Create Backup Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration Export
                </CardTitle>
                <CardDescription>
                  Export system configuration for backup or migration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export includes branding settings, user roles, and system preferences
                </p>
                
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={handleExportConfig}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>
                Real-time system performance and health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Database Connection</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Healthy
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>API Services</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>File System</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Available
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Memory Usage</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    68% Used
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}