import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TestTube
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

interface PlacementTest {
  id: number;
  question: string;
  type: 'multiple_choice' | 'open_ended' | 'audio' | 'writing';
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skill: 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | 'vocabulary';
}

export default function SMSSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [selectedTest, setSelectedTest] = useState<PlacementTest | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isEditingTest, setIsEditingTest] = useState(false);

  // Fetch SMS templates
  const { data: smsTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/admin/sms-templates'],
  });

  // Fetch placement test questions
  const { data: placementTests = [], isLoading: testsLoading } = useQuery({
    queryKey: ['/api/admin/placement-tests'],
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SMS & Placement Test Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure SMS notifications and placement test questions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Test SMS
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

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
              Test Questions
            </CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Placement test bank
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sms-templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sms-templates">SMS Templates</TabsTrigger>
          <TabsTrigger value="placement-tests">Placement Tests</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="kavenegar">Kavenegar Settings</TabsTrigger>
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

        <TabsContent value="placement-tests">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Placement Test Question Bank</CardTitle>
                  <CardDescription>
                    Manage questions and answers for student placement testing
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Question Categories */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'].map((skill) => (
                    <Card key={skill} className="text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {skill === 'reading' ? '24' : skill === 'writing' ? '18' : skill === 'listening' ? '22' : 
                           skill === 'speaking' ? '16' : skill === 'grammar' ? '28' : '24'}
                        </div>
                        <p className="text-xs text-gray-600 capitalize">{skill}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Sample Questions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Questions</h3>
                  
                  {[
                    {
                      id: 1,
                      question: "مترادف کلمه 'زیبا' کدام است؟ (What is the synonym of 'beautiful'?)",
                      type: "multiple_choice",
                      skill: "vocabulary",
                      difficulty: "beginner",
                      options: ["قشنگ", "زشت", "بزرگ", "کوچک"],
                      correctAnswer: "قشنگ",
                      points: 2
                    },
                    {
                      id: 2,
                      question: "Listen to the audio and answer: What did Ahmad do yesterday?",
                      type: "audio",
                      skill: "listening",
                      difficulty: "intermediate", 
                      points: 3
                    },
                    {
                      id: 3,
                      question: "Write a paragraph about your family in Persian (minimum 50 words)",
                      type: "writing",
                      skill: "writing",
                      difficulty: "advanced",
                      points: 5
                    }
                  ].map((question) => (
                    <Card key={question.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={`text-xs ${
                                question.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                question.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.skill}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-gray-500">{question.points} points</span>
                            </div>
                            
                            <p className="font-medium mb-2">{question.question}</p>
                            
                            {question.options && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {question.options.map((option, idx) => (
                                  <div key={idx} className={`text-sm p-2 border rounded ${
                                    option === question.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                  }`}>
                                    {option} {option === question.correctAnswer && '✓'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <TestTube className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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