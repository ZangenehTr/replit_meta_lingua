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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Phone
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
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showRateDialog, setShowRateDialog] = useState(false);

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
      setShowRateDialog(false);
      setSelectedTeacher(null);
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
    mutationFn: (rateData: { baseRate: number; bonusPercentage: number }) => 
      apiRequest('/api/admin/teacher-payments/update-rate-structure', { 
        method: 'POST',
        body: JSON.stringify(rateData),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Rate Structure Updated",
        description: "Global rate structure has been updated successfully.",
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
          <div className="flex gap-2">
            <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Rates
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Teacher Rate Management</DialogTitle>
                  <DialogDescription>
                    Update hourly rates for regular classes and Callern standby
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teacherSelect">Select Teacher</Label>
                    <Select 
                      value={selectedTeacher?.id.toString() || ''} 
                      onValueChange={(value) => {
                        const teacher = teachers.find(t => t.id === parseInt(value));
                        setSelectedTeacher(teacher || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name} ({teacher.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTeacher && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="regularRate">Regular Classes Rate (IRR/hour)</Label>
                        <Input
                          id="regularRate"
                          type="number"
                          defaultValue={selectedTeacher.hourlyRate}
                          placeholder="75000"
                        />
                      </div>
                      
                      {(selectedTeacher.department === 'callern' || selectedTeacher.department === 'both') && (
                        <div>
                          <Label htmlFor="callernRate">Callern Standby Rate (IRR/hour)</Label>
                          <Input
                            id="callernRate"
                            type="number"
                            defaultValue={selectedTeacher.callernRate || 0}
                            placeholder="65000"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (selectedTeacher) {
                          const regularRateInput = document.getElementById('regularRate') as HTMLInputElement;
                          const callernRateInput = document.getElementById('callernRate') as HTMLInputElement;
                          const regularRate = parseInt(regularRateInput.value);
                          const callernRate = callernRateInput ? parseInt(callernRateInput.value) : undefined;
                          
                          updateTeacherRateMutation.mutate({
                            teacherId: selectedTeacher.id,
                            regularRate,
                            callernRate
                          });
                        }
                      }}
                      disabled={updateTeacherRateMutation.isPending}
                    >
                      {updateTeacherRateMutation.isPending ? 'Updating...' : 'Update Rate'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowRateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={() => calculatePaymentsMutation.mutate(selectedPeriod)}
              disabled={calculatePaymentsMutation.isPending}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {calculatePaymentsMutation.isPending ? 'Calculating...' : 'Calculate Payments'}
            </Button>
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
          <TabsTrigger value="rates">Rate Management</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Details</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
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
                <Button 
                  onClick={() => {
                    const baseRateElement = document.querySelector('input[defaultValue="75000"]') as HTMLInputElement;
                    const bonusElement = document.querySelector('input[defaultValue="10"]') as HTMLInputElement;
                    const baseRate = parseInt(baseRateElement?.value || '75000');
                    const bonusPercentage = parseInt(bonusElement?.value || '10');
                    updateRateStructureMutation.mutate({ baseRate, bonusPercentage });
                  }}
                  disabled={updateRateStructureMutation.isPending}
                >
                  {updateRateStructureMutation.isPending ? 'Updating...' : 'Update Rate Structure'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Payroll Details</CardTitle>
              <CardDescription>
                Comprehensive payroll information for each teacher (Admin & Supervisor Access)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{teacher.name}</h3>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                          {teacher.status}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Fetch detailed payroll information
                          fetch(`/api/admin/teacher-payments/payroll-details/${teacher.id}`)
                            .then(res => res.json())
                            .then(data => {
                              console.log('Payroll details:', data);
                              toast({
                                title: "Payroll Details",
                                description: `Retrieved details for ${teacher.name}`,
                              });
                            })
                            .catch(err => {
                              toast({
                                title: "Error",
                                description: "Failed to fetch payroll details",
                                variant: "destructive"
                              });
                            });
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Hourly Rate</Label>
                        <div className="font-medium">{teacher.hourlyRate?.toLocaleString()} IRR</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Callern Rate</Label>
                        <div className="font-medium">{teacher.callernRate?.toLocaleString() || 'N/A'} IRR</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Total Sessions</Label>
                        <div className="font-medium">{teacher.totalSessions}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Performance</Label>
                        <div className="font-medium">{teacher.performance}/5.0</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Department</Label>
                        <div className="font-medium capitalize">{teacher.department}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Total Hours</Label>
                        <div className="font-medium">{teacher.totalHours}h</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Tax ID</Label>
                        <div className="font-medium">TAX-{teacher.id.toString().padStart(6, '0')}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Contract Type</Label>
                        <div className="font-medium">Hourly</div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <Select defaultValue="all">
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
                      // Fetch payment history for selected teacher
                      const selectedTeacherId = teachers[0]?.id || 1;
                      fetch(`/api/admin/teacher-payments/history/${selectedTeacherId}`)
                        .then(res => res.json())
                        .then(data => {
                          console.log('Payment history:', data);
                          toast({
                            title: "Payment History",
                            description: `Retrieved ${data.payments.length} payment records`,
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