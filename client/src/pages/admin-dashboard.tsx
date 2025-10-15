import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  Search,
  Filter,
  Plus,
  Edit,
  Eye
} from "lucide-react";

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingLeads: number;
  todaysSessions: number;
  overdueInvoices: number;
}

interface StudentSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  enrolledCourses: number;
  totalPayments: number;
  lastActivity: string;
}

interface LeadSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  interestedCourses: string[];
  assignedTo: string;
  followUpDate: string;
  createdAt: string;
}

interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  studentName: string;
  amount: number;
  status: string;
  dueDate: string;
  courseName: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation(['admin', 'common']);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: students } = useQuery<StudentSummary[]>({
    queryKey: ['/api/admin/students'],
  });

  const { data: leads } = useQuery<LeadSummary[]>({
    queryKey: ['/api/admin/leads'],
  });

  const { data: invoices } = useQuery<InvoiceSummary[]>({
    queryKey: ['/api/admin/invoices'],
  });

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredLeads = leads?.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'qualified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'enrolled': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin:dashboard.instituteManagement')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('admin:dashboard.comprehensiveCRM')}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('admin:dashboard.totalStudents')}
                  </p>
                  <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {stats?.activeStudents || 0} {t('admin:dashboard.active')}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('admin:dashboard.monthlyRevenue')}
                  </p>
                  <p className="text-2xl font-bold">${stats?.monthlyRevenue || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('admin:dashboard.total')}: ${stats?.totalRevenue || 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('admin:dashboard.pendingLeads')}
                  </p>
                  <p className="text-2xl font-bold">{stats?.pendingLeads || 0}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {t('admin:dashboard.requireFollowUp')}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('admin:dashboard.todaysSessions')}
                  </p>
                  <p className="text-2xl font-bold">{stats?.todaysSessions || 0}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {stats?.overdueInvoices || 0} {t('admin:dashboard.overdueInvoices')}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-full lg:w-auto min-w-max">
              <TabsTrigger value="overview" className="min-w-[100px]">{t('admin:dashboard.overview')}</TabsTrigger>
              <TabsTrigger value="students" className="min-w-[100px]">{t('admin:dashboard.students')}</TabsTrigger>
              <TabsTrigger value="leads" className="min-w-[100px]">{t('admin:dashboard.leads')}</TabsTrigger>
              <TabsTrigger value="finance" className="min-w-[100px]">{t('admin:dashboard.finance')}</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin:dashboard.recentStudentActivity')}</CardTitle>
                  <CardDescription>{t('admin:dashboard.latestEnrollments')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students?.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {student.enrolledCourses} {t('admin:dashboard.courses')} • {t('admin:dashboard.lastActive')}: {student.lastActivity}
                          </p>
                        </div>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin:dashboard.urgentFollowUps')}</CardTitle>
                  <CardDescription>{t('admin:dashboard.leadsRequiringAttention')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leads?.filter(lead => lead.status === 'new' || lead.status === 'contacted')
                      .slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {lead.source} • {t('admin:dashboard.followUp')}: {lead.followUpDate}
                          </p>
                        </div>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 flex-1">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('admin:dashboard.searchStudents')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  {t('admin:dashboard.filter')}
                </Button>
              </div>
              <Button className="w-full sm:w-auto min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                {t('admin:dashboard.addStudent')}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:dashboard.student')}</TableHead>
                      <TableHead>{t('admin:dashboard.contact')}</TableHead>
                      <TableHead>{t('admin:dashboard.status')}</TableHead>
                      <TableHead>{t('admin:dashboard.courses')}</TableHead>
                      <TableHead>{t('admin:dashboard.totalPaid')}</TableHead>
                      <TableHead>{t('admin:dashboard.lastActivity')}</TableHead>
                      <TableHead>{t('admin:dashboard.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ID: STU-{student.id.toString().padStart(4, '0')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1" />
                              {student.email}
                            </div>
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {student.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {student.enrolledCourses}
                          </div>
                        </TableCell>
                        <TableCell>${student.totalPayments}</TableCell>
                        <TableCell>{student.lastActivity}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 flex-1">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('admin:dashboard.searchLeads')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <Button className="w-full sm:w-auto min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                {t('admin:dashboard.addLead')}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:dashboard.lead')}</TableHead>
                      <TableHead>{t('admin:dashboard.contact')}</TableHead>
                      <TableHead>{t('admin:dashboard.source')}</TableHead>
                      <TableHead>{t('admin:dashboard.status')}</TableHead>
                      <TableHead>{t('admin:dashboard.interestedCourses')}</TableHead>
                      <TableHead>{t('admin:dashboard.assignedTo')}</TableHead>
                      <TableHead>{t('admin:dashboard.followUp')}</TableHead>
                      <TableHead>{t('admin:dashboard.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t('admin:dashboard.created')}: {lead.createdAt}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1" />
                              {lead.email}
                            </div>
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lead.interestedCourses.slice(0, 2).map((course, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {course}
                              </Badge>
                            ))}
                            {lead.interestedCourses.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{lead.interestedCourses.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{lead.assignedTo}</TableCell>
                        <TableCell>{lead.followUpDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4 flex-1">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <Button className="w-full sm:w-auto min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                        </TableCell>
                        <TableCell>{invoice.studentName}</TableCell>
                        <TableCell>{invoice.courseName}</TableCell>
                        <TableCell>${invoice.amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}