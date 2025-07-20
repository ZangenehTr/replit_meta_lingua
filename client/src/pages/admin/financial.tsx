import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/use-language";
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
  const { t, isRTL } = useLanguage();
  const [dateRange, setDateRange] = useState("30days");
  const [filterType, setFilterType] = useState("all");

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

  // Recent Transactions
  const transactions = [
    {
      id: "TXN-001",
      type: "course_payment",
      student: "Sarah Johnson",
      course: "Persian Fundamentals",
      amount: 299,
      currency: "USD",
      status: "completed",
      date: "2024-01-25",
      paymentMethod: "shetab",
      commission: 59.8
    },
    {
      id: "TXN-002", 
      type: "teacher_payout",
      teacher: "Dr. Maryam Hosseini",
      amount: 2450,
      currency: "USD",
      status: "pending",
      date: "2024-01-24",
      paymentMethod: "bank_transfer",
      description: "Monthly teaching payout"
    },
    {
      id: "TXN-003",
      type: "course_payment",
      student: "Ahmad Rahman",
      course: "English Business",
      amount: 399,
      currency: "USD", 
      status: "failed",
      date: "2024-01-23",
      paymentMethod: "credit_card",
      commission: 79.8,
      failureReason: "Insufficient funds"
    },
    {
      id: "TXN-004",
      type: "refund",
      student: "Maria Garcia",
      course: "Arabic Grammar",
      amount: -199,
      currency: "USD",
      status: "completed",
      date: "2024-01-22",
      paymentMethod: "shetab",
      reason: "Course cancellation"
    }
  ];

  // Teacher Payouts
  const teacherPayouts = [
    {
      id: 1,
      teacher: "Dr. Maryam Hosseini",
      courses: ["Persian Fundamentals", "Advanced Persian"],
      studentsCount: 89,
      totalEarnings: 4580,
      commission: 20,
      netPayout: 3664,
      status: "pending",
      period: "January 2024"
    },
    {
      id: 2,
      teacher: "Prof. James Richardson", 
      courses: ["Business English"],
      studentsCount: 45,
      totalEarnings: 2890,
      commission: 25,
      netPayout: 2167.5,
      status: "paid",
      period: "January 2024"
    },
    {
      id: 3,
      teacher: "Dr. Ahmed Al-Mansouri",
      courses: ["Arabic Grammar"],
      studentsCount: 32,
      totalEarnings: 1950,
      commission: 20,
      netPayout: 1560,
      status: "scheduled",
      period: "January 2024"
    }
  ];

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
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Financial Management</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive billing, payouts, marketplace commissions & Iranian payment integration
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-green-200 hover:bg-green-50">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('exportReport')}</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('manualTransaction')}</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('createManualTransaction')}</DialogTitle>
                <DialogDescription>
                  {t('processManualPayments')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">{t('transactionType')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">{t('coursePayment')}</SelectItem>
                      <SelectItem value="refund">{t('refund')}</SelectItem>
                      <SelectItem value="payout">{t('teacherPayout')}</SelectItem>
                      <SelectItem value="adjustment">{t('manualAdjustment')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input id="amount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
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
                  <Label htmlFor="paymentMethod">{t('paymentMethod')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shetab">Shetab (Iranian)</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>Process Transaction</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-48 border-green-200">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 border-green-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="payments">Course Payments</SelectItem>
            <SelectItem value="payouts">Teacher Payouts</SelectItem>
            <SelectItem value="refunds">Refunds</SelectItem>
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
                      <TrendingUp className="h-3 w-3 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 mr-1" />
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
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Teacher Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All payment transactions, refunds, and payouts with Shetab integration
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
                            {transaction.status}
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
              <CardTitle>Teacher Payout Management</CardTitle>
              <CardDescription>
                Monthly payouts with commission calculations and payment scheduling
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
                            {payout.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-gray-600">{t('courses')}:</span>
                            <div className="font-medium">{payout.courses.length} active</div>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('students')}:</span>
                            <div className="font-medium">{payout.studentsCount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('totalEarnings')}:</span>
                            <div className="font-medium">${payout.totalEarnings.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('commission')} ({payout.commission}%):</span>
                            <div className="font-medium">${(payout.totalEarnings - payout.netPayout).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${payout.netPayout.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600">Net Payout</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          {payout.status === 'pending' ? 'Process Payment' : 'View Details'}
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
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Course Sales</span>
                    <span className="font-bold">$389,450 (86%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '86%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Platform {t('commission')}</span>
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
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Shetab (Iranian)</span>
                    <span className="font-bold">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Credit Cards</span>
                    <span className="font-bold">24%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bank Transfer</span>
                    <span className="font-bold">8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$347</div>
                <p className="text-sm text-gray-600">Per course purchase</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+18.2%</div>
                <p className="text-sm text-gray-600">Revenue increase</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failed Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">2.3%</div>
                <p className="text-sm text-gray-600">Failure rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Configuration</CardTitle>
                <CardDescription>Configure Shetab and international payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Shetab Payment Gateway</h4>
                    <p className="text-sm text-gray-600">Iranian national payment system</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
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