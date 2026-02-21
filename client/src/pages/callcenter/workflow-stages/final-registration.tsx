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
  CheckCircle,
  UserCheck,
  Users,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Award,
  FileCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS, LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function FinalRegistration() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [enrollmentNotes, setEnrollmentNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: finalRegLeads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/final_registration"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/final_registration`);
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
        title: t('callcenter:stages.final_registration.transition_success', 'انتقال موفق'),
        description: variables.toStage === 'private_class_setup'
          ? t('callcenter:stages.final_registration.to_private', 'متقاضی به مرحله تنظیم کلاس خصوصی منتقل شد')
          : t('callcenter:stages.final_registration.to_enrolled', 'دانش‌آموز با موفقیت ثبت‌نام شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.final_registration.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.final_registration.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedLead(null);
    setEnrollmentNotes("");
    setDialogOpen(false);
  };

  const filteredLeads = finalRegLeads.filter(lead =>
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
              placeholder={t('callcenter:stages.final_registration.search_placeholder', 'جستجو در متقاضیان ثبت‌نام نهایی...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Award className="h-4 w-4 mr-2" />
            {filteredLeads.length} {t('callcenter:stages.final_registration.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.final_registration.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.final_registration.empty_title', 'عالی!')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.final_registration.empty_desc', 'در حال حاضر متقاضی برای ثبت‌نام نهایی وجود ندارد')}</p>
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
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <Award className="h-3 w-3 mr-1" />
                          {t('callcenter:stages.final_registration.badge', 'ثبت‌نام نهایی')}
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
                            <GraduationCap className="h-4 w-4 mr-2" />
                            {t('callcenter:stages.final_registration.finalize', 'نهایی‌سازی ثبت‌نام')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>{t('callcenter:stages.final_registration.dialog_title', 'ثبت‌نام نهایی')}</DialogTitle>
                            <DialogDescription>
                              {t('callcenter:stages.final_registration.dialog_desc', 'نهایی‌سازی ثبت‌نام برای')} {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {selectedLead && (
                              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{selectedLead.firstName} {selectedLead.lastName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span dir="ltr">{selectedLead.phoneNumber}</span>
                                </div>
                                {selectedLead.courseTarget && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <BookOpen className="h-4 w-4 text-gray-500" />
                                    <span>{selectedLead.courseTarget}</span>
                                  </div>
                                )}
                                {selectedLead.notes && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {selectedLead.notes}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <Label>{t('callcenter:stages.final_registration.notes', 'یادداشت ثبت‌نام')}</Label>
                              <Textarea
                                placeholder={t('callcenter:stages.final_registration.notes_placeholder', 'توضیحات نهایی ثبت‌نام...')}
                                value={enrollmentNotes}
                                onChange={(e) => setEnrollmentNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'private_class_setup',
                                  reason: enrollmentNotes || 'تنظیم کلاس خصوصی'
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                {t('callcenter:stages.final_registration.setup_private', 'تنظیم کلاس خصوصی')}
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => selectedLead && transitionMutation.mutate({
                                  leadId: selectedLead.id,
                                  toStage: 'enrolled',
                                  reason: enrollmentNotes || 'ثبت‌نام در کلاس گروهی'
                                })}
                                disabled={transitionMutation.isPending}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                {t('callcenter:stages.final_registration.enroll_group', 'ثبت‌نام در کلاس گروهی')}
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

export default FinalRegistration;
