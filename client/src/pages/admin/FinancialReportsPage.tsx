import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, CreditCard } from "lucide-react";

interface FinancialSummary {
  success: boolean;
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    totalTransactions: number;
    successRate: number;
    newEnrollments: number;
    totalWalletTopups: number;
  };
  breakdown: {
    shetabRevenue: number;
    cashRevenue: number;
    walletTopups: number;
  };
  chartData: Array<{ date: string; revenue: number }>;
  trends: {
    averageDailyRevenue: number;
    peakDay: { date: string; revenue: number } | null;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function FinancialReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: report, isLoading, error, refetch } = useQuery<FinancialSummary>({
    queryKey: ["/api/reports/financial-summary", startDate, endDate],
    queryFn: () => apiRequest(`/reports/financial-summary?startDate=${startDate}&endDate=${endDate}`),
    enabled: false // Only fetch when user clicks Generate Report
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const pieData = report ? [
    { name: 'Shetab Payments', value: report.breakdown.shetabRevenue, color: COLORS[0] },
    { name: 'Cash Payments', value: report.breakdown.cashRevenue, color: COLORS[1] },
    { name: 'Wallet Top-ups', value: report.breakdown.walletTopups, color: COLORS[2] },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive financial analytics and revenue insights
          </p>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select date range to generate financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleGenerateReport} 
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to generate financial report. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.summary.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Net: {formatCurrency(report.summary.netRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  {report.summary.successRate}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.newEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Course purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.trends.averageDailyRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per day revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('fa-IR')}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('fa-IR')}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {formatCurrency(entry.value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown</CardTitle>
              <CardDescription>
                Report period: {new Date(report.period.startDate).toLocaleDateString('fa-IR')} - {new Date(report.period.endDate).toLocaleDateString('fa-IR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Revenue Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(report.summary.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Refunds:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(report.summary.totalRefunds)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Net Revenue:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(report.summary.netRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <Badge variant={report.summary.successRate > 90 ? "default" : "secondary"}>
                        {report.summary.successRate}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Wallet Top-ups:</span>
                      <span className="font-medium">
                        {formatCurrency(report.summary.totalWalletTopups)}
                      </span>
                    </div>
                    {report.trends.peakDay && (
                      <div className="flex justify-between">
                        <span>Peak Day:</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(report.trends.peakDay.revenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(report.trends.peakDay.date).toLocaleDateString('fa-IR')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}