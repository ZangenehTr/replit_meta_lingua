import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Shield,
  DollarSign,
  Percent,
  CreditCard,
  ArrowRight,
  BookOpen,
  FileCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS, LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function ConsultationSup() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [tuitionAmount, setTuitionAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const [specialDiscountApproval, setSpecialDiscountApproval] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: consultationLeads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/consultation_sup"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/consultation_sup`);
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
      toast({
        title: t('callcenter:stages.consultation_sup.transition_success', 'انتقال موفق'),
        description: variables.toStage === 'pre_registration'
          ? t('callcenter:stages.consultation_sup.to_registration', 'متقاضی به مرحله پیش‌ثبت‌نام منتقل شد')
          : t('callcenter:stages.consultation_sup.to_withdrawal', 'متقاضی به بخش انصراف منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.consultation_sup.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.consultation_sup.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setTuitionAmount("");
    setDiscountPercent("");
    setPaymentMethod("");
    setSupervisorNotes("");
    setSpecialDiscountApproval(false);
    setDialogOpen(false);
  };

  const filteredLeads = consultationLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  const calculateFinalAmount = () => {
    const amount = parseFloat(tuitionAmount) || 0;
    const discount = parseFloat(discountPercent) || 0;
    return amount - (amount * discount / 100);
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.consultation_sup.search_placeholder', 'جستجو در متقاضیان مشاوره سوپروایزر...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Shield className="h-4 w-4 mr-2" />
            {filteredLeads.length} {t('callcenter:stages.consultation_sup.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.consultation_sup.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.consultation_sup.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.consultation_sup.empty_desc', 'در حال حاضر متقاضی برای مشاوره سوپروایزر وجود ندارد')}</p>
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
                          <Shield className="h-3 w-3 mr-1" />
                          {t('callcenter:stages.consultation_sup.badge', 'مشاوره سوپروایزر')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{lead.phoneNumber}</span>
                        </div>
                        {lead.courseTarget && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
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
                      <Dialog open={dialogOpen && selectedLead?.id === lead.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) resetForm();
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setDialogOpen(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {t('callcenter:stages.consultation_sup.review', 'بررسی سوپروایزر')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.consultation_sup.dialog_title', 'مشاوره سوپروایزر')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.consultation_sup.dialog_desc', 'بررسی سوپروایزر برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.consultation_sup.tuition', 'مبلغ شهریه (تومان)')}</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  type="number"
                                  placeholder={t('callcenter:stages.consultation_sup.tuition_placeholder', 'مبلغ شهریه')}
                                  value={tuitionAmount}
                                  onChange={(e) => setTuitionAmount(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>{t('callcenter:stages.consultation_sup.discount', 'درصد تخفیف')}</Label>
                              <div className="relative">
                                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder={t('callcenter:stages.consultation_sup.discount_placeholder', 'درصد تخفیف')}
                                  value={discountPercent}
                                  onChange={(e) => setDiscountPercent(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="special-discount"
                                checked={specialDiscountApproval}
                                onCheckedChange={setSpecialDiscountApproval}
                              />
                              <Label htmlFor="special-discount" className="text-sm font-medium">
                                {t('callcenter:stages.consultation_sup.special_discount', 'تأیید تخفیف ویژه سوپروایزر')}
                              </Label>
                            </div>

                            {tuitionAmount && (
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-green-800 dark:text-green-200 text-sm">
                                <DollarSign className="h-4 w-4 inline mr-1" />
                                {t('callcenter:stages.consultation_sup.final_amount', 'مبلغ نهایی:')} {calculateFinalAmount().toLocaleString()} {t('callcenter:stages.consultation_sup.currency', 'تومان')}
                              </div>
                            )}

                            <div>
                              <Label>{t('callcenter:stages.consultation_sup.payment_method', 'روش پرداخت')}</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('callcenter:stages.consultation_sup.select_payment', 'انتخاب روش پرداخت')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">{t('callcenter:stages.consultation_sup.full_payment', 'پرداخت کامل')}</SelectItem>
                                  <SelectItem value="installments">{t('callcenter:stages.consultation_sup.installments', 'اقساط')}</SelectItem>
                                  <SelectItem value="cheque">{t('callcenter:stages.consultation_sup.cheque', 'چک')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>{t('callcenter:stages.consultation_sup.supervisor_notes', 'یادداشت سوپروایزر')}</Label>
                              <Textarea
                                placeholder={t('callcenter:stages.consultation_sup.supervisor_notes_placeholder', 'یادداشت و توضیحات سوپروایزر...')}
                                value={supervisorNotes}
                                onChange={(e) => setSupervisorNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'pre_registration',
                                  reason: `شهریه: ${tuitionAmount}, تخفیف: ${discountPercent}%${specialDiscountApproval ? ' (تخفیف ویژه تأیید شده)' : ''}, روش: ${paymentMethod}, ${supervisorNotes}`
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                <FileCheck className="h-4 w-4 mr-2" />
                                {t('callcenter:stages.consultation_sup.approve', 'تأیید و ارسال به پیش‌ثبت‌نام')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'withdrawal',
                                  reason: supervisorNotes || 'انصراف در مرحله مشاوره سوپروایزر'
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('callcenter:stages.consultation_sup.withdraw', 'انصراف')}
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

export default ConsultationSup;
