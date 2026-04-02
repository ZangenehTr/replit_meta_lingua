import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Database, Settings, AlertTriangle, Loader2, Download, FileText } from "lucide-react";

interface Props {
  maintenanceMode: boolean;
  onMaintenanceModeToggle: () => void;
  isBackupInProgress: boolean;
  onCreateBackup: () => void;
  isPendingBackup: boolean;
  onExportConfiguration?: () => void;
  isExportInProgress?: boolean;
}

export function SystemMaintenanceTab({ maintenanceMode, onMaintenanceModeToggle, isBackupInProgress, onCreateBackup, isPendingBackup, onExportConfiguration, isExportInProgress }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />System Backup</CardTitle><CardDescription>Create and manage system backups</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div><span className="font-medium">Last Backup</span><p className="text-sm text-gray-600">2 hours ago (347 MB)</p></div>
              <Badge variant="outline" className="text-green-600 border-green-600">Success</Badge>
            </div>
            <div className="space-y-2">
              <Label>Backup Schedule</Label>
              <Select defaultValue="daily">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[["manual", "Manual Only"], ["daily", "Daily at 2 AM"], ["weekly", "Weekly (Sunday)"], ["monthly", "Monthly"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={onCreateBackup} disabled={isPendingBackup}>
              {isPendingBackup ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />Creating...</> : <><Download className="me-2 h-4 w-4" />Create Backup Now</>}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />System Export</CardTitle><CardDescription>Export system configuration and data</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[["exportUsers", "User Data"], ["exportCourses", "Course Content"], ["exportSettings", "System Settings"], ["exportBranding", "Branding Assets"]].map(([id, label]) => (
                <div key={id} className="flex items-center space-x-2">
                  <input type="checkbox" id={id} defaultChecked={id !== "exportBranding"} />
                  <Label htmlFor={id}>{label}</Label>
                </div>
              ))}
            </div>
            <Button className="w-full" variant="outline" onClick={onExportConfiguration} disabled={isExportInProgress || isBackupInProgress}>
              {isExportInProgress ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />Exporting...</> : <><FileText className="me-2 h-4 w-4" />Export Configuration</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Maintenance Mode</CardTitle><CardDescription>Control system access during maintenance</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <span className="font-medium">Maintenance Mode</span>
              <p className="text-sm text-gray-600">{maintenanceMode ? "System is in maintenance mode. Only admins can access." : "System is operational."}</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={onMaintenanceModeToggle} />
          </div>
          {maintenanceMode && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">System in Maintenance Mode</h4>
                  <p className="text-sm text-amber-700 mt-1">Regular users cannot access the system.</p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
            <Textarea id="maintenanceMessage" placeholder="Message to display to users during maintenance..." defaultValue="We're performing scheduled maintenance. We'll be back shortly!" rows={3} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>System Information</CardTitle><CardDescription>Current system status</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[["System Version", "2.1.4"], ["Database Version", "PostgreSQL 15.3"], ["Last Update", "3 days ago"], ["Uptime", "99.9%"], ["Active Users", "1247"], ["System Load", "Normal"]].map(([label, value]) => (
              <div key={label} className="flex justify-between"><span className="text-sm text-gray-600">{label}:</span><span className="text-sm font-medium">{value}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
