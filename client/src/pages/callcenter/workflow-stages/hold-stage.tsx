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
  PauseCircle,
  PlayCircle,
  Clock,
  CalendarDays,
  Timer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";
import { differenceInDays, format } from "date-fns";
import { faIR } from "date-fns/locale";

function HoldStage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/hold"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/hold`);
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
        title: t('callcenter:stages.hold.success', 'بازگشت موفق'),
        description: t('callcenter:stages.hold.success_desc', 'دانش‌آموز به مرحله تعیین شماره کلاس منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.hold.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.hold.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setHoldReason("");
    setExpectedReturnDate("");
  };

  const getDaysOnHold = (lead: Lead) => {
    const holdStart = lead.stageChangedAt ? new Date(lead.stageChangedAt) : (lead.updatedAt ? new Date(lead.updatedAt) : new Date());
    return differenceInDays(new Date(), holdStart);
  };

  const getHoldDurationColor = (days: number) => {
    if (days <= 7) return "bg-green-100 text-green-800";
    if (days <= 30) return "bg-yellow-100 text-yellow-800";
    if (days <= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const filteredLeads = leads.filter(lead =>
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
              placeholder={t('callcenter:stages.hold.search_placeholder', 'جستجو در دانش‌آموزان متوقف...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <PauseCircle className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.hold.count', 'مورد در توقف')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.hold.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.hold.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.hold.empty_desc', 'در حال حاضر دانش‌آموز متوقفی وجود ندارد')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const daysOnHold = getDaysOnHold(lead);
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
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <PauseCircle className="h-3 w-3 me-1" />
                            {t('callcenter:stages.hold.badge', 'متوقف')}
                          </Badge>
                          <Badge className={getHoldDurationColor(daysOnHold)}>
                            <Timer className="h-3 w-3 me-1" />
                            {daysOnHold} {t('callcenter:stages.hold.days', 'روز')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{lead.phoneNumber}</span>
                          </div>
                          {lead.stageChangedAt && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              <span>{t('callcenter:stages.hold.start_date', 'شروع توقف:')} {format(new Date(lead.stageChangedAt), 'yyyy/MM/dd')}</span>
                            </div>
                          )}
                          {lead.nextFollowUpDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{t('callcenter:stages.hold.expected_return', 'بازگشت:')} {format(new Date(lead.nextFollowUpDate), 'yyyy/MM/dd')}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${daysOnHold <= 7 ? 'bg-green-500' : daysOnHold <= 30 ? 'bg-yellow-500' : daysOnHold <= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min((daysOnHold / 90) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0</span>
                            <span>30 {t('callcenter:stages.hold.days', 'روز')}</span>
                            <span>60 {t('callcenter:stages.hold.days', 'روز')}</span>
                            <span>90 {t('callcenter:stages.hold.days', 'روز')}</span>
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
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <PlayCircle className="h-4 w-4 me-2" />
                              {t('callcenter:stages.hold.resume', 'ادامه کلاس')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            <DialogHeader>
                              <DialogTitle>{t('callcenter:stages.hold.dialog_title', 'بازگشت از توقف')}</DialogTitle>
                              <DialogDescription>
                                {t('callcenter:stages.hold.dialog_desc', 'بازگشت دانش‌آموز به کلاس')} {selectedLead?.firstName} {selectedLead?.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{t('callcenter:stages.hold.hold_reason', 'دلیل توقف')}</Label>
                                <Textarea
                                  placeholder={t('callcenter:stages.hold.hold_reason_placeholder', 'دلیل توقف...')}
                                  value={holdReason}
                                  onChange={(e) => setHoldReason(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.hold.return_date', 'تاریخ بازگشت')}</Label>
                                <Input
                                  type="date"
                                  value={expectedReturnDate}
                                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetForm}
                                >
                                  {t('callcenter:stages.hold.cancel', 'انصراف')}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && transitionMutation.mutate({
                                    leadId: selectedLead.id,
                                    toStage: LEAD_WORKFLOW_STAGE.SET_CLASS_NUMBER,
                                    reason: `بازگشت از توقف | دلیل: ${holdReason} | تاریخ بازگشت: ${expectedReturnDate}`
                                  })}
                                  disabled={transitionMutation.isPending}
                                >
                                  {transitionMutation.isPending
                                    ? t('callcenter:stages.hold.processing', 'در حال ثبت...')
                                    : t('callcenter:stages.hold.confirm', 'تایید بازگشت')}
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

export default HoldStage;
