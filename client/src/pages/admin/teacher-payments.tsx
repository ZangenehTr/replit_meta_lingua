import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calculator,
  Download,
  Send
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
}

export default function TeacherPaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  // Fetch teacher payments data
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/admin/teacher-payments', selectedPeriod],
  });

  // Calculate payments mutation
  const calculatePaymentsMutation = useMutation({
    mutationFn: (period: string) => 
      apiRequest('/api/admin/teacher-payments/calculate', { 
        method: 'POST', 
        body: JSON.stringify({ period }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Payments Calculated",
        description: "Teacher payments have been calculated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-payments'] });
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
        title: "Payment Approved",
        description: "Payment has been approved for processing.",
      });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teacher Payment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Automated session-based payment calculation system
          </p>
        </div>
        <Button 
          onClick={() => calculatePaymentsMutation.mutate(selectedPeriod)}
          disabled={calculatePaymentsMutation.isPending}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Payments
        </Button>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250,000 IRR</div>
            <p className="text-xs text-muted-foreground">
              5 teachers pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessions This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Hourly Rate
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75,000 IRR</div>
            <p className="text-xs text-muted-foreground">
              Persian language standard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Issues
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Requires review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment Overview</TabsTrigger>
          <TabsTrigger value="sessions">Session Details</TabsTrigger>
          <TabsTrigger value="rates">Rate Management</TabsTrigger>
          <TabsTrigger value="reports">Payment Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Teacher Payments</CardTitle>
                  <CardDescription>
                    Automated calculation based on completed sessions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="current">Current Month</option>
                    <option value="previous">Previous Month</option>
                    <option value="custom">Custom Period</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    teacherName: "Ahmad Hosseini",
                    totalSessions: 45,
                    totalHours: 67.5,
                    hourlyRate: 80000,
                    basePay: 5400000,
                    bonuses: 150000,
                    deductions: 0,
                    finalAmount: 5550000,
                    status: 'calculated'
                  },
                  {
                    id: 2,
                    teacherName: "Maryam Rahimi",
                    totalSessions: 38,
                    totalHours: 57,
                    hourlyRate: 75000,
                    basePay: 4275000,
                    bonuses: 100000,
                    deductions: 25000,
                    finalAmount: 4350000,
                    status: 'approved'
                  },
                  {
                    id: 3,
                    teacherName: "Ali Moradi",
                    totalSessions: 52,
                    totalHours: 78,
                    hourlyRate: 70000,
                    basePay: 5460000,
                    bonuses: 200000,
                    deductions: 0,
                    finalAmount: 5660000,
                    status: 'pending'
                  }
                ].map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{payment.teacherName}</p>
                        <p className="text-sm text-gray-500">
                          {payment.totalSessions} sessions • {payment.totalHours} hours
                        </p>
                        <p className="text-xs text-gray-400">
                          Rate: {payment.hourlyRate.toLocaleString()} IRR/hour
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">
                        {payment.finalAmount.toLocaleString()} IRR
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                      {payment.status === 'calculated' && (
                        <Button 
                          size="sm" 
                          onClick={() => approvePaymentMutation.mutate(payment.id)}
                          disabled={approvePaymentMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session-Based Payment Details</CardTitle>
              <CardDescription>
                Detailed breakdown of sessions and their payment impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Session payment details with automatic calculation based on:
                <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                  <li>• Session completion status</li>
                  <li>• Session duration (actual vs planned)</li>
                  <li>• Student attendance</li>
                  <li>• Performance bonuses</li>
                  <li>• Iranian labor compliance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Rate Management</CardTitle>
              <CardDescription>
                Set and manage teacher hourly rates based on experience and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Base Hourly Rate (IRR)</Label>
                    <Input type="number" defaultValue="75000" />
                  </div>
                  <div>
                    <Label>Performance Bonus (%)</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                </div>
                <Button>Update Rate Structure</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reports</CardTitle>
              <CardDescription>
                Generate financial reports for Iranian tax compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Monthly Report
                  </Button>
                  <Button variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Accounting
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}