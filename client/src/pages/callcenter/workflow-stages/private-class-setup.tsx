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
  BookOpen,
  MapPin,
  UserCheck,
  DoorOpen
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function PrivateClassSetup() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [locationPreference, setLocationPreference] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/private_class_setup"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/private_class_setup`);
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
        title: t('callcenter:stages.private_class_setup.success', 'تنظیمات ذخیره شد'),
        description: t('callcenter:stages.private_class_setup.success_desc', 'لید به مرحله تعیین شماره کلاس منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.private_class_setup.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.private_class_setup.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setTeacherName("");
    setSchedule("");
    setSessionDuration("");
    setTotalSessions("");
    setLocationPreference("");
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
              placeholder={t('callcenter:stages.private_class_setup.search_placeholder', 'جستجو در متقاضیان تنظیم کلاس خصوصی...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <BookOpen className="h-4 w-4 mr-2" />
            {filteredLeads.length} {t('callcenter:stages.private_class_setup.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.private_class_setup.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.private_class_setup.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.private_class_setup.empty_desc', 'در حال حاضر موردی برای تنظیم کلاس خصوصی وجود ندارد')}</p>
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
                        <Badge className="bg-purple-100 text-purple-800">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {t('callcenter:stages.private_class_setup.badge', 'تنظیم کلاس')}
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
                        {lead.level && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{lead.level}</span>
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
                            <DoorOpen className="h-4 w-4 mr-2" />
                            {t('callcenter:stages.private_class_setup.assign_room', 'تعیین اتاق')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.private_class_setup.dialog_title', 'تنظیم کلاس خصوصی')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.private_class_setup.dialog_desc', 'تنظیمات کلاس برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.private_class_setup.teacher', 'انتخاب استاد')}</Label>
                              <Input
                                placeholder={t('callcenter:stages.private_class_setup.teacher_placeholder', 'نام استاد را وارد کنید...')}
                                value={teacherName}
                                onChange={(e) => setTeacherName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.private_class_setup.schedule', 'برنامه زمانی (روزها/ساعت)')}</Label>
                              <Input
                                placeholder={t('callcenter:stages.private_class_setup.schedule_placeholder', 'مثال: شنبه و دوشنبه ساعت ۱۰')}
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>{t('callcenter:stages.private_class_setup.session_duration', 'مدت هر جلسه (دقیقه)')}</Label>
                                <Input
                                  type="number"
                                  placeholder="60"
                                  value={sessionDuration}
                                  onChange={(e) => setSessionDuration(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>{t('callcenter:stages.private_class_setup.total_sessions', 'تعداد کل جلسات')}</Label>
                                <Input
                                  type="number"
                                  placeholder="20"
                                  value={totalSessions}
                                  onChange={(e) => setTotalSessions(e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>{t('callcenter:stages.private_class_setup.location', 'ترجیح مکان')}</Label>
                              <Select value={locationPreference} onValueChange={setLocationPreference}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('callcenter:stages.private_class_setup.location_placeholder', 'انتخاب مکان')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="online">{t('callcenter:stages.private_class_setup.online', 'آنلاین')}</SelectItem>
                                  <SelectItem value="in_person">{t('callcenter:stages.private_class_setup.in_person', 'حضوری')}</SelectItem>
                                  <SelectItem value="hybrid">{t('callcenter:stages.private_class_setup.hybrid', 'ترکیبی')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetForm}
                              >
                                {t('callcenter:stages.private_class_setup.cancel', 'انصراف')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: LEAD_WORKFLOW_STAGE.SET_CLASS_NUMBER,
                                  reason: `استاد: ${teacherName} | برنامه: ${schedule} | مدت جلسه: ${sessionDuration} دقیقه | تعداد: ${totalSessions} | مکان: ${locationPreference}`
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                {transitionMutation.isPending
                                  ? t('callcenter:stages.private_class_setup.processing', 'در حال ثبت...')
                                  : t('callcenter:stages.private_class_setup.confirm', 'تعیین اتاق')}
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

export default PrivateClassSetup;
