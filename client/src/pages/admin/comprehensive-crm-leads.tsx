import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
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
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import DynamicForm from "@/components/forms/DynamicForm";

// Type definitions for forms
interface FormDefinition {
  id: number;
  title: string;
  fields: any[];
  [key: string]: any;
}

// Type definitions for leads
interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  source: string;
  status: string;
  priority: string;
  level: string;
  interestedLanguage?: string;
  interestedLevel?: string;
  preferredFormat?: string;
  budget?: number;
  notes?: string;
  assignedTo?: number;
  assignedToName?: string;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  conversionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunicationLog {
  id: number;
  type: string;
  content: string;
  createdAt: Date;
  fromUserId: number;
  status: string;
}

export default function ComprehensiveCRMLeads() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCommunicationForm, setShowCommunicationForm] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('all-leads');

  // Form data states
  const [newLeadData, setNewLeadData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    source: '',
    status: 'new',
    priority: 'medium',
    level: 'beginner',
    interestedLanguage: '',
    interestedLevel: '',
    preferredFormat: '',
    budget: '',
    notes: '',
    nextFollowUpDate: undefined as Date | undefined
  });

  // communicationData state removed - now using DynamicForm (Form ID: 7)

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

  // Fetch Communication Log form definition (Form ID: 7)
  const { data: communicationFormDefinition, isLoading: communicationFormLoading } = useQuery<FormDefinition>({
    queryKey: ['/api/forms', 7],
    enabled: showCommunicationForm,
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      return apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify(leadData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowNewLeadForm(false);
      resetNewLeadForm();
      toast({
        title: "موفقیت",
        description: "سرنخ جدید با موفقیت ایجاد شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد سرنخ",
        variant: "destructive",
      });
    }
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest(`/api/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "موفقیت",
        description: "سرنخ با موفقیت به‌روزرسانی شد",
      });
    }
  });

  // Communication log mutation
  const createCommunicationMutation = useMutation({
    mutationFn: async ({ leadId, communication }: { leadId: number; communication: any }) => {
      return apiRequest(`/api/leads/${leadId}/communication`, {
        method: "POST",
        body: JSON.stringify(communication),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      setShowCommunicationForm(false);
      toast({
        title: "موفقیت",
        description: "ارتباط ثبت شد",
      });
    }
  });

  // Communication form submit handler for DynamicForm
  const handleCommunicationSubmit = async (data: any) => {
    if (!selectedLead) {
      throw new Error("No lead selected");
    }
    return createCommunicationMutation.mutateAsync({
      leadId: selectedLead.id,
      communication: data
    });
  };

  const resetNewLeadForm = () => {
    setNewLeadData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      source: '',
      status: 'new',
      priority: 'medium',
      level: 'beginner',
      interestedLanguage: '',
      interestedLevel: '',
      preferredFormat: '',
      budget: '',
      notes: '',
      nextFollowUpDate: undefined
    });
  };

  const handleCreateLead = () => {
    if (!newLeadData.firstName || !newLeadData.lastName || !newLeadData.phoneNumber) {
      toast({
        title: "فیلدهای ضروری",
        description: "لطفاً نام، نام خانوادگی و شماره تلفن را وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    createLeadMutation.mutate(newLeadData);
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
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مدیریت سرنخ‌های فروش</h1>
          <p className="text-muted-foreground">مدیریت کامل سرنخ‌ها و مشتریان بالقوه</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <TrendingUp className="h-4 w-4 mr-2" />
            تازه‌سازی
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            خروجی اکسل
          </Button>
          
          <Dialog open={showNewLeadForm} onOpenChange={setShowNewLeadForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                سرنخ جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>ایجاد سرنخ جدید</DialogTitle>
                <DialogDescription>
                  اطلاعات مشتری بالقوه را وارد کنید
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">نام *</Label>
                  <Input
                    id="firstName"
                    value={newLeadData.firstName}
                    onChange={(e) => setNewLeadData({...newLeadData, firstName: e.target.value})}
                    placeholder="نام"
                    dir="rtl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">نام خانوادگی *</Label>
                  <Input
                    id="lastName"
                    value={newLeadData.lastName}
                    onChange={(e) => setNewLeadData({...newLeadData, lastName: e.target.value})}
                    placeholder="نام خانوادگی"
                    dir="rtl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">شماره تلفن *</Label>
                  <Input
                    id="phoneNumber"
                    value={newLeadData.phoneNumber}
                    onChange={(e) => setNewLeadData({...newLeadData, phoneNumber: e.target.value})}
                    placeholder="09123456789 یا +981234567890"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLeadData.email}
                    onChange={(e) => setNewLeadData({...newLeadData, email: e.target.value})}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <Label htmlFor="source">منبع سرنخ</Label>
                  <Select value={newLeadData.source} onValueChange={(value) => setNewLeadData({...newLeadData, source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب منبع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">وبسایت</SelectItem>
                      <SelectItem value="social_media">شبکه‌های اجتماعی</SelectItem>
                      <SelectItem value="referral">معرفی</SelectItem>
                      <SelectItem value="advertisement">تبلیغات</SelectItem>
                      <SelectItem value="walk_in">مراجعه حضوری</SelectItem>
                      <SelectItem value="call_center">مرکز تماس</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">اولویت</Label>
                  <Select value={newLeadData.priority} onValueChange={(value) => setNewLeadData({...newLeadData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب اولویت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">کم</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">زیاد</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="interestedLanguage">زبان مورد علاقه</Label>
                  <Select value={newLeadData.interestedLanguage} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLanguage: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب زبان" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">انگلیسی</SelectItem>
                      <SelectItem value="persian">فارسی</SelectItem>
                      <SelectItem value="arabic">عربی</SelectItem>
                      <SelectItem value="french">فرانسه</SelectItem>
                      <SelectItem value="german">آلمانی</SelectItem>
                      <SelectItem value="spanish">اسپانیایی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="interestedLevel">سطح مورد نظر</Label>
                  <Select value={newLeadData.interestedLevel} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب سطح" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدی</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">پیشرفته</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="preferredFormat">نوع کلاس</Label>
                  <Select value={newLeadData.preferredFormat} onValueChange={(value) => setNewLeadData({...newLeadData, preferredFormat: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">گروهی</SelectItem>
                      <SelectItem value="individual">خصوصی</SelectItem>
                      <SelectItem value="online">آنلاین</SelectItem>
                      <SelectItem value="in_person">حضوری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="budget">بودجه (تومان)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newLeadData.budget}
                    onChange={(e) => setNewLeadData({...newLeadData, budget: e.target.value})}
                    placeholder="1000000"
                    dir="ltr"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="notes">یادداشت‌ها</Label>
                  <Textarea
                    id="notes"
                    value={newLeadData.notes}
                    onChange={(e) => setNewLeadData({...newLeadData, notes: e.target.value})}
                    placeholder="یادداشت‌های تکمیلی..."
                    rows={3}
                    dir="rtl"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="nextFollowUpDate">تاریخ پیگیری بعدی</Label>
                  <DatePicker
                    date={newLeadData.nextFollowUpDate}
                    onDateChange={(date) => setNewLeadData({...newLeadData, nextFollowUpDate: date})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewLeadForm(false)}>
                  انصراف
                </Button>
                <Button 
                  onClick={handleCreateLead}
                  disabled={createLeadMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createLeadMutation.isPending ? 'در حال ایجاد...' : 'ایجاد سرنخ'}
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
            <CardTitle className="text-sm font-medium">کل سرنخ‌ها</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سرنخ‌های جدید</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{newLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">واجد شرایط</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{qualifiedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تبدیل شده</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{convertedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ تبدیل</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>جستجو</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="نام، ایمیل یا تلفن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <Label>وضعیت</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="new">جدید</SelectItem>
                  <SelectItem value="contacted">تماس گرفته شده</SelectItem>
                  <SelectItem value="interested">علاقه‌مند</SelectItem>
                  <SelectItem value="qualified">واجد شرایط</SelectItem>
                  <SelectItem value="converted">تبدیل شده</SelectItem>
                  <SelectItem value="lost">از دست رفته</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>اولویت</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه اولویت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه اولویت‌ها</SelectItem>
                  <SelectItem value="low">کم</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">زیاد</SelectItem>
                  <SelectItem value="urgent">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>منبع</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه منابع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه منابع</SelectItem>
                  <SelectItem value="website">وبسایت</SelectItem>
                  <SelectItem value="social_media">شبکه‌های اجتماعی</SelectItem>
                  <SelectItem value="referral">معرفی</SelectItem>
                  <SelectItem value="advertisement">تبلیغات</SelectItem>
                  <SelectItem value="walk_in">مراجعه حضوری</SelectItem>
                  <SelectItem value="call_center">مرکز تماس</SelectItem>
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
                <span>{bulkSelected.length} سرنخ انتخاب شده</span>
                <Button variant="outline" size="sm" onClick={() => setBulkSelected([])}>
                  لغو انتخاب
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('contacted')}>
                  علامت‌گذاری تماس گرفته شده
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('qualified')}>
                  علامت‌گذاری واجد شرایط
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusUpdate('lost')}>
                  علامت‌گذاری از دست رفته
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>فهرست سرنخ‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
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
                      />
                    </TableHead>
                    <TableHead>نام</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>اولویت</TableHead>
                    <TableHead>منبع</TableHead>
                    <TableHead>زبان</TableHead>
                    <TableHead>مسئول</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: Lead) => (
                    <TableRow key={lead.id}>
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
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                          <div className="text-sm text-muted-foreground">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" dir="ltr">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {lead.phoneNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          {lead.status === 'new' ? 'جدید' :
                           lead.status === 'contacted' ? 'تماس گرفته شده' :
                           lead.status === 'interested' ? 'علاقه‌مند' :
                           lead.status === 'qualified' ? 'واجد شرایط' :
                           lead.status === 'converted' ? 'تبدیل شده' :
                           lead.status === 'lost' ? 'از دست رفته' : lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(lead.priority)}>
                          {lead.priority === 'low' ? 'کم' :
                           lead.priority === 'medium' ? 'متوسط' :
                           lead.priority === 'high' ? 'زیاد' :
                           lead.priority === 'urgent' ? 'فوری' : lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.source === 'website' ? 'وبسایت' :
                         lead.source === 'social_media' ? 'شبکه‌های اجتماعی' :
                         lead.source === 'referral' ? 'معرفی' :
                         lead.source === 'advertisement' ? 'تبلیغات' :
                         lead.source === 'walk_in' ? 'مراجعه حضوری' :
                         lead.source === 'call_center' ? 'مرکز تماس' : lead.source}
                      </TableCell>
                      <TableCell>{lead.interestedLanguage}</TableCell>
                      <TableCell>{lead.assignedToName || 'تخصیص نیافته'}</TableCell>
                      <TableCell>{formatPersianDate(lead.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadDetails(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              مشاهده جزئیات
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setShowCommunicationForm(true);
                            }}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              ثبت ارتباط
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <PhoneCall className="mr-2 h-4 w-4" />
                              تماس تلفنی
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'contacted')}>
                              تماس گرفته شده
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'qualified')}>
                              واجد شرایط
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'converted')}>
                              تبدیل شده
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'lost')}>
                              از دست رفته
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
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>ثبت ارتباط</DialogTitle>
            <DialogDescription>
              ارتباط با {selectedLead?.firstName} {selectedLead?.lastName} را ثبت کنید
            </DialogDescription>
          </DialogHeader>
          
          {communicationFormLoading ? (
            <div className="py-8 text-center">در حال بارگذاری فرم...</div>
          ) : communicationFormDefinition ? (
            <DynamicForm
              formDefinition={communicationFormDefinition}
              onSubmit={handleCommunicationSubmit}
              disabled={createCommunicationMutation.isPending}
              showTitle={false}
            />
          ) : (
            <div className="py-8 text-center text-red-600">خطا در بارگذاری فرم</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}