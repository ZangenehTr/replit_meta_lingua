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
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion } from "framer-motion";

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
  const { isRTL } = useLanguage();
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
      <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-xl p-6 md:p-8 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('callcenter:welcome', 'Welcome')}, {user?.firstName || t('callcenter:agent', 'Agent')}! 📞
              </h1>
              <p className="text-sm md:text-base opacity-90">
                {t('callcenter:welcomeMessage', 'Connect with leads, build relationships, and drive enrollment success!')}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t('callcenter:todaysCalls', "Today's Calls")}</p>
                <p className="text-xl font-bold">☎️ {callCenterStats?.todayCalls || 0}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t('callcenter:conversion', 'Conversion')}</p>
                <p className="text-xl font-bold">📈 {(callCenterStats?.conversionRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100">{t('leads.title')}</p>
                  <p className="text-3xl font-bold">{callCenterStats?.totalLeads || 0}</p>
                </div>
                <Users className="w-12 h-12 text-teal-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">{t('leads.hotLeads')}</p>
                  <p className="text-3xl font-bold">{callCenterStats?.hotLeads || 0}</p>
                </div>
                <Target className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{t('stats.totalCalls')}</p>
                  <p className="text-3xl font-bold">{callCenterStats?.todayCalls || 0}</p>
                </div>
                <Phone className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">{t('callcenter:dashboard.conversionRate')}</p>
                  <p className="text-3xl font-bold">{(callCenterStats?.conversionRate || 0).toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('dashboard.overview', { ns: 'common' })}</TabsTrigger>
            <TabsTrigger value="leads">{t('dashboard.leads', { ns: 'common' })}</TabsTrigger>
            <TabsTrigger value="calls">{t('dashboard.calls', { ns: 'common' })}</TabsTrigger>
            <TabsTrigger value="performance">{t('dashboard.performance', { ns: 'common' })}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="mt-6">
              <p>Overview content coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="leads">
            <div className="mt-6">
              <p>Leads content coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="calls">
            <div className="mt-6">
              <p>Calls content coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="mt-6">
              <p>Performance content coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default CallCenterDashboard;
