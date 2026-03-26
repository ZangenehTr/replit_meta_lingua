import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Pencil, Users2, FileText } from "lucide-react";
import { Link } from "wouter";

interface Employee {
  id: number;
  userId: number;
  employeeCode: string;
  department: string | null;
  jobTitle: string | null;
  contractType: string;
  baseSalary: string;
  hireDate: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  role: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = { active: "bg-green-100 text-green-800", on_leave: "bg-yellow-100 text-yellow-800", terminated: "bg-red-100 text-red-800" };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export default function HREmployeesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
  });

  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (editEmployee) {
        return apiRequest("PUT", `/api/hr/employees/${editEmployee.id}`, data);
      }
      return apiRequest("POST", `/api/hr/employees`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      setDialogOpen(false);
      toast({ title: editEmployee ? "Employee updated" : "Employee created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeCode} ${e.department ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditEmployee(null);
    setForm({ contractType: "full_time", status: "active", baseSalary: "0" });
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setForm({
      department: emp.department ?? "",
      jobTitle: emp.jobTitle ?? "",
      contractType: emp.contractType,
      baseSalary: emp.baseSalary,
      status: emp.status,
      hireDate: emp.hireDate?.split("T")[0] ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!editEmployee && !form.userId) return toast({ title: "Select a user", variant: "destructive" });
    if (!form.hireDate) return toast({ title: "Hire date is required", variant: "destructive" });
    saveMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users2 className="h-6 w-6" /> Employee Management</h1>
          <p className="text-muted-foreground">Manage institute staff and their records</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/hr/leave"><Button variant="outline">Leave Requests</Button></Link>
          <Link href="/admin/hr/payroll"><Button variant="outline">Payroll</Button></Link>
          <Link href="/admin/hr/performance"><Button variant="outline">Performance</Button></Link>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by name, code, department..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
                ) : filtered.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-sm">{emp.employeeCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                    <TableCell>{emp.department ?? "—"}</TableCell>
                    <TableCell>{emp.contractType?.replace("_", " ")}</TableCell>
                    <TableCell>{emp.hireDate?.split("T")[0] ?? "—"}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(emp.status)}`}>{emp.status}</span></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                      <Link href={`/admin/hr/performance?employee=${emp.id}`}><Button size="sm" variant="ghost"><FileText className="h-4 w-4" /></Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editEmployee && (
              <div className="space-y-1">
                <Label>User Account</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, userId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                  <SelectContent>
                    {users.filter(u => !["Student"].includes(u.role)).map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.firstName} {u.lastName} ({u.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Department</Label>
                <Input value={form.department ?? ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Teaching" />
              </div>
              <div className="space-y-1">
                <Label>Job Title</Label>
                <Input value={form.jobTitle ?? ""} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. Senior Teacher" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Contract Type</Label>
                <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Base Salary (Toman)</Label>
                <Input type="number" value={form.baseSalary ?? "0"} onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Hire Date</Label>
                <Input type="date" value={form.hireDate ?? ""} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
