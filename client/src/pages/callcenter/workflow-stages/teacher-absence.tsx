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
  AlertOctagon,
  Users,
  BookOpen,
  UserMinus,
  ClipboardList,
  UserPlus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function TeacherAbsence() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [classesAffected, setClassesAffected] = useState("");
  const [substituteTeacher, setSubstituteTeacher] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/teacher_absence"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/teacher_absence`);
    }
  });

  const recordAbsenceMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: number; reason: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage: LEAD_WORKFLOW_STAGE.TEACHER_ABSENCE, reason })
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:stages.teacher_absence.record_success', 'غیبت استاد ثبت شد'),
        description: t('callcenter:stages.teacher_absence.record_success_desc', 'غیبت غیرمجاز استاد با موفقیت ثبت شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.teacher_absence.record_error', 'خطا در ثبت غیبت'),
        description: error.message || t('callcenter:stages.teacher_absence.record_error_desc', 'ثبت غیبت با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setTeacherName("");
    setAbsenceDate("");
    setAbsenceReason("");
    setClassesAffected("");
    setSubstituteTeacher("");
  };

  const getTeacherAbsenceInfo = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return {
      teacherName: metadata?.teacherName || (lead as any).assignedTeacher || '-',
      absenceDate: metadata?.teacherAbsenceDate || '-',
      classAffected: metadata?.classAffected || lead.courseTarget || '-',
      studentsImpacted: metadata?.studentsImpacted || 0
    };
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
              placeholder={t('callcenter:stages.teacher_absence.search_placeholder', 'جستجو در غیبت‌های غیرمجاز اساتید...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <UserMinus className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.teacher_absence.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.teacher_absence.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserMinus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.teacher_absence.empty_title', 'هنوز موردی نیست')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.teacher_absence.empty_desc', 'در حال حاضر غیبت غیرمجاز استادی ثبت نشده')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const absenceInfo = getTeacherAbsenceInfo(lead);
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
                          <Badge className="bg-red-100 text-red-800">
                            <AlertOctagon className="h-3 w-3 me-1" />
                            {t('callcenter:stages.teacher_absence.badge', 'غیرمجاز')}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{lead.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserMinus className="h-4 w-4" />
                            <span>{t('callcenter:stages.teacher_absence.teacher_name', 'نام استاد')}: {absenceInfo.teacherName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('callcenter:stages.teacher_absence.absence_date', 'تاریخ غیبت')}: {absenceInfo.absenceDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{t('callcenter:stages.teacher_absence.class_affected', 'کلاس متأثر')}: {absenceInfo.classAffected}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{t('callcenter:stages.teacher_absence.students_impacted', 'دانش‌آموزان متأثر')}: {absenceInfo.studentsImpacted}</span>
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
                              {t('callcenter:stages.teacher_absence.record', 'ثبت غیبت')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            <DialogHeader>
                              <DialogTitle>{t('callcenter:stages.teacher_absence.dialog_title', 'ثبت غیبت غیرمجاز استاد')}</DialogTitle>
                              <DialogDescription>
                                {t('callcenter:stages.teacher_absence.dialog_desc', 'ثبت غیبت غیرمجاز استاد')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{t('callcenter:stages.teacher_absence.teacher_name', 'نام استاد')}</Label>
                                <Input
                                  placeholder={t('callcenter:stages.teacher_absence.teacher_placeholder', 'نام استاد...')}
                                  value={teacherName}
                                  onChange={(e) => setTeacherName(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.teacher_absence.absence_date', 'تاریخ غیبت')}</Label>
                                <Input
                                  type="date"
                                  value={absenceDate}
                                  onChange={(e) => setAbsenceDate(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.teacher_absence.absence_reason', 'دلیل غیبت')}</Label>
                                <Textarea
                                  placeholder={t('callcenter:stages.teacher_absence.reason_placeholder', 'دلیل غیبت...')}
                                  value={absenceReason}
                                  onChange={(e) => setAbsenceReason(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.teacher_absence.classes_affected', 'کلاس‌های متأثر')}</Label>
                                <Input
                                  placeholder={t('callcenter:stages.teacher_absence.classes_placeholder', 'نام کلاس‌ها...')}
                                  value={classesAffected}
                                  onChange={(e) => setClassesAffected(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.teacher_absence.substitute', 'استاد جایگزین')}</Label>
                                <Input
                                  placeholder={t('callcenter:stages.teacher_absence.substitute_placeholder', 'نام استاد جایگزین...')}
                                  value={substituteTeacher}
                                  onChange={(e) => setSubstituteTeacher(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetForm}
                                >
                                  {t('callcenter:stages.teacher_absence.cancel', 'انصراف')}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && recordAbsenceMutation.mutate({
                                    leadId: selectedLead.id,
                                    reason: `استاد: ${teacherName} | تاریخ: ${absenceDate} | دلیل: ${absenceReason} | کلاس‌ها: ${classesAffected} | جایگزین: ${substituteTeacher}`
                                  })}
                                  disabled={recordAbsenceMutation.isPending}
                                >
                                  {recordAbsenceMutation.isPending
                                    ? t('callcenter:stages.teacher_absence.processing', 'در حال ثبت...')
                                    : t('callcenter:stages.teacher_absence.confirm', 'ثبت غیبت')}
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

export default TeacherAbsence;
