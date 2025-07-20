import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Receipt,
  Calendar,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  Filter,
  Search
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalStudents: number;
  averageRevenuePerStudent: number;
  pendingPayments: number;
  overduePayments: number;
  cashFlow: number;
}

interface Transaction {
  id: number;
  date: string;
  studentName: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  method: string;
  referenceId: string;
  dueDate?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  studentName: string;
  courseName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  paymentMethod?: string;
  notes?: string;
}

export default function FinancialManagement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("this_month");

  // Fetch financial statistics from API
  const { data: stats } = useQuery<FinancialStats>({
    queryKey: ['/api/admin/financial-stats'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch transactions data
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions', { search: searchTerm, status: statusFilter, date: dateFilter }],
  });

  const transactions: Transaction[] = Array.isArray(transactionsData) ? transactionsData : [];

  // Fetch invoices data
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/admin/invoices', { search: searchTerm, status: statusFilter }],
  });

  const invoices: Invoice[] = Array.isArray(invoicesData) ? invoicesData : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">درآمد کل</p>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.totalRevenue) : '0 تومان'}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats?.revenueGrowth || 0}% این ماه
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
                <p className="text-sm font-medium text-muted-foreground">درآمد ماهانه</p>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.monthlyRevenue) : '0 تومان'}</p>
                <p className="text-sm text-blue-600">از {stats?.totalStudents || 0} دانش‌آموز</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">میانگین درآمد</p>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.averageRevenuePerStudent) : '0 تومان'}</p>
                <p className="text-sm text-purple-600">به ازای هر دانش‌آموز</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">جریان نقدی</p>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.cashFlow) : '0 تومان'}</p>
                <p className="text-sm text-orange-600">خالص این ماه</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">پرداخت‌های معلق</p>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.pendingPayments) : '0 تومان'}</p>
                <p className="text-sm text-yellow-600">نیاز به پیگیری</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">پرداخت‌های معوقه</p>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.overduePayments) : '0 تومان'}</p>
                <p className="text-sm text-red-600">فوری</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">پرداخت‌های موفق</p>
                <p className="text-2xl font-bold">94.2%</p>
                <p className="text-sm text-green-600">نرخ موفقیت</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>تراکنش‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'payment' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'payment' ? 
                      <TrendingUp className="h-4 w-4 text-green-600" /> : 
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium">{transaction.studentName}</p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status === 'completed' ? 'تکمیل شده' : 
                     transaction.status === 'pending' ? 'در انتظار' : transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>اقدامات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span>فاکتور جدید</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Receipt className="h-6 w-6" />
              <span>ثبت پرداخت</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>گزارش مالی</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Download className="h-6 w-6" />
              <span>صدور گزارش</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TransactionsTab = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در تراکنش‌ها..."
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
            <SelectItem value="completed">تکمیل شده</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="failed">ناموفق</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="بازه زمانی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">امروز</SelectItem>
            <SelectItem value="this_week">این هفته</SelectItem>
            <SelectItem value="this_month">این ماه</SelectItem>
            <SelectItem value="last_month">ماه گذشته</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">تاریخ</th>
                  <th className="p-4 font-medium">دانش‌آموز</th>
                  <th className="p-4 font-medium">توضیحات</th>
                  <th className="p-4 font-medium">مبلغ</th>
                  <th className="p-4 font-medium">روش پرداخت</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">کد پیگیری</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{transaction.date}</td>
                    <td className="p-4">
                      <p className="font-medium">{transaction.studentName}</p>
                    </td>
                    <td className="p-4">{transaction.description}</td>
                    <td className="p-4">
                      <span className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                    <td className="p-4">{transaction.method}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status === 'completed' ? 'تکمیل شده' : 
                         transaction.status === 'pending' ? 'در انتظار' : transaction.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {transaction.referenceId}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const InvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت فاکتورها</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          فاکتور جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">شماره فاکتور</th>
                  <th className="p-4 font-medium">دانش‌آموز</th>
                  <th className="p-4 font-medium">دوره</th>
                  <th className="p-4 font-medium">مبلغ</th>
                  <th className="p-4 font-medium">تاریخ صدور</th>
                  <th className="p-4 font-medium">تاریخ سررسید</th>
                  <th className="p-4 font-medium">وضعیت</th>
                  <th className="p-4 font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <code className="font-mono text-sm">{invoice.invoiceNumber}</code>
                    </td>
                    <td className="p-4">{invoice.studentName}</td>
                    <td className="p-4">{invoice.courseName}</td>
                    <td className="p-4">
                      <span className="font-bold">{formatCurrency(invoice.amount)}</span>
                    </td>
                    <td className="p-4">{invoice.issueDate}</td>
                    <td className="p-4">{invoice.dueDate}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status === 'paid' ? 'پرداخت شده' : 
                         invoice.status === 'pending' ? 'در انتظار' : 
                         invoice.status === 'overdue' ? 'معوقه' : invoice.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          مشاهده
                        </Button>
                        <Button size="sm" variant="ghost">
                          چاپ
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button size="sm" variant="ghost">
                            یادآوری
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
          <h1 className="text-3xl font-bold">مدیریت مالی</h1>
          <p className="text-muted-foreground">مدیریت درآمد، فاکتورها و تراکنش‌های مالی آموزشگاه</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            گزارش مالی
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            صدور گزارش
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
          <TabsTrigger value="invoices">فاکتورها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}