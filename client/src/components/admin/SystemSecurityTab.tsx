import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";

export function SystemSecurityTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><span className="font-medium">Two-Factor Authentication</span><p className="text-sm text-gray-600">Require 2FA for admin accounts</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><span className="font-medium">Session Timeout</span><p className="text-sm text-gray-600">Auto-logout after inactivity</p></div>
              <Select defaultValue="30min">
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{["15min", "30min", "1hour", "4hours"].map((v) => <SelectItem key={v} value={v}>{v.replace("min", " min").replace("hour", " hour")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div><span className="font-medium">Password Policy</span><p className="text-sm text-gray-600">Enforce strong passwords</p></div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Access Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Allowed IP Ranges</Label><Textarea placeholder="Enter IP ranges (one per line)" rows={3} /></div>
            {[["Geo-blocking", "Restrict access by location", false], ["Rate Limiting", "Prevent API abuse", true]].map(([label, desc, checked]) => (
              <div key={label as string} className="flex items-center justify-between">
                <div><span className="font-medium">{label as string}</span><p className="text-sm text-gray-600">{desc as string}</p></div>
                <Switch defaultChecked={checked as boolean} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Security Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div><p className="font-medium">Successful admin login</p><p className="text-sm text-gray-600">admin@example.com - 2 minutes ago</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div><p className="font-medium">Failed login attempt</p><p className="text-sm text-gray-600">unknown@domain.com - 15 minutes ago</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
