import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Receipt, 
  CreditCard, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Calculator
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface FinancialSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  revenueGrowth: number;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  date: string;
  studentName?: string;
  method: string;
}

interface Invoice {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  dueDate: string;
  status: string;
  issueDate: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
}

interface PaymentMethod {
  id: number;
  name: string;
  transactions: number;
  totalAmount: number;
  percentage: number;
}

export default function AccountantDashboard() {
  const { user } = useAuth();

  // Accountant theme colors
  const themeColors = {
    primary: "bg-amber-600",
    primaryHover: "hover:bg-amber-700",
    light: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    accent: "bg-amber-100 text-amber-800"
  };

  const { data: financialSummary } = useQuery<FinancialSummary>({
    queryKey: ["/api/reports/financial-summary"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/reports/payment-methods"],
  });

  // Calculate derived metrics
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'pending' && new Date(inv.dueDate) < new Date()
  ).length;
  const totalPendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full">
              <Calculator className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-amber-800">Financial Dashboard</h1>
              <p className="text-amber-600">
                Welcome back, {user?.firstName}! Monitor financial performance and transactions.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <Receipt className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(financialSummary?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialSummary?.revenueGrowth && financialSummary.revenueGrowth > 0 ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{financialSummary.revenueGrowth}% from last month
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {financialSummary?.revenueGrowth || 0}% from last month
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(financialSummary?.monthlyRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(totalPendingAmount)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Payment Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest payment activities and transactions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          {transaction.type === 'payment' ? (
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Receipt className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.studentName && (
                            <p className="text-sm text-muted-foreground">
                              Student: {transaction.studentName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {transaction.method} • {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.type === 'refund' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track and manage student invoices
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.slice(0, 10).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Invoice #{invoice.id}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                          {invoice.status === 'pending' && new Date(invoice.dueDate) < new Date() && (
                            <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Student: {invoice.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issue Date: {new Date(invoice.issueDate).toLocaleDateString()} • 
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button size="sm">Mark Paid</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No invoices found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Breakdown of payment methods used by students
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-sm text-muted-foreground">{method.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{method.transactions} transactions</span>
                          <span>{formatCurrency(method.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment method data available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate and download financial reports
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Monthly Revenue Report</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Detailed breakdown of monthly earnings and transactions
                    </p>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Outstanding Invoices</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      List of pending and overdue student payments
                    </p>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Excel
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Tax Report</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Annual tax summary and deductible expenses
                    </p>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Payment Analytics</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Performance analysis and payment trends
                    </p>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}