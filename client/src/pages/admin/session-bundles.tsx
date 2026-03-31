import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  Clock,
  BookOpen,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SessionBundle {
  id: number;
  name: string;
  description: string | null;
  sessionCount: number;
  sessionDuration: number;
  validityDays: number;
  price: string;
  lowSessionAlertThreshold: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: "",
  description: "",
  sessionCount: "",
  sessionDuration: "60",
  price: "",
  validityDays: "90",
  lowSessionAlertThreshold: "3",
  isActive: true,
};

type CurriculumSubLevel = { id: number; code: string; name: string };
type BundleExamTag = { id: number; name: string; code: string; is_active: boolean };

const BUNDLE_SKILL_SCOPE_OPTIONS = [
  { value: '', label: 'All skills' },
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'writing', label: 'Writing' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'quantitative_only', label: 'Quantitative only (GRE/GMAT)' },
];

function SessionBundlesPage() {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sub-level config state for the dialog
  const [minSubLevelCode, setMinSubLevelCode] = useState('');
  const [maxSubLevelCode, setMaxSubLevelCode] = useState('');
  const [selectedExamTagIds, setSelectedExamTagIds] = useState<number[]>([]);
  const [bundleSkillScope, setBundleSkillScope] = useState('');

  const { data: bundles = [], isLoading } = useQuery<SessionBundle[]>({
    queryKey: ["/api/session-bundles"],
    queryFn: () => apiRequest(`/api/session-bundles`)
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        sessionCount: Number(data.sessionCount),
        sessionDuration: Number(data.sessionDuration),
        price: Number(data.price),
        validityDays: Number(data.validityDays),
        lowSessionAlertThreshold: Number(data.lowSessionAlertThreshold),
        isActive: data.isActive,
      };
      if (editingId) {
        return await apiRequest(`/api/session-bundles/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      return await apiRequest(`/api/session-bundles`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      toast({ title: editingId ? "بسته ویرایش شد" : "بسته جدید ایجاد شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/session-bundles"] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e: Error) => {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/session-bundles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "بسته غیرفعال شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/session-bundles"] });
    },
    onError: (e: Error) => {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    }
  });

  // Sub-level data queries
  const { data: subLevelsRaw = [] } = useQuery<CurriculumSubLevel[]>({
    queryKey: ['/api/curriculum-sublevels'],
    staleTime: 10 * 60 * 1000,
    enabled: dialogOpen,
  });
  const subLevels: CurriculumSubLevel[] = Array.isArray(subLevelsRaw) ? subLevelsRaw : [];

  const { data: examTagsRaw = [] } = useQuery<BundleExamTag[]>({
    queryKey: ['/api/courses/exam-tags'],
    staleTime: 10 * 60 * 1000,
    enabled: dialogOpen,
  });
  const examTags: BundleExamTag[] = (Array.isArray(examTagsRaw) ? examTagsRaw : []).filter((t) => t.is_active !== false);

  const subLevelConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/session-bundles/${id}/sublevel-config`, {
        method: 'PATCH',
        body: JSON.stringify({
          minSubLevelCode: minSubLevelCode || null,
          maxSubLevelCode: maxSubLevelCode || null,
          examTagIds: selectedExamTagIds,
          skillScope: bundleSkillScope || null,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: 'تنظیمات سطح ذخیره شد' });
      queryClient.invalidateQueries({ queryKey: ["/api/session-bundles"] });
    },
    onError: (e: Error) => {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    },
  });

  const openEdit = (bundle: SessionBundle & { minSubLevelCode?: string; maxSubLevelCode?: string; examTagIds?: number[]; skillScope?: string }) => {
    setForm({
      name: bundle.name,
      description: bundle.description ?? "",
      sessionCount: String(bundle.sessionCount),
      sessionDuration: String(bundle.sessionDuration),
      price: String(bundle.price),
      validityDays: String(bundle.validityDays),
      lowSessionAlertThreshold: String(bundle.lowSessionAlertThreshold),
      isActive: bundle.isActive,
    });
    setMinSubLevelCode(bundle.minSubLevelCode ?? '');
    setMaxSubLevelCode(bundle.maxSubLevelCode ?? '');
    setSelectedExamTagIds(Array.isArray(bundle.examTagIds) ? bundle.examTagIds : []);
    setBundleSkillScope(bundle.skillScope ?? '');
    setEditingId(bundle.id);
    setDialogOpen(true);
  };

  const resetSubLevelState = () => {
    setMinSubLevelCode('');
    setMaxSubLevelCode('');
    setSelectedExamTagIds([]);
    setBundleSkillScope('');
  };

  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  const pricePerSession = (b: SessionBundle) => {
    const p = Number(b.price);
    return b.sessionCount > 0 ? Math.round(p / b.sessionCount) : 0;
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">بسته‌های جلسات خصوصی</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت قالب‌های بسته جلسات برای کلاس‌های خصوصی</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditingId(null); resetSubLevelState(); } }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              بسته جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{editingId ? "ویرایش بسته" : "ایجاد بسته جدید"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>نام بسته *</Label>
                <Input placeholder="مثال: بسته ۱۰ جلسه‌ای پایه" value={form.name} onChange={e => field("name", e.target.value)} />
              </div>
              <div>
                <Label>توضیحات</Label>
                <Input placeholder="توضیح مختصر..." value={form.description} onChange={e => field("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تعداد جلسات *</Label>
                  <Input type="number" placeholder="10" value={form.sessionCount} onChange={e => field("sessionCount", e.target.value)} />
                </div>
                <div>
                  <Label>مدت هر جلسه (دقیقه)</Label>
                  <Input type="number" placeholder="60" value={form.sessionDuration} onChange={e => field("sessionDuration", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>قیمت کل بسته (تومان) *</Label>
                  <Input type="number" placeholder="5000000" value={form.price} onChange={e => field("price", e.target.value)} />
                </div>
                <div>
                  <Label>اعتبار (روز)</Label>
                  <Input type="number" placeholder="90" value={form.validityDays} onChange={e => field("validityDays", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>آستانه هشدار کم‌بودن جلسه *</Label>
                <Input type="number" placeholder="3" value={form.lowSessionAlertThreshold} onChange={e => field("lowSessionAlertThreshold", e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">وقتی جلسات باقیمانده به این عدد برسد، هشدار ارسال می‌شود</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => field("isActive", v)} />
                <Label>بسته فعال است</Label>
              </div>

              {/* Smart Discovery Settings */}
              <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-semibold text-gray-700">Smart Discovery (Sub-level Prerequisites)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min Sub-Level</Label>
                    <Select value={minSubLevelCode} onValueChange={setMinSubLevelCode}>
                      <SelectTrigger className="text-xs h-8 mt-1">
                        <SelectValue placeholder="No minimum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No minimum</SelectItem>
                        {subLevels.map((sl) => (
                          <SelectItem key={sl.id} value={sl.code}>{sl.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Max Sub-Level</Label>
                    <Select value={maxSubLevelCode} onValueChange={setMaxSubLevelCode}>
                      <SelectTrigger className="text-xs h-8 mt-1">
                        <SelectValue placeholder="No maximum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No maximum</SelectItem>
                        {subLevels.map((sl) => (
                          <SelectItem key={sl.id} value={sl.code}>{sl.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Skill Scope</Label>
                  <Select value={bundleSkillScope} onValueChange={setBundleSkillScope}>
                    <SelectTrigger className="text-xs h-8 mt-1">
                      <SelectValue placeholder="All skills" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUNDLE_SKILL_SCOPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Exam Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {examTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedExamTagIds(
                          selectedExamTagIds.includes(tag.id)
                            ? selectedExamTagIds.filter((id) => id !== tag.id)
                            : [...selectedExamTagIds, tag.id]
                        )}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                          selectedExamTagIds.includes(tag.id)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
                {editingId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    disabled={subLevelConfigMutation.isPending}
                    onClick={() => subLevelConfigMutation.mutate(editingId)}
                  >
                    {subLevelConfigMutation.isPending ? 'Saving…' : 'Save Discovery Settings'}
                  </Button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); resetSubLevelState(); }}>
                  انصراف
                </Button>
                <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name || !form.sessionCount || !form.price}>
                  {saveMutation.isPending ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">در حال بارگذاری...</p>
        </div>
      ) : bundles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">هیچ بسته‌ای وجود ندارد</h3>
            <p className="text-gray-500 mb-4">اولین بسته جلسات خصوصی را ایجاد کنید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bundles.map(bundle => (
            <Card key={bundle.id} className={`hover:shadow-md transition-shadow ${!bundle.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{bundle.name}</CardTitle>
                  <Badge variant={bundle.isActive ? "default" : "secondary"}>
                    {bundle.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                {bundle.description && <p className="text-sm text-gray-500">{bundle.description}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span><strong>{bundle.sessionCount}</strong> جلسه</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span><strong>{bundle.validityDays}</strong> روز اعتبار</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4 text-purple-500" />
                    <span>{pricePerSession(bundle).toLocaleString()} تومان/جلسه</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>هشدار: {bundle.lowSessionAlertThreshold} جلسه</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-lg font-bold text-blue-700">{Number(bundle.price).toLocaleString()} تومان</p>
                  <p className="text-xs text-gray-400">قیمت کل بسته</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(bundle)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (confirm("آیا از غیرفعال کردن این بسته مطمئن هستید؟ بسته حذف نخواهد شد و تنها دیگر قابل انتخاب نخواهد بود.")) deleteMutation.mutate(bundle.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionBundlesPage;
