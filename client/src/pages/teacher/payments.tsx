import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  FileText, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PayslipDetail {
  id: number;
  period: string;
  totalSessions: number;
  totalHours: number;
  hourlyRate: number;
  basePay: number;
  bonuses: number;
  deductions: number;
  finalAmount: number;
  status: 'pending' | 'calculated' | 'approved' | 'confirmed' | 'paid';
  calculatedAt: string;
  approvedAt?: string;
  confirmedAt?: string;
  paidAt?: string;
  sessions: SessionDetail[];
  taxDeduction: number;
  socialSecurity: number;
  netAmount: number;
}

interface SessionDetail {
  date: string;
  type: "1-on-1" | "group" | "callern";
  studentName?: string;
  groupDetails?: string;
  startTime: string;
  endTime: string;
  duration: number;
  platform: string;
  courseTitle: string;
}

export default function TeacherPayments() {
  const { t } = useTranslation(['teacher', 'common']);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetail | null>(null);

  const { data: payslips, isLoading } = useQuery<PayslipDetail[]>({
    queryKey: [API_ENDPOINTS.teacher.payslips],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.teacher.payslips);
      if (!response.ok) throw new Error('Failed to fetch payslips');
      return response.json();
    }
  });

  const { data: currentPayslip } = useQuery<PayslipDetail>({
    queryKey: [API_ENDPOINTS.teacher.payslipCurrent],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.teacher.payslipCurrent);
      if (!response.ok) throw new Error('Failed to fetch current payslip');
      return response.json();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const downloadPayslip = async (payslipId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.teacher.payslips}/${payslipId}/download`);
      if (!response.ok) throw new Error('Failed to download payslip');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Payslip downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download payslip",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('teacher.payments')}</h1>
      </div>

      {/* Current Payment Status */}
      {currentPayslip && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Month Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{currentPayslip.totalSessions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{currentPayslip.totalHours}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Expected Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(currentPayslip.finalAmount)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              {getStatusIcon(currentPayslip.status)}
              <Badge className={getStatusColor(currentPayslip.status)}>
                {currentPayslip.status === 'confirmed' ? t('teacher.confirmed') : t(`teacher.${currentPayslip.status}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips?.map((payslip: PayslipDetail) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">{payslip.period}</TableCell>
                  <TableCell>{payslip.totalSessions}</TableCell>
                  <TableCell>{payslip.totalHours}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payslip.finalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payslip.status)}>
                      {payslip.status === 'confirmed' ? t('teacher.confirmed') : t(`teacher.${payslip.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedPayslip(payslip)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Payslip Details - {payslip.period}</DialogTitle>
                          </DialogHeader>
                          {selectedPayslip && (
                            <div className="space-y-6">
                              {/* Payment Summary */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                                      <p className="font-semibold">{selectedPayslip.totalSessions}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Total Hours</p>
                                      <p className="font-semibold">{selectedPayslip.totalHours}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Hourly Rate</p>
                                      <p className="font-semibold">{formatCurrency(selectedPayslip.hourlyRate)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Base Pay</p>
                                      <p className="font-semibold">{formatCurrency(selectedPayslip.basePay)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Bonuses</p>
                                      <p className="font-semibold text-green-600">+{formatCurrency(selectedPayslip.bonuses)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Deductions</p>
                                      <p className="font-semibold text-red-600">-{formatCurrency(selectedPayslip.deductions)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Tax Deduction</p>
                                      <p className="font-semibold text-red-600">-{formatCurrency(selectedPayslip.taxDeduction)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Social Security</p>
                                      <p className="font-semibold text-red-600">-{formatCurrency(selectedPayslip.socialSecurity)}</p>
                                    </div>
                                    <div className="col-span-2 border-t pt-4">
                                      <p className="text-sm text-muted-foreground">Final Amount</p>
                                      <p className="text-xl font-bold">{formatCurrency(selectedPayslip.finalAmount)}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Session Details */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Session Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Student/Group</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Course</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedPayslip.sessions?.map((session, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{session.date}</TableCell>
                                          <TableCell>
                                            <Badge variant="outline">{session.type}</Badge>
                                          </TableCell>
                                          <TableCell>
                                            {session.studentName || session.groupDetails}
                                          </TableCell>
                                          <TableCell>{session.duration}h</TableCell>
                                          <TableCell>{session.platform}</TableCell>
                                          <TableCell>{session.courseTitle}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {(payslip.status === 'confirmed' || payslip.status === 'paid') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPayslip(payslip.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}