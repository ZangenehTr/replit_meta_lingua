import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, Phone, Mail, Target, Clock, CheckCircle, XCircle, AlertCircle,
  Filter, Search, Download, Calendar, MessageSquare, User, ChevronDown,
  Edit, Trash2, Eye, PhoneCall, Send, FileText, TrendingUp, Users, DollarSign
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  type Lead, 
  type InsertLead, 
  type CommunicationLog, 
  type InsertCommunicationLog,
  insertLeadSchema,
  insertCommunicationLogSchema
} from "@shared/schema";

// Frontend-specific lead type that includes assignedToName for display
interface LeadWithAssignee extends Lead {
  assignedToName?: string;
}

// Enhanced insert schemas for frontend forms with validation
const createLeadFormSchema = insertLeadSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: true,
  lastContactDate: true,
  conversionDate: true,
  studentId: true
}).extend({
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  budget: z.string().optional().or(z.number().optional()),
  nextFollowUpDate: z.string().optional()
});

const communicationFormSchema = insertCommunicationLogSchema.omit({
  id: true,
  fromUserId: true,
  toUserId: true,
  toParentId: true,
  sentAt: true,
  readAt: true,
  metadata: true,
  createdAt: true,
  studentId: true
}).extend({
  scheduledFor: z.string().optional()
});

type CreateLeadFormData = z.infer<typeof createLeadFormSchema>;
type CommunicationFormData = z.infer<typeof communicationFormSchema>;

export default function AdminLeadsPage() {
  const { t } = useTranslation(['admin', 'common']);
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>();
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>();
  
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithAssignee | null>(null);
  const [showCommunicationForm, setShowCommunicationForm] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('all-leads');

  // React Hook Form instances
  const leadForm = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      source: 'website',
      status: 'new',
      priority: 'medium',
      level: 'beginner',
      interestedLanguage: '',
      interestedLevel: '',
      preferredFormat: '',
      budget: '',
      notes: '',
      nextFollowUpDate: ''
    }
  });

  const communicationForm = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      type: 'call',
      subject: '',
      content: '',
      status: 'sent',
      scheduledFor: ''
    }
  });

  // Fetch leads with filters
  const buildFilterParams = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (priorityFilter !== 'all') params.append('priority', priorityFilter);
    if (sourceFilter !== 'all') params.append('source', sourceFilter);
    if (assigneeFilter !== 'all') params.append('assignedAgent', assigneeFilter);
    if (dateFromFilter) params.append('dateFrom', dateFromFilter.toISOString());
    if (dateToFilter) params.append('dateTo', dateToFilter.toISOString());
    return params.toString();
  };

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/leads', buildFilterParams()],
    queryFn: async () => {
      const filterParams = buildFilterParams();
      const url = filterParams ? `/api/leads?${filterParams}` : '/api/leads';
      return apiRequest(url);
    }
  });

  // Fetch call center agents for assignment
  const { data: agents = [] } = useQuery({
    queryKey: ['/api/users/agents'],
    queryFn: () => apiRequest('/api/users?role=Call Center Agent,Admin')
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: CreateLeadFormData) => {
      // Transform form data for API
      const apiData = {
        ...leadData,
        budget: leadData.budget ? (typeof leadData.budget === 'string' ? parseInt(leadData.budget) || null : leadData.budget) : null,
        nextFollowUpDate: leadData.nextFollowUpDate ? new Date(leadData.nextFollowUpDate).toISOString() : null
      };
      
      return apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify(apiData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowNewLeadForm(false);
      leadForm.reset();
      toast({
        title: t('admin:leads.success'),
        description: t('admin:leads.leadCreatedSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin:leads.error'),
        description: error.message || t('admin:leads.invalidPhone'),
        variant: "destructive",
      });
    }
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertLead> }) => {
      // Transform updates for API
      const apiUpdates = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return apiRequest(`/api/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify(apiUpdates),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: t('admin:leads.success'),
        description: t('admin:leads.leadUpdatedSuccess'),
      });
    }
  });

  // Communication log mutation
  const createCommunicationMutation = useMutation({
    mutationFn: async ({ leadId, communication }: { leadId: number; communication: CommunicationFormData }) => {
      // Transform form data for API
      const apiData = {
        ...communication,
        scheduledFor: communication.scheduledFor ? new Date(communication.scheduledFor).toISOString() : null
      };
      
      return apiRequest(`/api/leads/${leadId}/communication`, {
        method: "POST",
        body: JSON.stringify(apiData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      setShowCommunicationForm(false);
      communicationForm.reset();
      toast({
        title: t('admin:leads.success'),
        description: t('admin:leads.communicationRecorded'),
      });
    }
  });

  // Form handlers
  const handleCreateLead = (formData: CreateLeadFormData) => {
    createLeadMutation.mutate(formData);
  };

  const handleCreateCommunication = (formData: CommunicationFormData) => {
    if (!selectedLead) {
      toast({
        title: t('admin:leads.error'),
        description: t('admin:leads.noLeadSelected'),
        variant: "destructive",
      });
      return;
    }
    
    createCommunicationMutation.mutate({
      leadId: selectedLead.id,
      communication: formData
    });
  };

  const handleUpdateLeadStatus = (leadId: number, status: string) => {
    updateLeadMutation.mutate({
      id: leadId,
      updates: { status, updatedAt: new Date() }
    });
  };

  const handleBulkStatusUpdate = (status: string) => {
    bulkSelected.forEach(leadId => {
      updateLeadMutation.mutate({
        id: leadId,
        updates: { status, updatedAt: new Date() }
      });
    });
    setBulkSelected([]);
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: { [key: string]: string } = {
      'new': 'default',
      'contacted': 'secondary',
      'interested': 'outline',
      'qualified': 'default',
      'converted': 'default',
      'lost': 'destructive',
    };
    return variants[status] || 'default';
  };

  const getPriorityBadgeVariant = (priority: string) => {
    const variants: { [key: string]: string } = {
      'low': 'outline',
      'medium': 'secondary',
      'high': 'destructive',
      'urgent': 'destructive',
    };
    return variants[priority] || 'default';
  };

  const filteredLeads = leads.filter((lead: Lead) => {
    const matchesSearch = searchTerm === '' || 
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phoneNumber?.includes(searchTerm);
    
    return matchesSearch;
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l: Lead) => l.status === 'new').length;
  const qualifiedLeads = leads.filter((l: Lead) => l.status === 'qualified').length;
  const convertedLeads = leads.filter((l: Lead) => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  // Persian date formatting
  const formatPersianDate = (date: Date) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Tehran'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:leads.title')}</h1>
          <p className="text-muted-foreground">{t('admin:leads.subtitle')}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('admin:leads.refresh')}
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('admin:leads.exportExcel')}
          </Button>
          
          <Dialog open={showNewLeadForm} onOpenChange={setShowNewLeadForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('admin:leads.addLead')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('admin:leads.createLead')}</DialogTitle>
                <DialogDescription>
                  {t('admin:leads.createLeadDescription')}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...leadForm}>
                <form onSubmit={leadForm.handleSubmit(handleCreateLead)} className="grid grid-cols-2 gap-4">
                  <FormField
                    control={leadForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:leads.firstName')} *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('admin:leads.firstNamePlaceholder')}
                            data-testid="input-firstName"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={leadForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:leads.lastName')} *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('admin:leads.lastNamePlaceholder')}
                            data-testid="input-lastName"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={leadForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:leads.phoneNumber')} *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('admin:leads.phoneNumberPlaceholder')}
                            data-testid="input-phoneNumber"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={leadForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:leads.email')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder={t('admin:leads.emailPlaceholder')}
                            data-testid="input-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={leadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:leads.source')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-source">
                              <SelectValue placeholder={t('admin:leads.selectSource')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">{t('admin:leads.sourceWebsite')}</SelectItem>
                            <SelectItem value="social_media">{t('admin:leads.sourceSocialMedia')}</SelectItem>
                            <SelectItem value="referral">{t('admin:leads.sourceReferral')}</SelectItem>
                            <SelectItem value="advertisement">{t('admin:leads.sourceAdvertisement')}</SelectItem>
                            <SelectItem value="walk_in">{t('admin:leads.sourceWalkIn')}</SelectItem>
                            <SelectItem value="call_center">{t('admin:leads.sourceCallCenter')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={leadForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:leads.priority')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder={t('admin:leads.selectPriority')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t('admin:leads.priorityLow')}</SelectItem>
                            <SelectItem value="medium">{t('admin:leads.priorityMedium')}</SelectItem>
                            <SelectItem value="high">{t('admin:leads.priorityHigh')}</SelectItem>
                            <SelectItem value="urgent">{t('admin:leads.priorityUrgent')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                <div>
                  <Label htmlFor="interestedLanguage">{t('admin:leads.interestedLanguage')}</Label>
                  <Select value={newLeadData.interestedLanguage} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLanguage: value})}>
                    <SelectTrigger data-testid="select-interestedLanguage">
                      <SelectValue placeholder={t('admin:leads.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t('admin:leads.languageEnglish')}</SelectItem>
                      <SelectItem value="persian">{t('admin:leads.languagePersian')}</SelectItem>
                      <SelectItem value="arabic">{t('admin:leads.languageArabic')}</SelectItem>
                      <SelectItem value="french">{t('admin:leads.languageFrench')}</SelectItem>
                      <SelectItem value="german">{t('admin:leads.languageGerman')}</SelectItem>
                      <SelectItem value="spanish">{t('admin:leads.languageSpanish')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="interestedLevel">{t('admin:leads.interestedLevel')}</Label>
                  <Select value={newLeadData.interestedLevel} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLevel: value})}>
                    <SelectTrigger data-testid="select-interestedLevel">
                      <SelectValue placeholder={t('admin:leads.selectLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t('admin:leads.levelBeginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('admin:leads.levelIntermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('admin:leads.levelAdvanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="preferredFormat">{t('admin:leads.preferredFormat')}</Label>
                  <Select value={newLeadData.preferredFormat} onValueChange={(value) => setNewLeadData({...newLeadData, preferredFormat: value})}>
                    <SelectTrigger data-testid="select-preferredFormat">
                      <SelectValue placeholder={t('admin:leads.selectFormat')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">{t('admin:leads.formatGroup')}</SelectItem>
                      <SelectItem value="individual">{t('admin:leads.formatIndividual')}</SelectItem>
                      <SelectItem value="online">{t('admin:leads.formatOnline')}</SelectItem>
                      <SelectItem value="in_person">{t('admin:leads.formatInPerson')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="budget">{t('admin:leads.budget')}</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newLeadData.budget}
                    onChange={(e) => setNewLeadData({...newLeadData, budget: e.target.value})}
                    placeholder={t('admin:leads.budgetPlaceholder')}
                    data-testid="input-budget"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="notes">{t('admin:leads.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={newLeadData.notes}
                    onChange={(e) => setNewLeadData({...newLeadData, notes: e.target.value})}
                    placeholder={t('admin:leads.notesPlaceholder')}
                    rows={3}
                    data-testid="textarea-notes"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewLeadForm(false)} data-testid="button-cancel">
                  {t('admin:leads.cancel')}
                </Button>
                <Button 
                  onClick={handleCreateLead}
                  disabled={createLeadMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-createLead"
                >
                  {createLeadMutation.isPending ? t('admin:leads.creating') : t('admin:leads.createLead')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:leads.totalLeads')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-totalLeads">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:leads.newLeads')}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-newLeads">{newLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:leads.qualified')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-qualifiedLeads">{qualifiedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:leads.converted')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-convertedLeads">{convertedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:leads.conversionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-conversionRate">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('admin:leads.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>{t('admin:leads.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin:leads.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div>
              <Label>{t('admin:leads.status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-statusFilter">
                  <SelectValue placeholder={t('admin:leads.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin:leads.allStatuses')}</SelectItem>
                  <SelectItem value="new">{t('admin:leads.new')}</SelectItem>
                  <SelectItem value="contacted">{t('admin:leads.contacted')}</SelectItem>
                  <SelectItem value="interested">{t('admin:leads.interested')}</SelectItem>
                  <SelectItem value="qualified">{t('admin:leads.qualified')}</SelectItem>
                  <SelectItem value="converted">{t('admin:leads.converted')}</SelectItem>
                  <SelectItem value="lost">{t('admin:leads.lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('admin:leads.priority')}</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger data-testid="select-priorityFilter">
                  <SelectValue placeholder={t('admin:leads.allPriorities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin:leads.allPriorities')}</SelectItem>
                  <SelectItem value="low">{t('admin:leads.priorityLow')}</SelectItem>
                  <SelectItem value="medium">{t('admin:leads.priorityMedium')}</SelectItem>
                  <SelectItem value="high">{t('admin:leads.priorityHigh')}</SelectItem>
                  <SelectItem value="urgent">{t('admin:leads.priorityUrgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('admin:leads.source')}</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger data-testid="select-sourceFilter">
                  <SelectValue placeholder={t('admin:leads.allSources')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin:leads.allSources')}</SelectItem>
                  <SelectItem value="website">{t('admin:leads.sourceWebsite')}</SelectItem>
                  <SelectItem value="social_media">{t('admin:leads.sourceSocialMedia')}</SelectItem>
                  <SelectItem value="referral">{t('admin:leads.sourceReferral')}</SelectItem>
                  <SelectItem value="advertisement">{t('admin:leads.sourceAdvertisement')}</SelectItem>
                  <SelectItem value="walk_in">{t('admin:leads.sourceWalkIn')}</SelectItem>
                  <SelectItem value="call_center">{t('admin:leads.sourceCallCenter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {bulkSelected.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span data-testid="text-selectedCount">{bulkSelected.length} {t('admin:leads.selectedLeads')}</span>
                <Button variant="outline" size="sm" onClick={() => setBulkSelected([])} data-testid="button-unselectAll">
                  {t('admin:leads.unselectAll')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('contacted')} data-testid="button-markAllContacted">
                  {t('admin:leads.markAllContacted')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('qualified')} data-testid="button-markAllQualified">
                  {t('admin:leads.markAllQualified')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('lost')} data-testid="button-markAllLost">
                  {t('admin:leads.markAllLost')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin:leads.leadsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="text-loading">{t('admin:leads.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={bulkSelected.length === filteredLeads.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkSelected(filteredLeads.map((lead: Lead) => lead.id));
                          } else {
                            setBulkSelected([]);
                          }
                        }}
                        data-testid="checkbox-selectAll"
                      />
                    </TableHead>
                    <TableHead>{t('admin:leads.name')}</TableHead>
                    <TableHead>{t('admin:leads.phone')}</TableHead>
                    <TableHead>{t('admin:leads.status')}</TableHead>
                    <TableHead>{t('admin:leads.priority')}</TableHead>
                    <TableHead>{t('admin:leads.source')}</TableHead>
                    <TableHead>{t('admin:leads.language')}</TableHead>
                    <TableHead>{t('admin:leads.agent')}</TableHead>
                    <TableHead>{t('admin:leads.created')}</TableHead>
                    <TableHead>{t('admin:leads.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: Lead) => (
                    <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={bulkSelected.includes(lead.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkSelected([...bulkSelected, lead.id]);
                            } else {
                              setBulkSelected(bulkSelected.filter(id => id !== lead.id));
                            }
                          }}
                          data-testid={`checkbox-lead-${lead.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-leadName-${lead.id}`}>{lead.firstName} {lead.lastName}</div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-leadEmail-${lead.id}`}>{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-leadPhone-${lead.id}`}>{lead.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.status)} data-testid={`badge-leadStatus-${lead.id}`}>
                          {lead.status === 'new' ? t('admin:leads.new') :
                           lead.status === 'contacted' ? t('admin:leads.contacted') :
                           lead.status === 'interested' ? t('admin:leads.interested') :
                           lead.status === 'qualified' ? t('admin:leads.qualified') :
                           lead.status === 'converted' ? t('admin:leads.converted') :
                           lead.status === 'lost' ? t('admin:leads.lost') : lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(lead.priority)} data-testid={`badge-leadPriority-${lead.id}`}>
                          {lead.priority === 'low' ? t('admin:leads.priorityLow') :
                           lead.priority === 'medium' ? t('admin:leads.priorityMedium') :
                           lead.priority === 'high' ? t('admin:leads.priorityHigh') :
                           lead.priority === 'urgent' ? t('admin:leads.priorityUrgent') : lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-leadSource-${lead.id}`}>
                        {lead.source === 'website' ? t('admin:leads.sourceWebsite') :
                         lead.source === 'social_media' ? t('admin:leads.sourceSocialMedia') :
                         lead.source === 'referral' ? t('admin:leads.sourceReferral') :
                         lead.source === 'advertisement' ? t('admin:leads.sourceAdvertisement') :
                         lead.source === 'walk_in' ? t('admin:leads.sourceWalkIn') :
                         lead.source === 'call_center' ? t('admin:leads.sourceCallCenter') : lead.source}
                      </TableCell>
                      <TableCell data-testid={`text-leadLanguage-${lead.id}`}>{lead.interestedLanguage}</TableCell>
                      <TableCell data-testid={`text-leadAgent-${lead.id}`}>{lead.assignedToName || t('admin:leads.noAssignee')}</TableCell>
                      <TableCell data-testid={`text-leadCreated-${lead.id}`}>{formatPersianDate(lead.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-leadActions-${lead.id}`}>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('admin:leads.actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadDetails(true);
                            }} data-testid={`menuitem-viewDetails-${lead.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('admin:leads.viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setShowCommunicationForm(true);
                            }} data-testid={`menuitem-logCommunication-${lead.id}`}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {t('admin:leads.logCommunication')}
                            </DropdownMenuItem>
                            <DropdownMenuItem data-testid={`menuitem-makeCall-${lead.id}`}>
                              <PhoneCall className="mr-2 h-4 w-4" />
                              {t('admin:leads.makeCall')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'contacted')} data-testid={`menuitem-markContacted-${lead.id}`}>
                              {t('admin:leads.markContacted')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'qualified')} data-testid={`menuitem-markQualified-${lead.id}`}>
                              {t('admin:leads.markQualified')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'converted')} data-testid={`menuitem-markConverted-${lead.id}`}>
                              {t('admin:leads.markConverted')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'lost')} data-testid={`menuitem-markLost-${lead.id}`}>
                              {t('admin:leads.markLost')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Form Dialog */}
      <Dialog open={showCommunicationForm} onOpenChange={setShowCommunicationForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:leads.communicationLog')}</DialogTitle>
            <DialogDescription>
              {t('admin:leads.recordCommunication')} {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">{t('admin:leads.communicationType')}</Label>
              <Select value={communicationData.type} onValueChange={(value) => setCommunicationData({...communicationData, type: value})}>
                <SelectTrigger data-testid="select-communicationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">{t('admin:leads.communicationCall')}</SelectItem>
                  <SelectItem value="email">{t('admin:leads.communicationEmail')}</SelectItem>
                  <SelectItem value="sms">{t('admin:leads.communicationSMS')}</SelectItem>
                  <SelectItem value="meeting">{t('admin:leads.communicationMeeting')}</SelectItem>
                  <SelectItem value="note">{t('admin:leads.communicationNote')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">{t('admin:leads.communicationSubject')}</Label>
              <Input
                id="subject"
                value={communicationData.subject}
                onChange={(e) => setCommunicationData({...communicationData, subject: e.target.value})}
                placeholder={t('admin:leads.communicationSubject')}
                data-testid="input-communicationSubject"
              />
            </div>

            <div>
              <Label htmlFor="content">{t('admin:leads.communicationContent')}</Label>
              <Textarea
                id="content"
                value={communicationData.content}
                onChange={(e) => setCommunicationData({...communicationData, content: e.target.value})}
                placeholder={t('admin:leads.communicationContent')}
                rows={4}
                data-testid="textarea-communicationContent"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommunicationForm(false)} data-testid="button-cancelCommunication">
              {t('admin:leads.cancel')}
            </Button>
            <Button 
              onClick={() => {
                if (selectedLead) {
                  createCommunicationMutation.mutate({
                    leadId: selectedLead.id,
                    communication: communicationData
                  });
                }
              }}
              disabled={createCommunicationMutation.isPending}
              data-testid="button-recordCommunication"
            >
              {createCommunicationMutation.isPending ? t('admin:leads.recording') : t('admin:leads.recordCommunication')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}