import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar as CalendarIcon,
  Clock, 
  Phone, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Search,
  User,
  Target,
  Bell
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS } from "@shared/schema";
import { motion } from "framer-motion";
import { format, addDays, isAfter, isBefore, startOfDay, isValid } from "date-fns";
import { faIR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function FollowUp() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpTime, setFollowUpTime] = useState<{ hours: number; minutes: number } | null>({ hours: 10, minutes: 0 });
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [enableSMSReminder, setEnableSMSReminder] = useState(true);

  // Fetch leads in follow-up stage
  const { data: followUpLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", { status: "follow_up" }],
    queryFn: async () => {
      return await apiRequest(`/api/leads?workflowStatus=${WORKFLOW_STATUS.FOLLOW_UP}`);
    }
  });

  // Schedule follow-up mutation
  const scheduleFollowUpMutation = useMutation({
    mutationFn: async ({ leadId, date, time, notes, smsReminder }: { 
      leadId: number; 
      date: Date; 
      time: { hours: number; minutes: number }; 
      notes: string;
      smsReminder: boolean;
    }) => {
      // Validation
      if (!isValid(date)) {
        throw new Error('تاریخ انتخاب شده نامعتبر است');
      }
      
      if (!time || time.hours < 0 || time.hours > 23 || time.minutes < 0 || time.minutes > 59) {
        throw new Error('زمان انتخاب شده نامعتبر است');
      }
      
      // Combine date and time into proper DateTime
      const followUpDateTime = new Date(date);
      followUpDateTime.setHours(time.hours, time.minutes, 0, 0);
      
      // Validate the combined DateTime is not in the past
      const now = new Date();
      if (followUpDateTime <= now) {
        throw new Error('زمان پیگیری نمی‌تواند در گذشته باشد');
      }
      
      // Create end date (7 days later at the same time)
      const followUpEndDateTime = new Date(followUpDateTime);
      followUpEndDateTime.setDate(followUpEndDateTime.getDate() + 7);
      
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          nextFollowUpDate: followUpDateTime.toISOString(),
          followUpStart: followUpDateTime.toISOString(),
          followUpEnd: followUpEndDateTime.toISOString(),
          notes: notes,
          smsReminderEnabled: smsReminder
        })
      });
    },
    onSuccess: () => {
      const scheduledTime = followUpDate && followUpTime ? 
        `${format(followUpDate, 'yyyy/MM/dd', { locale: faIR })} ${followUpTime.hours.toString().padStart(2, '0')}:${followUpTime.minutes.toString().padStart(2, '0')}` 
        : '';
      
      toast({
        title: "پیگیری برنامه‌ریزی شد",
        description: `زمان پیگیری برای ${scheduledTime} تنظیم شد` + (enableSMSReminder ? ' (همراه با پیامک یادآوری)' : ''),
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLead(null);
      setFollowUpDate(undefined);
      setFollowUpTime({ hours: 10, minutes: 0 });
      setFollowUpNotes("");
      setEnableSMSReminder(true);
    },
    onError: (error: any) => {
      toast({
        title: "خطا در برنامه‌ریزی",
        description: error.message || "عملیات با شکست مواجه شد",
        variant: "destructive"
      });
    }
  });

  // Move to level assessment mutation
  const moveToLevelAssessmentMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT,
          status: LEAD_STATUS.QUALIFIED
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "انتقال موفق",
        description: "متقاضی به مرحله تعیین سطح منتقل شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  // Send SMS reminder mutation
  const sendSMSReminderMutation = useMutation({
    mutationFn: async ({ leadId, message }: { leadId: number; message: string }) => {
      return await apiRequest(`/api/leads/${leadId}/sms`, {
        method: "POST",
        body: JSON.stringify({
          message,
          type: "follow_up_reminder"
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "پیامک ارسال شد",
        description: "پیامک یادآوری با موفقیت ارسال شد",
      });
    }
  });

  const filteredLeads = followUpLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  // Categorize leads by follow-up timing
  const today = startOfDay(new Date());
  const overDueLeads = filteredLeads.filter(lead => 
    lead.nextFollowUpDate && isBefore(new Date(lead.nextFollowUpDate), today)
  );
  const todayLeads = filteredLeads.filter(lead => 
    lead.nextFollowUpDate && 
    format(new Date(lead.nextFollowUpDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );
  const upcomingLeads = filteredLeads.filter(lead => 
    lead.nextFollowUpDate && isAfter(new Date(lead.nextFollowUpDate), today)
  );
  const unscheduledLeads = filteredLeads.filter(lead => !lead.nextFollowUpDate);

  const getFollowUpBadge = (lead: Lead) => {
    if (!lead.nextFollowUpDate) {
      return <Badge variant="secondary">برنامه‌ریزی نشده</Badge>;
    }
    
    const followUpDate = new Date(lead.nextFollowUpDate);
    if (isBefore(followUpDate, today)) {
      return <Badge className="bg-red-100 text-red-800">عقب‌افتاده</Badge>;
    } else if (format(followUpDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return <Badge className="bg-blue-100 text-blue-800">امروز</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">آینده</Badge>;
    }
  };

  const renderLeadsList = (leads: Lead[], title: string, icon: React.ReactNode) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({leads.length} مورد)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-center text-gray-500 py-4">موردی یافت نشد</p>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium" data-testid={`lead-name-${lead.id}`}>
                          {lead.firstName} {lead.lastName}
                        </h4>
                      </div>
                      {getFollowUpBadge(lead)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span dir="ltr">{lead.phoneNumber}</span>
                      </div>
                      
                      {lead.courseTarget && (
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          <span>{lead.courseTarget}</span>
                        </div>
                      )}
                      
                      {lead.nextFollowUpDate && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            {format(new Date(lead.nextFollowUpDate), 'yyyy/MM/dd HH:mm', { locale: faIR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                          data-testid={`button-schedule-${lead.id}`}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          برنامه‌ریزی
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
                        <DialogHeader>
                          <DialogTitle>برنامه‌ریزی پیگیری</DialogTitle>
                          <DialogDescription>
                            تعیین زمان پیگیری برای {selectedLead?.firstName} {selectedLead?.lastName}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>تاریخ پیگیری</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !followUpDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {followUpDate ? (
                                      format(followUpDate, "PPP", { locale: faIR })
                                    ) : (
                                      "انتخاب تاریخ"
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={followUpDate}
                                    onSelect={setFollowUpDate}
                                    disabled={(date) =>
                                      isBefore(date, startOfDay(new Date()))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div>
                              <Label>زمان پیگیری</Label>
                              <TimePicker
                                value={followUpTime}
                                onChange={setFollowUpTime}
                                placeholder="انتخاب زمان"
                                data-testid="time-picker-follow-up"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="sms-reminder"
                              checked={enableSMSReminder}
                              onCheckedChange={setEnableSMSReminder}
                              data-testid="switch-sms-reminder"
                            />
                            <Label htmlFor="sms-reminder" className="text-sm font-medium">
                              ارسال پیامک یادآوری در زمان مقرر
                            </Label>
                          </div>
                          
                          <div>
                            <Label htmlFor="follow-up-notes">یادداشت پیگیری</Label>
                            <Textarea
                              id="follow-up-notes"
                              placeholder="توضیحات پیگیری..."
                              value={followUpNotes}
                              onChange={(e) => setFollowUpNotes(e.target.value)}
                              rows={3}
                              data-testid="textarea-follow-up-notes"
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLead(null);
                                setFollowUpDate(undefined);
                                setFollowUpTime({ hours: 10, minutes: 0 });
                                setFollowUpNotes("");
                                setEnableSMSReminder(true);
                              }}
                            >
                              انصراف
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => selectedLead && followUpDate && followUpTime && scheduleFollowUpMutation.mutate({
                                leadId: selectedLead.id,
                                date: followUpDate,
                                time: followUpTime,
                                notes: followUpNotes,
                                smsReminder: enableSMSReminder
                              })}
                              disabled={!followUpDate || !followUpTime || scheduleFollowUpMutation.isPending}
                              data-testid="button-submit-follow-up"
                            >
                              {scheduleFollowUpMutation.isPending ? "در حال ثبت..." : "تایید"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendSMSReminderMutation.mutate({
                        leadId: lead.id,
                        message: `سلام ${lead.firstName} عزیز، برای ادامه روند ثبت‌نام در موسسه زبان با ما تماس بگیرید.`
                      })}
                      disabled={sendSMSReminderMutation.isPending}
                      data-testid={`button-sms-${lead.id}`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      پیامک
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => moveToLevelAssessmentMutation.mutate(lead.id)}
                      disabled={moveToLevelAssessmentMutation.isPending}
                      data-testid={`button-level-assessment-${lead.id}`}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      تعیین سطح
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در متقاضیان پیگیری..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-follow-up"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>در حال بارگذاری...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overdue Follow-ups */}
          {renderLeadsList(
            overDueLeads,
            "پیگیری‌های عقب‌افتاده",
            <Clock className="h-5 w-5 text-red-500" />
          )}
          
          {/* Today's Follow-ups */}
          {renderLeadsList(
            todayLeads,
            "پیگیری‌های امروز",
            <Bell className="h-5 w-5 text-blue-500" />
          )}
          
          {/* Upcoming Follow-ups */}
          {renderLeadsList(
            upcomingLeads,
            "پیگیری‌های آینده",
            <CalendarIcon className="h-5 w-5 text-green-500" />
          )}
          
          {/* Unscheduled Follow-ups */}
          {renderLeadsList(
            unscheduledLeads,
            "برنامه‌ریزی نشده",
            <CheckCircle className="h-5 w-5 text-gray-500" />
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">عالی!</h3>
            <p className="text-gray-600">در حال حاضر متقاضی برای پیگیری وجود ندارد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FollowUp;