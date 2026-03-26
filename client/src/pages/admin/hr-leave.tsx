import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarOff, CheckCircle, XCircle, Clock } from "lucide-react";
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

function statusBadge(status: string) {
  const map: Record<string, { class: string; icon: any }> = {
    pending: { class: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { class: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { class: "bg-red-100 text-red-800", icon: XCircle },
    cancelled: { class: "bg-gray-100 text-gray-700", icon: XCircle },
  };
  return map[status] ?? { class: "bg-gray-100 text-gray-700", icon: Clock };
}

export default function HRLeavePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; leaveId: number | null; action: "approved" | "rejected" }>({ open: false, leaveId: null, action: "approved" });
  const [reviewNotes, setReviewNotes] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/hr/employees/leaves/all"],
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
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarOff className="h-6 w-6" /> Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <Link href="/admin/hr/employees"><Button variant="outline">← Employees</Button></Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
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
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
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
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sb.class}`}>
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
                          <span className="text-xs text-muted-foreground italic">{l.reviewNotes.substring(0, 40)}...</span>
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
