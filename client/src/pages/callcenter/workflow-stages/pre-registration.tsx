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
import {
  Search,
  User,
  Phone,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  CreditCard,
  ArrowRight,
  BookOpen,
  Receipt,
  Banknote,
  FileCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS, LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function PreRegistration() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [registrationNotes, setRegistrationNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: preRegLeads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/pre_registration"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/pre_registration`);
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
      const stageNames: Record<string, string> = {
        'final_registration': 'ثبت‌نام نهایی',
        'installments': 'اقساط',
        'cheque': 'چک',
        'withdrawal': 'انصراف'
      };
      toast({
        title: t('callcenter:stages.pre_registration.transition_success', 'انتقال موفق'),
        description: `${t('callcenter:stages.pre_registration.moved_to', 'متقاضی به مرحله')} ${stageNames[variables.toStage] || variables.toStage} ${t('callcenter:stages.pre_registration.moved', 'منتقل شد')}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.pre_registration.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.pre_registration.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setPaymentMethod("");
    setRegistrationNotes("");
    setDialogOpen(false);
  };

  const filteredLeads = preRegLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  const handlePaymentAction = (lead: Lead, method: string) => {
    let toStage = 'final_registration';
    if (method === 'installments') toStage = 'installments';
    if (method === 'cheque') toStage = 'cheque';

    transitionMutation.mutate({
      leadId: lead.id,
      toStage,
      reason: `روش پرداخت: ${method}, ${registrationNotes}`
    });
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.pre_registration.search_placeholder', 'جستجو در متقاضیان پیش‌ثبت‌نام...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <FileText className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.pre_registration.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.pre_registration.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.pre_registration.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.pre_registration.empty_desc', 'در حال حاضر متقاضی برای پیش‌ثبت‌نام وجود ندارد')}</p>
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
                        <Badge className="bg-indigo-100 text-indigo-800">
                          <FileText className="h-3 w-3 me-1" />
                          {t('callcenter:stages.pre_registration.badge', 'پیش‌ثبت‌نام')}
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
                            <CreditCard className="h-4 w-4 me-2" />
                            {t('callcenter:stages.pre_registration.process', 'پردازش ثبت‌نام')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.pre_registration.dialog_title', 'پیش‌ثبت‌نام و پرداخت')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.pre_registration.dialog_desc', 'انتخاب روش پرداخت برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.pre_registration.payment_method', 'روش پرداخت')}</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('callcenter:stages.pre_registration.select_payment', 'انتخاب روش پرداخت')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4" />
                                      {t('callcenter:stages.pre_registration.full_payment', 'پرداخت کامل')}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="installments">
                                    <div className="flex items-center gap-2">
                                      <Receipt className="h-4 w-4" />
                                      {t('callcenter:stages.pre_registration.installments', 'اقساط')}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cheque">
                                    <div className="flex items-center gap-2">
                                      <Banknote className="h-4 w-4" />
                                      {t('callcenter:stages.pre_registration.cheque', 'چک')}
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>{t('callcenter:stages.pre_registration.notes', 'یادداشت ثبت‌نام')}</Label>
                              <Textarea
                                placeholder={t('callcenter:stages.pre_registration.notes_placeholder', 'توضیحات ثبت‌نام و پرداخت...')}
                                value={registrationNotes}
                                onChange={(e) => setRegistrationNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                              {paymentMethod === 'full' && (
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && handlePaymentAction(selectedLead, 'full')}
                                  disabled={transitionMutation.isPending}
                                >
                                  <FileCheck className="h-4 w-4 me-2" />
                                  {t('callcenter:stages.pre_registration.complete_registration', 'تکمیل ثبت‌نام')}
                                </Button>
                              )}
                              {paymentMethod === 'installments' && (
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && handlePaymentAction(selectedLead, 'installments')}
                                  disabled={transitionMutation.isPending}
                                >
                                  <Receipt className="h-4 w-4 me-2" />
                                  {t('callcenter:stages.pre_registration.setup_installments', 'تنظیم اقساط')}
                                </Button>
                              )}
                              {paymentMethod === 'cheque' && (
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && handlePaymentAction(selectedLead, 'cheque')}
                                  disabled={transitionMutation.isPending}
                                >
                                  <Banknote className="h-4 w-4 me-2" />
                                  {t('callcenter:stages.pre_registration.setup_cheque', 'تنظیم چک')}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'withdrawal',
                                  reason: registrationNotes || 'انصراف در مرحله پیش‌ثبت‌نام'
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 me-2" />
                                {t('callcenter:stages.pre_registration.withdraw', 'انصراف')}
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

export default PreRegistration;
