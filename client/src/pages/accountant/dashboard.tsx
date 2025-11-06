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
  Shield,
  BookOpen,
  Award
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion } from "framer-motion";
import { CurriculumAssignment } from "@/components/accountant/curriculum-assignment";

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
  const { t } = useTranslation(['accountant', 'common']);
  const { isRTL } = useLanguage();
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
      <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-xl p-6 md:p-8 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('accountant:welcome', 'Welcome')}, {user?.firstName || t('accountant:accountant', 'Accountant')}! 💰
              </h1>
              <p className="text-sm md:text-base opacity-90">
                {t('accountant:welcomeMessage', 'Managing finances with precision. Your financial dashboard is ready!')}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t('accountant:monthlyRevenue', 'Monthly Revenue')}</p>
                <p className="text-xl font-bold">💵 {formatCurrency(accountantStats?.monthlyRevenue || 0)}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t('accountant:pending', 'Pending')}</p>
                <p className="text-xl font-bold">📋 {accountantStats?.pendingPayments || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100">{t('accountant:dashboard.totalRevenue')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(accountantStats?.totalRevenue || 0)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{t('accountant:dashboard.monthlyRevenue')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(accountantStats?.monthlyRevenue || 0)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">{t('accountant:dashboard.pendingPayments')}</p>
                  <p className="text-3xl font-bold">{accountantStats?.pendingPayments || 0}</p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">{t('accountant:dashboard.activeStudents')}</p>
                  <p className="text-3xl font-bold">{accountantStats?.activeStudents || 0}</p>
                </div>
                <Users className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('accountant:overview')}</TabsTrigger>
            <TabsTrigger value="payments">{t('accountant:payments')}</TabsTrigger>
            <TabsTrigger value="revenue">{t('accountant:revenue')}</TabsTrigger>
            <TabsTrigger value="curriculum">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                مدیریت سطوح
              </div>
            </TabsTrigger>
            <TabsTrigger value="reports">{t('accountant:reports')}</TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="mt-6">
            <TabsContent value="overview">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Overview content will be displayed here.</p>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Payments content will be displayed here.</p>
              </div>
            </TabsContent>

            <TabsContent value="revenue">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Revenue content will be displayed here.</p>
              </div>
            </TabsContent>

            <TabsContent value="curriculum">
              <CurriculumAssignment />
            </TabsContent>

            <TabsContent value="reports">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Reports content will be displayed here.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default AccountantDashboard;
