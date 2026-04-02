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
  RefreshCw,
  PauseCircle,
  LogOut,
  Award,
  Settings,
  Monitor,
  UserX,
  UserMinus,
  BookOpen
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function ActivePrivateClass() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/active_private_class"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/active_private_class`);
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
        title: t('callcenter:stages.active_private_class.success', 'عملیات موفق'),
        description: t('callcenter:stages.active_private_class.success_desc', 'لید با موفقیت منتقل شد'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      setDialogOpen(false);
      setSelectedLead(null);
      setActionType("");
      setActionReason("");
    },
    onError: (error: any) => {
      toast({
        title: t('callcenter:stages.active_private_class.error', 'خطا در انتقال'),
        description: error.message || t('callcenter:stages.active_private_class.error_desc', 'انتقال با مشکل مواجه شد'),
        variant: "destructive"
      });
    }
  });

  const actions = [
    { key: 'charge_renewal', stage: LEAD_WORKFLOW_STAGE.CHARGE_RENEWAL, label: t('callcenter:stages.active_private_class.renew_charge', 'تمدید شارژ'), icon: RefreshCw, color: 'bg-green-500 hover:bg-green-600 text-white' },
    { key: 'hold', stage: LEAD_WORKFLOW_STAGE.HOLD, label: t('callcenter:stages.active_private_class.put_on_hold', 'توقف موقت'), icon: PauseCircle, color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    { key: 'withdrawal', stage: LEAD_WORKFLOW_STAGE.PRIVATE_CLASS_WITHDRAWAL, label: t('callcenter:stages.active_private_class.withdraw', 'انصراف از کلاس'), icon: LogOut, color: 'bg-red-500 hover:bg-red-600 text-white' },
    { key: 'complete', stage: LEAD_WORKFLOW_STAGE.COMPLETED_PRIVATE_CLASS, label: t('callcenter:stages.active_private_class.mark_complete', 'اتمام دوره'), icon: Award, color: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
    { key: 'setup', stage: LEAD_WORKFLOW_STAGE.PRIVATE_CLASS_SETUP, label: t('callcenter:stages.active_private_class.change_setup', 'تغییر تنظیمات'), icon: Settings, color: 'bg-purple-500 hover:bg-purple-600 text-white' },
    { key: 'online', stage: LEAD_WORKFLOW_STAGE.ONLINE_ATTENDANCE, label: t('callcenter:stages.active_private_class.online_attendance', 'حضور آنلاین'), icon: Monitor, color: 'bg-cyan-500 hover:bg-cyan-600 text-white' },
    { key: 'student_absence', stage: LEAD_WORKFLOW_STAGE.STUDENT_ABSENCE, label: t('callcenter:stages.active_private_class.student_absence', 'غیبت دانش‌آموز'), icon: UserX, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { key: 'teacher_absence', stage: LEAD_WORKFLOW_STAGE.TEACHER_ABSENCE, label: t('callcenter:stages.active_private_class.teacher_absence', 'غیبت استاد'), icon: UserMinus, color: 'bg-rose-500 hover:bg-rose-600 text-white' },
  ];

  const filteredLeads = leads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  const handleAction = (lead: Lead, action: typeof actions[0]) => {
    setSelectedLead(lead);
    setActionType(action.key);
    setActionReason("");
    setDialogOpen(true);
  };

  const getActionByKey = (key: string) => actions.find(a => a.key === key);

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.active_private_class.search_placeholder', 'جستجو در کلاس‌های خصوصی فعال...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <BookOpen className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.active_private_class.count', 'کلاس فعال')}
          </Badge>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{getActionByKey(actionType)?.label || t('callcenter:stages.active_private_class.action_title', 'عملیات')}</DialogTitle>
            <DialogDescription>
              {t('callcenter:stages.active_private_class.action_for', 'عملیات برای')} {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('callcenter:stages.active_private_class.reason', 'توضیحات')}</Label>
              <Textarea
                placeholder={t('callcenter:stages.active_private_class.reason_placeholder', 'دلیل یا توضیحات...')}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedLead(null);
                  setActionType("");
                  setActionReason("");
                }}
              >
                {t('callcenter:stages.active_private_class.cancel', 'انصراف')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const action = getActionByKey(actionType);
                  if (selectedLead && action) {
                    transitionMutation.mutate({
                      leadId: selectedLead.id,
                      toStage: action.stage,
                      reason: actionReason || undefined
                    });
                  }
                }}
                disabled={transitionMutation.isPending}
              >
                {transitionMutation.isPending
                  ? t('callcenter:stages.active_private_class.processing', 'در حال ثبت...')
                  : t('callcenter:stages.active_private_class.confirm', 'تایید')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.active_private_class.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.active_private_class.empty_title', 'بدون کلاس فعال')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.active_private_class.empty_desc', 'در حال حاضر کلاس خصوصی فعالی وجود ندارد')}</p>
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
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-lg">
                            {lead.firstName} {lead.lastName}
                          </h3>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 me-1" />
                            {t('callcenter:stages.active_private_class.badge', 'فعال')}
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
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {actions.map((action) => {
                        const IconComponent = action.icon;
                        return (
                          <Button
                            key={action.key}
                            size="sm"
                            className={action.color}
                            onClick={() => handleAction(lead, action)}
                          >
                            <IconComponent className="h-4 w-4 me-1" />
                            {action.label}
                          </Button>
                        );
                      })}
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

export default ActivePrivateClass;
