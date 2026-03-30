import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  User,
  Phone,
  BookOpen,
  Package,
  CreditCard,
  CheckCircle,
  GraduationCap,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { motion } from "framer-motion";

interface SessionBundle {
  id: number;
  name: string;
  sessionCount: number;
  sessionDuration: number;
  price: string;
  validityDays: number;
  lowSessionAlertThreshold: number;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
}

function PrivateClassSetup() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/private_class_setup"],
    queryFn: () => apiRequest(`/api/leads/by-stage/private_class_setup`)
  });

  const { data: bundles = [] } = useQuery<SessionBundle[]>({
    queryKey: ["/api/session-bundles"],
    queryFn: () => apiRequest(`/api/session-bundles`)
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ["/api/users?role=Teacher"],
    queryFn: () => apiRequest(`/api/users?role=Teacher`)
  });

  const selectedBundle = bundles.find(b => String(b.id) === selectedBundleId);

  const createMutation = useMutation({
    mutationFn: async (data: {
      leadId: number;
      packageId: number;
      teacherId: number;
      paymentMethod: string;
      amount: number;
      notes?: string;
    }) => {
      return await apiRequest(`/api/private-class/create`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "کلاس خصوصی ایجاد شد",
        description: "بسته جلسات ثبت شد و لید به مرحله فعال منتقل شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "خطا در ایجاد کلاس خصوصی",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setSelectedBundleId("");
    setSelectedTeacherId("");
    setPaymentMethod("cash");
    setAmount("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!selectedLead || !selectedBundleId || !selectedTeacherId || !amount) {
      toast({ title: "لطفاً تمام فیلدها را پر کنید", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      leadId: selectedLead.id,
      packageId: Number(selectedBundleId),
      teacherId: Number(selectedTeacherId),
      paymentMethod,
      amount: Number(amount),
      notes: notes || undefined,
    });
  };

  const filteredLeads = leads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در متقاضیان تنظیم کلاس خصوصی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <BookOpen className="h-4 w-4 mr-2" />
          {filteredLeads.length} مورد
        </Badge>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>در حال بارگذاری...</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">عالی!</h3>
              <p className="text-gray-600">در حال حاضر موردی برای تنظیم کلاس خصوصی وجود ندارد</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <h3 className="font-semibold text-lg">{lead.firstName} {lead.lastName}</h3>
                        <Badge className="bg-purple-100 text-purple-800">
                          <BookOpen className="h-3 w-3 mr-1" />
                          تنظیم کلاس خصوصی
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span dir="ltr">{lead.phoneNumber}</span>
                      </div>
                      {lead.notes && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {lead.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Dialog onOpenChange={(open) => !open && resetForm()}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            ایجاد کلاس خصوصی
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>ایجاد کلاس خصوصی</DialogTitle>
                            <DialogDescription>
                              ثبت بسته جلسات برای {lead.firstName} {lead.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div>
                              <Label>بسته جلسات</Label>
                              <Select value={selectedBundleId} onValueChange={(v) => {
                                setSelectedBundleId(v);
                                const b = bundles.find(b => String(b.id) === v);
                                if (b) setAmount(String(b.price));
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب بسته جلسات..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {bundles.map(b => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                      {b.name} — {b.sessionCount} جلسه — {Number(b.price).toLocaleString()} تومان
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedBundle && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300 grid grid-cols-2 gap-1">
                                  <span>تعداد جلسات: <strong>{selectedBundle.sessionCount}</strong></span>
                                  <span>هر جلسه: <strong>{selectedBundle.sessionCount > 0 ? Math.round(Number(selectedBundle.price) / selectedBundle.sessionCount).toLocaleString() : 0} تومان</strong></span>
                                  <span>اعتبار: <strong>{selectedBundle.validityDays} روز</strong></span>
                                  <span>هشدار کم‌بودن: <strong>{selectedBundle.lowSessionAlertThreshold} جلسه</strong></span>
                                </div>
                              )}
                            </div>

                            <div>
                              <Label>استاد</Label>
                              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب استاد..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {teachers.map(t => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                      <GraduationCap className="h-3 w-3 inline mr-1" />
                                      {t.firstName} {t.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>روش پرداخت</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">نقدی</SelectItem>
                                  <SelectItem value="pos">کارتخوان (POS)</SelectItem>
                                  <SelectItem value="cheque">چک</SelectItem>
                                  <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
                                  <SelectItem value="wallet">کیف پول دانشجو</SelectItem>
                                  <SelectItem value="gateway">درگاه آنلاین</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>مبلغ پرداختی (تومان)</Label>
                              <Input
                                type="number"
                                placeholder="مثال: 5000000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label>یادداشت (اختیاری)</Label>
                              <Input
                                placeholder="توضیحات اضافی..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" onClick={resetForm}>
                                انصراف
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={createMutation.isPending || !selectedBundleId || !selectedTeacherId || !amount}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                {createMutation.isPending ? "در حال ثبت..." : "ثبت و فعال‌سازی کلاس"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default PrivateClassSetup;
