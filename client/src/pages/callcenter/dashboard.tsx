import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  PhoneCall, 
  UserPlus, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  source: string;
  status: string;
  priority: string;
  createdAt: string;
  lastContactDate?: string;
  notes?: string;
}

interface CallLog {
  id: number;
  leadId: number;
  duration: number;
  status: string;
  notes: string;
  createdAt: string;
  lead?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

export default function CallCenterDashboard() {
  const { user } = useAuth();

  // Call Center theme colors
  const themeColors = {
    primary: "bg-teal-600",
    primaryHover: "hover:bg-teal-700",
    light: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    accent: "bg-teal-100 text-teal-800"
  };

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
  });

  const { data: todayStats } = useQuery({
    queryKey: ["/api/callcenter/today-stats"],
  });

  // Calculate dashboard stats from real data
  const totalLeads = leads.length;
  const hotLeads = leads.filter(lead => lead.priority === 'high').length;
  const todayCalls = callLogs.filter(call => 
    new Date(call.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const conversionRate = leads.length > 0 ? 
    (leads.filter(lead => lead.status === 'enrolled').length / leads.length * 100).toFixed(1) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'enrolled': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full">
              <Phone className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-teal-800">Call Center Dashboard</h1>
              <p className="text-teal-600">
                Welcome back, {user?.firstName}! Manage leads and drive conversions.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/callcenter/leads/new">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Active prospects in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
              <p className="text-xs text-muted-foreground">
                High priority prospects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCalls}</div>
              <p className="text-xs text-muted-foreground">
                Calls made today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Lead to enrollment rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">Recent Leads</TabsTrigger>
            <TabsTrigger value="calls">Call History</TabsTrigger>
            <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest prospects requiring attention
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads.slice(0, 10).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </span>
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead.phoneNumber} • {lead.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Source: {lead.source} • Added {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Link href={`/callcenter/leads/${lead.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads available. Start adding leads to grow your pipeline.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Call History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your recent call activities
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callLogs.slice(0, 10).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {call.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : call.status === 'missed' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {call.lead?.firstName} {call.lead?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {call.lead?.phoneNumber} • {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(call.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(call.status)}>
                        {call.status}
                      </Badge>
                    </div>
                  ))}
                  {callLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No call history available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="follow-ups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Required</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Leads that need follow-up calls
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leads.filter(lead => 
                    lead.status === 'contacted' && 
                    (!lead.lastContactDate || 
                     new Date(lead.lastContactDate) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
                  ).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lead.phoneNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last contact: {lead.lastContactDate ? 
                              new Date(lead.lastContactDate).toLocaleDateString() : 
                              'Never'
                            }
                          </p>
                        </div>
                      </div>
                      <Button size="sm">
                        <PhoneCall className="h-4 w-4 mr-1" />
                        Follow Up
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}