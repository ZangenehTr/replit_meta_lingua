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
import {
  Search,
  User,
  Phone,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Hash,
  Receipt
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function Installments() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [installmentNumber, setInstallmentNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/installments"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/installments`);
    }
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ leadId, toStage, reason }: { leadId: number; toStage: string; reason?: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage, reason })
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:stages.installments.payment_success', 'پرداخت قسط موفق'),
        description: t('callcenter:stages.installments.payment_success_desc', 'قسط با موفقیت ثبت شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.installments.payment_error', 'خطا در ثبت پرداخت'),
        description: error.message || t('callcenter:stages.installments.payment_error_desc', 'ثبت پرداخت با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setInstallmentNumber("");
    setAmountPaid("");
    setPaymentDate("");
    setReceiptNumber("");
  };

  const getInstallmentsPaid = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return metadata?.installmentsPaid || 0;
  };

  const getTotalInstallments = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return metadata?.totalInstallments || 1;
  };

  const getTotalTuition = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return metadata?.totalTuition || 0;
  };

  const getPaidAmount = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return metadata?.paidAmount || 0;
  };

  const getRemainingAmount = (lead: Lead) => {
    return getTotalTuition(lead) - getPaidAmount(lead);
  };

  const getProgressPercent = (lead: Lead) => {
    const total = getTotalInstallments(lead);
    const paid = getInstallmentsPaid(lead);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  };

  const handleConfirmPayment = (lead: Lead) => {
    const paid = getInstallmentsPaid(lead);
    const total = getTotalInstallments(lead);
    const isLastInstallment = paid + 1 >= total;

    if (isLastInstallment) {
      transitionMutation.mutate({
        leadId: lead.id,
        toStage: LEAD_WORKFLOW_STAGE.FINAL_REGISTRATION,
        reason: `قسط ${installmentNumber} | مبلغ: ${amountPaid} | تاریخ: ${paymentDate} | رسید: ${receiptNumber} | تکمیل اقساط`
      });
    } else {
      transitionMutation.mutate({
        leadId: lead.id,
        toStage: LEAD_WORKFLOW_STAGE.INSTALLMENTS,
        reason: `قسط ${installmentNumber} | مبلغ: ${amountPaid} | تاریخ: ${paymentDate} | رسید: ${receiptNumber}`
      });
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.installments.search_placeholder', 'جستجو در پرداخت‌های اقساطی...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <CreditCard className="h-4 w-4 mr-2" />
            {filteredLeads.length} {t('callcenter:stages.installments.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.installments.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.installments.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.installments.empty_desc', 'در حال حاضر پرداخت اقساطی وجود ندارد')}</p>
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
                        <h3 className="font-semibold text-lg">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {t('callcenter:stages.installments.badge', 'اقساط')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{lead.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{t('callcenter:stages.installments.total_tuition', 'شهریه کل')}: {getTotalTuition(lead).toLocaleString('fa-IR')} {t('callcenter:stages.installments.toman', 'تومان')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span>{t('callcenter:stages.installments.installments_count', 'تعداد اقساط')}: {getInstallmentsPaid(lead)}/{getTotalInstallments(lead)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{t('callcenter:stages.installments.paid_amount', 'پرداخت شده')}: {getPaidAmount(lead).toLocaleString('fa-IR')} {t('callcenter:stages.installments.toman', 'تومان')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-red-500" />
                          <span>{t('callcenter:stages.installments.remaining', 'مانده')}: {getRemainingAmount(lead).toLocaleString('fa-IR')} {t('callcenter:stages.installments.toman', 'تومان')}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{t('callcenter:stages.installments.progress', 'پیشرفت پرداخت')}</span>
                          <span>{getProgressPercent(lead)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${getProgressPercent(lead)}%` }}
                          />
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
                            <Receipt className="h-4 w-4 mr-2" />
                            {t('callcenter:stages.installments.confirm_payment', 'ثبت پرداخت')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.installments.dialog_title', 'ثبت پرداخت قسط')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.installments.dialog_desc', 'ثبت پرداخت برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.installments.installment_number', 'شماره قسط')}</Label>
                              <Input
                                type="number"
                                placeholder={t('callcenter:stages.installments.installment_number_placeholder', 'شماره قسط...')}
                                value={installmentNumber}
                                onChange={(e) => setInstallmentNumber(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.installments.amount_paid', 'مبلغ پرداخت شده (تومان)')}</Label>
                              <Input
                                type="number"
                                placeholder={t('callcenter:stages.installments.amount_placeholder', 'مبلغ را وارد کنید...')}
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.installments.payment_date', 'تاریخ پرداخت')}</Label>
                              <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.installments.receipt_number', 'شماره رسید')}</Label>
                              <Input
                                placeholder={t('callcenter:stages.installments.receipt_placeholder', 'شماره رسید...')}
                                value={receiptNumber}
                                onChange={(e) => setReceiptNumber(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetForm}
                              >
                                {t('callcenter:stages.installments.cancel', 'انصراف')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => selectedLead && handleConfirmPayment(selectedLead)}
                                disabled={transitionMutation.isPending}
                              >
                                {transitionMutation.isPending
                                  ? t('callcenter:stages.installments.processing', 'در حال ثبت...')
                                  : t('callcenter:stages.installments.confirm', 'تایید پرداخت')}
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

export default Installments;
