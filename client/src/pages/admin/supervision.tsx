import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
              <CardTitle>Homework Quality Assurance</CardTitle>
              <CardDescription>
                Review and approve homework assignments and grading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((homework) => (
                  <div key={homework} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <ClipboardCheck className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Persian Writing Exercise #{homework}</p>
                        <p className="text-sm text-gray-500">Submitted by: Student {homework} | Graded by: Teacher {homework}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={homework % 2 === 0 ? "default" : "secondary"}>
                        {homework % 2 === 0 ? "Approved" : "Pending Review"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
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