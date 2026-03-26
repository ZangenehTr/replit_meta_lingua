import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Pencil, Users2, FileText, AlertTriangle, RefreshCw } from "lucide-react";
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

interface UserOption {
  id: number;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Contract {
  id: number;
  employeeId: number;
  contractType: string;
  startDate: string;
  endDate: string | null;
  salaryAmount: string;
  status: string;
  renewalAlert?: boolean;
  isExpired?: boolean;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  department?: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    on_leave: "bg-yellow-100 text-yellow-800",
    terminated: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export default function HREmployeesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contractDialog, setContractDialog] = useState<{ open: boolean; employeeId: number | null }>({ open: false, employeeId: null });
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [contractForm, setContractForm] = useState<Record<string, string>>({});

  const { data: employees = [], isLoading } = useQuery<Employee[]>({ queryKey: ["/api/hr/employees"] });
  const { data: users = [] } = useQuery<UserOption[]>({ queryKey: ["/api/admin/users"] });
  const { data: expiringContracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/hr/employees/contracts/expiring"],
    queryFn: () => fetch("/api/hr/employees/contracts/expiring?days=30", { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }).then(r => r.json()),
  });

  const { data: selectedEmployeeContracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/hr/employees", contractDialog.employeeId, "contracts"],
    queryFn: () => contractDialog.employeeId
      ? fetch(`/api/hr/employees/${contractDialog.employeeId}/contracts`, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!contractDialog.employeeId,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      editEmployee
        ? apiRequest("PUT", `/api/hr/employees/${editEmployee.id}`, data)
        : apiRequest("POST", `/api/hr/employees`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      setDialogOpen(false);
      toast({ title: editEmployee ? "Employee updated" : "Employee created" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const saveContractMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest("POST", `/api/hr/employees/${contractDialog.employeeId}/contracts`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees", contractDialog.employeeId, "contracts"] });
      setContractForm({});
      toast({ title: "Contract added" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
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
    if (!editEmployee && !form.userId) { toast({ title: "Select a user", variant: "destructive" }); return; }
    if (!form.hireDate) { toast({ title: "Hire date is required", variant: "destructive" }); return; }
    saveMutation.mutate(form);
  };

  const handleSaveContract = () => {
    if (!contractForm.startDate || !contractForm.salaryAmount) {
      toast({ title: "Start date and salary are required", variant: "destructive" });
      return;
    }
    saveContractMutation.mutate({ ...contractForm, status: "active" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users2 className="h-6 w-6" /> Employee Management</h1>
          <p className="text-muted-foreground">Manage institute staff, contracts, and records</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/hr/leave"><Button variant="outline">Leave</Button></Link>
          <Link href="/admin/hr/payroll"><Button variant="outline">Payroll</Button></Link>
          <Link href="/admin/hr/performance"><Button variant="outline">Performance</Button></Link>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
        </div>
      </div>

      {expiringContracts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {expiringContracts.length} contract(s) expiring within 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expiringContracts.map(c => (
                <Badge key={c.id} variant="outline" className="text-orange-700 border-orange-300">
                  {c.firstName} {c.lastName} — expires {c.endDate?.split("T")[0]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees ({employees.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
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
                        <TableCell className="capitalize">{emp.contractType?.replace("_", " ")}</TableCell>
                        <TableCell>{emp.hireDate?.split("T")[0] ?? "—"}</TableCell>
                        <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(emp.status)}`}>{emp.status}</span></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setContractDialog({ open: true, employeeId: emp.id })} title="Manage contracts">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Link href={`/admin/hr/performance?employee=${emp.id}`}>
                              <Button size="sm" variant="ghost" title="Performance"><RefreshCw className="h-4 w-4" /></Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Expiring / Recent Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Alert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringContracts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No contracts expiring in the next 30 days</TableCell></TableRow>
                  ) : expiringContracts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.firstName} {c.lastName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{c.employeeCode}</div>
                      </TableCell>
                      <TableCell className="capitalize">{c.contractType?.replace("_", " ")}</TableCell>
                      <TableCell>{c.startDate?.split("T")[0]}</TableCell>
                      <TableCell>{c.endDate?.split("T")[0] ?? "Open"}</TableCell>
                      <TableCell className="font-mono">{Number(c.salaryAmount).toLocaleString()}</TableCell>
                      <TableCell>
                        {c.renewalAlert && <Badge variant="outline" className="text-orange-700 border-orange-300">Renew soon</Badge>}
                        {c.isExpired && <Badge variant="destructive">Expired</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee add/edit dialog */}
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
                    {users.filter((u: UserOption) => !["Student"].includes(u.role)).map((u: UserOption) => (
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

      {/* Contract management dialog */}
      <Dialog open={contractDialog.open} onOpenChange={open => setContractDialog(d => ({ ...d, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Contract Management — {employees.find(e => e.id === contractDialog.employeeId)?.firstName}{" "}
              {employees.find(e => e.id === contractDialog.employeeId)?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <h4 className="font-medium mb-2 text-sm">Add New Contract</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={contractForm.contractType ?? "full_time"} onValueChange={v => setContractForm(f => ({ ...f, contractType: v }))}>
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
                  <Label>Salary Amount</Label>
                  <Input type="number" value={contractForm.salaryAmount ?? ""} onChange={e => setContractForm(f => ({ ...f, salaryAmount: e.target.value }))} placeholder="Monthly amount in Toman" />
                </div>
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="date" value={contractForm.startDate ?? ""} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>End Date (leave blank for open-ended)</Label>
                  <Input type="date" value={contractForm.endDate ?? ""} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <Button size="sm" className="mt-3" onClick={handleSaveContract} disabled={saveContractMutation.isPending}>
                {saveContractMutation.isPending ? "Adding..." : "Add Contract"}
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-sm">Contract History</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployeeContracts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No contracts yet</TableCell></TableRow>
                  ) : selectedEmployeeContracts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="capitalize">{c.contractType?.replace("_", " ")}</TableCell>
                      <TableCell>{c.startDate?.split("T")[0]}</TableCell>
                      <TableCell>{c.endDate?.split("T")[0] ?? "Open"}</TableCell>
                      <TableCell className="font-mono">{Number(c.salaryAmount).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${c.renewalAlert ? "bg-orange-100 text-orange-800" : c.isExpired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {c.renewalAlert ? "Renew Soon" : c.isExpired ? "Expired" : c.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialog({ open: false, employeeId: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
