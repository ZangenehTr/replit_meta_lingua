import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Tag, TicketPercent, Copy, BarChart2, Users } from "lucide-react";

interface PromoUsage {
  id: number;
  usedAt: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentPhone: string | null;
  courseTitle: string | null;
}

interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minAmount: number;
  maxUsages: number | null;
  usedCount: number;
  expiresAt: string | null;
  applicableCourseIds: number[] | null;
  singleUsePerUser: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PromoCodePayload {
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minAmount: number;
  maxUsages: number | null;
  expiresAt: string | null;
  applicableCourseIds: number[] | null;
  singleUsePerUser: boolean;
  isActive: boolean;
}

interface CourseOption { id: number; title: string; }

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minAmount: "",
  maxUsages: "",
  expiresAt: "",
  singleUsePerUser: false,
  isActive: true,
  allCourses: true,
  selectedCourseIds: [] as number[],
};

export default function PromoCodesPage() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const isRTL = i18n.dir() === "rtl";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [usagePromo, setUsagePromo] = useState<PromoCode | null>(null);

  const { data: usages = [], isLoading: usagesLoading } = useQuery<PromoUsage[]>({
    queryKey: ["/api/admin/promo-codes", usagePromo?.id, "usages"],
    queryFn: () => apiRequest(`/api/admin/promo-codes/${usagePromo!.id}/usages`),
    enabled: !!usagePromo,
  });

  const { data: promoCodes = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    queryFn: () => apiRequest("/api/admin/promo-codes"),
  });

  const { data: courseOptions = [] } = useQuery<CourseOption[]>({
    queryKey: ["/api/courses"],
    queryFn: () => apiRequest("/api/courses"),
  });

  const createMutation = useMutation({
    mutationFn: (data: PromoCodePayload) =>
      apiRequest("/api/admin/promo-codes", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "کد تخفیف ایجاد شد" });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: err.message || "خطا در ایجاد کد تخفیف", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      apiRequest(`/api/admin/promo-codes/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "کد تخفیف بروزرسانی شد" });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: err.message || "خطا در بروزرسانی", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/promo-codes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "کد تخفیف حذف شد" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({ title: err.message || "خطا در حذف", variant: "destructive" });
    },
  });

  function openCreate() {
    setEditingCode(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(code: PromoCode) {
    setEditingCode(code);
    const hasSpecificCourses = Array.isArray(code.applicableCourseIds) && code.applicableCourseIds.length > 0;
    setForm({
      code: code.code,
      description: code.description || "",
      discountType: code.discountType,
      discountValue: String(code.discountValue),
      minAmount: code.minAmount ? String(code.minAmount) : "",
      maxUsages: code.maxUsages ? String(code.maxUsages) : "",
      expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString().split("T")[0] : "",
      singleUsePerUser: code.singleUsePerUser,
      isActive: code.isActive,
      allCourses: !hasSpecificCourses,
      selectedCourseIds: hasSpecificCourses ? (code.applicableCourseIds as number[]) : [],
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingCode(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    const payload: PromoCodePayload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minAmount: form.minAmount ? Number(form.minAmount) : 0,
      maxUsages: form.maxUsages ? Number(form.maxUsages) : null,
      expiresAt: form.expiresAt || null,
      applicableCourseIds: form.allCourses ? null : form.selectedCourseIds,
      singleUsePerUser: form.singleUsePerUser,
      isActive: form.isActive,
    };
    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast({ title: "کد کپی شد" });
  }

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString("fa-IR") : "—";

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TicketPercent className="h-6 w-6 text-primary" aria-hidden="true" />
            کدهای تخفیف
          </h1>
          <p className="text-muted-foreground mt-1">مدیریت کدهای تخفیف برای ثبت‌نام دوره‌ها</p>
        </div>
        <Button onClick={openCreate} aria-label="ایجاد کد تخفیف جدید">
          <Plus className="h-4 w-4 me-2" aria-hidden="true" />
          کد جدید
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست کدهای تخفیف ({promoCodes.length})</CardTitle>
          <CardDescription>کدهای قابل استفاده توسط دانشجویان هنگام ثبت‌نام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">در حال بارگذاری...</div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p>هیچ کد تخفیفی وجود ندارد</p>
              <Button variant="outline" onClick={openCreate} className="mt-3">
                اولین کد را ایجاد کنید
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد</TableHead>
                  <TableHead>نوع تخفیف</TableHead>
                  <TableHead>مقدار</TableHead>
                  <TableHead>استفاده شده</TableHead>
                  <TableHead>تاریخ انقضا</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((pc) => (
                  <TableRow key={pc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                          {pc.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(pc.code)}
                          aria-label="کپی کد"
                        >
                          <Copy className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                      {pc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{pc.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pc.discountType === "percentage" ? "درصدی" : "مبلغ ثابت"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {pc.discountType === "percentage"
                        ? `٪${pc.discountValue}`
                        : `${pc.discountValue.toLocaleString("fa-IR")} تومان`}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {pc.usedCount.toLocaleString("fa-IR")}
                        {pc.maxUsages !== null && ` / ${pc.maxUsages.toLocaleString("fa-IR")}`}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(pc.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge variant={pc.isActive ? "default" : "secondary"}>
                        {pc.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUsagePromo(pc)}
                          aria-label="مشاهده تاریخچه استفاده"
                          title="تاریخچه استفاده"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(pc)}
                          aria-label="ویرایش کد تخفیف"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(pc.id)}
                          aria-label="حذف کد تخفیف"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editingCode ? "ویرایش کد تخفیف" : "ایجاد کد تخفیف جدید"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="promo-code">کد تخفیف *</Label>
              <Input
                id="promo-code"
                placeholder="مثال: SUMMER2025"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                disabled={!!editingCode}
                className="font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="promo-description">توضیحات</Label>
              <Input
                id="promo-description"
                placeholder="توضیح کوتاه برای این کد"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="discount-type">نوع تخفیف *</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm({ ...form, discountType: v })}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">درصدی</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (تومان)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="discount-value">
                  {form.discountType === "percentage" ? "درصد تخفیف *" : "مقدار تخفیف (تومان) *"}
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  placeholder={form.discountType === "percentage" ? "مثال: 20" : "مثال: 50000"}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  min={1}
                  max={form.discountType === "percentage" ? 100 : undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="min-amount">حداقل مبلغ سفارش (تومان)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  placeholder="اختیاری"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  min={0}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="max-usages">حداکثر تعداد استفاده</Label>
                <Input
                  id="max-usages"
                  type="number"
                  placeholder="خالی = نامحدود"
                  value={form.maxUsages}
                  onChange={(e) => setForm({ ...form, maxUsages: e.target.value })}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="expires-at">تاریخ انقضا</Label>
              <Input
                id="expires-at"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>

            {/* Course applicability */}
            <div className="space-y-2">
              <Label>قابل استفاده برای</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="course-scope"
                    checked={form.allCourses}
                    onChange={() => setForm({ ...form, allCourses: true, selectedCourseIds: [] })}
                  />
                  همه دوره‌ها
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="course-scope"
                    checked={!form.allCourses}
                    onChange={() => setForm({ ...form, allCourses: false })}
                  />
                  دوره‌های خاص
                </label>
              </div>
              {!form.allCourses && (
                <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1">
                  {courseOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">در حال بارگذاری دوره‌ها...</p>
                  ) : (
                    courseOptions.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={form.selectedCourseIds.includes(c.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...form.selectedCourseIds, c.id]
                              : form.selectedCourseIds.filter((id) => id !== c.id);
                            setForm({ ...form, selectedCourseIds: ids });
                          }}
                        />
                        {c.title}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="single-use"
                checked={form.singleUsePerUser}
                onCheckedChange={(v) => setForm({ ...form, singleUsePerUser: v })}
              />
              <div>
                <Label htmlFor="single-use">یک‌بار مصرف به ازای هر کاربر</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  هر کاربر فقط یک بار می‌تواند از این کد برای هر دوره استفاده کند
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label htmlFor="is-active">کد فعال باشد</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCode ? "بروزرسانی" : "ایجاد کد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کد تخفیف</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید؟ این عملیات قابل برگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Usage Analytics Dialog */}
      <Dialog open={!!usagePromo} onOpenChange={(open) => !open && setUsagePromo(null)}>
        <DialogContent className="max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              تاریخچه استفاده از کد:{" "}
              <code className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                {usagePromo?.code}
              </code>
            </DialogTitle>
          </DialogHeader>

          {usagesLoading ? (
            <div className="py-10 text-center text-muted-foreground">در حال بارگذاری...</div>
          ) : usages.length === 0 ? (
            <div className="py-10 text-center">
              <BarChart2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" aria-hidden="true" />
              <p className="text-muted-foreground">هنوز هیچ استفاده‌ای ثبت نشده است.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">{usages.length.toLocaleString("fa-IR")}</p>
                    <p className="text-xs text-muted-foreground mt-1">تعداد استفاده</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">
                      {usages.reduce((s, u) => s + u.discountAmount, 0).toLocaleString("fa-IR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">کل تخفیف (تومان)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">
                      {new Set(usages.map((u) => u.studentPhone)).size.toLocaleString("fa-IR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">کاربران یکتا</p>
                  </CardContent>
                </Card>
              </div>
              <div className="max-h-72 overflow-y-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>دانشجو</TableHead>
                      <TableHead>دوره</TableHead>
                      <TableHead>تخفیف (تومان)</TableHead>
                      <TableHead>تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usages.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm">
                          {u.studentFirstName || u.studentLastName
                            ? `${u.studentFirstName || ""} ${u.studentLastName || ""}`.trim()
                            : u.studentPhone || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.courseTitle || "—"}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {u.discountAmount.toLocaleString("fa-IR")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.usedAt).toLocaleDateString("fa-IR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUsagePromo(null)}>بستن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
