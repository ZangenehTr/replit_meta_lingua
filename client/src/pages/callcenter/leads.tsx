import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  PhoneCall,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit3,
  MessageCircle,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Plus,
  Headphones,
  PhoneIncoming,
  PhoneOutgoing,
  Mail,
  Star
} from "lucide-react";

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  interestLevel: number;
  notes: string;
  createdAt: string;
  lastContactDate?: string;
  assignedAgent?: string;
  coursesInterested: string[];
  preferredContactMethod: 'phone' | 'email' | 'whatsapp';
}

export default function LeadsPage() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Dynamic lead form initial state (no hardcoded defaults)
  const [newLeadData, setNewLeadData] = useState(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    priority: 'medium' as const,
    notes: '',
    coursesInterested: [] as string[],
    preferredContactMethod: 'phone' as const
  }));

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/callcenter/leads"],
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      return apiRequest("/api/callcenter/leads", {
        method: "POST",
        body: leadData,
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:leads.leadCreated'),
        description: t('callcenter:leads.leadCreatedDesc'),
      });
      setIsCreateDialogOpen(false);
      setNewLeadData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: '',
        priority: 'medium' as const,
        notes: '',
        coursesInterested: [],
        preferredContactMethod: 'phone'
      });
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/leads"] });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: t('common:errorTryAgain'),
        variant: "destructive",
      });
    },
  });

  // VoIP call initiation
  const initiateVoIPCall = useMutation({
    mutationFn: async ({ phoneNumber, contactName }: { phoneNumber: string; contactName: string }) => {
      return apiRequest("/api/voip/initiate-call", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          contactName
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: t('callcenter:leads.voipCallInitiated'),
        description: t('callcenter:leads.callInitiatedTo', { contactName: data.contactName }),
      });
    },
    onError: (error) => {
      toast({
        title: t('callcenter:leads.callFailed'),
        description: t('callcenter:leads.callFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Handle VoIP call
  const handleVoIPCall = (lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: t('callcenter:leads.noPhoneNumber'),
        description: t('callcenter:leads.noPhoneNumberDesc', { firstName: lead.firstName, lastName: lead.lastName }),
        variant: "destructive",
      });
      return;
    }

    initiateVoIPCall.mutate({
      phoneNumber: lead.phone,
      contactName: `${lead.firstName} ${lead.lastName}`
    });
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.phone}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-purple-500';
      case 'converted': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('callcenter:leads.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('callcenter:leads.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open('/callcenter/voip', '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Headphones className="w-4 h-4 mr-2" />
                {t('callcenter:leads.voipCenter')}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('callcenter:leads.addNewLead')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('callcenter:leads.createNewLead')}</DialogTitle>
                    <DialogDescription>
                      {t('callcenter:leads.createNewLeadDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t('callcenter:leads.firstName')} *</Label>
                      <Input
                        id="firstName"
                        value={newLeadData.firstName}
                        onChange={(e) => setNewLeadData({ ...newLeadData, firstName: e.target.value })}
                        placeholder={t('callcenter:leads.enterFirstName')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t('callcenter:leads.lastName')} *</Label>
                      <Input
                        id="lastName"
                        value={newLeadData.lastName}
                        onChange={(e) => setNewLeadData({ ...newLeadData, lastName: e.target.value })}
                        placeholder={t('callcenter:leads.enterLastName')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t('callcenter:leads.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newLeadData.email}
                        onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                        placeholder={t('callcenter:leads.enterEmail')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{t('callcenter:leads.phoneNumber')} *</Label>
                      <Input
                        id="phone"
                        value={newLeadData.phone}
                        onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                        placeholder={t('callcenter:leads.enterPhone')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="source">{t('callcenter:leads.source')}</Label>
                      <Select value={newLeadData.source} onValueChange={(value) => setNewLeadData({ ...newLeadData, source: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('callcenter:leads.selectSource')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">{t('callcenter:leads.sources.website')}</SelectItem>
                          <SelectItem value="social-media">{t('callcenter:leads.sources.socialMedia')}</SelectItem>
                          <SelectItem value="referral">{t('callcenter:leads.sources.referral')}</SelectItem>
                          <SelectItem value="cold-call">{t('callcenter:leads.sources.coldCall')}</SelectItem>
                          <SelectItem value="email-campaign">{t('callcenter:leads.sources.emailCampaign')}</SelectItem>
                          <SelectItem value="event">{t('callcenter:leads.sources.event')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">{t('callcenter:leads.priority')}</Label>
                      <Select value={newLeadData.priority} onValueChange={(value) => setNewLeadData({ ...newLeadData, priority: value as 'low' | 'medium' | 'high' })}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('callcenter:leads.selectPriority')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('callcenter:leads.priorities.low')}</SelectItem>
                          <SelectItem value="medium">{t('callcenter:leads.priorities.medium')}</SelectItem>
                          <SelectItem value="high">{t('callcenter:leads.priorities.high')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">{t('callcenter:leads.notes')}</Label>
                      <Textarea
                        id="notes"
                        value={newLeadData.notes}
                        onChange={(e) => setNewLeadData({ ...newLeadData, notes: e.target.value })}
                        placeholder={t('callcenter:leads.additionalNotes')}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      {t('common:actions.cancel')}
                    </Button>
                    <Button 
                      onClick={() => createLeadMutation.mutate(newLeadData)}
                      disabled={createLeadMutation.isPending}
                    >
                      {createLeadMutation.isPending ? t('callcenter:leads.creating') : t('callcenter:leads.createLead')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{lead.firstName} {lead.lastName}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {lead.email}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityBadgeColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                      <Badge className={getStatusBadgeColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{lead.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    {lead.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {lead.notes}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleVoIPCall(lead)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={initiateVoIPCall.isPending}
                      >
                        <PhoneCall className="w-4 h-4 mr-1" />
                        {initiateVoIPCall.isPending ? 'Calling...' : 'Call'}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No leads found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start by adding your first lead.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}