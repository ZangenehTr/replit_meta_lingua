import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, CheckCircle, XCircle, Clock, Users, Download,
  Search, Filter, ShieldAlert, Calendar
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  force_cancelled: "bg-purple-100 text-purple-800 border-purple-200",
};

const REASON_LABELS: Record<string, string> = {
  sick: "Sick / Illness",
  emergency: "Personal Emergency",
  conflict: "Schedule Conflict",
  weather: "Weather / Force Majeure",
  other: "Other",
};

export default function CancellationsAuditPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);

  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/classes/cancel-requests/audit', { startDate, endDate, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "100" });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/classes/cancel-requests/audit?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 60000,
  });

  const forceCancelMutation = useMutation({
    mutationFn: async ({ sessionId, reasonText }: { sessionId: number; reasonText?: string }) => {
      const res = await fetch(`/api/classes/${sessionId}/force-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ reasonCategory: 'other', reasonText: reasonText || 'Admin force cancel' })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Session force-cancelled", description: "Students have been notified via SMS." });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/cancel-requests/audit'] });
    },
    onError: (err: Error) => { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
  });

  const filtered = records.filter(item => {
    const req = item.request;
    const requester = item.requester;
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const name = `${requester?.firstName || ''} ${requester?.lastName || ''}`.toLowerCase();
      if (!name.includes(q) && !String(req.classSessionId).includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: records.length,
    pending: records.filter(r => r.request.status === 'pending').length,
    approved: records.filter(r => r.request.status === 'approved').length,
    rejected: records.filter(r => r.request.status === 'rejected').length,
    forceCancelled: records.filter(r => r.request.status === 'force_cancelled').length,
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Session ID', 'Status', 'Requester', 'Role', 'Reason', 'Details', 'Is <30min', 'SMS Count', 'Created'];
    const rows = filtered.map(item => [
      item.request.id,
      item.request.classSessionId,
      item.request.status,
      `${item.requester?.firstName || ''} ${item.requester?.lastName || ''}`.trim(),
      item.request.requesterRole,
      REASON_LABELS[item.request.reasonCategory] || item.request.reasonCategory,
      (item.request.reasonText || '').replace(/,/g, ';'),
      item.request.isLessThan30Min ? 'Yes' : 'No',
      item.request.smsDeliveryCount || 0,
      new Date(item.request.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cancellations-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              Class Cancellations Audit Log
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Full record of all emergency cancellation requests and decisions.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-800" },
            { label: "Pending", value: stats.pending, color: "bg-yellow-100 text-yellow-800" },
            { label: "Approved", value: stats.approved, color: "bg-green-100 text-green-800" },
            { label: "Rejected", value: stats.rejected, color: "bg-red-100 text-red-800" },
            { label: "Force Cancelled", value: stats.forceCancelled, color: "bg-purple-100 text-purple-800" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or session ID..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="force_cancelled">Force Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="From date" />
              </div>
              <div>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="To date" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-600">No records found</p>
                <p className="text-sm mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Session</th>
                      <th className="px-4 py-3 text-left">Requester</th>
                      <th className="px-4 py-3 text-left">Reason</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Flags</th>
                      <th className="px-4 py-3 text-left">SMS</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((item: any) => {
                      const req = item.request;
                      const session = item.session;
                      const requester = item.requester;
                      return (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">#{req.id}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">#{req.classSessionId}</span>
                            {session?.sessionDate && (
                              <p className="text-xs text-gray-400">{new Date(session.sessionDate).toLocaleDateString()}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{requester?.firstName} {requester?.lastName}</span>
                            <p className="text-xs text-gray-400 capitalize">{req.requesterRole}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span>{REASON_LABELS[req.reasonCategory] || req.reasonCategory}</span>
                            {req.reasonText && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{req.reasonText}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-700'}`}>
                              {req.status === 'approved' && <CheckCircle className="h-3 w-3 me-1" />}
                              {req.status === 'rejected' && <XCircle className="h-3 w-3 me-1" />}
                              {req.status === 'pending' && <Clock className="h-3 w-3 me-1" />}
                              {req.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {req.isLessThan30Min && (
                                <Badge variant="destructive" className="text-xs">⚡ &lt;30min</Badge>
                              )}
                              {req.studentRequestCount > 1 && (
                                <Badge className="text-xs bg-orange-100 text-orange-700 border border-orange-200">
                                  {req.studentRequestCount} students
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {req.smsDeliveryCount != null ? (
                              <span className="text-green-700 font-medium">{req.smsDeliveryCount}</span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {req.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-7"
                                onClick={() => forceCancelMutation.mutate({ sessionId: req.classSessionId })}
                                disabled={forceCancelMutation.isPending}
                              >
                                Force Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
