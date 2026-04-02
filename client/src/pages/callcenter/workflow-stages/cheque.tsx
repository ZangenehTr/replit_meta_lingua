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
  Calendar,
  CheckCircle,
  FileText,
  Landmark,
  DollarSign,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function Cheque() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [chequeAmount, setChequeAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [chequeStatus, setChequeStatus] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/cheque"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/cheque`);
    }
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ leadId, toStage, reason }: { leadId: number; toStage: string; reason?: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage, reason })
      });
    },
    onSuccess: (_, variables) => {
      if (variables.toStage === LEAD_WORKFLOW_STAGE.FINAL_REGISTRATION) {
        toast({
          title: t('callcenter:stages.cheque.cleared_success', 'چک وصول شد'),
          description: t('callcenter:stages.cheque.cleared_success_desc', 'لید به مرحله ثبت‌نام نهایی منتقل شد'),
        });
      } else {
        toast({
          title: t('callcenter:stages.cheque.bounced_alert', 'چک برگشت خورد'),
          description: t('callcenter:stages.cheque.bounced_alert_desc', 'وضعیت چک به برگشتی تغییر یافت'),
          variant: "destructive"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.cheque.error', 'خطا'),
        description: error.message || t('callcenter:stages.cheque.error_desc', 'عملیات با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setChequeNumber("");
    setBankName("");
    setChequeAmount("");
    setDueDate("");
    setChequeStatus("");
  };

  const getChequeInfo = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return {
      chequeNumber: metadata?.chequeNumber || '-',
      bankName: metadata?.bankName || '-',
      amount: metadata?.chequeAmount || 0,
      dueDate: metadata?.dueDate || '-',
      status: metadata?.chequeStatus || 'pending'
    };
  };

  const getChequeStatusBadge = (status: string) => {
    switch (status) {
      case 'cleared':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 me-1" />{t('callcenter:stages.cheque.status_cleared', 'وصول شده')}</Badge>;
      case 'bounced':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 me-1" />{t('callcenter:stages.cheque.status_bounced', 'برگشتی')}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 me-1" />{t('callcenter:stages.cheque.status_pending', 'در انتظار')}</Badge>;
    }
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
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.cheque.search_placeholder', 'جستجو در پرداخت‌های چکی...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <FileText className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.cheque.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.cheque.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.cheque.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.cheque.empty_desc', 'در حال حاضر پرداخت چکی وجود ندارد')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const chequeInfo = getChequeInfo(lead);
            return (
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
                          <h3 className="font-semibold text-lg">
                            {lead.firstName} {lead.lastName}
                          </h3>
                          {getChequeStatusBadge(chequeInfo.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{lead.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{t('callcenter:stages.cheque.cheque_number', 'شماره چک')}: {chequeInfo.chequeNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4" />
                            <span>{t('callcenter:stages.cheque.bank_name', 'بانک')}: {chequeInfo.bankName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{t('callcenter:stages.cheque.amount', 'مبلغ')}: {Number(chequeInfo.amount).toLocaleString('fa-IR')} {t('callcenter:stages.cheque.toman', 'تومان')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('callcenter:stages.cheque.due_date', 'سررسید')}: {chequeInfo.dueDate}</span>
                          </div>
                        </div>

                        {lead.notes && (
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            {lead.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <FileText className="h-4 w-4 me-2" />
                              {t('callcenter:stages.cheque.manage', 'مدیریت چک')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            <DialogHeader>
                              <DialogTitle>{t('callcenter:stages.cheque.dialog_title', 'مدیریت چک')}</DialogTitle>
                              <DialogDescription>
                                {t('callcenter:stages.cheque.dialog_desc', 'مدیریت چک برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{t('callcenter:stages.cheque.cheque_number', 'شماره چک')}</Label>
                                <Input
                                  placeholder={t('callcenter:stages.cheque.cheque_number_placeholder', 'شماره چک...')}
                                  value={chequeNumber}
                                  onChange={(e) => setChequeNumber(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.cheque.bank_name', 'نام بانک')}</Label>
                                <Input
                                  placeholder={t('callcenter:stages.cheque.bank_placeholder', 'نام بانک...')}
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.cheque.amount', 'مبلغ (تومان)')}</Label>
                                <Input
                                  type="number"
                                  placeholder={t('callcenter:stages.cheque.amount_placeholder', 'مبلغ...')}
                                  value={chequeAmount}
                                  onChange={(e) => setChequeAmount(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.cheque.due_date', 'تاریخ سررسید')}</Label>
                                <Input
                                  type="date"
                                  value={dueDate}
                                  onChange={(e) => setDueDate(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.cheque.status', 'وضعیت')}</Label>
                                <Select value={chequeStatus} onValueChange={setChequeStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('callcenter:stages.cheque.status_placeholder', 'انتخاب وضعیت')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">{t('callcenter:stages.cheque.status_pending', 'در انتظار')}</SelectItem>
                                    <SelectItem value="cleared">{t('callcenter:stages.cheque.status_cleared', 'وصول شده')}</SelectItem>
                                    <SelectItem value="bounced">{t('callcenter:stages.cheque.status_bounced', 'برگشتی')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetForm}
                                >
                                  {t('callcenter:stages.cheque.cancel', 'انصراف')}
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => selectedLead && transitionMutation.mutate({
                                    leadId: selectedLead.id,
                                    toStage: LEAD_WORKFLOW_STAGE.FINAL_REGISTRATION,
                                    reason: `چک وصول شد | شماره: ${chequeNumber} | بانک: ${bankName} | مبلغ: ${chequeAmount} | سررسید: ${dueDate}`
                                  })}
                                  disabled={transitionMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 me-1" />
                                  {t('callcenter:stages.cheque.mark_cleared', 'وصول شد')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => selectedLead && transitionMutation.mutate({
                                    leadId: selectedLead.id,
                                    toStage: LEAD_WORKFLOW_STAGE.CHEQUE,
                                    reason: `چک برگشت خورد | شماره: ${chequeNumber} | بانک: ${bankName} | مبلغ: ${chequeAmount}`
                                  })}
                                  disabled={transitionMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 me-1" />
                                  {t('callcenter:stages.cheque.mark_bounced', 'برگشت خورد')}
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
            );
          })
        )}
      </div>
    </div>
  );
}

export default Cheque;
