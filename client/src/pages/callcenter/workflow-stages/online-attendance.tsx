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
  Calendar,
  CheckCircle,
  Clock,
  Video,
  UserCheck,
  UserX,
  Timer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function OnlineAttendance() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sessionDate, setSessionDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [durationAttended, setDurationAttended] = useState("");
  const [attendanceNotes, setAttendanceNotes] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/online_attendance"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/online_attendance`);
    }
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: number; reason: string }) => {
      return await apiRequest(`/api/leads/${leadId}/transition`, {
        method: "POST",
        body: JSON.stringify({ toStage: LEAD_WORKFLOW_STAGE.ONLINE_ATTENDANCE, reason })
      });
    },
    onSuccess: () => {
      toast({
        title: t('callcenter:stages.online_attendance.record_success', 'حضور ثبت شد'),
        description: t('callcenter:stages.online_attendance.record_success_desc', 'وضعیت حضور با موفقیت ثبت شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.online_attendance.record_error', 'خطا در ثبت حضور'),
        description: error.message || t('callcenter:stages.online_attendance.record_error_desc', 'ثبت حضور با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setSessionDate("");
    setAttendanceStatus("");
    setDurationAttended("");
    setAttendanceNotes("");
  };

  const getAttendanceInfo = (lead: Lead) => {
    const metadata = (lead as any).metadata as any;
    return {
      lastSessionDate: metadata?.lastSessionDate || '-',
      lastStatus: metadata?.attendanceStatus || 'unknown',
      totalPresent: metadata?.totalPresent || 0,
      totalAbsent: metadata?.totalAbsent || 0
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 me-1" />{t('callcenter:stages.online_attendance.present', 'حاضر')}</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800"><UserX className="h-3 w-3 me-1" />{t('callcenter:stages.online_attendance.absent', 'غایب')}</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-800"><Timer className="h-3 w-3 me-1" />{t('callcenter:stages.online_attendance.late', 'تأخیر')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t('callcenter:stages.online_attendance.unknown', 'نامشخص')}</Badge>;
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
              placeholder={t('callcenter:stages.online_attendance.search_placeholder', 'جستجو در حضور و غیاب آنلاین...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Video className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.online_attendance.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.online_attendance.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Video className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.online_attendance.empty_title', 'هنوز موردی نیست')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.online_attendance.empty_desc', 'در حال حاضر رکورد حضور آنلاینی وجود ندارد')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const attendanceInfo = getAttendanceInfo(lead);
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
                          {getStatusBadge(attendanceInfo.lastStatus)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{lead.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('callcenter:stages.online_attendance.last_session', 'آخرین جلسه')}: {attendanceInfo.lastSessionDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{t('callcenter:stages.online_attendance.total_present', 'حاضر')}: {attendanceInfo.totalPresent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4 text-red-500" />
                            <span>{t('callcenter:stages.online_attendance.total_absent', 'غایب')}: {attendanceInfo.totalAbsent}</span>
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
                              <Clock className="h-4 w-4 me-2" />
                              {t('callcenter:stages.online_attendance.record', 'ثبت حضور')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            <DialogHeader>
                              <DialogTitle>{t('callcenter:stages.online_attendance.dialog_title', 'ثبت حضور و غیاب')}</DialogTitle>
                              <DialogDescription>
                                {t('callcenter:stages.online_attendance.dialog_desc', 'ثبت حضور برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{t('callcenter:stages.online_attendance.session_date', 'تاریخ جلسه')}</Label>
                                <Input
                                  type="date"
                                  value={sessionDate}
                                  onChange={(e) => setSessionDate(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.online_attendance.attendance_status', 'وضعیت حضور')}</Label>
                                <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('callcenter:stages.online_attendance.status_placeholder', 'انتخاب وضعیت')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">{t('callcenter:stages.online_attendance.present', 'حاضر')}</SelectItem>
                                    <SelectItem value="absent">{t('callcenter:stages.online_attendance.absent', 'غایب')}</SelectItem>
                                    <SelectItem value="late">{t('callcenter:stages.online_attendance.late', 'تأخیر')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.online_attendance.duration', 'مدت حضور (دقیقه)')}</Label>
                                <Input
                                  type="number"
                                  placeholder={t('callcenter:stages.online_attendance.duration_placeholder', 'مدت زمان...')}
                                  value={durationAttended}
                                  onChange={(e) => setDurationAttended(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.online_attendance.notes', 'یادداشت')}</Label>
                                <Textarea
                                  placeholder={t('callcenter:stages.online_attendance.notes_placeholder', 'توضیحات...')}
                                  value={attendanceNotes}
                                  onChange={(e) => setAttendanceNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetForm}
                                >
                                  {t('callcenter:stages.online_attendance.cancel', 'انصراف')}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => selectedLead && recordAttendanceMutation.mutate({
                                    leadId: selectedLead.id,
                                    reason: `جلسه: ${sessionDate} | وضعیت: ${attendanceStatus} | مدت: ${durationAttended} دقیقه | ${attendanceNotes}`
                                  })}
                                  disabled={recordAttendanceMutation.isPending}
                                >
                                  {recordAttendanceMutation.isPending
                                    ? t('callcenter:stages.online_attendance.processing', 'در حال ثبت...')
                                    : t('callcenter:stages.online_attendance.confirm', 'ثبت حضور')}
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

export default OnlineAttendance;
