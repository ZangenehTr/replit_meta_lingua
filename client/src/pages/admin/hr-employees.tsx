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
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contractDialog, setContractDialog] = useState<{ open: boolean; employeeId: number | null }>({ open: false, employeeId: null });
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [contractForm, setContractForm] = useState<Record<string, string>>({});

  const { data: employees = [], isLoading } = useQuery<Employee[]>({ queryKey: ["/api/hr/employees"] });
  const { data: users = [] } = useQuery<UserOption[]>({ queryKey: ["/api/admin/users"], enabled: isAdmin });
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
        ? apiRequest(`/api/hr/employees/${editEmployee.id}`, { method: "PUT", body: data })
        : apiRequest(`/api/hr/employees`, { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      setDialogOpen(false);
      toast({ title: editEmployee ? "Employee updated" : "Employee created" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const saveContractMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest(`/api/hr/employees/${contractDialog.employeeId}/contracts`, { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees", contractDialog.employeeId, "contracts"] });
      setContractForm({});
      toast({ title: "Contract added" });
    },
    onError: (e: unknown) => toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
  });

  const terminateContractMutation = useMutation({
    mutationFn: ({ empId, contractId }: { empId: number; contractId: number }) =>
      apiRequest(`/api/hr/employees/${empId}/contracts/${contractId}/terminate`, { method: "PUT", body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr/employees", contractDialog.employeeId, "contracts"] });
      toast({ title: "Contract terminated" });
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
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users2 className="h-6 w-6" /> مدیریت کارمندان</h1>
          <p className="text-muted-foreground">مدیریت کارکنان، قراردادها و پرونده‌های موسسه</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/hr/leave"><Button variant="outline">مرخصی</Button></Link>
          <Link href="/admin/hr/payroll"><Button variant="outline">حقوق و دستمزد</Button></Link>
          <Link href="/admin/hr/performance"><Button variant="outline">عملکرد</Button></Link>
          {isAdmin && <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" /> افزودن کارمند</Button>}
        </div>
      </div>

      {expiringContracts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {expiringContracts.length} قرارداد در طی ۳۰ روز آینده منقضی می‌شود
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
          <TabsTrigger value="employees">کارمندان ({employees.length})</TabsTrigger>
          <TabsTrigger value="contracts">قراردادها</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input placeholder="جستجو بر اساس نام، کد، بخش..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">در حال بارگذاری کارمندان...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کد</TableHead>
                      <TableHead>نام</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>بخش</TableHead>
                      <TableHead>قرارداد</TableHead>
                      <TableHead>تاریخ استخدام</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">کارمندی یافت نشد</TableCell></TableRow>
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
                            {isAdmin && <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>}
                            {isAdmin && (
                              <Button size="sm" variant="ghost" onClick={() => setContractDialog({ open: true, employeeId: emp.id })} title="Manage contracts">
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
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
              <CardTitle className="text-base">قراردادهای در حال انقضا / اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کارمند</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>شروع</TableHead>
                    <TableHead>پایان</TableHead>
                    <TableHead>حقوق</TableHead>
                    <TableHead>هشدار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringContracts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">هیچ قراردادی در ۳۰ روز آینده منقضی نمی‌شود</TableCell></TableRow>
                  ) : expiringContracts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.firstName} {c.lastName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{c.employeeCode}</div>
                      </TableCell>
                      <TableCell className="capitalize">{c.contractType?.replace("_", " ")}</TableCell>
                      <TableCell>{c.startDate?.split("T")[0]}</TableCell>
                      <TableCell>{c.endDate?.split("T")[0] ?? "باز"}</TableCell>
                      <TableCell className="font-mono">{Number(c.salaryAmount).toLocaleString()}</TableCell>
                      <TableCell>
                        {c.renewalAlert && <Badge variant="outline" className="text-orange-700 border-orange-300">تمدید به‌زودی</Badge>}
                        {c.isExpired && <Badge variant="destructive">منقضی شده</Badge>}
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
            <DialogTitle>{editEmployee ? "ویرایش کارمند" : "افزودن کارمند"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editEmployee && (
              <div className="space-y-1">
                <Label>حساب کاربری</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, userId: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب کاربر..." /></SelectTrigger>
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
                <Label>بخش</Label>
                <Input value={form.department ?? ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="مثال: آموزش" />
              </div>
              <div className="space-y-1">
                <Label>عنوان شغلی</Label>
                <Input value={form.jobTitle ?? ""} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="مثال: معلم ارشد" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>نوع قرارداد</Label>
                <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">تمام وقت</SelectItem>
                    <SelectItem value="part_time">پاره وقت</SelectItem>
                    <SelectItem value="hourly">ساعتی</SelectItem>
                    <SelectItem value="contract">قراردادی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>حقوق پایه (تومان)</Label>
                <Input type="number" value={form.baseSalary ?? "0"} onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>تاریخ استخدام</Label>
                <Input type="date" value={form.hireDate ?? ""} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>وضعیت</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="on_leave">در مرخصی</SelectItem>
                    <SelectItem value="terminated">خاتمه یافته</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>{saveMutation.isPending ? "در حال ذخیره..." : "ذخیره"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract management dialog */}
      <Dialog open={contractDialog.open} onOpenChange={open => setContractDialog(d => ({ ...d, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              مدیریت قرارداد — {employees.find(e => e.id === contractDialog.employeeId)?.firstName}{" "}
              {employees.find(e => e.id === contractDialog.employeeId)?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <h4 className="font-medium mb-2 text-sm">افزودن قرارداد جدید</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>نوع</Label>
                  <Select value={contractForm.contractType ?? "full_time"} onValueChange={v => setContractForm(f => ({ ...f, contractType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">تمام وقت</SelectItem>
                      <SelectItem value="part_time">پاره وقت</SelectItem>
                      <SelectItem value="hourly">ساعتی</SelectItem>
                      <SelectItem value="contract">قراردادی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>مبلغ حقوق</Label>
                  <Input type="number" value={contractForm.salaryAmount ?? ""} onChange={e => setContractForm(f => ({ ...f, salaryAmount: e.target.value }))} placeholder="مبلغ ماهانه به تومان" />
                </div>
                <div className="space-y-1">
                  <Label>تاریخ شروع</Label>
                  <Input type="date" value={contractForm.startDate ?? ""} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>تاریخ پایان (برای نامحدود خالی بگذارید)</Label>
                  <Input type="date" value={contractForm.endDate ?? ""} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <Button size="sm" className="mt-3" onClick={handleSaveContract} disabled={saveContractMutation.isPending}>
                {saveContractMutation.isPending ? "در حال افزودن..." : "افزودن قرارداد"}
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-sm">تاریخچه قراردادها</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع</TableHead>
                    <TableHead>شروع</TableHead>
                    <TableHead>پایان</TableHead>
                    <TableHead>حقوق</TableHead>
                    <TableHead>وضعیت</TableHead>
                    {isAdmin && <TableHead>عملیات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEmployeeContracts.length === 0 ? (
                    <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-4">هنوز قراردادی ثبت نشده</TableCell></TableRow>
                  ) : selectedEmployeeContracts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="capitalize">{c.contractType?.replace("_", " ")}</TableCell>
                      <TableCell>{c.startDate?.split("T")[0]}</TableCell>
                      <TableCell>{c.endDate?.split("T")[0] ?? "باز"}</TableCell>
                      <TableCell className="font-mono">{Number(c.salaryAmount).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${c.renewalAlert ? "bg-orange-100 text-orange-800" : c.isExpired ? "bg-red-100 text-red-800" : c.status === "terminated" ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"}`}>
                          {c.renewalAlert ? "تمدید به‌زودی" : c.isExpired ? "منقضی شده" : c.status}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {c.status === "active" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => contractDialog.employeeId && terminateContractMutation.mutate({ empId: contractDialog.employeeId, contractId: c.id })}
                              disabled={terminateContractMutation.isPending}
                            >
                              خاتمه دادن
                            </Button>
                          )}
                        </TableCell>
                      )}
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
