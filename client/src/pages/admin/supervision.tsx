import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  Video,
  ClipboardCheck,
  Star
} from "lucide-react";

export default function AdminSupervisionPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quality Assurance & Supervision
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Live session monitoring and quality control
          </p>
        </div>
        <Button>
          <Eye className="h-4 w-4 mr-2" />
          Start Live Monitoring
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessions Monitored Today
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Quality Score
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6/5.0</div>
            <p className="text-xs text-muted-foreground">
              +0.2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Issues Identified
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              -3 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Sessions</TabsTrigger>
          <TabsTrigger value="reports">Quality Reports</TabsTrigger>
          <TabsTrigger value="homework">Homework Review</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle>Live Session Monitoring</CardTitle>
              <CardDescription>
                Currently active sessions requiring supervision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((session) => (
                  <div key={session} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Live
                      </Badge>
                      <div>
                        <p className="font-medium">Persian Conversation - Level 2</p>
                        <p className="text-sm text-gray-500">Teacher: Ahmad Hosseini | Student: Sara Thompson</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        32 min
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Monitor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance Reports</CardTitle>
              <CardDescription>
                Session evaluation summaries and improvement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Quality reports and analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework">
          <Card>
            <CardHeader>
              <CardTitle>Standard Teacher Observation Sheet</CardTitle>
              <CardDescription>
                Professional quality assurance with automated SMS notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Active Observations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Active Observations</h3>
                  
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Ahmad Hosseini - Persian Conversation Level 2</p>
                          <p className="text-sm text-gray-500">Observer: Dr. Maryam Rezaei | Started: 2:30 PM</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                      </div>
                      
                      {/* Standard Observation Criteria */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Teaching Effectiveness</h4>
                          <div className="space-y-2">
                            {[
                              'Lesson preparation & structure',
                              'Cultural context integration',
                              'Student engagement techniques',
                              'Persian pronunciation guidance'
                            ].map((criteria, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <select className="text-xs border rounded px-2 py-1">
                                  <option value="">Rate</option>
                                  <option value="5">Excellent (5)</option>
                                  <option value="4">Good (4)</option>
                                  <option value="3">Average (3)</option>
                                  <option value="2">Needs Improvement (2)</option>
                                  <option value="1">Poor (1)</option>
                                </select>
                                <span className="text-xs text-gray-600">{criteria}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Professional Standards</h4>
                          <div className="space-y-2">
                            {[
                              'Punctuality & professionalism',
                              'Iranian cultural sensitivity',
                              'Student progress tracking',
                              'Technology integration'
                            ].map((criteria, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <select className="text-xs border rounded px-2 py-1">
                                  <option value="">Rate</option>
                                  <option value="5">Excellent (5)</option>
                                  <option value="4">Good (4)</option>
                                  <option value="3">Average (3)</option>
                                  <option value="2">Needs Improvement (2)</option>
                                  <option value="1">Poor (1)</option>
                                </select>
                                <span className="text-xs text-gray-600">{criteria}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Voice & Text Feedback */}
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Voice Feedback for Teacher</Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button size="sm" variant="outline">
                              🎤 Record Voice Message
                            </Button>
                            <span className="text-xs text-gray-500">Persian language feedback</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Written Feedback</Label>
                          <textarea 
                            className="w-full mt-2 p-3 border rounded-lg text-sm"
                            placeholder="Detailed feedback in Persian/English for teacher improvement..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            ⚡ SMS will be sent automatically to teacher upon completion
                          </div>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              // This would trigger SMS notification
                              alert("✅ Observation completed!\n📱 SMS sent to Ahmad Hosseini: 'Your quality evaluation is ready. Please check your teacher portal for detailed feedback and voice message.'");
                            }}
                          >
                            End Observation & Send SMS
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Completed Observations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Completed Observations</h3>
                  
                  {[
                    {
                      teacher: "Maryam Rahimi",
                      course: "Business Persian",
                      observer: "Dr. Ali Moradi",
                      score: 4.6,
                      date: "2024-01-15",
                      feedback: "Excellent cultural integration, needs improvement in time management"
                    },
                    {
                      teacher: "Ali Nouri",
                      course: "Persian Literature",
                      observer: "Dr. Sara Ahmadi",
                      score: 4.8,
                      date: "2024-01-14",
                      feedback: "Outstanding lesson structure and student engagement"
                    }
                  ].map((obs, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{obs.teacher} - {obs.course}</p>
                          <p className="text-sm text-gray-500">Observer: {obs.observer} | {obs.date}</p>
                          <p className="text-xs text-gray-600 mt-1">{obs.feedback}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{obs.score}/5.0</div>
                          <Badge className="bg-green-100 text-green-800">SMS Sent</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance Monitoring</CardTitle>
              <CardDescription>
                Track teaching quality and student feedback scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Ahmad Hosseini", score: 4.8, sessions: 45 },
                  { name: "Maryam Rahimi", score: 4.6, sessions: 38 },
                  { name: "Ali Moradi", score: 4.7, sessions: 52 }
                ].map((teacher, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-gray-500">{teacher.sessions} sessions this month</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{teacher.score}/5.0</p>
                        <Progress value={teacher.score * 20} className="w-20" />
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}