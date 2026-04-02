import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, Clock } from "lucide-react";

interface PushNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  channels: string[];
  status: "draft" | "scheduled" | "sent";
  sentAt?: string;
  deliveryStats?: { sent: number; delivered: number; clicked: number };
}

interface NotificationForm {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  targetAudience: string;
  channels: string[];
  status: "draft" | "scheduled" | "sent";
  testPhoneNumber: string;
}

interface Props {
  notifications: PushNotification[];
  isLoading: boolean;
  form: NotificationForm;
  onFormChange: (form: NotificationForm) => void;
  onSend: () => void;
  isSending: boolean;
}

export function NotificationsTab({ notifications, isLoading, form, onFormChange, onSend, isSending }: Props) {
  const toggleChannel = (channel: string, checked: boolean) => {
    const channels = checked
      ? [...form.channels, channel]
      : form.channels.filter((c) => c !== channel);
    onFormChange({ ...form, channels });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Push notifications sent to users</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No notifications sent yet</div>
              ) : notifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{notification.title}</h4>
                    <Badge variant={notification.status === "sent" ? "default" : "secondary"}>{notification.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>to {notification.targetAudience}</span>
                    <span>{notification.sentAt ? new Date(notification.sentAt).toLocaleString() : "Not sent"}</span>
                  </div>
                  {notification.deliveryStats && (
                    <div className="mt-2 pt-2 border-t flex justify-between text-xs">
                      <span>Sent: {notification.deliveryStats.sent}</span>
                      <span>Delivered: {notification.deliveryStats.delivered}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
          <CardDescription>Create and send push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Title</Label>
            <Input placeholder="Notification title..." value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label className="mb-2 block">Message</Label>
            <Textarea placeholder="Notification message..." value={form.message} onChange={(e) => onFormChange({ ...form, message: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Target Audience</Label>
              <Select value={form.targetAudience} onValueChange={(value) => onFormChange({ ...form, targetAudience: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users">All Users</SelectItem>
                  <SelectItem value="students">Students Only</SelectItem>
                  <SelectItem value="teachers">Teachers Only</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Type</Label>
              <Select value={form.type} onValueChange={(value: NotificationForm["type"]) => onFormChange({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Delivery Channels</Label>
            <div className="space-y-2">
              {[["push", "Push Notification"], ["email", "Email"], ["sms", "SMS (via Kavenegar)"]].map(([channel, label]) => (
                <div key={channel} className="flex items-center gap-2">
                  <Checkbox id={`channel-${channel}`} checked={form.channels.includes(channel)} onCheckedChange={(checked) => toggleChannel(channel, !!checked)} />
                  <label htmlFor={`channel-${channel}`} className="text-sm">{label}</label>
                </div>
              ))}
            </div>
          </div>
          {form.channels.includes("sms") && (
            <div>
              <Label className="mb-2 block">Test Phone Number (for SMS)</Label>
              <Input placeholder="+98912345678" value={form.testPhoneNumber} onChange={(e) => onFormChange({ ...form, testPhoneNumber: e.target.value })} />
              <p className="text-sm text-gray-500 mt-1">Enter a phone number to test SMS delivery</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onSend} disabled={!form.title || !form.message || isSending}>
              <Send className="h-4 w-4 me-2" />
              {isSending ? "Sending..." : "Send Now"}
            </Button>
            <Button variant="outline">
              <Clock className="h-4 w-4 me-2" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
