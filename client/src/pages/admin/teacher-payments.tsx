import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calculator,
  Download,
  Send,
  Edit,
  Users,
  TrendingUp,
  Calendar,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface TeacherPayment {
  id: number;
  teacherId: number;
  teacherName: string;
  period: string;
  totalSessions: number;
  totalHours: number;
  hourlyRate: number;
  basePay: number;
  bonuses: number;
  deductions: number;
  finalAmount: number;
  status: 'pending' | 'calculated' | 'approved' | 'paid';
  calculatedAt: string;
  paidAt?: string;
  callernHours?: number;
  callernRate?: number;
  callernPay?: number;
  department: 'regular' | 'callern' | 'both';
}

interface TeacherSession {
  date: string;
  type: '1-on-1' | 'group' | 'callern';
  studentName?: string;
  groupDetails?: string;
  startTime: string;
  endTime: string;
  duration: number;
  platform: string;
  courseTitle: string;
}

function SessionDetailsSection({ teacherId, period }: { teacherId: number; period: string }) {
  const { t } = useTranslation(['admin', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  
  // Convert period format from "current" to a proper date period
  const formatPeriod = (period: string) => {
    if (period === 'current') {
      const now = new Date();
      return `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    }
    return period;
  };

  const formattedPeriod = formatPeriod(period);
  
  const { data: sessions = [], isLoading, error } = useQuery<TeacherSession[]>({
    queryKey: ['/api/admin/teacher-payments', teacherId, 'sessions', formattedPeriod],
    queryFn: () => apiRequest(`/api/admin/teacher-payments/${teacherId}/sessions/${encodeURIComponent(formattedPeriod)}`),
    enabled: !!teacherId && !!formattedPeriod,
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const getSessionColor = (type: string) => {
    switch (type) {
      case '1-on-1': return 'border-blue-500';
      case 'group': return 'border-green-500';
      case 'callern': return 'border-purple-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center p-4 h-auto text-left font-semibold hover:bg-gray-50"
        >
          <span>{t('admin:teacherPayments.sessionDetailsSection')} ({(sessions as TeacherSession[]).length} {t('admin:teacherPayments.sessions')})</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {isLoading ? (
          <div className="text-center py-4">{t('admin:teacherPayments.loadingSessions')}</div>
        ) : error ? (
          <div className="text-center py-4 text-amber-600">
            <p className="mb-2">{t('admin:teacherPayments.sessionUnavailable')}</p>
            <p className="text-sm text-gray-500">{t('admin:teacherPayments.paymentAccurate')}</p>
          </div>
        ) : (sessions as TeacherSession[]).length === 0 ? (
          <div className="text-center py-4 text-gray-500">{t('admin:teacherPayments.noSessionsFound')}</div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(sessions as TeacherSession[]).map((session, index) => (
              <div key={index} className={`border-l-4 ${getSessionColor(session.type)} pl-4 py-2`}>
                <div className="font-medium">
                  {session.date} - {session.type === '1-on-1' ? t('admin:teacherPayments.oneOnOneSession') : 
                                    session.type === 'group' ? t('admin:teacherPayments.groupClass') : t('admin:teacherPayments.callernSession')}
                </div>
                <div className="text-sm text-gray-600">
                  {session.type === '1-on-1' ? `${t('admin:teacherPayments.student')}: ${session.studentName}` :
                   session.type === 'group' ? session.groupDetails :
                   `${t('admin:teacherPayments.student')}: ${session.studentName}`}
                </div>
                <div className="text-sm text-gray-500">
                  {session.startTime}-{session.endTime} ({session.duration} hrs) - {session.platform}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface Teacher {
  id: number;
  name: string;
  hourlyRate: number;
  callernRate?: number;
  totalSessions: number;
  totalHours: number;
  performance: number;
  department: 'regular' | 'callern' | 'both';
}

export default function TeacherPaymentsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { language, isRTL, direction } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedTeacherForHistory, setSelectedTeacherForHistory] = useState<string>("all");

  // Fetch teacher payments data
  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/teacher-payments', selectedPeriod],
  });



  // Fetch teachers data with their individual rates
  const { data: teachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/rates']
  });

  // Calculate payments mutation using individual teacher rates
  const calculatePaymentsMutation = useMutation({
    mutationFn: (period: string) => 
      apiRequest('/api/admin/teacher-payments/calculate', { 
        method: 'POST', 
        body: JSON.stringify({ period, useIndividualRates: true }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: t('common:toast.paymentsCalculated'),
        description: "Teacher payments calculated using individual hourly rates.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
    },
  });

  // Update teacher rate mutation
  const updateTeacherRateMutation = useMutation({
    mutationFn: ({ teacherId, regularRate, callernRate }: { teacherId: number, regularRate: number, callernRate?: number }) => 
      apiRequest(`/api/teachers/${teacherId}/rates`, {
        method: 'PUT',
        body: JSON.stringify({ regularRate, callernRate }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: t('common:toast.rateUpdated'),
        description: "Teacher hourly rate has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/rates'] });
    },
  });

  // Approve payment mutation
  const approvePaymentMutation = useMutation({
    mutationFn: (paymentId: number) => 
      apiRequest(`/api/admin/teacher-payments/${paymentId}/approve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: t('common:toast.paymentApproved'),
        description: "Payment has been approved for processing.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
    },
  });

  // Download report mutation
  const downloadReportMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/admin/teacher-payments/download-report', { 
        method: 'GET'
      }),
    onSuccess: (data) => {
      // Create and trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher-payments-${selectedPeriod}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('common:toast.reportDownloaded'),
        description: "Payment report has been downloaded successfully.",
      });
      // Invalidate to refresh UI state
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
    },
  });

  // Send to accounting mutation
  const sendToAccountingMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/admin/teacher-payments/send-to-accounting', { 
        method: 'POST',
        body: JSON.stringify({ period: selectedPeriod, payments }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (data) => {
      toast({
        title: t('common:toast.sentToAccounting'),
        description: `Payment data sent successfully. Tracking ID: ${data.trackingId}`,
      });
      // Invalidate to refresh payment status
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
    },
  });

  // Update rate structure mutation
  const updateRateStructureMutation = useMutation({
    mutationFn: (rateData: { baseRate: number; callernRate: number; effectiveDate: string }) => 
      apiRequest('/api/admin/teacher-payments/update-rate-structure', { 
        method: 'POST',
        body: JSON.stringify(rateData),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Rate Structure Updated",
        description: "Both regular and callern rates have been updated successfully.",
      });
      // Add missing query invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'calculated': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header Section */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200/50 backdrop-blur-sm p-8 mb-10">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {t('admin:teacherPayments.title')}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500 font-medium">{t('admin:teacherPayments.liveSystemActive')}</span>
                    </div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                  {t('admin:teacherPayments.automatedDescription')}
                </p>
              </div>
              
              {/* Quick Stats Summary */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center shadow-lg min-w-[140px]">
                  <div className="text-3xl font-bold mb-1">1,250,000</div>
                  <div className="text-green-100 font-medium text-sm">{t('admin:teacherPayments.irrPending')}</div>
                  <div className="text-xs text-green-200 mt-1">5 {t('admin:teacherPayments.sessionsPending')}</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 text-white text-center shadow-lg min-w-[140px]">
                  <div className="text-3xl font-bold mb-1">156</div>
                  <div className="text-blue-100 font-medium text-sm">{t('admin:teacherPayments.sessions')}</div>
                  <div className="text-xs text-blue-200 mt-1">{t('admin:teacherPayments.fromLastMonth')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Payment Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-green-800">
                  {t('admin:teacherPayments.totalPending')}
                </CardTitle>
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-700 mb-1">1,250,000</div>
                <div className="text-lg font-medium text-green-700 mb-2">IRR</div>
                <p className="text-xs text-green-600 font-medium">
                  5 {t('admin:teacherPayments.teachers')} {t('admin:teacherPayments.sessionsPending')}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 border-0 shadow-lg hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-blue-800">
                  {t('admin:teacherPayments.sessionsThisMonth')}
                </CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-blue-700 mb-2">156</div>
                <p className="text-xs text-blue-600 font-medium">
                  +12% {t('admin:teacherPayments.fromLastMonth')}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 border-0 shadow-lg hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-purple-800">
                  {t('admin:teacherPayments.averageHourlyRate')}
                </CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-purple-700 mb-1">75,000</div>
                <div className="text-lg font-medium text-purple-700 mb-2">IRR</div>
                <p className="text-xs text-purple-600 font-medium">
                  {t('admin:teacherPayments.persianLanguageStandard')}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border-0 shadow-lg hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-orange-800">
                  {t('admin:teacherPayments.paymentIssues')}
                </CardTitle>
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-orange-700 mb-2">2</div>
                <p className="text-xs text-orange-600 font-medium">
                  {t('admin:teacherPayments.requiresReview')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="payments" className="space-y-8">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-4xl grid-cols-4 bg-white shadow-lg border border-gray-200 p-2 rounded-2xl">
                <TabsTrigger value="payments" className="rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('admin:teacherPayments.paymentOverview')}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="sessions" className="rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('admin:teacherPayments.sessionDetails')}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('admin:teacherPayments.paymentHistory')}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="reports" className="rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('admin:teacherPayments.paymentReports')}
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="payments">
              <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-8">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900">{t('admin:teacherPayments.title')}</CardTitle>
                      </div>
                      <CardDescription className="text-lg text-gray-600">
                        {t('admin:teacherPayments.payrollOverview')}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-6 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-sm hover:border-gray-300 transition-colors"
                      >
                        <option value="current">{t('common:currentMonth')}</option>
                        <option value="previous">{t('common:previousMonth')}</option>
                        <option value="custom">{t('common:customPeriod')}</option>
                      </select>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                            <Calculator className="h-5 w-5" />
                            {t('admin:teacherPayments.calculatePayments')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('admin:teacherPayments.calculateTitle')}</DialogTitle>
                            <DialogDescription>
                              {t('admin:teacherPayments.calculateDescription')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Label>{t('admin:teacherPayments.periodLabel')}</Label>
                            <Select defaultValue={selectedPeriod}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="current">{t('common:currentMonth')}</SelectItem>
                                <SelectItem value="previous">{t('common:previousMonth')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2 justify-end">
                              <Button
                                onClick={() => calculatePaymentsMutation.mutate(selectedPeriod)}
                                disabled={calculatePaymentsMutation.isPending}
                              >
                                {calculatePaymentsMutation.isPending ? t('common:calculating') : t('admin:teacherPayments.calculatePayments')}
                              </Button>
                              <DialogClose asChild>
                                <Button variant="outline">{t('common:cancel')}</Button>
                              </DialogClose>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-4">{t('common:loadingPaymentData')}</div>
                    ) : error ? (
                      <div className="text-center py-4 text-red-500">{t('admin:teacherPayments.errorLoadingPayments')}: {error?.message}</div>
                    ) : (payments as TeacherPayment[])?.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                    {t('admin:teacherPayments.noPaymentsFound')} {selectedPeriod}. 
                    <br />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => calculatePaymentsMutation.mutate(selectedPeriod)}
                    >
                      {t('admin:teacherPayments.calculateForPeriod')}
                      </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('admin:teacherPayments.teacherName')}</TableHead>
                              <TableHead>{t('admin:teacherPayments.finalAmount')}</TableHead>
                              <TableHead>{t('admin:teacherPayments.status')}</TableHead>
                              <TableHead>{t('admin:teacherPayments.actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                      {(payments as TeacherPayment[])?.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                <img 
                                  src={`/uploads/teacher-photos/${payment.teacherId}.jpg`}
                                  alt={payment.teacherName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (nextElement) {
                                      nextElement.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold" style={{display: 'none'}}>
                                  {payment.teacherName.charAt(0)}
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-lg">{payment.teacherName}</div>
                                <div className="text-sm text-gray-500">{t('admin:teacherPayments.id')}: {payment.teacherId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-right">
                              <div className="font-bold text-2xl text-green-600">
                                {formatCurrency(payment.finalAmount || 0, 'IRR')}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {payment.totalHours} hours • {formatCurrency(payment.hourlyRate || 0, 'IRR')}/hr
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Base: {formatCurrency(payment.basePay || 0, 'IRR')} | Bonus: +{formatCurrency(payment.bonuses || 0, 'IRR')} | Deduct: -{formatCurrency(payment.deductions || 0, 'IRR')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getStatusColor(payment.status)} px-3 py-1 text-sm font-medium`}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4" />
                                    <span>{t('admin:teacherPayments.payslipDetails')}</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{t('admin:teacherPayments.payslipDetails')} - {payment.teacherName}</DialogTitle>
                                    <DialogDescription>
                                      {t('admin:teacherPayments.completeBreakdown')} {payment.period}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    {/* Teacher Info with Photo */}
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                          <img 
                                            src={`/uploads/teacher-photos/${payment.teacherId}.jpg`}
                                            alt={payment.teacherName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                              if (nextElement) {
                                                nextElement.style.display = 'flex';
                                              }
                                            }}
                                          />
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs" style={{display: 'none'}}>
                                            {t('admin:teacherPayments.noPhoto')}
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{t('admin:teacherPayments.teacher')}</Label>
                                          <div className="font-medium">{payment.teacherName}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{t('admin:teacherPayments.period')}</Label>
                                        <div className="font-medium">{payment.period}</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{t('admin:teacherPayments.paymentStatus')}</Label>
                                        <Badge className={getStatusColor(payment.status)}>
                                          {payment.status}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Session Details */}
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs text-gray-500">{t('admin:teacherPayments.totalSessions')}</Label>
                                        <div className="text-2xl font-bold">{payment.totalSessions}</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{t('admin:teacherPayments.totalHours')}</Label>
                                        <div className="text-2xl font-bold">{payment.totalHours}</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{t('admin:teacherPayments.hourlyRate')}</Label>
                                        <div className="text-2xl font-bold">{formatCurrency(payment.hourlyRate || 0, 'IRR')}</div>
                                      </div>
                                    </div>

                                    {/* Session Details */}
                                    <SessionDetailsSection 
                                      teacherId={payment.teacherId} 
                                      period={payment.period} 
                                    />

                                    {/* Payment Breakdown */}
                                    <div className="border rounded-lg p-4">
                                      <h3 className="font-semibold mb-3">{t('admin:teacherPayments.paymentCalculation')}</h3>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>{t('admin:teacherPayments.regularSessions')} ({payment.totalHours - (payment.callernHours || 0)} {t('admin:teacherPayments.hours')} × {formatCurrency(payment.hourlyRate || 0, 'IRR')})</span>
                                          <span className="font-medium">{formatCurrency((payment.totalHours - (payment.callernHours || 0)) * (payment.hourlyRate || 0), 'IRR')}</span>
                                        </div>
                                        {payment.callernHours && (
                                          <div className="flex justify-between">
                                            <span>{t('admin:teacherPayments.callernSessions')} ({payment.callernHours} {t('admin:teacherPayments.hours')} × {formatCurrency(850000, 'IRR')})</span>
                                            <span className="font-medium">{formatCurrency(payment.callernHours * 850000, 'IRR')}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between text-green-600">
                                          <span>{t('admin:teacherPayments.performanceBonuses')}</span>
                                          <span className="font-medium">+{formatCurrency(payment.bonuses || 0, 'IRR')}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                          <span>{t('admin:teacherPayments.administrativeDeductions')}</span>
                                          <span className="font-medium">-{formatCurrency(payment.deductions || 0, 'IRR')}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                          <span>{t('admin:teacherPayments.finalPaymentAmount')}</span>
                                          <span>{formatCurrency(payment.finalAmount || 0, 'IRR')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 mt-6">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline">
                                          <Edit className="h-4 w-4" />
                                          <span className="ms-2">{t('admin:teacherPayments.editPayslip')}</span>
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>{t('admin:teacherPayments.editPayslipTitle')} - {payment.teacherName}</DialogTitle>
                                          <DialogDescription>
                                            {t('admin:teacherPayments.modifyPaymentDetails')}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-6">
                                          {/* Current Payslip Summary */}
                                          <div className="bg-gray-50 rounded-lg p-4 border">
                                            <h4 className="font-semibold text-gray-800 mb-2">{t('admin:teacherPayments.currentPayslip')}</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>{t('admin:teacherPayments.basePay')}: <span className="font-medium">{formatCurrency(payment.basePay || 0, 'IRR')}</span></div>
                                              <div>{t('admin:teacherPayments.hours')}: <span className="font-medium">{payment.totalHours}</span></div>
                                              <div>{t('admin:teacherPayments.hourlyRate')}: <span className="font-medium">{formatCurrency(payment.hourlyRate || 0, 'IRR')}</span></div>
                                              <div>{t('admin:teacherPayments.paymentPeriod')}: <span className="font-medium">{payment.period}</span></div>
                                              <div>{t('admin:teacherPayments.bonuses')}: <span className="font-medium text-green-600">+{formatCurrency(payment.bonuses || 0, 'IRR')}</span></div>
                                              <div>{t('admin:teacherPayments.deductions')}: <span className="font-medium text-red-600">-{formatCurrency(payment.deductions || 0, 'IRR')}</span></div>
                                              <div className="col-span-2 pt-2 border-t">
                                                <span className="text-lg font-bold">{t('admin:teacherPayments.total')}: {formatCurrency(payment.finalAmount || 0, 'IRR')}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <form data-payment-id={payment.id} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-sm font-medium">Base Pay (IRR)</Label>
                                                <Input 
                                                  name="basePay" 
                                                  type="number" 
                                                  defaultValue={payment.basePay}
                                                  className="mt-1"
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium">Bonuses (IRR)</Label>
                                                <Input 
                                                  name="bonuses" 
                                                  type="number" 
                                                  defaultValue={payment.bonuses}
                                                  className="mt-1"
                                                />
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-sm font-medium">Deductions (IRR)</Label>
                                                <Input 
                                                  name="deductions" 
                                                  type="number" 
                                                  defaultValue={payment.deductions}
                                                  className="mt-1"
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium">Total Hours</Label>
                                                <Input 
                                                  name="totalHours" 
                                                  type="number" 
                                                  defaultValue={payment.totalHours}
                                                  className="mt-1"
                                                />
                                              </div>
                                            </div>
                                            
                                            {/* Live Calculation Preview */}
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                              <h5 className="font-medium text-blue-800 mb-2">💡 {t('admin:teacherPayments.liveCalculationPreview')}</h5>
                                              <p className="text-sm text-blue-600">
                                                {t('admin:teacherPayments.changesWillRecalculate')}
                                              </p>
                                            </div>
                                          </form>
                                          <div className="flex justify-end gap-2">
                                            <DialogClose asChild>
                                              <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={async () => {
                                              try {
                                                // Get form values from the nearest form
                                                const form = document.querySelector(`form[data-payment-id="${payment.id}"]`) as HTMLFormElement;
                                                if (!form) throw new Error('Form not found');
                                                
                                                const formData = new FormData(form);
                                                const updatedPayment = {
                                                  basePay: parseInt(formData.get('basePay') as string),
                                                  bonuses: parseInt(formData.get('bonuses') as string),
                                                  deductions: parseInt(formData.get('deductions') as string),
                                                  totalHours: parseInt(formData.get('totalHours') as string),
                                                  hourlyRate: payment.hourlyRate,
                                                  previousAmount: payment.finalAmount
                                                };
                                                
                                                // Call API to update and recalculate payment
                                                const response = await apiRequest(`/api/admin/teacher-payments/${payment.id}/update`, {
                                                  method: 'PUT',
                                                  body: JSON.stringify(updatedPayment)
                                                });
                                                
                                                // Refresh data to show new calculations
                                                queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
                                                
                                                // Show detailed success message with calculation changes
                                                if (response.changes) {
                                                  const { newAmount, previousAmount, difference } = response.changes;
                                                  toast({
                                                    title: "Payslip Recalculated",
                                                    description: `Amount changed from ${formatCurrency(previousAmount || 0, 'IRR')} to ${formatCurrency(newAmount || 0, 'IRR')} (${difference > 0 ? '+' : ''}${formatCurrency(Math.abs(difference || 0), 'IRR')})`,
                                                  });
                                                } else {
                                                  toast({
                                                    title: "Payslip Updated",
                                                    description: "Payment details have been recalculated successfully.",
                                                  });
                                                }
                                              } catch (error) {
                                                console.error('Payslip update error:', error);
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to update and recalculate payslip",
                                                  variant: "destructive"
                                                });
                                              }
                                            }}>
                                              <Calculator className="h-4 w-4" />
                                              <span className="ms-2">{t('admin:teacherPayments.recalculateAndSave')}</span>
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button 
                                      onClick={async () => {
                                        try {
                                          // Approve payment
                                          await approvePaymentMutation.mutateAsync(payment.id);
                                          
                                          // Send SMS notification to teacher
                                          await apiRequest('/api/admin/teacher-payments/send-approval-sms', {
                                            method: 'POST',
                                            body: JSON.stringify({
                                              teacherId: payment.teacherId,
                                              teacherName: payment.teacherName,
                                              amount: payment.finalAmount,
                                              period: payment.period
                                            })
                                          });
                                          
                                          toast({
                                            title: t('common:toast.paymentApproved'),
                                            description: `Payslip approved and SMS sent to ${payment.teacherName}`,
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to approve payment or send SMS",
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                      disabled={payment.status === 'approved' || approvePaymentMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="ms-2">{payment.status === 'approved' ? t('admin:teacherPayments.alreadyApproved') : t('admin:teacherPayments.approveAndSendSMS')}</span>
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:teacherPayments.sessionBasedPaymentDetails')}</CardTitle>
              <CardDescription>
                {t('admin:teacherPayments.detailedBreakdown')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                {t('admin:teacherPayments.sessionPaymentDetails')}
                <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                  <li>• {t('admin:teacherPayments.sessionCompletionStatus')}</li>
                  <li>• {t('admin:teacherPayments.sessionDuration')}</li>
                  <li>• {t('admin:teacherPayments.studentAttendance')}</li>
                  <li>• {t('admin:teacherPayments.performanceBonuses')}</li>
                  <li>• {t('admin:teacherPayments.iranianLaborCompliance')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>





        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:teacherPayments.paymentHistory')}</CardTitle>
              <CardDescription>
                {t('admin:teacherPayments.historicalRecords')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Select defaultValue="all" value={selectedTeacherForHistory} onValueChange={setSelectedTeacherForHistory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('admin:teacherPayments.selectTeacher')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common:allTeachers')}</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Fetch payment history for selected teacher with proper authentication
                      const teacherId = selectedTeacherForHistory === "all" ? teachers[0]?.id || 1 : parseInt(selectedTeacherForHistory);
                      apiRequest(`/api/admin/teacher-payments/history/${teacherId}`)
                        .then(data => {
                          console.log('Payment history:', data);
                          toast({
                            title: t('admin:teacherPayments.paymentHistory'),
                            description: `${t('admin:teacherPayments.retrievedRecords')} ${data.payments.length} ${teachers.find(t => t.id === teacherId)?.name || 'teacher'}`,
                          });
                        })
                        .catch(err => {
                          toast({
                            title: "Error",
                            description: t('admin:teacherPayments.failedToFetchHistory'),
                            variant: "destructive"
                          });
                        });
                    }}
                  >
                    {t('admin:teacherPayments.loadHistory')}
                  </Button>
                </div>
                
                <div className="border rounded-lg">
                  <div className="grid grid-cols-7 gap-4 p-4 border-b bg-gray-50 font-medium text-sm">
                    <div>{t('admin:teacherPayments.period')}</div>
                    <div>{t('admin:teacherPayments.sessions')}</div>
                    <div>{t('admin:teacherPayments.hours')}</div>
                    <div>{t('admin:teacherPayments.grossAmount')}</div>
                    <div>{t('admin:teacherPayments.deductions')}</div>
                    <div>{t('admin:teacherPayments.netAmount')}</div>
                    <div>{t('admin:teacherPayments.status')}</div>
                  </div>
                  
                  {/* Sample payment history rows */}
                  {[
                    { period: '2024-12', sessions: 42, hours: 63, gross: 47250000, deductions: 8977500, net: 38272500, status: 'paid' },
                    { period: '2024-11', sessions: 38, hours: 57, gross: 42750000, deductions: 8122500, net: 34627500, status: 'paid' },
                    { period: '2024-10', sessions: 45, hours: 68, gross: 51000000, deductions: 9690000, net: 41310000, status: 'approved' },
                  ].map((record, index) => (
                    <div key={index} className="grid grid-cols-7 gap-4 p-4 border-b text-sm">
                      <div>{record.period}</div>
                      <div>{record.sessions}</div>
                      <div>{record.hours}h</div>
                      <div className="font-medium">{formatCurrency(record.gross, 'IRR')}</div>
                      <div className="text-red-600">-{formatCurrency(record.deductions, 'IRR')}</div>
                      <div className="font-medium text-green-600">{formatCurrency(record.net, 'IRR')}</div>
                      <div>
                        <Badge variant={record.status === 'paid' ? 'default' : record.status === 'approved' ? 'secondary' : 'outline'}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:teacherPayments.paymentReports')}</CardTitle>
              <CardDescription>
                {t('admin:teacherPayments.generateFinancialReports')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => downloadReportMutation.mutate()}
                    disabled={downloadReportMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                    <span className="ms-2">{downloadReportMutation.isPending ? t('admin:teacherPayments.generating') : t('admin:teacherPayments.downloadMonthlyReport')}</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => sendToAccountingMutation.mutate()}
                    disabled={sendToAccountingMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                    <span className="ms-2">{sendToAccountingMutation.isPending ? t('admin:teacherPayments.sending') : t('admin:teacherPayments.sendToAccounting')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
