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
  RefreshCw,
  CreditCard,
  Percent,
  Hash
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function ChargeRenewal() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chargeAmount, setChargeAmount] = useState("");
  const [sessionsToAdd, setSessionsToAdd] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discount, setDiscount] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/charge_renewal"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/charge_renewal`);
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
        title: t('callcenter:stages.charge_renewal.success', 'تمدید شارژ موفق'),
        description: t('callcenter:stages.charge_renewal.success_desc', 'لید به مرحله تعیین شماره کلاس منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.charge_renewal.error', 'خطا در تمدید'),
        description: error.message || t('callcenter:stages.charge_renewal.error_desc', 'تمدید با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setChargeAmount("");
    setSessionsToAdd("");
    setPaymentMethod("");
    setDiscount("");
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
              placeholder={t('callcenter:stages.charge_renewal.search_placeholder', 'جستجو در متقاضیان تمدید شارژ...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <RefreshCw className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.charge_renewal.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.charge_renewal.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.charge_renewal.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.charge_renewal.empty_desc', 'در حال حاضر موردی برای تمدید شارژ وجود ندارد')}</p>
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
                        <Badge className="bg-amber-100 text-amber-800">
                          <RefreshCw className="h-3 w-3 me-1" />
                          {t('callcenter:stages.charge_renewal.badge', 'تمدید شارژ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{lead.phoneNumber}</span>
                        </div>
                        {lead.courseTarget && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{lead.courseTarget}</span>
                          </div>
                        )}
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
                            <CreditCard className="h-4 w-4 me-2" />
                            {t('callcenter:stages.charge_renewal.renew', 'تمدید شارژ')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.charge_renewal.dialog_title', 'تمدید شارژ')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.charge_renewal.dialog_desc', 'تمدید شارژ برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.charge_renewal.amount', 'مبلغ شارژ جدید (تومان)')}</Label>
                              <Input
                                type="number"
                                placeholder={t('callcenter:stages.charge_renewal.amount_placeholder', 'مبلغ را وارد کنید...')}
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.charge_renewal.sessions', 'تعداد جلسات اضافه')}</Label>
                              <Input
                                type="number"
                                placeholder={t('callcenter:stages.charge_renewal.sessions_placeholder', 'تعداد جلسات...')}
                                value={sessionsToAdd}
                                onChange={(e) => setSessionsToAdd(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.charge_renewal.payment_method', 'روش پرداخت')}</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('callcenter:stages.charge_renewal.payment_placeholder', 'انتخاب روش پرداخت')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">{t('callcenter:stages.charge_renewal.cash', 'نقدی')}</SelectItem>
                                  <SelectItem value="card">{t('callcenter:stages.charge_renewal.card', 'کارت به کارت')}</SelectItem>
                                  <SelectItem value="online">{t('callcenter:stages.charge_renewal.online_payment', 'پرداخت آنلاین')}</SelectItem>
                                  <SelectItem value="installment">{t('callcenter:stages.charge_renewal.installment', 'اقساط')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.charge_renewal.discount', 'تخفیف (درصد)')}</Label>
                              <Input
                                type="number"
                                placeholder={t('callcenter:stages.charge_renewal.discount_placeholder', 'درصد تخفیف...')}
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetForm}
                              >
                                {t('callcenter:stages.charge_renewal.cancel', 'انصراف')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: LEAD_WORKFLOW_STAGE.SET_CLASS_NUMBER,
                                  reason: `مبلغ: ${chargeAmount} تومان | جلسات: ${sessionsToAdd} | روش: ${paymentMethod} | تخفیف: ${discount}%`
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                {transitionMutation.isPending
                                  ? t('callcenter:stages.charge_renewal.processing', 'در حال ثبت...')
                                  : t('callcenter:stages.charge_renewal.confirm', 'تایید تمدید')}
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

export default ChargeRenewal;
