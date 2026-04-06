import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSmsTemplatesData, useSmsTemplateMutations, SmsTemplatePayload, type TemplateFormValues } from "@/hooks/useSmsTemplates";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Plus, Send, Search, Eye, FileText, BarChart3, TrendingUp, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { TemplateCard } from "@/components/frontdesk/TemplateCard";
import { TemplateFormFields } from "@/components/frontdesk/TemplateFormFields";

interface SmsTemplate {
  id: number; name: string; content: string; categoryId: number; categoryName?: string; status: "active"|"inactive"|"archived";
  tags: string[]; variables: string[]; usageCount: number; successfulSends: number; failedSends: number;
  lastUsedAt?: string; createdAt: string; updatedAt: string; createdBy: number; createdByName?: string;
}
interface SmsTemplateCategory { id: number; name: string; displayName: string; description?: string; color?: string; isActive: boolean; createdAt: string; updatedAt: string; }

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(1, "Template content is required"),
  categoryId: z.number().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
});
type TemplateFormData = TemplateFormValues;

const sendSmsSchema = z.object({ recipients: z.string().min(1, "Recipients are required"), variableData: z.record(z.string()).optional() });
type SendSmsFormData = z.infer<typeof sendSmsSchema>;

const extractVariables = (content: string) => { const m = content.match(/\{\{([^}]+)\}\}/g); return m ? m.map((v) => v.slice(2, -2).trim()) : []; };
const replaceVariables = (content: string, data: Record<string, string>) => { let r = content; Object.entries(data).forEach(([k, v]) => { r = r.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v); }); return r; };
const getStatusColor = (s: string) => s === "active" ? "bg-green-100 text-green-800" : s === "inactive" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800";

export default function SmsTemplatesPage() {
  const { i18n } = useTranslation(["common", "frontdesk"]);
  const isRTL = i18n.language === "fa" || i18n.language === "ar";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("templates");

  const { templates, templatesLoading, refetchTemplates, categories, analytics } = useSmsTemplatesData(searchQuery, selectedCategory, selectedStatus);
  const { createMutation, updateMutation, deleteMutation, sendSmsMutation } = useSmsTemplateMutations(
    isRTL,
    () => setShowCreateDialog(false),
    () => { setShowEditDialog(false); setSelectedTemplate(null); },
    () => setShowSendDialog(false),
  );

  const createForm = useForm<TemplateFormData>({ resolver: zodResolver(templateFormSchema), defaultValues: { name: "", content: "", categoryId: 0, tags: [], status: "draft" } });
  const editForm = useForm<TemplateFormData>({ resolver: zodResolver(templateFormSchema), defaultValues: { name: "", content: "", categoryId: 0, tags: [], status: "draft" } });
  const sendForm = useForm<SendSmsFormData>({ resolver: zodResolver(sendSmsSchema), defaultValues: { recipients: "", variableData: {} } });

  const filteredTemplates = useMemo(() => (templates as SmsTemplate[]).filter((t) => {
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.content.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || t.categoryId.toString() === selectedCategory;
    const matchesStatus = selectedStatus === "all" || t.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }), [templates, searchQuery, selectedCategory, selectedStatus]);

  const handleCreate = (data: TemplateFormData) => {
    const payload: SmsTemplatePayload = { ...data, variables: extractVariables(data.content) };
    createMutation.mutate(payload);
  };
  const handleEdit = (data: TemplateFormData) => {
    if (!selectedTemplate) return;
    const payload: SmsTemplatePayload = { ...data, variables: extractVariables(data.content) };
    updateMutation.mutate({ id: selectedTemplate.id, data: payload });
  };
  const handleDelete = (t: SmsTemplate) => { if (confirm(isRTL ? "آیا مطمئن هستید؟" : "Are you sure?")) deleteMutation.mutate(t.id); };
  const handleEditClick = (t: SmsTemplate) => {
    setSelectedTemplate(t);
    const validStatus = (["active", "inactive", "draft"] as const).includes(t.status as "active" | "inactive" | "draft") ? t.status as "active" | "inactive" | "draft" : "draft";
    editForm.reset({ name: t.name, content: t.content, categoryId: t.categoryId, tags: t.tags, status: validStatus });
    setShowEditDialog(true);
  };
  const handleSendClick = (t: SmsTemplate) => { setSelectedTemplate(t); setShowSendDialog(true); };
  const handlePreviewClick = (t: SmsTemplate) => { setSelectedTemplate(t); setShowPreviewDialog(true); };
  const handleSendSms = (data: SendSmsFormData) => {
    if (!selectedTemplate) return;
    const recipients = data.recipients.split(/[,\n]/).map((l) => { const p = l.trim().split(/[\s,]+/); return { phone: p[0], name: p[1] || "", variableData: data.variableData }; }).filter((r) => r.phone);
    sendSmsMutation.mutate({ templateId: selectedTemplate.id, data: { recipients, variableData: data.variableData, sendingType: recipients.length > 1 ? "bulk" : "individual", contextType: "frontdesk_template", contextId: selectedTemplate.id.toString(), idempotencyKey: crypto.randomUUID() } });
  };

  if (templatesLoading) return (
    <div className="min-h-screen flex items-center justify-center"><div className="text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" /><p>{isRTL ? "در حال بارگذاری..." : "Loading templates..."}</p></div></div>
  );

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", isRTL && "rtl")} data-testid="sms-templates-page">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="me-2"><ArrowLeft className="h-4 w-4" /></Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isRTL ? "مدیریت قالب‌های پیامک" : "SMS Template Management"}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{isRTL ? "ایجاد، ویرایش و مدیریت قالب‌های پیامک" : "Create, edit and manage SMS templates"}</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-template"><Plus className="h-4 w-4 me-2" />{isRTL ? "قالب جدید" : "New Template"}</Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">{isRTL ? "قالب‌ها" : "Templates"}</TabsTrigger>
            <TabsTrigger value="analytics">{isRTL ? "آمار" : "Analytics"}</TabsTrigger>
            <TabsTrigger value="categories">{isRTL ? "دسته‌بندی‌ها" : "Categories"}</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Filters */}
            <Card><CardHeader><CardTitle className="text-lg">{isRTL ? "فیلترها و جستجو" : "Filters & Search"}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><Label>{isRTL ? "جستجو" : "Search"}</Label>
                    <div className="relative"><Search className="absolute start-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder={isRTL ? "جستجو..." : "Search templates..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-10" data-testid="input-search" /></div>
                  </div>
                  <div><Label>{isRTL ? "دسته‌بندی" : "Category"}</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category"><SelectValue placeholder={isRTL ? "همه دسته‌ها" : "All categories"} /></SelectTrigger>
                      <SelectContent><SelectItem value="all">{isRTL ? "همه دسته‌ها" : "All categories"}</SelectItem>{(categories as SmsTemplateCategory[]).map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.displayName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{isRTL ? "وضعیت" : "Status"}</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger data-testid="select-status"><SelectValue placeholder={isRTL ? "همه وضعیت‌ها" : "All statuses"} /></SelectTrigger>
                      <SelectContent><SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem><SelectItem value="active">{isRTL ? "فعال" : "Active"}</SelectItem><SelectItem value="inactive">{isRTL ? "غیرفعال" : "Inactive"}</SelectItem><SelectItem value="archived">{isRTL ? "آرشیو" : "Archived"}</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end"><Button variant="outline" onClick={() => refetchTemplates()} disabled={templatesLoading} data-testid="button-refresh"><RefreshCw className={cn("h-4 w-4 me-2", templatesLoading && "animate-spin")} />{isRTL ? "بروزرسانی" : "Refresh"}</Button></div>
                </div>
              </CardContent>
            </Card>

            {/* Template Grid */}
            {filteredTemplates.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{isRTL ? "هیچ قالبی یافت نشد" : "No templates found"}</h3>
                <p className="text-gray-600 mb-4">{isRTL ? "قالب جدیدی ایجاد کنید" : "Create a new template"}</p>
                <Button onClick={() => setShowCreateDialog(true)}><Plus className="h-4 w-4 me-2" />{isRTL ? "ایجاد اولین قالب" : "Create First Template"}</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((t) => <TemplateCard key={t.id} template={t} isRTL={isRTL} onPreview={handlePreviewClick} onEdit={handleEditClick} onSend={handleSendClick} onDelete={handleDelete} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: isRTL ? "کل قالب‌ها" : "Total Templates", value: (templates as SmsTemplate[]).length, note: `${(templates as SmsTemplate[]).filter((t) => t.status === "active").length} active`, icon: FileText },
                { label: isRTL ? "کل ارسال‌ها" : "Total Sends", value: (templates as SmsTemplate[]).reduce((s, t) => s + t.usageCount, 0), note: `${analytics?.todaySends || 0} today`, icon: Send },
                { label: isRTL ? "نرخ موفقیت" : "Success Rate", value: `${(templates as SmsTemplate[]).length > 0 ? Math.round(((templates as SmsTemplate[]).reduce((s, t) => s + t.successfulSends, 0) / Math.max((templates as SmsTemplate[]).reduce((s, t) => s + t.usageCount, 0), 1)) * 100) : 0}%`, note: isRTL ? "بر اساس کل" : "based on total", icon: TrendingUp },
                { label: isRTL ? "محبوب‌ترین دسته" : "Top Category", value: (categories as SmsTemplateCategory[]).find((c) => c.id === (templates as SmsTemplate[]).reduce((top, t) => { const cnt = (templates as SmsTemplate[]).filter((x) => x.categoryId === t.categoryId).length; const topCnt = (templates as SmsTemplate[]).filter((x) => x.categoryId === top).length; return cnt > topCnt ? t.categoryId : top; }, (templates as SmsTemplate[])[0]?.categoryId || 0))?.displayName || "N/A", note: isRTL ? "بیشترین استفاده" : "most used", icon: BarChart3 },
              ].map(({ label, value, note, icon: Icon }) => (
                <Card key={label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground">{note}</p></CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(categories as SmsTemplateCategory[]).map((c) => (
                <Card key={c.id}><CardHeader><div className="flex items-center space-x-2"><div><CardTitle>{c.displayName}</CardTitle><CardDescription>{c.description}</CardDescription></div></div></CardHeader>
                  <CardContent><div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>{isRTL ? "تعداد قالب‌ها:" : "Templates:"}</span><span>{(templates as SmsTemplate[]).filter((t) => t.categoryId === c.id).length}</span></div>
                    <div className="flex justify-between text-sm"><span>{isRTL ? "وضعیت:" : "Status:"}</span><Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? (isRTL ? "فعال" : "Active") : (isRTL ? "غیرفعال" : "Inactive")}</Badge></div>
                  </div></CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "ایجاد قالب جدید" : "Create New Template"}</DialogTitle><DialogDescription>{isRTL ? "قالب پیامک جدید ایجاد کنید" : "Create a new SMS template"}</DialogDescription></DialogHeader>
          <TemplateFormFields form={createForm} categories={categories as SmsTemplateCategory[]} isRTL={isRTL} isLoading={createMutation.isPending} mode="create" onCancel={() => setShowCreateDialog(false)} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "ویرایش قالب" : "Edit Template"}</DialogTitle><DialogDescription>{isRTL ? "قالب پیامک را ویرایش کنید" : "Edit the SMS template"}</DialogDescription></DialogHeader>
          <TemplateFormFields form={editForm} categories={categories as SmsTemplateCategory[]} isRTL={isRTL} isLoading={updateMutation.isPending} mode="edit" onCancel={() => setShowEditDialog(false)} onSubmit={handleEdit} />
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "ارسال پیامک" : "Send SMS"}</DialogTitle><DialogDescription>{isRTL ? `قالب: ${selectedTemplate?.name}` : `Template: ${selectedTemplate?.name}`}</DialogDescription></DialogHeader>
          <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(handleSendSms)} className="space-y-4">
              <FormField control={sendForm.control} name="recipients" render={({ field }) => (
                <FormItem><FormLabel>{isRTL ? "گیرندگان" : "Recipients"}</FormLabel>
                  <FormControl><Textarea {...field} placeholder={isRTL ? "یک شماره در هر خط" : "One phone number per line"} className="min-h-[100px]" /></FormControl>
                  <FormDescription>{isRTL ? "شماره تلفن و اسم (اختیاری)" : "Phone number and name (optional)"}</FormDescription><FormMessage />
                </FormItem>
              )} />
              {selectedTemplate && extractVariables(selectedTemplate.content).length > 0 && (
                <div className="space-y-4"><Label>{isRTL ? "مقادیر متغیرها" : "Variable Values"}</Label>
                  {extractVariables(selectedTemplate.content).map((v) => (
                    <div key={v}><Label htmlFor={`var-${v}`}>{v}</Label>
                      <Input id={`var-${v}`} placeholder={isRTL ? `مقدار برای ${v}` : `Value for ${v}`} onChange={(e) => { const cur = sendForm.getValues("variableData") || {}; sendForm.setValue("variableData", { ...cur, [v]: e.target.value }); }} />
                    </div>
                  ))}
                </div>
              )}
              {selectedTemplate && (
                <div className="space-y-2"><Label>{isRTL ? "پیش‌نمایش" : "Preview"}</Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm">{replaceVariables(selectedTemplate.content, sendForm.watch("variableData") || {})}</p>
                    <div className="flex justify-between text-xs text-gray-500 mt-2"><span>{replaceVariables(selectedTemplate.content, sendForm.watch("variableData") || {}).length}/1000</span><span>{Math.ceil(replaceVariables(selectedTemplate.content, sendForm.watch("variableData") || {}).length / 160)} SMS</span></div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSendDialog(false)}>{isRTL ? "لغو" : "Cancel"}</Button>
                <Button type="submit" disabled={sendSmsMutation.isPending} data-testid="button-send-sms">{sendSmsMutation.isPending ? <><RefreshCw className="h-4 w-4 me-2 animate-spin" />{isRTL ? "ارسال..." : "Sending..."}</> : <><Send className="h-4 w-4 me-2" />{isRTL ? "ارسال پیامک" : "Send SMS"}</>}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isRTL ? "پیش‌نمایش قالب" : "Template Preview"}</DialogTitle><DialogDescription>{selectedTemplate?.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"><p className="text-sm whitespace-pre-wrap">{selectedTemplate ? replaceVariables(selectedTemplate.content, previewData) : ""}</p></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><Label>{isRTL ? "تعداد کاراکتر" : "Characters"}</Label><p>{selectedTemplate?.content.length || 0}/1000</p></div>
              <div><Label>{isRTL ? "تعداد پیامک" : "SMS Count"}</Label><p>{selectedTemplate ? Math.ceil(selectedTemplate.content.length / 160) : 0}</p></div>
              <div><Label>{isRTL ? "دسته‌بندی" : "Category"}</Label><p>{selectedTemplate?.categoryName || "N/A"}</p></div>
              <div><Label>{isRTL ? "وضعیت" : "Status"}</Label>{selectedTemplate && <Badge className={getStatusColor(selectedTemplate.status)}>{selectedTemplate.status}</Badge>}</div>
            </div>
            {selectedTemplate && extractVariables(selectedTemplate.content).length > 0 && (
              <div className="space-y-2"><Label>{isRTL ? "متغیرها" : "Variables"}</Label>
                <div className="flex flex-wrap gap-2">{extractVariables(selectedTemplate.content).map((v, i) => <Badge key={i} variant="outline">{v}</Badge>)}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>{isRTL ? "بستن" : "Close"}</Button>
            <Button onClick={() => { if (selectedTemplate) { setShowPreviewDialog(false); setShowSendDialog(true); } }}><Send className="h-4 w-4 me-2" />{isRTL ? "ارسال این قالب" : "Send This Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
