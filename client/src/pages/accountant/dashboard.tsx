import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  Wallet,
  BanknoteIcon,
  Calculator,
  FileText,
  Building2,
  Shield
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface AccountantStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalStudents: number;
  activeStudents: number;
  pendingPayments: number;
  completedTransactions: number;
  averagePayment: number;
  outstandingBalance: number;
  shetabTransactions: number;
  walletBalance: number;
}

interface Transaction {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  type: 'payment' | 'refund' | 'discount' | 'penalty';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  method: 'shetab' | 'wallet' | 'cash' | 'bank_transfer';
  description: string;
  createdAt: string;
  completedAt?: string;
  referenceNumber?: string;
  gatewayResponse?: string;
}

interface Invoice {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  studentCount: number;
  averageRevenuePerStudent: number;
  paymentMethodBreakdown: {
    shetab: number;
    wallet: number;
    cash: number;
    bank_transfer: number;
  };
  monthlyTrend: {
    month: string;
    revenue: number;
    students: number;
  }[];
}

interface StudentFinancials {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  totalPaid: number;
  outstandingBalance: number;
  walletBalance: number;
  membershipTier: string;
  discountRate: number;
  lastPaymentDate?: string;
  status: 'active' | 'suspended' | 'graduated';
  paymentHistory: Transaction[];
}

function AccountantDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("this_month");
  const queryClient = useQueryClient();

  // Accountant theme colors (Professional blue-green for financial)
  const themeColors = {
    primary: "bg-emerald-600",
    primaryHover: "hover:bg-emerald-700",
    light: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    accent: "bg-emerald-100 text-emerald-800"
  };

  // Data queries
  const { data: accountantStats } = useQuery<AccountantStats>({
    queryKey: ["/api/accountant/stats"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", dateRange],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", statusFilter],
  });

  const { data: financialReport } = useQuery<FinancialReport>({
    queryKey: ["/api/financial-report", dateRange],
  });

  const { data: studentFinancials = [] } = useQuery<StudentFinancials[]>({
    queryKey: ["/api/student-financials"],
  });

  // Mutations
  const generateInvoiceMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (!response.ok) throw new Error('Failed to generate invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    }
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ transactionId, amount, reason }: { transactionId: number; amount: number; reason: string }) => {
      const response = await fetch(`/api/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason })
      });
      if (!response.ok) throw new Error('Failed to process refund');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accountant/stats"] });
    }
  });

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'failed': case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'shetab': return 'bg-blue-100 text-blue-800';
      case 'wallet': return 'bg-purple-100 text-purple-800';
      case 'cash': return 'bg-green-100 text-green-800';
      case 'bank_transfer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'refund': return 'bg-red-100 text-red-800';
      case 'discount': return 'bg-blue-100 text-blue-800';
      case 'penalty': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Filter data
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesStatus;
  });

  // Calculate metrics
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const todayTransactions = transactions.filter(t => 
    new Date(t.createdAt).toDateString() === new Date().toDateString()
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.firstName}! Manage finances and ensure compliance today.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/accountant/invoices/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
                <Receipt className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
            <Link href="/accountant/reports">
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Financial Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(accountantStats?.monthlyRevenue || 425000000)}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <ArrowUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+18.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accountantStats?.activeStudents || 26}</div>
              <p className="text-xs text-muted-foreground">
                {accountantStats?.totalStudents || 32} total students
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices.length}</div>
              <p className="text-xs text-muted-foreground">
                {overdueInvoices.length} overdue
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shetab Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accountantStats?.shetabTransactions || 18}</div>
              <p className="text-xs text-muted-foreground">
                Today: {todayTransactions.filter(t => t.method === 'shetab').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Course Payments</span>
                  <span className="font-medium">{formatCurrency(320000000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Private Sessions</span>
                  <span className="font-medium">{formatCurrency(85000000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Materials & Books</span>
                  <span className="font-medium">{formatCurrency(15000000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Membership Fees</span>
                  <span className="font-medium">{formatCurrency(5000000)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center font-bold">
                  <span>Total Revenue</span>
                  <span>{formatCurrency(425000000)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Shetab Gateway</span>
                  </div>
                  <span className="font-medium">68%</span>
                </div>
                <Progress value={68} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Digital Wallet</span>
                  </div>
                  <span className="font-medium">22%</span>
                </div>
                <Progress value={22} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Cash</span>
                  </div>
                  <span className="font-medium">7%</span>
                </div>
                <Progress value={7} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Bank Transfer</span>
                  </div>
                  <span className="font-medium">3%</span>
                </div>
                <Progress value={3} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Third Party Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tax Compliance</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shetab Integration</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">IRR Currency Support</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Local Data Storage</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Persian Receipt Format</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'payment' ? (
                            <ArrowDown className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{transaction.studentName}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                            <Badge className={getPaymentMethodColor(transaction.method)} variant="outline">
                              {transaction.method}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                        <Badge className={getTransactionTypeColor(transaction.type)} variant="outline">
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Outstanding Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Outstanding Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{invoice.studentName}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{invoice.courseName}</span>
                          <span>•</span>
                          <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                        <Badge className={getStatusColor(invoice.status)} variant="outline">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialReport?.totalRevenue || 425000000)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {financialReport?.studentCount || 26}
                    </div>
                    <div className="text-sm text-muted-foreground">Paying Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(financialReport?.averageRevenuePerStudent || 16350000)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Revenue/Student</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(financialReport?.netProfit || 382500000)}
                    </div>
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction Management</CardTitle>
                    <CardDescription>
                      Monitor all financial transactions and payments
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="this_quarter">This Quarter</option>
                      <option value="this_year">This Year</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'payment' ? (
                            <ArrowDown className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowUp className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{transaction.studentName}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{transaction.description}</span>
                            <span>•</span>
                            <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                            {transaction.referenceNumber && (
                              <>
                                <span>•</span>
                                <span>Ref: {transaction.referenceNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                          <div className="text-xs text-muted-foreground">{transaction.method}</div>
                        </div>
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        {transaction.type === 'payment' && transaction.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processRefundMutation.mutate({
                              transactionId: transaction.id,
                              amount: transaction.amount,
                              reason: 'Customer request'
                            })}
                            disabled={processRefundMutation.isPending}
                          >
                            Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoice Management</CardTitle>
                    <CardDescription>
                      Create and manage student invoices
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Link href="/accountant/invoices/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Invoice
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">INV-{invoice.id.toString().padStart(4, '0')}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{invoice.studentName}</span>
                            <span>•</span>
                            <span>{invoice.courseName}</span>
                            <span>•</span>
                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                          <div className="text-xs text-muted-foreground">
                            Tax: {formatCurrency(invoice.taxAmount)}
                          </div>
                        </div>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Link href={`/accountant/invoices/${invoice.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/accountant/invoices/${invoice.id}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Financial Profiles</CardTitle>
                <CardDescription>
                  Monitor individual student payment history and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentFinancials.map((student) => (
                    <Card key={student.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{student.firstName} {student.lastName}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge className={getTierColor(student.membershipTier)}>
                                {student.membershipTier}
                              </Badge>
                              <Badge variant="outline" className={student.status === 'active' ? 'text-green-700 border-green-200' : 'text-gray-700 border-gray-200'}>
                                {student.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Total Paid</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(student.totalPaid)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Outstanding</div>
                            <div className={`text-lg font-bold ${student.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(student.outstandingBalance)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Wallet Balance</span>
                          <span className="font-medium">{formatCurrency(student.walletBalance)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Discount Rate</span>
                          <span className="font-medium">{student.discountRate}%</span>
                        </div>

                        {student.lastPaymentDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Last Payment</span>
                            <span className="text-sm">{new Date(student.lastPaymentDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link href={`/accountant/students/${student.id}`}>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            onClick={() => generateInvoiceMutation.mutate(student.id)}
                            disabled={generateInvoiceMutation.isPending}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialReport?.totalRevenue || 425000000)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialReport?.totalExpenses || 42500000)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Expenses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(financialReport?.netProfit || 382500000)}
                      </div>
                      <div className="text-sm text-muted-foreground">Net Profit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(((financialReport?.netProfit || 382500000) / (financialReport?.totalRevenue || 425000000)) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Profit Margin</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Shetab Gateway</span>
                      <span className="font-bold">{formatCurrency(financialReport?.paymentMethodBreakdown?.shetab || 289000000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Digital Wallet</span>
                      <span className="font-bold">{formatCurrency(financialReport?.paymentMethodBreakdown?.wallet || 93500000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cash Payments</span>
                      <span className="font-bold">{formatCurrency(financialReport?.paymentMethodBreakdown?.cash || 29750000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bank Transfers</span>
                      <span className="font-bold">{formatCurrency(financialReport?.paymentMethodBreakdown?.bank_transfer || 12750000)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(425000000)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Financial Reports</CardTitle>
                <CardDescription>
                  Generate comprehensive financial reports for compliance and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Monthly Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>Tax Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Building2 className="h-6 w-6" />
                    <span>Compliance Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default AccountantDashboard;