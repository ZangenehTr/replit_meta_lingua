import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Phone, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  UserPlus,
  Target,
  Calendar,
  BarChart3,
  MessageSquare,
  Mail,
  Star,
  ArrowUp,
  ArrowDown,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Timer,
  Award,
  TrendingDown,
  DollarSign,
  Activity,
  Headphones,
  Play
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useState } from "react";

interface CallCenterStats {
  totalLeads: number;
  hotLeads: number;
  todayCalls: number;
  conversionRate: number;
  averageCallDuration: number;
  responseRate: number;
  dailyTargetCalls: number;
  completedCalls: number;
  revenueGenerated: number;
  customerSatisfaction: number;
}

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'enrolled' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  interestedLanguage: string;
  interestedLevel: string;
  budget: number;
  notes: string;
  assignedAgentId?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  score: number;
}

interface CallLog {
  id: number;
  leadId: number;
  agentId: number;
  duration: number;
  status: 'completed' | 'missed' | 'rejected' | 'busy';
  outcome: 'interested' | 'not_interested' | 'callback_requested' | 'enrolled' | 'follow_up';
  notes: string;
  recordingUrl?: string;
  satisfaction: number;
  createdAt: string;
  lead: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

interface DailyGoal {
  targetCalls: number;
  targetConversions: number;
  targetRevenue: number;
  actualCalls: number;
  actualConversions: number;
  actualRevenue: number;
}

interface AgentPerformance {
  agentId: number;
  agentName: string;
  callsToday: number;
  conversionsToday: number;
  averageCallTime: number;
  conversionRate: number;
  satisfaction: number;
  status: 'available' | 'busy' | 'break' | 'offline';
}

function CallCenterDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['callcenter', 'common']);
  const { language, isRTL, direction } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  // Call center theme colors
  const themeColors = {
    primary: "bg-teal-600",
    primaryHover: "hover:bg-teal-700",
    light: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    accent: "bg-teal-100 text-teal-800"
  };

  // Data queries
  const { data: callCenterStats } = useQuery<CallCenterStats>({
    queryKey: ["/api/callcenter/stats"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
  });

  const { data: dailyGoals } = useQuery<DailyGoal>({
    queryKey: ["/api/callcenter/daily-goals"],
  });

  const { data: teamPerformance = [] } = useQuery<AgentPerformance[]>({
    queryKey: ["/api/callcenter/team-performance"],
  });

  // Mutations
  const makeCallMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await fetch(`/api/leads/${leadId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to initiate call');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/stats"] });
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, status, notes }: { leadId: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (!response.ok) throw new Error('Failed to update lead');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/stats"] });
    }
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'enrolled': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCallOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'interested': return 'bg-green-100 text-green-800';
      case 'enrolled': return 'bg-emerald-100 text-emerald-800';
      case 'callback_requested': return 'bg-yellow-100 text-yellow-800';
      case 'follow_up': return 'bg-blue-100 text-blue-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Filter leads based on search and status
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phoneNumber.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate performance metrics
  const todayCallsPercentage = dailyGoals ? (dailyGoals.actualCalls / dailyGoals.targetCalls) * 100 : 0;
  const todayConversionsPercentage = dailyGoals ? (dailyGoals.actualConversions / dailyGoals.targetConversions) * 100 : 0;
  const todayRevenuePercentage = dailyGoals ? (dailyGoals.actualRevenue / dailyGoals.targetRevenue) * 100 : 0;

  const hotLeads = leads.filter(lead => lead.priority === 'high' || lead.priority === 'urgent');
  const newLeads = leads.filter(lead => lead.status === 'new');
  const todayCalls = callLogs.filter(call => 
    new Date(call.createdAt).toDateString() === new Date().toDateString()
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl shadow-lg">
              <Headphones className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('callcenter:dashboard.title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('callcenter:dashboard.welcomeMessage')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/callcenter/voip">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
                <Headphones className="h-4 w-4 mr-2" />
                VoIP Center
              </Button>
            </Link>
            <Link href="/callcenter/leads/new">
              <Button className="bg-teal-600 hover:bg-teal-700 shadow-md">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </Link>
            <Link href="/callcenter/reports">
              <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('callCenter.todayCalls')}</CardTitle>
              <Phone className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCalls.length}</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={todayCallsPercentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">
                  {dailyGoals?.targetCalls || 50}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(todayCallsPercentage)}% of daily target
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('callCenter.hotLeads')}</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotLeads.length}</div>
              <p className="text-xs text-muted-foreground">
                {newLeads.length} new leads today
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('callCenter.conversionRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {callCenterStats?.conversionRate || 12.8}%
              </div>
              <div className="flex items-center gap-1 text-xs">
                <ArrowUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+2.3% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('callCenter.revenueGenerated')}</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(callCenterStats?.revenueGenerated || 127500000)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Calls Made</span>
                  <span className="font-medium">
                    {dailyGoals?.actualCalls || todayCalls.length}/{dailyGoals?.targetCalls || 50}
                  </span>
                </div>
                <Progress value={todayCallsPercentage} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Conversions</span>
                  <span className="font-medium">
                    {dailyGoals?.actualConversions || 6}/{dailyGoals?.targetConversions || 8}
                  </span>
                </div>
                <Progress value={todayConversionsPercentage} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(dailyGoals?.actualRevenue || 18500000)}
                  </span>
                </div>
                <Progress value={todayRevenuePercentage} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="calls">Call Logs</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Leads */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Priority Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hotLeads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{lead.firstName} {lead.lastName}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {lead.phoneNumber}
                          <span>•</span>
                          <span>{lead.interestedLanguage} - {lead.interestedLevel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => makeCallMutation.mutate(lead.id)}
                          disabled={makeCallMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <PhoneCall className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Call Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Call Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayCalls.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-teal-100 rounded-full">
                          <PhoneCall className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {call.lead.firstName} {call.lead.lastName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {formatDuration(call.duration)}
                            <span>•</span>
                            <span>{new Date(call.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCallOutcomeColor(call.outcome)} variant="outline">
                          {call.outcome.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs">{call.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Team Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Performance Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teamPerformance.slice(0, 4).map((agent) => (
                    <div key={agent.agentId} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {agent.agentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-sm">{agent.agentName}</h4>
                          <Badge 
                            variant="outline" 
                            className={agent.status === 'available' ? 'text-green-700 border-green-200' : 'text-yellow-700 border-yellow-200'}
                          >
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Calls:</span>
                          <span className="font-medium">{agent.callsToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversions:</span>
                          <span className="font-medium">{agent.conversionsToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversion Rate:</span>
                          <span className="font-medium">{agent.conversionRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="font-medium">{agent.satisfaction}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lead Management</CardTitle>
                    <CardDescription>
                      Track and manage prospective students
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="qualified">Qualified</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {lead.firstName[0]}{lead.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{lead.firstName} {lead.lastName}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{lead.phoneNumber}</span>
                            <span>{lead.email}</span>
                            <span>{lead.interestedLanguage} - {lead.interestedLevel}</span>
                            <span>{formatCurrency(lead.budget)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => makeCallMutation.mutate(lead.id)}
                            disabled={makeCallMutation.isPending}
                          >
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          <Link href={`/callcenter/leads/${lead.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/callcenter/leads/${lead.id}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
                <CardDescription>
                  Complete log of all call activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {callLogs.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          call.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {call.status === 'completed' ? (
                            <PhoneCall className="h-5 w-5 text-green-600" />
                          ) : (
                            <PhoneCall className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {call.lead.firstName} {call.lead.lastName}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{call.lead.phoneNumber}</span>
                            <span>•</span>
                            <span>{formatDuration(call.duration)}</span>
                            <span>•</span>
                            <span>{new Date(call.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getCallOutcomeColor(call.outcome)}>
                          {call.outcome.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{call.satisfaction}/5</span>
                        </div>
                        {call.recordingUrl && (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Monitor individual agent performance and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamPerformance.map((agent) => (
                    <Card key={agent.agentId}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {agent.agentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{agent.agentName}</CardTitle>
                            <Badge 
                              variant="outline" 
                              className={agent.status === 'available' ? 'text-green-700 border-green-200' : 'text-yellow-700 border-yellow-200'}
                            >
                              {agent.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Calls Today</div>
                            <div className="text-2xl font-bold text-blue-600">{agent.callsToday}</div>
                          </div>
                          <div>
                            <div className="font-medium">Conversions</div>
                            <div className="text-2xl font-bold text-green-600">{agent.conversionsToday}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Conversion Rate</span>
                            <span>{agent.conversionRate}%</span>
                          </div>
                          <Progress value={agent.conversionRate} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Avg Call Time</span>
                          <span className="font-medium">{formatDuration(agent.averageCallTime)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Satisfaction</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{agent.satisfaction}/5</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {callCenterStats?.responseRate || 94}%
                      </div>
                      <div className="text-sm text-muted-foreground">Response Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatDuration(callCenterStats?.averageCallDuration || 385)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Call Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {callCenterStats?.customerSatisfaction || 4.2}/5
                      </div>
                      <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {leads.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Leads</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Monthly Revenue</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(callCenterStats?.revenueGenerated || 127500000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Deal Size</span>
                      <span className="font-bold">
                        {formatCurrency(3200000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Deals Closed</span>
                      <span className="font-bold">
                        {Math.floor((callCenterStats?.revenueGenerated || 127500000) / 3200000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Revenue per Call</span>
                      <span className="font-bold">
                        {formatCurrency(850000)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default CallCenterDashboard;