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
  ClipboardCheck,
  GraduationCap,
  Users,
  UserCheck,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS, LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function Evaluation() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [classType, setClassType] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [courseType, setCourseType] = useState<string>("");
  const [teacherPreference, setTeacherPreference] = useState<string>("");
  const [schedulingNotes, setSchedulingNotes] = useState("");
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: evaluationLeads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/evaluation"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/evaluation`);
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
        'consultation_cc': 'مشاوره کال‌سنتر',
        'consultation_sup': 'مشاوره سوپروایزر',
        'withdrawal': 'انصراف'
      };
      toast({
        title: t('callcenter:stages.evaluation.transition_success', 'انتقال موفق'),
        description: `${t('callcenter:stages.evaluation.moved_to', 'متقاضی به مرحله')} ${stageNames[variables.toStage] || variables.toStage} ${t('callcenter:stages.evaluation.moved', 'منتقل شد')}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.evaluation.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.evaluation.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setClassType("");
    setSelectedLevel("");
    setCourseType("");
    setTeacherPreference("");
    setSchedulingNotes("");
    setEvaluationNotes("");
    setDialogOpen(false);
  };

  const filteredLeads = evaluationLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.evaluation.search_placeholder', 'جستجو در متقاضیان ارزیابی...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <ClipboardCheck className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.evaluation.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.evaluation.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.evaluation.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.evaluation.empty_desc', 'در حال حاضر متقاضی برای ارزیابی وجود ندارد')}</p>
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
                          <ClipboardCheck className="h-3 w-3 me-1" />
                          {t('callcenter:stages.evaluation.badge', 'در انتظار ارزیابی')}
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
                            <GraduationCap className="h-4 w-4 me-2" />
                            {t('callcenter:stages.evaluation.evaluate', 'ارزیابی')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.evaluation.evaluate_title', 'ارزیابی نتایج تعیین سطح')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.evaluation.evaluate_for', 'ارزیابی برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{t('callcenter:stages.evaluation.class_type', 'نوع کلاس')}</Label>
                              <Select value={classType} onValueChange={setClassType}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('callcenter:stages.evaluation.select_class_type', 'انتخاب نوع کلاس')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="group">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      {t('callcenter:stages.evaluation.group_class', 'کلاس گروهی')}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="private">
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="h-4 w-4" />
                                      {t('callcenter:stages.evaluation.private_class', 'کلاس خصوصی')}
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>{t('callcenter:stages.evaluation.level', 'سطح زبان')}</Label>
                              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('callcenter:stages.evaluation.select_level', 'انتخاب سطح')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {levels.map(level => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {classType === 'group' && (
                              <div>
                                <Label>{t('callcenter:stages.evaluation.course_type', 'نوع دوره')}</Label>
                                <Select value={courseType} onValueChange={setCourseType}>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('callcenter:stages.evaluation.select_course_type', 'انتخاب نوع دوره')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">{t('callcenter:stages.evaluation.general', 'عمومی')}</SelectItem>
                                    <SelectItem value="intensive">{t('callcenter:stages.evaluation.intensive', 'فشرده')}</SelectItem>
                                    <SelectItem value="conversation">{t('callcenter:stages.evaluation.conversation', 'مکالمه')}</SelectItem>
                                    <SelectItem value="exam_prep">{t('callcenter:stages.evaluation.exam_prep', 'آمادگی آزمون')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {classType === 'private' && (
                              <>
                                <div>
                                  <Label>{t('callcenter:stages.evaluation.teacher_preference', 'ترجیح استاد')}</Label>
                                  <Input
                                    placeholder={t('callcenter:stages.evaluation.teacher_preference_placeholder', 'نام استاد مورد نظر...')}
                                    value={teacherPreference}
                                    onChange={(e) => setTeacherPreference(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>{t('callcenter:stages.evaluation.scheduling', 'ترجیح زمان‌بندی')}</Label>
                                  <Textarea
                                    placeholder={t('callcenter:stages.evaluation.scheduling_placeholder', 'روزها و ساعات ترجیحی...')}
                                    value={schedulingNotes}
                                    onChange={(e) => setSchedulingNotes(e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              </>
                            )}

                            <div>
                              <Label>{t('callcenter:stages.evaluation.notes', 'یادداشت ارزیابی')}</Label>
                              <Textarea
                                placeholder={t('callcenter:stages.evaluation.notes_placeholder', 'نتیجه ارزیابی و توضیحات...')}
                                value={evaluationNotes}
                                onChange={(e) => setEvaluationNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'consultation_cc',
                                  reason: `نوع: ${classType}, سطح: ${selectedLevel}, ${evaluationNotes}`
                                })}
                                disabled={!classType || !selectedLevel || transitionMutation.isPending}
                              >
                                <ArrowRight className="h-4 w-4 me-2" />
                                {t('callcenter:stages.evaluation.send_to_cc', 'ارسال به مشاوره کال‌سنتر')}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'consultation_sup',
                                  reason: `نوع: ${classType}, سطح: ${selectedLevel}, ${evaluationNotes}`
                                })}
                                disabled={!classType || !selectedLevel || transitionMutation.isPending}
                              >
                                <ArrowRight className="h-4 w-4 me-2" />
                                {t('callcenter:stages.evaluation.send_to_sup', 'ارسال به مشاوره سوپروایزر')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'withdrawal',
                                  reason: evaluationNotes || 'انصراف در مرحله ارزیابی'
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 me-2" />
                                {t('callcenter:stages.evaluation.withdraw', 'انصراف')}
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

export default Evaluation;
