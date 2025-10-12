import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Banknote,
  Receipt,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Building
} from "lucide-react";

export function AdminFinancial() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [dateRange, setDateRange] = useState("30days");
  const [filterType, setFilterType] = useState("all");
  
  // Financial Reports state
  const [reportType, setReportType] = useState("trial-balance");
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch financial reports from real ledger
  const { data: reportData, isLoading: reportLoading, error: reportError, isError: reportIsError, refetch: refetchReport } = useQuery({
    queryKey: ['/api/admin/reports', reportType, reportStartDate, reportEndDate],
    queryFn: async () => {
      const endpoint = reportType === 'trial-balance' ? '/api/admin/reports/trial-balance'
        : reportType === 'balance-sheet' ? '/api/admin/reports/balance-sheet'
        : '/api/admin/reports/profit-loss';
      
      const response = await fetch(`${endpoint}?startDate=${reportStartDate}&endDate=${reportEndDate}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error(`Failed to fetch report: ${response.statusText}`);
      return response.json();
    },
    enabled: !!reportStartDate && !!reportEndDate
  });

  // Fetch financial data
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['/api/admin/financial', { range: dateRange, type: filterType }],
  });

  // Fetch financial overview stats from API
  const { data: overviewStats = [] } = useQuery({
    queryKey: ['/api/admin/financial/overview-stats', { range: dateRange }],
    select: (data: any[]) => data?.map(stat => ({
      ...stat,
      title: t(stat.titleKey || stat.title),
      description: t(stat.descriptionKey || stat.description)
    })) || []
  });

  // Calculate stable date range values using useMemo to prevent infinite refetching
  const { startDate, endDate } = useMemo(() => {
    const days = dateRange === '7days' ? 7 
                : dateRange === '30days' ? 30
                : dateRange === '90days' ? 90 
                : dateRange === '1year' ? 365
                : 30; // default to 30 days
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    return { startDate, endDate };
  }, [dateRange]);

  // Fetch REAL transactions from accounting ledger (STABLE query key)
  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['/api/admin/ledger/entries', { startDate, endDate, sourceType: filterType !== 'all' ? filterType : undefined }],
  });

  // Map ledger entries to transaction format
  const transactions = ledgerEntries?.map((entry: any) => ({
    id: `JE-${entry.journalEntryId}`,
    type: entry.sourceType,
    amount: parseFloat(entry.amount),
    currency: entry.currency || 'IRR',
    status: entry.status,
    date: new Date(entry.transactionDate).toISOString().split('T')[0],
    description: entry.description,
    referenceNumber: entry.referenceNumber,
    transactionType: entry.transactionType
  })) || [];

  // Fetch teacher payouts from ledger (STABLE query key)
  const { data: teacherPayoutEntries = [] } = useQuery({
    queryKey: ['/api/admin/ledger/entries', { startDate, endDate, sourceType: 'teacher_payout' }],
  });

  // Map teacher payout entries
  const teacherPayouts = teacherPayoutEntries?.map((entry: any) => ({
    id: entry.id,
    amount: parseFloat(entry.amount),
    status: entry.status,
    date: new Date(entry.transactionDate).toISOString().split('T')[0],
    description: entry.description,
    referenceNumber: entry.referenceNumber
  })) || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending':
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return t('admin:financial.completed');
      case 'paid': return t('admin:financial.completed');
      case 'pending': return t('admin:financial.pending');
      case 'scheduled': return t('admin:financial.pending');
      case 'failed': return t('admin:financial.failed');
      default: return status;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'course_payment': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'teacher_payout': return <Banknote className="h-4 w-4 text-blue-600" />;
      case 'refund': return <Receipt className="h-4 w-4 text-red-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 sm:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{t('admin:financial.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin:financial.overview')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-green-200 hover:bg-green-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin:financial.exportData')}</span>
            <span className="sm:hidden">{t('admin:financial.export')}</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin:financial.manualTransaction')}</span>
                <span className="sm:hidden">{t('admin:financial.add')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('admin:financial.createManualTransaction')}</DialogTitle>
                <DialogDescription>
                  {t('admin:financial.processManualPayments')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">{t('admin:financial.transactionType')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:financial.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">{t('admin:financial.coursePayment')}</SelectItem>
                      <SelectItem value="refund">{t('admin:financial.refund')}</SelectItem>
                      <SelectItem value="payout">{t('admin:financial.teacherPayout')}</SelectItem>
                      <SelectItem value="adjustment">{t('admin:financial.manualAdjustment')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('admin:financial.amount')}</Label>
                  <Input id="amount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('admin:financial.currency')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="irr">IRR</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">{t('admin:financial.paymentMethod')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:financial.selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shetab">{t('admin:financial.shetabIranian')}</SelectItem>
                      <SelectItem value="credit_card">{t('admin:financial.creditCards')}</SelectItem>
                      <SelectItem value="bank_transfer">{t('admin:financial.bankTransfer')}</SelectItem>
                      <SelectItem value="cash">{t('admin:financial.cash')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">{t('admin:financial.cancel')}</Button>
                <Button>{t('admin:financial.processTransaction')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-48 border-green-200 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">{t('admin:financial.last7Days')}</SelectItem>
            <SelectItem value="30days">{t('admin:financial.last30Days')}</SelectItem>
            <SelectItem value="90days">{t('admin:financial.last90Days')}</SelectItem>
            <SelectItem value="1year">{t('admin:financial.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 border-green-200 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:financial.allTransactions')}</SelectItem>
            <SelectItem value="course_payment">{t('admin:financial.coursePayments')}</SelectItem>
            <SelectItem value="teacher_payout">{t('admin:financial.teacherPayouts')}</SelectItem>
            <SelectItem value="refund">{t('admin:financial.refunds')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs flex items-center ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? 
                      <TrendingUp className="h-3 w-3" /> : 
                      <TrendingDown className="h-3 w-3" />
                    }
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-600">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">{t('admin:financial.recentTransactions')}</TabsTrigger>
          <TabsTrigger value="payouts">{t('admin:financial.teacherPayoutsTab')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:financial.financialAnalytics')}</TabsTrigger>
          <TabsTrigger value="reports">{t('admin:financial.financialReports')}</TabsTrigger>
          <TabsTrigger value="settings">{t('admin:financial.paymentSettings')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:financial.transactionHistory')}</CardTitle>
              <CardDescription>
                {t('admin:financial.transactionHistoryDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {transaction.student || transaction.teacher}
                          </span>
                          <Badge className={getStatusColor(transaction.status)}>
                            {getStatusText(transaction.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {transaction.course || transaction.description} • {transaction.date}
                        </p>
                        {transaction.failureReason && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {transaction.failureReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">{transaction.paymentMethod}</p>
                      {transaction.commission && (
                        <p className="text-xs text-gray-500">
                          Commission: ${transaction.commission}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:financial.teacherPayoutManagement')}</CardTitle>
              <CardDescription>
                {t('admin:financial.teacherPayoutDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherPayouts.map((payout) => (
                  <div key={payout.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {payout.teacher.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-medium">{payout.teacher}</h3>
                            <p className="text-sm text-gray-600">{payout.period}</p>
                          </div>
                          <Badge className={getStatusColor(payout.status)}>
                            {getStatusText(payout.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-gray-600">{t('admin:financial.courses')}:</span>
                            <div className="font-medium">{payout.courses.length} {t('admin:financial.active')}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('admin:financial.students')}:</span>
                            <div className="font-medium">{payout.studentsCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('admin:financial.totalEarnings')}:</span>
                            <div className="font-medium">${payout.totalEarnings.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('admin:financial.commission')} ({payout.commission}%):</span>
                            <div className="font-medium">${(payout.totalEarnings - payout.netPayout).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${payout.netPayout.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600">{t('admin:financial.netPayout')}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          {payout.status === 'pending' ? t('admin:financial.processPayment') : t('admin:financial.viewDetails')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin:financial.revenueBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{t('admin:financial.courseSales')}</span>
                    <span className="font-bold">$389,450 (86%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '86%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>{t('admin:financial.platformCommission')}</span>
                    <span className="font-bold">$63,440 (14%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '14%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin:financial.paymentMethods')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{t('admin:financial.shetabIranian')}</span>
                    <span className="font-bold">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('admin:financial.creditCards')}</span>
                    <span className="font-bold">24%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('admin:financial.bankTransfer')}</span>
                    <span className="font-bold">8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin:financial.averageTransaction')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$347</div>
                <p className="text-sm text-gray-600">{t('admin:financial.perCoursePurchase')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin:financial.monthlyGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+18.2%</div>
                <p className="text-sm text-gray-600">{t('admin:financial.revenueIncrease')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin:financial.failedPayments')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">2.3%</div>
                <p className="text-sm text-gray-600">{t('admin:financial.failureRate')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:financial.financialReports')}</CardTitle>
              <CardDescription>{t('admin:financial.financialReportsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Controls */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>{t('admin:financial.reportType')}</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial-balance">{t('admin:financial.trialBalance')}</SelectItem>
                      <SelectItem value="balance-sheet">{t('admin:financial.balanceSheet')}</SelectItem>
                      <SelectItem value="profit-loss">{t('admin:financial.profitLoss')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <Label>{t('admin:financial.startDate')}</Label>
                  <Input 
                    type="date" 
                    value={reportStartDate} 
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <Label>{t('admin:financial.endDate')}</Label>
                  <Input 
                    type="date" 
                    value={reportEndDate} 
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('admin:financial.exportReport')}
                  </Button>
                </div>
              </div>
              
              {/* Report Display */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {reportType === 'trial-balance' && t('admin:financial.trialBalance')}
                    {reportType === 'balance-sheet' && t('admin:financial.balanceSheet')}
                    {reportType === 'profit-loss' && t('admin:financial.profitLoss')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {reportStartDate} {t('admin:financial.to')} {reportEndDate}
                  </p>
                </div>
                
                {reportLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading report data...</p>
                  </div>
                ) : reportIsError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <h4 className="font-semibold">Failed to load report</h4>
                      </div>
                      <p className="text-sm text-red-600 mb-3">
                        {reportError?.message || 'Unable to fetch financial report from ledger'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchReport()}
                        className="border-red-300 hover:bg-red-50"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : reportData ? (
                  <div className="overflow-x-auto">
                    {reportType === 'trial-balance' && reportData.accounts && (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Account Code</th>
                            <th className="border p-2 text-left">Account Name</th>
                            <th className="border p-2 text-right">Debit</th>
                            <th className="border p-2 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.accounts.map((account: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="border p-2">{account.accountCode}</td>
                              <td className="border p-2">{account.accountName}</td>
                              <td className="border p-2 text-right">{account.debit?.toLocaleString('fa-IR') || '-'}</td>
                              <td className="border p-2 text-right">{account.credit?.toLocaleString('fa-IR') || '-'}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan={2} className="border p-2">Total</td>
                            <td className="border p-2 text-right">{reportData.totalDebit?.toLocaleString('fa-IR')}</td>
                            <td className="border p-2 text-right">{reportData.totalCredit?.toLocaleString('fa-IR')}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                    
                    {reportType === 'balance-sheet' && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Assets</h4>
                          <div className="ml-4 space-y-1">
                            {reportData.assets?.map((asset: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{asset.accountName}</span>
                                <span className="font-mono">{asset.balance?.toLocaleString('fa-IR')} IRR</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold pt-2 border-t">
                              <span>Total Assets</span>
                              <span>{reportData.totalAssets?.toLocaleString('fa-IR')} IRR</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Liabilities</h4>
                          <div className="ml-4 space-y-1">
                            {reportData.liabilities?.map((liability: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{liability.accountName}</span>
                                <span className="font-mono">{liability.balance?.toLocaleString('fa-IR')} IRR</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold pt-2 border-t">
                              <span>Total Liabilities</span>
                              <span>{reportData.totalLiabilities?.toLocaleString('fa-IR')} IRR</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Equity</h4>
                          <div className="ml-4 space-y-1">
                            {reportData.equity?.map((eq: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{eq.accountName}</span>
                                <span className="font-mono">{eq.balance?.toLocaleString('fa-IR')} IRR</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold pt-2 border-t">
                              <span>Total Equity</span>
                              <span>{reportData.totalEquity?.toLocaleString('fa-IR')} IRR</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {reportType === 'profit-loss' && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Revenue</h4>
                          <div className="ml-4 space-y-1">
                            {reportData.revenue?.map((rev: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{rev.accountName}</span>
                                <span className="font-mono">{rev.balance?.toLocaleString('fa-IR')} IRR</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold pt-2 border-t">
                              <span>Total Revenue</span>
                              <span>{reportData.totalRevenue?.toLocaleString('fa-IR')} IRR</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Expenses</h4>
                          <div className="ml-4 space-y-1">
                            {reportData.expenses?.map((exp: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{exp.accountName}</span>
                                <span className="font-mono">{exp.balance?.toLocaleString('fa-IR')} IRR</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold pt-2 border-t">
                              <span>Total Expenses</span>
                              <span>{reportData.totalExpenses?.toLocaleString('fa-IR')} IRR</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Net Profit</span>
                            <span className={reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {reportData.netProfit?.toLocaleString('fa-IR')} IRR
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No data available for selected date range</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin:financial.paymentGatewayConfiguration')}</CardTitle>
                <CardDescription>{t('admin:financial.paymentGatewayDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{t('admin:financial.shetabPaymentGateway')}</h4>
                    <p className="text-sm text-gray-600">{t('admin:financial.iranianNationalPaymentSystem')}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{t('admin:financial.active')}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">International Credit Cards</h4>
                    <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Bank Transfer</h4>
                    <p className="text-sm text-gray-600">Direct bank payments</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending Setup</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('commission')} Structure</CardTitle>
                <CardDescription>{t('platformCommissionRates')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{t('newTeachers')}</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('experiencedTeachers')}</span>
                  <span className="font-bold">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('premiumTeachers')}</span>
                  <span className="font-bold">15%</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  {t('updateCommissionRates')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}