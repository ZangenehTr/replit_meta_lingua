import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [newLeadData, setNewLeadData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    priority: 'medium',
    notes: '',
    coursesInterested: [],
    preferredContactMethod: 'phone'
  });

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
        title: "Lead Created",
        description: "New lead has been added successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewLeadData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: '',
        priority: 'medium',
        notes: '',
        coursesInterested: [],
        preferredContactMethod: 'phone'
      });
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/leads"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // VoIP call initiation
  const initiateVoIPCall = useMutation({
    mutationFn: async ({ phoneNumber, contactName }: { phoneNumber: string; contactName: string }) => {
      return apiRequest("/api/voip/initiate-call", {
        method: "POST",
        body: {
          phoneNumber,
          contactName
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "VoIP Call Initiated",
        description: `Call initiated to ${data.contactName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Call Failed",
        description: "Failed to initiate VoIP call. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  // Handle VoIP call
  const handleVoIPCall = (lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: "No Phone Number",
        description: `${lead.firstName} ${lead.lastName} does not have a phone number.`,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Lead Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage and track potential students and prospects
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open('/callcenter/voip', '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Headphones className="w-4 h-4 mr-2" />
                VoIP Center
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                      Create a new lead entry for potential students
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newLeadData.firstName}
                        onChange={(e) => setNewLeadData({ ...newLeadData, firstName: e.target.value })}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newLeadData.lastName}
                        onChange={(e) => setNewLeadData({ ...newLeadData, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newLeadData.email}
                        onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newLeadData.phone}
                        onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Select value={newLeadData.source} onValueChange={(value) => setNewLeadData({ ...newLeadData, source: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="social-media">Social Media</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="cold-call">Cold Call</SelectItem>
                          <SelectItem value="email-campaign">Email Campaign</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newLeadData.priority} onValueChange={(value) => setNewLeadData({ ...newLeadData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newLeadData.notes}
                        onChange={(e) => setNewLeadData({ ...newLeadData, notes: e.target.value })}
                        placeholder="Enter any additional notes about the lead"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createLeadMutation.mutate(newLeadData)}
                      disabled={createLeadMutation.isPending}
                    >
                      {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
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