import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  Mail, 
  Bell, 
  Clock, 
  Send, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Copy,
  Calendar,
  User,
  Phone,
  Video,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NotificationTemplate {
  id: number;
  name: string;
  type: 'sms' | 'email';
  trigger: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'teacher_assignment' | 'cancellation' | 'rescheduling' | 'follow_up';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface NotificationLog {
  id: number;
  templateId: number;
  templateName: string;
  recipientType: 'student' | 'teacher';
  recipientName: string;
  recipientContact: string;
  type: 'sms' | 'email';
  status: 'sent' | 'failed' | 'pending';
  sentAt?: string;
  trialLessonId: number;
  errorMessage?: string;
}

interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminderHours: number[];
  autoSendEnabled: boolean;
  kavenegar: {
    apiKey?: string;
    sender: string;
    enabled: boolean;
  };
  email: {
    smtpHost?: string;
    smtpPort?: number;
    username?: string;
    fromAddress: string;
    enabled: boolean;
  };
}

const templateSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters"),
  type: z.enum(['sms', 'email']),
  trigger: z.enum(['booking_confirmation', 'reminder_24h', 'reminder_2h', 'teacher_assignment', 'cancellation', 'rescheduling', 'follow_up']),
  subject: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  isActive: z.boolean()
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className }: NotificationSystemProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [activeTab, setActiveTab] = useState("templates");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ['/api/notifications/templates'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/templates');
      return response.json();
    }
  });

  // Fetch notification logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<NotificationLog[]>({
    queryKey: ['/api/notifications/logs'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/logs?limit=100');
      return response.json();
    }
  });

  // Fetch notification settings
  const { data: settings, isLoading: settingsLoading } = useQuery<NotificationSettings>({
    queryKey: ['/api/notifications/settings'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/settings');
      return response.json();
    }
  });

  // Template form
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      type: "sms",
      trigger: "booking_confirmation",
      subject: "",
      content: "",
      isActive: true
    }
  });

  // Create/update template mutation
  const templateMutation = useMutation({
    mutationFn: async (data: TemplateFormData & { id?: number }) => {
      const url = data.id ? `/api/notifications/templates/${data.id}` : '/api/notifications/templates';
      const method = data.id ? 'PUT' : 'POST';
      
      return apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "Notification template has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/templates'] });
      setTemplateDialogOpen(false);
      templateForm.reset();
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error saving template",
        description: error.message || "Failed to save notification template.",
        variant: "destructive"
      });
    }
  });

  // Send test notification mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ templateId, recipient }: { templateId: number; recipient: string }) => {
      return apiRequest('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ templateId, recipient })
      });
    },
    onSuccess: () => {
      toast({
        title: "Test notification sent",
        description: "Test message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to send test notification.",
        variant: "destructive"
      });
    }
  });

  // Toggle template status mutation
  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ templateId, isActive }: { templateId: number; isActive: boolean }) => {
      return apiRequest(`/api/notifications/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/templates'] });
    }
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get trigger display name
  const getTriggerDisplayName = (trigger: string) => {
    const triggerMap: Record<string, string> = {
      booking_confirmation: 'Booking Confirmation',
      reminder_24h: '24 Hour Reminder',
      reminder_2h: '2 Hour Reminder',
      teacher_assignment: 'Teacher Assignment',
      cancellation: 'Cancellation',
      rescheduling: 'Rescheduling',
      follow_up: 'Follow Up'
    };
    return triggerMap[trigger] || trigger;
  };

  // Handle edit template
  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    templateForm.reset({
      name: template.name,
      type: template.type,
      trigger: template.trigger,
      subject: template.subject || "",
      content: template.content,
      isActive: template.isActive
    });
    setTemplateDialogOpen(true);
  };

  // Handle template submit
  const handleTemplateSubmit = (data: TemplateFormData) => {
    templateMutation.mutate({
      ...data,
      id: selectedTemplate?.id
    });
  };

  // Available template variables
  const templateVariables = [
    '{{studentName}}',
    '{{teacherName}}',
    '{{lessonDate}}',
    '{{lessonTime}}',
    '{{lessonType}}',
    '{{targetLanguage}}',
    '{{studentPhone}}',
    '{{studentEmail}}',
    '{{schoolName}}',
    '{{schoolAddress}}',
    '{{schoolPhone}}',
    '{{confirmationLink}}',
    '{{cancelLink}}',
    '{{rescheduleLink}}'
  ];

  const recentLogs = logs.slice(0, 10);

  if (templatesLoading || logsLoading || settingsLoading) {
    return (
      <div className="space-y-4" data-testid="notifications-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="notification-system">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Notification System</h2>
          <p className="text-muted-foreground">
            Manage SMS and email templates for trial lesson communications
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              templateForm.reset();
              setTemplateDialogOpen(true);
            }}
            data-testid="create-template"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            New Template
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setSettingsDialogOpen(true)}
            data-testid="notification-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-active-templates">
              {templates.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-messages-today">
              {logs.filter(log => 
                log.sentAt && 
                format(new Date(log.sentAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Notifications sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-success-rate">
              {logs.length > 0 
                ? Math.round((logs.filter(log => log.status === 'sent').length / logs.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Delivery success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-failed-messages">
              {logs.filter(log => log.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" data-testid="tab-templates">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            Recent Logs ({recentLogs.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notification templates found</p>
                    <Button 
                      className="mt-2"
                      onClick={() => setTemplateDialogOpen(true)}
                    >
                      Create your first template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          <Badge 
                            className={`${
                              template.type === 'sms' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {template.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {getTriggerDisplayName(template.trigger)}
                          </Badge>
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={(isActive) => 
                              toggleTemplateMutation.mutate({ templateId: template.id, isActive })
                            }
                            data-testid={`toggle-template-${template.id}`}
                          />
                        </div>
                        
                        {template.subject && (
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Subject: {template.subject}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.content.length > 150 
                            ? `${template.content.substring(0, 150)}...`
                            : template.content
                          }
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Created: {format(new Date(template.createdAt), 'MMM dd, yyyy')}</span>
                          <span>Used: {template.usageCount} times</span>
                          {template.lastUsed && (
                            <span>Last used: {formatDistanceToNow(new Date(template.lastUsed), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setPreviewDialogOpen(true);
                          }}
                          data-testid={`preview-template-${template.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                          data-testid={`edit-template-${template.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(template.content);
                            toast({ title: "Template copied to clipboard" });
                          }}
                          data-testid={`copy-template-${template.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notification Logs</CardTitle>
              <CardDescription>Latest sent messages and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                      <TableCell className="font-medium">
                        {log.templateName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.recipientName}</div>
                          <div className="text-sm text-gray-500">{log.recipientContact}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          log.type === 'sms' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }>
                          {log.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.sentAt ? format(new Date(log.sentAt), 'MMM dd, HH:mm') : 'Pending'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`view-log-${log.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Usage</CardTitle>
                <CardDescription>Most frequently used templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .slice(0, 5)
                    .map((template, index) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-gray-500">{getTriggerDisplayName(template.trigger)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{template.usageCount}</p>
                          <p className="text-xs text-gray-500">uses</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
                <CardDescription>Success rate by notification type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span>SMS Messages</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {logs.filter(l => l.type === 'sms' && l.status === 'sent').length}/
                        {logs.filter(l => l.type === 'sms').length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {logs.filter(l => l.type === 'sms').length > 0
                          ? Math.round((logs.filter(l => l.type === 'sms' && l.status === 'sent').length / logs.filter(l => l.type === 'sms').length) * 100)
                          : 0}% success
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span>Email Messages</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {logs.filter(l => l.type === 'email' && l.status === 'sent').length}/
                        {logs.filter(l => l.type === 'email').length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {logs.filter(l => l.type === 'email').length > 0
                          ? Math.round((logs.filter(l => l.type === 'email' && l.status === 'sent').length / logs.filter(l => l.type === 'email').length) * 100)
                          : 0}% success
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Creation/Edit Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Create or edit notification templates for trial lesson communications
            </DialogDescription>
          </DialogHeader>
          
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Trial Lesson Confirmation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={templateForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="trigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Event *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="When should this be sent?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                        <SelectItem value="reminder_24h">24 Hour Reminder</SelectItem>
                        <SelectItem value="reminder_2h">2 Hour Reminder</SelectItem>
                        <SelectItem value="teacher_assignment">Teacher Assignment</SelectItem>
                        <SelectItem value="cancellation">Cancellation</SelectItem>
                        <SelectItem value="rescheduling">Rescheduling</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {templateForm.watch('type') === 'email' && (
                <FormField
                  control={templateForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Trial Lesson Confirmation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={templateForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Content *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Hi {{studentName}}, your trial lesson is confirmed for {{lessonDate}} at {{lessonTime}}..."
                            rows={8}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Available Variables</Label>
                  <ScrollArea className="h-48 mt-2 border rounded-md p-3">
                    <div className="space-y-1">
                      {templateVariables.map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          className="block w-full text-left text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                          onClick={() => {
                            const currentContent = templateForm.getValues('content');
                            templateForm.setValue('content', currentContent + ' ' + variable);
                          }}
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <FormField
                control={templateForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Template</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this template to be used for automatic notifications
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <div>
                  {selectedTemplate && (
                    <div className="space-x-2">
                      <Input
                        placeholder="Test recipient (phone/email)"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        className="w-48 inline-block"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!testRecipient || sendTestMutation.isPending}
                        onClick={() => sendTestMutation.mutate({ 
                          templateId: selectedTemplate.id, 
                          recipient: testRecipient 
                        })}
                      >
                        {sendTestMutation.isPending ? "Sending..." : "Send Test"}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTemplateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={templateMutation.isPending}
                  >
                    {templateMutation.isPending ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}