import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  MessageSquare, 
  Settings, 
  Send, 
  Clock, 
  Users,
  CheckCircle,
  AlertCircle,
  Phone,
  Plus,
  Edit,
  TestTube,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SMSTemplate {
  id: number;
  event: string;
  recipient: string;
  template: string;
  variables: string[];
  isActive: boolean;
  language: 'persian' | 'english' | 'both';
}

interface KavenegarSettings {
  apiKey: string;
  isConfigured: boolean;
  senderNumber: string;
  dailyLimit: number;
  isEnabled: boolean;
}

export default function SMSSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { language, isRTL, direction } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [kavenegarData, setKavenegarData] = useState({
    senderNumber: '',
    dailyLimit: 1000,
    isEnabled: false
  });

  // Fetch SMS templates
  const { data: smsTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/admin/sms-templates'],
  });

  // Fetch Kavenegar settings
  const { data: kavenegarSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/kavenegar-settings'],
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (kavenegarSettings) {
      setKavenegarData({
        senderNumber: kavenegarSettings.senderNumber || '',
        dailyLimit: kavenegarSettings.dailyLimit || 1000,
        isEnabled: kavenegarSettings.isEnabled || false
      });
    }
  }, [kavenegarSettings]);

  // Save Kavenegar settings mutation
  const saveKavenegarMutation = useMutation({
    mutationFn: async (data: typeof kavenegarData) => {
      return await apiRequest('/api/admin/kavenegar-settings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: t('common:toast.settingsSaved'),
        description: result.message || "Kavenegar settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kavenegar-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.saveFailed'),
        description: error.message || "Failed to save Kavenegar settings",
        variant: "destructive",
      });
    },
  });

  const eventTypes = [
    { key: 'enrollment', label: 'Student Enrollment', recipients: ['Student', 'Parent', 'Teacher'] },
    { key: 'session_reminder', label: 'Session Reminder', recipients: ['Student', 'Teacher'] },
    { key: 'homework_assigned', label: 'Homework Assigned', recipients: ['Student', 'Parent'] },
    { key: 'homework_overdue', label: 'Homework Overdue', recipients: ['Student', 'Parent'] },
    { key: 'payment_due', label: 'Payment Due', recipients: ['Student', 'Parent'] },
    { key: 'payment_received', label: 'Payment Received', recipients: ['Student', 'Parent'] },
    { key: 'teacher_evaluation', label: 'Teacher Evaluation Complete', recipients: ['Teacher'] },
    { key: 'progress_report', label: 'Progress Report Ready', recipients: ['Student', 'Parent'] },
    { key: 'session_cancelled', label: 'Session Cancelled', recipients: ['Student', 'Teacher'] },
    { key: 'absence_warning', label: 'Absence Warning', recipients: ['Student', 'Parent'] },
    { key: 'certificate_ready', label: 'Certificate Ready', recipients: ['Student', 'Parent'] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('admin:smsSettings.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('common:configureService')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/sms-test'}>
            <TestTube className="h-4 w-4 mr-2" />
            {t('common:testSMS')}
          </Button>
          <Button 
            onClick={() => saveKavenegarMutation.mutate(kavenegarData)}
            disabled={saveKavenegarMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveKavenegarMutation.isPending ? t('common:saving') : t('common:saveSettings')}
          </Button>
        </div>
      </div>

      {/* Kavenegar Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('admin:smsSettings.kavenegarSettings')}
          </CardTitle>
          <CardDescription>
            {t('common:configureSMSService')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>API Key Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {kavenegarSettings?.isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Configured</span>
                    <Badge variant="outline">{kavenegarSettings?.apiKey}</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Not Configured</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                API key is set via environment variable for security
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">Sender Configuration</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Sender number and API key are configured in <strong>Third Party Settings → SMS</strong>. 
                Use this page to manage SMS templates and daily limits only.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.href = '/admin/iranian-compliance-settings'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Sender & API
              </Button>
            </div>

            <div>
              <Label htmlFor="dailyLimit">Daily SMS Limit</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={kavenegarData.dailyLimit}
                onChange={(e) => setKavenegarData({ ...kavenegarData, dailyLimit: parseInt(e.target.value) || 1000 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="smsEnabled"
                checked={kavenegarData.isEnabled}
                onCheckedChange={(checked) => setKavenegarData({ ...kavenegarData, isEnabled: checked })}
              />
              <Label htmlFor="smsEnabled">Enable SMS Service</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SMS Sent Today
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +23% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Delivery Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4%</div>
            <p className="text-xs text-muted-foreground">
              Excellent delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Templates
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              11 events covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Balance
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kavenegarSettings?.balance || '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              SMS credits remaining
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sms-templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sms-templates">SMS Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="sms-templates">
          <Card>
            <CardHeader>
              <CardTitle>SMS Event Templates</CardTitle>
              <CardDescription>
                Configure SMS messages for different events and user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventTypes.map((eventType) => (
                  <Card key={eventType.key} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-medium">{eventType.label}</h3>
                          <div className="flex space-x-2">
                            {eventType.recipients.map((recipient) => (
                              <Badge key={recipient} variant="outline" className="text-xs">
                                {recipient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Switch defaultChecked />
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        {eventType.recipients.map((recipient) => (
                          <div key={recipient} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Template for {recipient}</Label>
                              <Badge className="text-xs bg-green-100 text-green-800">Persian/English</Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-gray-600">Persian Template</Label>
                                <textarea 
                                  className="w-full text-sm border rounded p-2 bg-white" 
                                  rows={2}
                                  placeholder="Persian SMS template..."
                                  defaultValue={getDefaultTemplate(eventType.key, recipient, 'persian')}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">English Template</Label>
                                <textarea 
                                  className="w-full text-sm border rounded p-2 bg-white" 
                                  rows={2}
                                  placeholder="English SMS template..."
                                  defaultValue={getDefaultTemplate(eventType.key, recipient, 'english')}
                                />
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Available variables: {'{student_name}'}, {'{course_name}'}, {'{date}'}, {'{time}'}, {'{teacher_name}'}, {'{amount}'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>SMS Automation Rules</CardTitle>
              <CardDescription>
                Configure when and how SMS messages are sent automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Session Reminder Timing</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>24 hours before session</option>
                      <option>12 hours before session</option>
                      <option>2 hours before session</option>
                      <option>1 hour before session</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Payment Reminder Frequency</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>3 days before due date</option>
                      <option>1 day before due date</option>
                      <option>On due date</option>
                      <option>1 day after due date</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Homework Overdue Alerts</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>1 day after deadline</option>
                      <option>3 days after deadline</option>
                      <option>1 week after deadline</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Absence Tracking</Label>
                    <select className="w-full mt-2 p-2 border rounded">
                      <option>After 2 consecutive absences</option>
                      <option>After 3 consecutive absences</option>
                      <option>After 5 total absences</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-6">
                  <Switch defaultChecked />
                  <Label>Enable automatic SMS sending</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kavenegar">
          <Card>
            <CardHeader>
              <CardTitle>Kavenegar SMS Service Configuration</CardTitle>
              <CardDescription>
                Iranian SMS service integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>API Key</Label>
                    <Input type="password" placeholder="Kavenegar API Key" />
                  </div>
                  <div>
                    <Label>Sender Number</Label>
                    <Input placeholder="10008663" />
                  </div>
                  <div>
                    <Label>SMS Template ID</Label>
                    <Input placeholder="verify" />
                  </div>
                  <div>
                    <Label>Daily SMS Limit</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Test SMS Configuration</Label>
                  <div className="flex space-x-2">
                    <Input placeholder="Test phone number (09xxxxxxxxx)" />
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                </div>
                
                <Button className="w-full">Save Kavenegar Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function for default templates
function getDefaultTemplate(event: string, recipient: string, language: 'persian' | 'english'): string {
  const templates: Record<string, Record<string, Record<string, string>>> = {
    enrollment: {
      Student: {
        persian: "سلام {student_name}، با موفقیت در دوره {course_name} ثبت نام شدید. تاریخ شروع: {date}",
        english: "Hello {student_name}, you have successfully enrolled in {course_name}. Start date: {date}"
      },
      Parent: {
        persian: "فرزندتان {student_name} در دوره {course_name} ثبت نام شده است.",
        english: "Your child {student_name} has been enrolled in {course_name}."
      },
      Teacher: {
        persian: "دانش آموز جدید {student_name} به کلاس {course_name} شما اضافه شد.",
        english: "New student {student_name} has been added to your {course_name} class."
      }
    },
    session_reminder: {
      Student: {
        persian: "یادآوری: کلاس {course_name} فردا ساعت {time} با استاد {teacher_name}",
        english: "Reminder: Your {course_name} class is tomorrow at {time} with {teacher_name}"
      },
      Teacher: {
        persian: "یادآوری: کلاس {course_name} فردا ساعت {time} با دانش آموز {student_name}",
        english: "Reminder: Your {course_name} class is tomorrow at {time} with {student_name}"
      }
    },
    teacher_evaluation: {
      Teacher: {
        persian: "ارزیابی کیفیت تدریس شما آماده شد. لطفا پنل معلم را مشاهده کنید.",
        english: "Your teaching quality evaluation is ready. Please check your teacher portal."
      }
    }
  };
  
  return templates[event]?.[recipient]?.[language] || `Template for ${event} - ${recipient} (${language})`;
}