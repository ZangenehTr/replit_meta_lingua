import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  FileText
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
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
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);

  // Debug authentication
  const hasToken = !!localStorage.getItem('auth_token');
  console.log('Has auth token:', hasToken);

  // Fetch leads from local database - works offline in Iran
  const { data: leads = [], isLoading, error } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: hasToken // Only run query if user has token
  });

  // Calculate real statistics from database data
  const stats: LeadStats = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'new').length;
    const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    const hotLeads = leads.filter(lead => lead.priority === 'high').length;
    
    const now = new Date();
    const followUpsDue = leads.filter(lead => {
      if (!lead.nextFollowUp) return false;
      const followUpDate = new Date(lead.nextFollowUp);
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
      case "new": return "جدید";
      case "contacted": return "تماس گرفته شده";
      case "qualified": return "واجد شرایط";
      case "converted": return "تبدیل شده";
      case "lost": return "از دست رفته";
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
                <p className="text-sm font-medium text-muted-foreground">کل لیدها</p>
                <p className="text-3xl font-bold">{stats.totalLeads}</p>
                <p className="text-sm text-blue-600">+{stats.newLeads} جدید</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">واجد شرایط</p>
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
                <p className="text-sm font-medium text-muted-foreground">نرخ تبدیل</p>
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                <p className="text-sm text-green-600">+2.3% این ماه</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">پیگیری امروز</p>
                <p className="text-3xl font-bold">{stats.followUpsDue}</p>
                <p className="text-sm text-orange-600">نیاز به اقدام</p>
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
                          <p>{lead.targetLanguage}</p>
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
                          {lead.nextFollowUp 
                            ? new Date(lead.nextFollowUp).toLocaleDateString('fa-IR') 
                            : 'تعیین نشده'
                          }
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" title="تماس تلفنی">
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مدیریت لیدها</h1>
          <p className="text-muted-foreground">مدیریت مشتریان بالقوه و پیگیری فرآیند فروش</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            گزارش لیدها
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="leads">لیست لیدها</TabsTrigger>
        </TabsList>

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