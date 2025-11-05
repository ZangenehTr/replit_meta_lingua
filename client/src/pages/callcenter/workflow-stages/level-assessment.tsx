import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target,
  Calendar as CalendarIcon,
  Clock, 
  User,
  CheckCircle,
  ArrowRight,
  Search,
  Phone,
  MessageSquare,
  GraduationCap,
  Users
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS } from "@shared/schema";
import { motion } from "framer-motion";
import { format, addHours, addDays, isAfter, isBefore, startOfDay } from "date-fns";
import { faIR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function LevelAssessment() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<Date | undefined>(undefined);
  const [assessmentTime, setAssessmentTime] = useState("");

  // Fetch leads ready for level assessment
  const { data: assessmentLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", { status: "level_assessment" }],
    queryFn: async () => {
      return await apiRequest(`/api/leads?workflowStatus=${WORKFLOW_STATUS.LEVEL_ASSESSMENT}`);
    }
  });

  // Schedule level assessment mutation
  const scheduleAssessmentMutation = useMutation({
    mutationFn: async ({ leadId, date, time }: { leadId: number; date: Date; time: string }) => {
      const [hours, minutes] = time.split(':').map(Number);
      const assessmentDateTime = new Date(date);
      assessmentDateTime.setHours(hours, minutes, 0, 0);
      
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          levelAssessmentStart: assessmentDateTime.toISOString(),
          levelAssessmentEnd: addHours(assessmentDateTime, 1).toISOString(),
          status: LEAD_STATUS.ASSESSMENT_SCHEDULED
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "جلسه تعیین سطح برنامه‌ریزی شد",
        description: "زمان تعیین سطح با موفقیت تنظیم شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLead(null);
      setAssessmentDate(undefined);
      setAssessmentTime("");
    }
  });

  // Mark assessment completed mutation
  const completeAssessmentMutation = useMutation({
    mutationFn: async ({ leadId, level }: { leadId: number; level: string }) => {
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          workflowStatus: WORKFLOW_STATUS.LEVEL_ASSESSMENT_COMPLETE,
          status: LEAD_STATUS.CONVERTED,
          interestedLevel: level,
          conversionDate: new Date().toISOString()
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "تعیین سطح تکمیل شد",
        description: "متقاضی آماده ثبت‌نام در دوره مناسب است",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  // Send assessment reminder SMS
  const sendReminderSMSMutation = useMutation({
    mutationFn: async ({ leadId, assessmentDate }: { leadId: number; assessmentDate: string }) => {
      const lead = assessmentLeads.find(l => l.id === leadId);
      const message = `سلام ${lead?.firstName} عزیز، جلسه تعیین سطح شما برای ${format(new Date(assessmentDate), 'yyyy/MM/dd HH:mm', { locale: faIR })} برنامه‌ریزی شده است.`;
      
      return await apiRequest(`/api/leads/${leadId}/sms`, {
        method: "POST",
        body: JSON.stringify({
          message,
          type: "assessment_reminder"
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "پیامک یادآوری ارسال شد",
        description: "پیامک یادآوری جلسه تعیین سطح ارسال شد",
      });
    }
  });

  const filteredLeads = assessmentLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  // Categorize leads by assessment status
  const today = startOfDay(new Date());
  const scheduledLeads = filteredLeads.filter(lead => lead.levelAssessmentStart);
  const unscheduledLeads = filteredLeads.filter(lead => !lead.levelAssessmentStart);
  const todayAssessments = scheduledLeads.filter(lead => 
    lead.levelAssessmentStart && 
    format(new Date(lead.levelAssessmentStart), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );
  const upcomingAssessments = scheduledLeads.filter(lead => 
    lead.levelAssessmentStart && isAfter(new Date(lead.levelAssessmentStart), today) &&
    format(new Date(lead.levelAssessmentStart), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')
  );

  const getAssessmentBadge = (lead: Lead) => {
    if (!lead.levelAssessmentStart) {
      return <Badge variant="secondary">برنامه‌ریزی نشده</Badge>;
    }
    
    const assessmentDate = new Date(lead.levelAssessmentStart);
    if (format(assessmentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return <Badge className="bg-blue-100 text-blue-800">امروز</Badge>;
    } else if (isAfter(assessmentDate, today)) {
      return <Badge className="bg-green-100 text-green-800">برنامه‌ریزی شده</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">عقب‌افتاده</Badge>;
    }
  };

  // Available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  // Proficiency levels
  const proficiencyLevels = [
    { value: "beginner", label: "مبتدی (A1)" },
    { value: "elementary", label: "ابتدایی (A2)" },
    { value: "intermediate", label: "متوسط (B1)" },
    { value: "upper_intermediate", label: "متوسط بالا (B2)" },
    { value: "advanced", label: "پیشرفته (C1)" },
    { value: "proficient", label: "تسلط کامل (C2)" }
  ];

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
                      {getAssessmentBadge(lead)}
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
                      
                      {lead.levelAssessmentStart && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            {format(new Date(lead.levelAssessmentStart), 'yyyy/MM/dd HH:mm', { locale: faIR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!lead.levelAssessmentStart ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                            data-testid={`button-schedule-assessment-${lead.id}`}
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            برنامه‌ریزی
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>برنامه‌ریزی تعیین سطح</DialogTitle>
                            <DialogDescription>
                              تعیین زمان جلسه تعیین سطح برای {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label>تاریخ</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !assessmentDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {assessmentDate ? (
                                      format(assessmentDate, "PPP", { locale: faIR })
                                    ) : (
                                      "انتخاب تاریخ"
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={assessmentDate}
                                    onSelect={setAssessmentDate}
                                    disabled={(date) =>
                                      isBefore(date, startOfDay(new Date()))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div>
                              <Label htmlFor="assessment-time">زمان</Label>
                              <Select value={assessmentTime} onValueChange={setAssessmentTime}>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب زمان" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(null);
                                  setAssessmentDate(undefined);
                                  setAssessmentTime("");
                                }}
                              >
                                انصراف
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => selectedLead && assessmentDate && assessmentTime && scheduleAssessmentMutation.mutate({
                                  leadId: selectedLead.id,
                                  date: assessmentDate,
                                  time: assessmentTime
                                })}
                                disabled={!assessmentDate || !assessmentTime || scheduleAssessmentMutation.isPending}
                                data-testid="button-submit-assessment"
                              >
                                {scheduleAssessmentMutation.isPending ? "در حال ثبت..." : "تایید"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendReminderSMSMutation.mutate({
                            leadId: lead.id,
                            assessmentDate: lead.levelAssessmentStart!
                          })}
                          disabled={sendReminderSMSMutation.isPending}
                          data-testid={`button-remind-${lead.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          یادآوری
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              data-testid={`button-complete-assessment-${lead.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              تکمیل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            <DialogHeader>
                              <DialogTitle>تکمیل تعیین سطح</DialogTitle>
                              <DialogDescription>
                                سطح تعیین شده برای {lead.firstName} {lead.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>سطح تعیین شده</Label>
                                <Select onValueChange={(value) => {
                                  completeAssessmentMutation.mutate({
                                    leadId: lead.id,
                                    level: value
                                  });
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب سطح" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {proficiencyLevels.map((level) => (
                                      <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
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
              placeholder="جستجو در متقاضیان تعیین سطح..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-level-assessment"
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
          {/* Today's Assessments */}
          {renderLeadsList(
            todayAssessments,
            "تعیین سطح امروز",
            <Clock className="h-5 w-5 text-blue-500" />
          )}
          
          {/* Upcoming Assessments */}
          {renderLeadsList(
            upcomingAssessments,
            "جلسات برنامه‌ریزی شده",
            <CalendarIcon className="h-5 w-5 text-green-500" />
          )}
          
          {/* Unscheduled Assessments */}
          {renderLeadsList(
            unscheduledLeads,
            "نیاز به برنامه‌ریزی",
            <Target className="h-5 w-5 text-orange-500" />
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">عالی!</h3>
            <p className="text-gray-600">در حال حاضر متقاضی برای تعیین سطح وجود ندارد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LevelAssessment;