import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface LeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
}

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "emergency", label: "Emergency Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

function statusBadge(status: string) {
  if (status === "approved")
    return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-800 gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
}

export default function HrMyLeavePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    daysRequested: "",
    reason: "",
  });

  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/hr/leaves/self"],
    queryFn: () => apiRequest("/api/hr/leaves/self"),
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("/api/hr/leaves/self", {
        method: "POST",
        body: {
          ...data,
          daysRequested: Number(data.daysRequested),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/leaves/self"] });
      toast({ title: "Leave request submitted successfully" });
      setOpen(false);
      setForm({ leaveType: "annual", startDate: "", endDate: "", daysRequested: "", reason: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to submit leave request", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.daysRequested || !form.reason) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    submitMutation.mutate(form);
  };

  const pending = leaves.filter(l => l.status === "pending").length;
  const approved = leaves.filter(l => l.status === "approved").length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            My Leave Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Submit and track your leave requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Leave Type</Label>
                <Select value={form.leaveType} onValueChange={v => setForm(f => ({ ...f, leaveType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(lt => (
                      <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Days Requested *</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={form.daysRequested}
                  onChange={e => setForm(f => ({ ...f, daysRequested: e.target.value }))}
                  placeholder="e.g. 3"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Reason *</Label>
                <Textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Brief reason for your leave request..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-sm text-muted-foreground mt-1">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{approved}</div>
            <div className="text-sm text-muted-foreground mt-1">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{leaves.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Requests</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No leave requests yet. Click "Request Leave" to submit your first request.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map(leave => (
                <div key={leave.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">
                      {LEAVE_TYPES.find(lt => lt.value === leave.leaveType)?.label ?? leave.leaveType}
                    </div>
                    {statusBadge(leave.status)}
                  </div>
                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>{new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}</span>
                    <span>{leave.daysRequested} day{leave.daysRequested !== 1 ? "s" : ""}</span>
                  </div>
                  {leave.reason && (
                    <div className="text-sm">{leave.reason}</div>
                  )}
                  {leave.reviewNotes && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      <span className="font-medium">Reviewer note:</span> {leave.reviewNotes}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(leave.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
