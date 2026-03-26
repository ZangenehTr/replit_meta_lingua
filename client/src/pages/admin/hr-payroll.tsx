import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Banknote, Calculator, CheckCheck } from "lucide-react";
import { Link } from "wouter";

interface PayrollRecord {
  id: number;
  employeeId: number;
  periodYear: number;
  periodMonth: number;
  baseSalary: string;
  overtimePay: string;
  bonus: string;
  deductions: string;
  leaveDeductions: string;
  grossPay: string;
  netPay: string;
  workingDays: number;
  presentDays: number;
  leavesDays: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string;
  department: string | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function fmt(n: string | number) {
  return Number(n).toLocaleString("fa-IR");
}

function statusColor(status: string) {
  const map: Record<string, string> = { draft: "text-yellow-700 bg-yellow-50", approved: "text-blue-700 bg-blue-50", paid: "text-green-700 bg-green-50" };
  return map[status] ?? "text-gray-700 bg-gray-50";
}

export default function HRPayrollPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);

  const { data: records = [], isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/hr/employees/payroll/period", year, month],
    queryFn: () => fetch(`/api/hr/employees/payroll/period?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }).then(r => r.json()),
  });

  const calcMutation = useMutation({
    mutationFn: () => apiRequest("/api/hr/employees/payroll/calculate", { method: "POST", body: { year, month } }),
    onSuccess: (data: { calculatedCount: number; records: PayrollRecord[] }) => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees/payroll/period", year, month] });
      toast({ title: `Payroll calculated for ${data.calculatedCount} employees` });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/hr/employees/payroll/${id}/approve`, { method: "PUT" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees/payroll/period", year, month] });
      toast({ title: "Payroll record approved" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const exportCSV = () => {
    if (records.length === 0) return;
    const header = "Code,Name,Department,Base Salary,Overtime,Bonus,Leave Deductions,Gross Pay,Net Pay,Status\n";
    const rows = records.map(r =>
      `${r.employeeCode},"${r.firstName} ${r.lastName}",${r.department ?? ""},${r.baseSalary},${r.overtimePay},${r.bonus},${r.leaveDeductions},${r.grossPay},${r.netPay},${r.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${year}_${String(month).padStart(2,"0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalNet = records.reduce((s, r) => s + Number(r.netPay), 0);
  const totalGross = records.reduce((s, r) => s + Number(r.grossPay), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="h-6 w-6" /> Payroll</h1>
          <p className="text-muted-foreground">Monthly salary calculation and approval</p>
        </div>
        <Link href="/admin/hr/employees"><Button variant="outline">← Employees</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <Button onClick={() => calcMutation.mutate()} disabled={calcMutation.isPending} className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />{calcMutation.isPending ? "Calculating..." : "Calculate Payroll"}
              </Button>
            )}
            <Button variant="outline" onClick={exportCSV} disabled={records.length === 0}>Export CSV</Button>
          </div>
        </CardHeader>

        {records.length > 0 && (
          <div className="px-6 pb-2 grid grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Gross Pay</div>
                <div className="text-xl font-bold">{fmt(totalGross)} ﷼</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Net Pay</div>
                <div className="text-xl font-bold">{fmt(totalNet)} ﷼</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Employees</div>
                <div className="text-xl font-bold">{records.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Banknote className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No payroll records for this period.</p>
              <p className="text-sm">Click "Calculate Payroll" to generate records.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Leave Ded.</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.firstName} {r.lastName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r.employeeCode}</div>
                    </TableCell>
                    <TableCell>{r.department ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(r.baseSalary)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">-{fmt(r.leaveDeductions)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(r.grossPay)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(r.netPay)}</TableCell>
                    <TableCell className="text-sm">{r.presentDays}/{r.workingDays}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span></TableCell>
                    <TableCell>
                      {isAdmin && r.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}>
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
