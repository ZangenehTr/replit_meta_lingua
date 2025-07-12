import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  FileText
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
  callernHours?: number;
  callernRate?: number;
  callernPay?: number;
  department: 'regular' | 'callern' | 'both';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedTeacherForHistory, setSelectedTeacherForHistory] = useState<string>("all");

  // Fetch teacher payments data
  const { data: payments = [], isLoading } = useQuery({
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
        title: "Payments Calculated",
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
        title: "Rate Updated",
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
        title: "Payment Approved",
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
        title: "Report Downloaded",
        description: "Payment report has been downloaded successfully.",
      });
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
        title: "Sent to Accounting",
        description: `Payment data sent successfully. Tracking ID: ${data.trackingId}`,
      });
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
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Teacher Payment Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Automated session-based payment calculation using individual teacher rates
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="regularRate">Regular Session Hourly Rate (IRR)</Label>
              <Input
                id="regularRate"
                type="number"
                defaultValue="750000"
                placeholder="750000"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Rate for regular in-person and online sessions</p>
            </div>
            <div>
              <Label htmlFor="callernRate">Callern Service Hourly Rate (IRR)</Label>
              <Input
                id="callernRate"
                type="number"
                defaultValue="850000"
                placeholder="850000"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Rate for Callern standby and on-demand sessions</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const regularRate = (document.getElementById('regularRate') as HTMLInputElement).value;
                const callernRate = (document.getElementById('callernRate') as HTMLInputElement).value;
                
                updateRateStructureMutation.mutate({
                  baseRate: parseInt(regularRate),
                  callernRate: parseInt(callernRate),
                  effectiveDate: new Date().toISOString().split('T')[0]
                });
              }}
              disabled={updateRateStructureMutation.isPending}
            >
              {updateRateStructureMutation.isPending ? 'Updating...' : 'Update Both Rates'}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={calculatePaymentsMutation.isPending}>
                  <Calculator className="h-4 w-4 mr-2" />
                  {calculatePaymentsMutation.isPending ? 'Calculating...' : 'Calculate Payments'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Calculate Teacher Payments</DialogTitle>
                  <DialogDescription>
                    Select the period for salary calculation and payment processing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input 
                        id="startDate" 
                        type="date" 
                        defaultValue="2024-12-01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input 
                        id="endDate" 
                        type="date" 
                        defaultValue="2024-12-31"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions (Regular + Callern)</SelectItem>
                        <SelectItem value="regular">Regular Sessions Only</SelectItem>
                        <SelectItem value="callern">Callern Sessions Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      onClick={() => {
                        const startDate = (document.getElementById('startDate') as HTMLInputElement).value;
                        const endDate = (document.getElementById('endDate') as HTMLInputElement).value;
                        const customPeriod = `${startDate}_to_${endDate}`;
                        calculatePaymentsMutation.mutate(customPeriod);
                      }}
                      disabled={calculatePaymentsMutation.isPending}
                    >
                      {calculatePaymentsMutation.isPending ? 'Calculating...' : 'Calculate Payments'}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="reports">Payment Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Teacher Payment Overview</CardTitle>
                  <CardDescription>
                    Simplified view with payslip management
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
                {isLoading ? (
                  <div className="text-center py-4">Loading payment data...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Total Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payslip Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="font-medium">{payment.teacherName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-lg">
                              {payment.finalAmount?.toLocaleString()} IRR
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Payslip Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Payslip Details - {payment.teacherName}</DialogTitle>
                                    <DialogDescription>
                                      Complete breakdown of payment calculation for {payment.period}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    {/* Teacher Info */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                      <div>
                                        <Label className="text-xs text-gray-500">Teacher</Label>
                                        <div className="font-medium">{payment.teacherName}</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Period</Label>
                                        <div className="font-medium">{payment.period}</div>
                                      </div>
                                    </div>

                                    {/* Session Details */}
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs text-gray-500">Total Sessions</Label>
                                        <div className="text-2xl font-bold">{payment.totalSessions}</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Total Hours</Label>
                                        <div className="text-2xl font-bold">{payment.totalHours}</div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Hourly Rate</Label>
                                        <div className="text-2xl font-bold">{payment.hourlyRate?.toLocaleString()} IRR</div>
                                      </div>
                                    </div>

                                    {/* Payment Breakdown */}
                                    <div className="border rounded-lg p-4">
                                      <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>Base Pay ({payment.totalHours} hours × {payment.hourlyRate?.toLocaleString()} IRR)</span>
                                          <span className="font-medium">{payment.basePay?.toLocaleString()} IRR</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                          <span>Bonuses & Incentives</span>
                                          <span className="font-medium">+{payment.bonuses?.toLocaleString()} IRR</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                          <span>Deductions & Taxes</span>
                                          <span className="font-medium">-{payment.deductions?.toLocaleString()} IRR</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                          <span>Final Amount</span>
                                          <span>{payment.finalAmount?.toLocaleString()} IRR</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Iranian Tax Compliance */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <h3 className="font-semibold mb-2">Iranian Tax Compliance</h3>
                                      <div className="text-sm space-y-1">
                                        <div>✓ 12% Income Tax: {Math.round((payment.basePay || 0) * 0.12)?.toLocaleString()} IRR</div>
                                        <div>✓ 7% Social Security: {Math.round((payment.basePay || 0) * 0.07)?.toLocaleString()} IRR</div>
                                        <div>✓ All deductions calculated per Iranian labor law</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="outline">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Payslip
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        // Approve and send to accounting
                                        approvePaymentMutation.mutate(payment.id);
                                        sendToAccountingMutation.mutate();
                                        toast({
                                          title: "Payslip Approved",
                                          description: `Payslip for ${payment.teacherName} approved and sent to accounting.`,
                                        });
                                      }}
                                      disabled={payment.status === 'approved' || approvePaymentMutation.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      {payment.status === 'approved' ? 'Already Approved' : 'Approve & Send to Accounting'}
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
                )}
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





        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Historical payment records for all teachers (Admin & Supervisor Access)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Select defaultValue="all" value={selectedTeacherForHistory} onValueChange={setSelectedTeacherForHistory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
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
                            title: "Payment History",
                            description: `Retrieved ${data.payments.length} payment records for ${teachers.find(t => t.id === teacherId)?.name || 'teacher'}`,
                          });
                        })
                        .catch(err => {
                          toast({
                            title: "Error",
                            description: "Failed to fetch payment history",
                            variant: "destructive"
                          });
                        });
                    }}
                  >
                    Load History
                  </Button>
                </div>
                
                <div className="border rounded-lg">
                  <div className="grid grid-cols-7 gap-4 p-4 border-b bg-gray-50 font-medium text-sm">
                    <div>Period</div>
                    <div>Sessions</div>
                    <div>Hours</div>
                    <div>Gross Amount</div>
                    <div>Deductions</div>
                    <div>Net Amount</div>
                    <div>Status</div>
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
                      <div className="font-medium">{record.gross.toLocaleString()} IRR</div>
                      <div className="text-red-600">-{record.deductions.toLocaleString()} IRR</div>
                      <div className="font-medium text-green-600">{record.net.toLocaleString()} IRR</div>
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
              <CardTitle>Payment Reports</CardTitle>
              <CardDescription>
                Generate financial reports for Iranian tax compliance
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
                    <Download className="h-4 w-4 mr-2" />
                    {downloadReportMutation.isPending ? 'Generating...' : 'Download Monthly Report'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => sendToAccountingMutation.mutate()}
                    disabled={sendToAccountingMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendToAccountingMutation.isPending ? 'Sending...' : 'Send to Accounting'}
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