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
import {
  Search,
  User,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS, LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

function NoShow() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const { data: noShowLeads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/no_show"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/no_show`);
    }
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: number; reason?: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage: 'follow_up', reason: reason || 'بازبرنامه‌ریزی از عدم حضور' })
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:stages.no_show.reschedule_success', 'بازبرنامه‌ریزی موفق'),
        description: t('callcenter:stages.no_show.reschedule_desc', 'متقاضی به مرحله پیگیری منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      setSelectedLead(null);
      setRescheduleNotes("");
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.no_show.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.no_show.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const withdrawalMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: number; reason?: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage: 'withdrawal', reason: reason || 'عدم حضور در تعیین سطح' })
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:stages.no_show.withdrawal_success', 'انصراف ثبت شد'),
        description: t('callcenter:stages.no_show.withdrawal_desc', 'متقاضی به بخش انصراف منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      setSelectedLead(null);
      setWithdrawalReason("");
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.no_show.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.no_show.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const filteredLeads = noShowLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.no_show.search_placeholder', 'جستجو در متقاضیان عدم حضور...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <AlertTriangle className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.no_show.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.no_show.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.no_show.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.no_show.empty_desc', 'در حال حاضر موردی با عدم حضور وجود ندارد')}</p>
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
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 me-1" />
                          {t('callcenter:stages.no_show.badge', 'عدم حضور')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
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

                        {lead.lastContactDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(lead.lastContactDate), {
                                addSuffix: true,
                                locale: faIR
                              })}
                            </span>
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
                            <RotateCcw className="h-4 w-4 me-2" />
                            {t('callcenter:stages.no_show.reschedule', 'بازبرنامه‌ریزی')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.no_show.reschedule_title', 'بازبرنامه‌ریزی تعیین سطح')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.no_show.reschedule_for', 'بازبرنامه‌ریزی برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.no_show.notes_label', 'یادداشت')}</Label>
                              <Textarea
                                placeholder={t('callcenter:stages.no_show.notes_placeholder', 'دلیل عدم حضور و زمان جدید...')}
                                value={rescheduleNotes}
                                onChange={(e) => setRescheduleNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(null);
                                  setRescheduleNotes("");
                                }}
                              >
                                {t('callcenter:stages.no_show.cancel', 'انصراف')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => selectedLead && rescheduleMutation.mutate({
                                  leadId: selectedLead.id,
                                  reason: rescheduleNotes || undefined
                                })}
                                disabled={rescheduleMutation.isPending}
                              >
                                {rescheduleMutation.isPending ? t('callcenter:stages.no_show.processing', 'در حال ثبت...') : t('callcenter:stages.no_show.confirm_reschedule', 'تایید بازبرنامه‌ریزی')}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <XCircle className="h-4 w-4 me-2" />
                            {t('callcenter:stages.no_show.withdrawal', 'ثبت انصراف')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.no_show.withdrawal_title', 'ثبت انصراف')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.no_show.withdrawal_confirm', 'آیا از انصراف این متقاضی مطمئن هستید؟')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.no_show.withdrawal_reason', 'دلیل انصراف')}</Label>
                              <Textarea
                                placeholder={t('callcenter:stages.no_show.withdrawal_reason_placeholder', 'دلیل انصراف را وارد کنید...')}
                                value={withdrawalReason}
                                onChange={(e) => setWithdrawalReason(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(null);
                                  setWithdrawalReason("");
                                }}
                              >
                                {t('callcenter:stages.no_show.cancel', 'انصراف')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => selectedLead && withdrawalMutation.mutate({
                                  leadId: selectedLead.id,
                                  reason: withdrawalReason || undefined
                                })}
                                disabled={withdrawalMutation.isPending}
                              >
                                {withdrawalMutation.isPending ? t('callcenter:stages.no_show.processing', 'در حال ثبت...') : t('callcenter:stages.no_show.confirm_withdrawal', 'تایید انصراف')}
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

export default NoShow;
