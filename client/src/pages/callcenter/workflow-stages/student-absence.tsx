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
  ShieldCheck,
  FileText,
  Hash,
  ClipboardList
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function StudentAbsence() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [sessionsMissed, setSessionsMissed] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/student_absence"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/student_absence`);
    }
  });

  const recordAbsenceMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: number; reason: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage: LEAD_WORKFLOW_STAGE.STUDENT_ABSENCE, reason })
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:stages.student_absence.record_success', 'غیبت ثبت شد'),
        description: t('callcenter:stages.student_absence.record_success_desc', 'غیبت مجاز با موفقیت ثبت شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.student_absence.record_error', 'خطا در ثبت غیبت'),
        description: error.message || t('callcenter:stages.student_absence.record_error_desc', 'ثبت غیبت با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setAbsenceDate("");
    setAbsenceReason("");
    setSessionsMissed("");
  };

  const getAbsenceInfo = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return {
      lastAbsenceDate: metadata?.lastAbsenceDate || '-',
      reason: metadata?.absenceReason || '-',
      totalAbsences: metadata?.totalAbsences || 0,
      approvalStatus: metadata?.approvalStatus || 'approved'
    };
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
              placeholder={t('callcenter:stages.student_absence.search_placeholder', 'جستجو در غیبت‌های مجاز دانش‌آموزان...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <ShieldCheck className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.student_absence.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.student_absence.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.student_absence.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.student_absence.empty_desc', 'در حال حاضر غیبت مجازی ثبت نشده')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const absenceInfo = getAbsenceInfo(lead);
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
                          <Badge className="bg-amber-100 text-amber-800">
                            <ShieldCheck className="h-3 w-3 me-1" />
                            {t('callcenter:stages.student_absence.badge', 'مجاز')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{lead.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('callcenter:stages.student_absence.last_absence', 'آخرین غیبت')}: {absenceInfo.lastAbsenceDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{t('callcenter:stages.student_absence.reason', 'دلیل')}: {absenceInfo.reason}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            <span>{t('callcenter:stages.student_absence.total_absences', 'کل غیبت‌ها')}: {absenceInfo.totalAbsences}</span>
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
                              <ClipboardList className="h-4 w-4 me-2" />
                              {t('callcenter:stages.student_absence.record', 'ثبت غیبت')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            <DialogHeader>
                              <DialogTitle>{t('callcenter:stages.student_absence.dialog_title', 'ثبت غیبت مجاز')}</DialogTitle>
                              <DialogDescription>
                                {t('callcenter:stages.student_absence.dialog_desc', 'ثبت غیبت مجاز برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{t('callcenter:stages.student_absence.absence_date', 'تاریخ غیبت')}</Label>
                                <Input
                                  type="date"
                                  value={absenceDate}
                                  onChange={(e) => setAbsenceDate(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.student_absence.absence_reason', 'دلیل غیبت')}</Label>
                                <Textarea
                                  placeholder={t('callcenter:stages.student_absence.reason_placeholder', 'دلیل غیبت را وارد کنید...')}
                                  value={absenceReason}
                                  onChange={(e) => setAbsenceReason(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.student_absence.sessions_missed', 'تعداد جلسات از دست رفته')}</Label>
                                <Input
                                  type="number"
                                  placeholder={t('callcenter:stages.student_absence.sessions_placeholder', 'تعداد جلسات...')}
                                  value={sessionsMissed}
                                  onChange={(e) => setSessionsMissed(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetForm}
                                >
                                  {t('callcenter:stages.student_absence.cancel', 'انصراف')}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && recordAbsenceMutation.mutate({
                                    leadId: selectedLead.id,
                                    reason: `تاریخ: ${absenceDate} | دلیل: ${absenceReason} | جلسات: ${sessionsMissed}`
                                  })}
                                  disabled={recordAbsenceMutation.isPending}
                                >
                                  {recordAbsenceMutation.isPending
                                    ? t('callcenter:stages.student_absence.processing', 'در حال ثبت...')
                                    : t('callcenter:stages.student_absence.confirm', 'ثبت غیبت')}
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

export default StudentAbsence;
