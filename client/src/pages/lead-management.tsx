import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  Filter,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Target,
  PhoneCall,
  MessageSquare,
  FileText,
  Headphones,
  Plus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import type { Lead } from "@shared/schema";

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  hotLeads: number;
  followUpsDue: number;
}

export default function LeadManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    source: '',
    status: 'new',
    priority: 'medium',
    interestedLanguage: '',
    interestedLevel: '',
    preferredFormat: '',
    budget: '',
    notes: ''
  });

  // Debug authentication
  const hasToken = !!localStorage.getItem('auth_token');
  console.log('Has auth token:', hasToken);

  // Fetch leads from local database - works offline in Iran
  const { data: leads = [], isLoading, error } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: hasToken // Only run query if user has token
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      console.log("🚀 Making API request with data:", leadData);
      const response = await apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify(leadData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("✅ API response received:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("🎉 Lead creation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowNewLeadForm(false);
      setNewLeadData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        source: '',
        status: 'new',
        priority: 'medium',
        interestedLanguage: '',
        interestedLevel: '',
        preferredFormat: '',
        budget: '',
        notes: ''
      });
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: (error: any) => {
      console.error("❌ Lead creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    }
  });

  // VoIP call mutation
  const initiateVoIPCall = useMutation({
    mutationFn: async ({ phoneNumber, contactName }: { phoneNumber: string; contactName: string }) => {
      return apiRequest("/api/voip/initiate-call", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          contactName,
          recordCall: true,
          source: 'lead_management'
        })
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
    if (!lead.phoneNumber) {
      toast({
        title: "No Phone Number",
        description: `${lead.firstName} ${lead.lastName} does not have a phone number.`,
        variant: "destructive",
      });
      return;
    }

    initiateVoIPCall.mutate({
      phoneNumber: lead.phoneNumber,
      contactName: `${lead.firstName} ${lead.lastName}`
    });
  };

  // Handle create lead
  const handleCreateLead = () => {
    console.log("🔥 handleCreateLead clicked! Form data:", newLeadData);
    
    if (!newLeadData.firstName || !newLeadData.lastName || !newLeadData.phoneNumber) {
      console.log("❌ Validation failed - missing fields:", {
        firstName: newLeadData.firstName,
        lastName: newLeadData.lastName,
        phoneNumber: newLeadData.phoneNumber
      });
      toast({
        title: "Missing Required Fields",
        description: "Please fill in first name, last name, and phone number.",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Validation passed, calling mutation...");
    createLeadMutation.mutate(newLeadData);
  };

  // Calculate real statistics from database data
  const stats: LeadStats = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'new').length;
    const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    const hotLeads = leads.filter(lead => lead.priority === 'high').length;
    
    const now = new Date();
    const followUpsDue = leads.filter(lead => {
      if (!lead.nextFollowUpDate) return false;
      const followUpDate = new Date(lead.nextFollowUpDate);
      return followUpDate <= now;
    }).length;

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      avgResponseTime: 2.5, // This would need separate tracking
      hotLeads,
      followUpsDue
    };
  }, [leads]);

  // Filter leads based on search and status - all data from local Iranian database
  const filteredLeads = useMemo(() => {
    if (!leads || !Array.isArray(leads)) return [];
    
    return leads.filter(lead => {
      const matchesSearch = searchTerm === "" || 
        (lead.firstName && lead.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.lastName && lead.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phoneNumber && lead.phoneNumber.includes(searchTerm));
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-purple-100 text-purple-800";
      case "converted": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "contacted": return "Contacted";
      case "qualified": return "Qualified";
      case "converted": return "Converted";
      case "lost": return "Lost";
      default: return status;
    }
  };



  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold">{stats.totalLeads}</p>
                <p className="text-sm text-blue-600">+{stats.newLeads} new</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qualified</p>
                <p className="text-3xl font-bold">{stats.qualifiedLeads}</p>
                <p className="text-sm text-purple-600">{((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                <p className="text-sm text-green-600">+2.3% this month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Follow-ups Today</p>
                <p className="text-3xl font-bold">{stats.followUpsDue}</p>
                <p className="text-sm text-orange-600">Action needed</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle>اقدامات اولویت‌دار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">لیدهای داغ</p>
                    <p className="text-sm text-red-600">{stats.hotLeads} لید نیاز به پیگیری فوری</p>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-3" variant="outline">
                  مشاهده همه
                </Button>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">پیگیری امروز</p>
                    <p className="text-sm text-yellow-600">{stats.followUpsDue} تماس برنامه‌ریزی شده</p>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-3" variant="outline">
                  شروع تماس‌ها
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">آماده تبدیل</p>
                    <p className="text-sm text-green-600">15 لید آماده ثبت‌نام</p>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-3" variant="outline">
                  ثبت‌نام
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Lead Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>مسیر فروش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-blue-600">23</span>
              </div>
              <p className="font-medium">جدید</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-yellow-600">18</span>
              </div>
              <p className="font-medium">تماس اول</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-purple-600">45</span>
              </div>
              <p className="font-medium">واجد شرایط</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-orange-600">28</span>
              </div>
              <p className="font-medium">پیشنهاد</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-green-600">67</span>
              </div>
              <p className="font-medium">تبدیل شده</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const LeadsTab = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در لیدها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="new">جدید</SelectItem>
            <SelectItem value="contacted">تماس گرفته شده</SelectItem>
            <SelectItem value="qualified">واجد شرایط</SelectItem>
            <SelectItem value="converted">تبدیل شده</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowNewLeadForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          لید جدید
        </Button>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">نام</th>
                  <th className="p-4 font-medium">منبع</th>
                  <th className="p-4 font-medium">زبان هدف</th>
                  <th className="p-4 font-medium">بودجه</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">اولویت</th>
                  <th className="p-4 font-medium">پیگیری بعدی</th>
                  <th className="p-4 font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      در حال بارگذاری اطلاعات لیدها...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-red-500">
                      {!hasToken 
                        ? "جهت دسترسی به لیدها، ابتدا وارد سیستم شوید" 
                        : "خطا در بارگذاری لیدها. لطفاً صفحه را مجدداً بارگذاری کنید."
                      }
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      لیدی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                          <p className="text-sm text-gray-500">{lead.email}</p>
                          <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="p-4">{lead.source}</td>
                      <td className="p-4">
                        <div>
                          <p>{lead.interestedLanguage || 'تعیین نشده'}</p>
                          <p className="text-sm text-gray-500">{lead.level}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.budget ? `${lead.budget.toLocaleString()} تومان` : 'تعیین نشده'}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(lead.status)}>
                          {getStatusText(lead.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority === "high" ? "بالا" : lead.priority === "medium" ? "متوسط" : "پایین"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {lead.nextFollowUpDate 
                            ? new Date(lead.nextFollowUpDate).toLocaleDateString('fa-IR') 
                            : 'تعیین نشده'
                          }
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            title="تماس تلفنی"
                            onClick={() => handleVoIPCall(lead)}
                            disabled={initiateVoIPCall.isPending}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="ارسال ایمیل">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="پیام">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="تنظیم پیگیری">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 space-y-6">
      {/* Modern Header Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Lead Management
                </h1>
                <p className="text-slate-600 text-lg">
                  Manage prospects and track the sales process
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.open('/callcenter/voip', '_blank')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Headphones className="h-4 w-4 mr-2" />
              VoIP Center
            </Button>
            <Dialog open={showNewLeadForm} onOpenChange={setShowNewLeadForm}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>
                    Add a new prospect to the system for follow-up and conversion.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newLeadData.firstName}
                      onChange={(e) => setNewLeadData({...newLeadData, firstName: e.target.value})}
                      placeholder={t('admin:leads.firstNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newLeadData.lastName}
                      onChange={(e) => setNewLeadData({...newLeadData, lastName: e.target.value})}
                      placeholder={t('admin:leads.lastNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={newLeadData.phoneNumber}
                      onChange={(e) => setNewLeadData({...newLeadData, phoneNumber: e.target.value})}
                      placeholder="+98 912 345 6789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLeadData.email}
                      onChange={(e) => setNewLeadData({...newLeadData, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Lead Source</Label>
                    <Select value={newLeadData.source} onValueChange={(value) => setNewLeadData({...newLeadData, source: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:leads.selectSource')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newLeadData.priority} onValueChange={(value) => setNewLeadData({...newLeadData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:leads.selectPriority')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="interestedLanguage">Interested Language</Label>
                    <Select value={newLeadData.interestedLanguage} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLanguage: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:leads.selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="persian">Persian</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="arabic">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="interestedLevel">Level</Label>
                    <Select value={newLeadData.interestedLevel} onValueChange={(value) => setNewLeadData({...newLeadData, interestedLevel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:leads.selectLevel')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredFormat">Preferred Format</Label>
                    <Select value={newLeadData.preferredFormat} onValueChange={(value) => setNewLeadData({...newLeadData, preferredFormat: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin:leads.selectFormat')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (IRR)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={newLeadData.budget}
                      onChange={(e) => setNewLeadData({...newLeadData, budget: e.target.value})}
                      placeholder="2000000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newLeadData.notes}
                      onChange={(e) => setNewLeadData({...newLeadData, notes: e.target.value})}
                      placeholder={t('admin:leads.notesPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowNewLeadForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateLead}
                    disabled={createLeadMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
              <FileText className="h-4 w-4 mr-2" />
              Lead Report
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="leads" className="rounded-md">Lead List</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="leads">
          <LeadsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}