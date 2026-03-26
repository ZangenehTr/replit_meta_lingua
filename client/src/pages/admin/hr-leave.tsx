import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarOff, CheckCircle, XCircle, Clock, PieChart } from "lucide-react";
import { Link } from "wouter";

interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: string;
  reason: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string;
}

interface Employee {
  id: number;
  employeeCode: string;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
}

interface LeaveBalance {
  leaveType: string;
  entitled: number;
  used: number;
  pending: number;
  remaining: number;
}

interface BalanceResponse {
  employeeId: number;
  year: number;
  balance: LeaveBalance[];
}

function statusBadge(status: string) {
  const map: Record<string, { cls: string; icon: (props: { className?: string }) => JSX.Element }> = {
    pending: { cls: "bg-yellow-100 text-yellow-800", icon: ({ className }) => <Clock className={className} /> },
    approved: { cls: "bg-green-100 text-green-800", icon: ({ className }) => <CheckCircle className={className} /> },
    rejected: { cls: "bg-red-100 text-red-800", icon: ({ className }) => <XCircle className={className} /> },
    cancelled: { cls: "bg-gray-100 text-gray-700", icon: ({ className }) => <XCircle className={className} /> },
  };
  return map[status] ?? { cls: "bg-gray-100 text-gray-700", icon: ({ className }) => <Clock className={className} /> };
}

const CURRENT_YEAR = new Date().getFullYear();

export default function HRLeavePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; leaveId: number | null; action: "approved" | "rejected" }>({ open: false, leaveId: null, action: "approved" });
  const [reviewNotes, setReviewNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [balanceYear, setBalanceYear] = useState(CURRENT_YEAR);

  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({ queryKey: ["/api/hr/employees/leaves/all"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/hr/employees"] });

  const { data: balanceData, isLoading: balanceLoading } = useQuery<BalanceResponse>({
    queryKey: ["/api/hr/employees", selectedEmployeeId, "leaves/balance", balanceYear],
    queryFn: () => selectedEmployeeId
      ? fetch(`/api/hr/employees/${selectedEmployeeId}/leaves/balance?year=${balanceYear}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        }).then(r => r.json())
      : Promise.resolve(null),
    enabled: !!selectedEmployeeId,
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { status: string; reviewNotes: string }) =>
      apiRequest("PUT", `/api/hr/employees/leaves/${reviewDialog.leaveId}/review`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees/leaves/all"] });
      setReviewDialog({ open: false, leaveId: null, action: "approved" });
      setReviewNotes("");
      toast({ title: `Leave request ${reviewDialog.action}` });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  const openReview = (id: number, action: "approved" | "rejected") => {
    setReviewDialog({ open: true, leaveId: id, action });
    setReviewNotes("");
  };

  const leaveCounts = {
    all: leaves.length,
    pending: leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
  };

  const LEAVE_COLORS: Record<string, string> = {
    annual: "bg-blue-500",
    sick: "bg-red-400",
    emergency: "bg-orange-400",
    unpaid: "bg-gray-400",
    maternity: "bg-pink-400",
    paternity: "bg-indigo-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarOff className="h-6 w-6" /> Leave Management</h1>
          <p className="text-muted-foreground">Review leave requests and track employee leave balances</p>
        </div>
        <Link href="/admin/hr/employees"><Button variant="outline">← Employees</Button></Link>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balance">Leave Balance Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {(["all", "pending", "approved", "rejected"] as const).map(s => (
              <Card key={s} className={`cursor-pointer transition-all ${filter === s ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter(s)}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{leaveCounts[s]}</div>
                  <div className="text-sm text-muted-foreground capitalize">{s} Requests</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leave requests found</TableCell></TableRow>
                    ) : filtered.map(l => {
                      const sb = statusBadge(l.status);
                      const Icon = sb.icon;
                      return (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="font-medium">{l.firstName} {l.lastName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{l.employeeCode}</div>
                          </TableCell>
                          <TableCell className="capitalize">{l.leaveType.replace("_", " ")}</TableCell>
                          <TableCell>{l.startDate?.split("T")[0] ?? "—"}</TableCell>
                          <TableCell>{l.endDate?.split("T")[0] ?? "—"}</TableCell>
                          <TableCell>{l.daysRequested}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{l.reason ?? "—"}</TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${sb.cls}`}>
                              <Icon className="h-3 w-3" />{l.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {l.status === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => openReview(l.id, "approved")}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => openReview(l.id, "rejected")}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {l.status !== "pending" && l.reviewNotes && (
                              <span className="text-xs text-muted-foreground italic">{l.reviewNotes.substring(0, 40)}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-4">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1 flex-1 min-w-48">
                  <Select value={selectedEmployeeId ? String(selectedEmployeeId) : ""} onValueChange={v => setSelectedEmployeeId(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select employee to view balance..." /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.firstName} {e.lastName} — {e.employeeCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={String(balanceYear)} onValueChange={v => setBalanceYear(Number(v))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedEmployeeId ? (
                <div className="text-center py-10 text-muted-foreground">Select an employee above to view their leave balance.</div>
              ) : balanceLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading balance...</div>
              ) : !balanceData ? (
                <div className="text-center py-8 text-muted-foreground">No data available.</div>
              ) : (
                <div className="space-y-4">
                  {balanceData.balance.map(b => (
                    <div key={b.leaveType} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{b.leaveType.replace("_", " ")} Leave</span>
                        <span className="text-muted-foreground">
                          {b.used} used + {b.pending} pending / {b.entitled} days
                          {b.entitled > 0 && <span className={`ml-2 font-medium ${b.remaining <= 3 ? "text-red-600" : "text-green-700"}`}>({b.remaining} left)</span>}
                        </span>
                      </div>
                      {b.entitled > 0 && (
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full ${LEAVE_COLORS[b.leaveType] ?? "bg-blue-500"}`}
                            style={{ width: `${Math.min(100, (b.used / b.entitled) * 100)}%` }}
                          />
                          {b.pending > 0 && (
                            <div
                              className="absolute top-0 h-full bg-yellow-400/60 rounded-full"
                              style={{
                                left: `${Math.min(100, (b.used / b.entitled) * 100)}%`,
                                width: `${Math.min(100 - (b.used / b.entitled) * 100, (b.pending / b.entitled) * 100)}%`
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialog.open} onOpenChange={open => setReviewDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{reviewDialog.action === "approved" ? "Approve" : "Reject"} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Review Notes (optional)</Label>
            <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Add a note for the employee..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(d => ({ ...d, open: false }))}>Cancel</Button>
            <Button
              variant={reviewDialog.action === "approved" ? "default" : "destructive"}
              onClick={() => reviewMutation.mutate({ status: reviewDialog.action, reviewNotes })}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Processing..." : reviewDialog.action === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
