import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, 
  UserPlus, 
  Clock, 
  Calendar, 
  Target, 
  XCircle,
  Users,
  AlertCircle,
  UserX,
  ClipboardCheck,
  MessageCircle,
  ShieldCheck,
  FileText,
  FileBadge,
  BookOpen,
  Hash,
  PlayCircle,
  RefreshCw,
  Pause,
  LogOut,
  Award,
  CreditCard,
  Receipt,
  MonitorCheck,
  UserMinus,
  UserCog,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface User {
  id: number;
  email: string;
  role: string;
}

import ContactDesk from "./workflow-stages/contact-desk";
import NewIntake from "./workflow-stages/new-intake";
import NoResponse from "./workflow-stages/no-response";
import FollowUp from "./workflow-stages/follow-up";
import LevelAssessment from "./workflow-stages/level-assessment";
import Withdrawal from "./workflow-stages/withdrawal";
import NoShow from "./workflow-stages/no-show";
import Evaluation from "./workflow-stages/evaluation";
import ConsultationCC from "./workflow-stages/consultation-cc";
import ConsultationSup from "./workflow-stages/consultation-sup";
import PreRegistration from "./workflow-stages/pre-registration";
import FinalRegistration from "./workflow-stages/final-registration";
import PrivateClassSetup from "./workflow-stages/private-class-setup";
import SetClassNumber from "./workflow-stages/set-class-number";
import ActivePrivateClass from "./workflow-stages/active-private-class";
import ChargeRenewal from "./workflow-stages/charge-renewal";
import HoldStage from "./workflow-stages/hold-stage";
import PrivateClassWithdrawal from "./workflow-stages/private-class-withdrawal";
import CompletedPrivateClass from "./workflow-stages/completed-private-class";
import Installments from "./workflow-stages/installments";
import Cheque from "./workflow-stages/cheque";
import OnlineAttendance from "./workflow-stages/online-attendance";
import StudentAbsence from "./workflow-stages/student-absence";
import TeacherAbsence from "./workflow-stages/teacher-absence";

export type WorkflowStage = 
  | "contact_desk"
  | "new_intake"
  | "no_response"
  | "follow_up"
  | "level_assessment"
  | "withdrawal"
  | "no_show"
  | "evaluation"
  | "consultation_cc"
  | "consultation_sup"
  | "pre_registration"
  | "final_registration"
  | "private_class_setup"
  | "set_class_number"
  | "active_private_class"
  | "charge_renewal"
  | "hold"
  | "private_class_withdrawal"
  | "completed_private_class"
  | "installments"
  | "cheque"
  | "online_attendance"
  | "student_absence"
  | "teacher_absence";

interface StageGroup {
  title: string;
  titleEn: string;
  stages: StageConfig[];
}

interface StageConfig {
  key: WorkflowStage;
  title: string;
  titleEn: string;
  icon: any;
  description: string;
  color: string;
  testId: string;
}

export default function UnifiedCallCenterWorkflow() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const [activeStage, setActiveStage] = useState<WorkflowStage>("contact_desk");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/users/me']
  });

  const normalizeRole = (role: string): string => {
    return role.toLowerCase().trim().replace(/[\s_-]+/g, '_');
  };

  const hasStageAccess = (stage: WorkflowStage): boolean => {
    if (!user) return false;
    
    const normalizedUserRole = normalizeRole(user.role);
    
    const isRole = (...allowedRoles: string[]): boolean => {
      const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
      return normalizedAllowed.includes(normalizedUserRole);
    };
    
    switch (stage) {
      case "contact_desk":
        return true;
      case "new_intake":
      case "follow_up":
        return isRole('admin', 'supervisor', 'call_center_agent', 'callcenter');
      case "no_response":
      case "withdrawal":
      case "no_show":
        return isRole('admin', 'supervisor');
      case "level_assessment":
      case "evaluation":
        return isRole('admin', 'supervisor', 'mentor');
      case "consultation_cc":
        return isRole('admin', 'supervisor', 'call_center_agent', 'callcenter');
      case "consultation_sup":
        return isRole('admin', 'supervisor');
      case "pre_registration":
      case "final_registration":
        return isRole('admin', 'supervisor', 'call_center_agent', 'callcenter', 'front_desk_clerk', 'frontdesk');
      case "private_class_setup":
      case "set_class_number":
      case "active_private_class":
      case "charge_renewal":
      case "hold":
      case "private_class_withdrawal":
      case "completed_private_class":
        return isRole('admin', 'supervisor', 'call_center_agent', 'callcenter');
      case "installments":
      case "cheque":
        return isRole('admin', 'supervisor', 'accountant', 'call_center_agent', 'callcenter');
      case "online_attendance":
      case "student_absence":
      case "teacher_absence":
        return isRole('admin', 'supervisor', 'call_center_agent', 'callcenter', 'mentor');
      default:
        return false;
    }
  };

  const { data: stageCounts, isLoading: statsLoading } = useQuery<Record<string, number>>({
    queryKey: ['/api/leads/stage-counts'],
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  const getCount = (key: string) => stageCounts?.[key] || 0;

  const stageGroups: StageGroup[] = [
    {
      title: "پذیرش اولیه",
      titleEn: "Initial Intake",
      stages: [
        { key: "contact_desk", title: "دفتر تلفن", titleEn: "Contact Desk", icon: Phone, description: "مدیریت تماس‌ها", color: "bg-blue-500", testId: "tab-contact-desk" },
        { key: "new_intake", title: "ورودی جدید", titleEn: "New Intake", icon: UserPlus, description: "ثبت متقاضیان جدید", color: "bg-green-500", testId: "tab-new-intake" },
        { key: "no_response", title: "پاسخ نداده‌ها", titleEn: "No Response", icon: Clock, description: "متقاضیان بدون پاسخ", color: "bg-orange-500", testId: "tab-no-response" },
        { key: "follow_up", title: "پیگیری", titleEn: "Follow-up", icon: Calendar, description: "پیگیری متقاضیان", color: "bg-purple-500", testId: "tab-follow-up" },
      ]
    },
    {
      title: "ارزیابی و مشاوره",
      titleEn: "Assessment & Consultation",
      stages: [
        { key: "level_assessment", title: "تعیین سطح", titleEn: "Level Assessment", icon: Target, description: "جلسات تعیین سطح", color: "bg-indigo-500", testId: "tab-level-assessment" },
        { key: "no_show", title: "عدم حضور", titleEn: "No Show", icon: UserX, description: "عدم حضور در تعیین سطح", color: "bg-amber-500", testId: "tab-no-show" },
        { key: "evaluation", title: "ارزشیابی", titleEn: "Evaluation", icon: ClipboardCheck, description: "ارزیابی نتایج", color: "bg-teal-500", testId: "tab-evaluation" },
        { key: "consultation_cc", title: "مشاوره (مرکز تماس)", titleEn: "CC Consultation", icon: MessageCircle, description: "مشاوره توسط مرکز تماس", color: "bg-cyan-500", testId: "tab-consultation-cc" },
        { key: "consultation_sup", title: "مشاوره (سوپروایزر)", titleEn: "Supervisor Consultation", icon: ShieldCheck, description: "مشاوره توسط سوپروایزر", color: "bg-sky-500", testId: "tab-consultation-sup" },
      ]
    },
    {
      title: "ثبت نام و مالی",
      titleEn: "Registration & Finance",
      stages: [
        { key: "pre_registration", title: "پیش ثبت‌نام", titleEn: "Pre-Registration", icon: FileText, description: "تکمیل پیش ثبت‌نام", color: "bg-lime-500", testId: "tab-pre-registration" },
        { key: "final_registration", title: "ثبت‌نام نهایی", titleEn: "Final Registration", icon: FileBadge, description: "تأیید ثبت‌نام نهایی", color: "bg-emerald-500", testId: "tab-final-registration" },
        { key: "installments", title: "اقساط", titleEn: "Installments", icon: CreditCard, description: "مدیریت پرداخت اقساط", color: "bg-violet-500", testId: "tab-installments" },
        { key: "cheque", title: "چک", titleEn: "Cheque", icon: Receipt, description: "مدیریت چک‌ها", color: "bg-fuchsia-500", testId: "tab-cheque" },
      ]
    },
    {
      title: "مدیریت کلاس خصوصی",
      titleEn: "Private Class Management",
      stages: [
        { key: "private_class_setup", title: "ست کلاس خصوصی", titleEn: "Private Class Setup", icon: BookOpen, description: "تنظیم کلاس خصوصی", color: "bg-blue-600", testId: "tab-private-class-setup" },
        { key: "set_class_number", title: "شماره کلاس", titleEn: "Room Assignment", icon: Hash, description: "تخصیص شماره کلاس", color: "bg-green-600", testId: "tab-set-class-number" },
        { key: "active_private_class", title: "کلاس‌های فعال", titleEn: "Active Classes", icon: PlayCircle, description: "کلاس‌های خصوصی فعال", color: "bg-blue-400", testId: "tab-active-private-class" },
        { key: "charge_renewal", title: "تمدید شارژ", titleEn: "Charge Renewal", icon: RefreshCw, description: "تمدید شارژ جلسات", color: "bg-green-400", testId: "tab-charge-renewal" },
        { key: "hold", title: "هلد", titleEn: "Hold", icon: Pause, description: "کلاس‌های متوقف شده", color: "bg-yellow-500", testId: "tab-hold" },
        { key: "private_class_withdrawal", title: "انصراف خصوصی", titleEn: "Class Withdrawal", icon: LogOut, description: "انصراف از کلاس خصوصی", color: "bg-red-400", testId: "tab-private-class-withdrawal" },
        { key: "completed_private_class", title: "اتمام یافته", titleEn: "Completed", icon: Award, description: "کلاس‌های تکمیل شده", color: "bg-emerald-400", testId: "tab-completed-private-class" },
      ]
    },
    {
      title: "حضور و غیاب",
      titleEn: "Attendance",
      stages: [
        { key: "online_attendance", title: "حضور آنلاین", titleEn: "Online Attendance", icon: MonitorCheck, description: "ثبت حضور آنلاین", color: "bg-cyan-400", testId: "tab-online-attendance" },
        { key: "student_absence", title: "غیبت دانش‌آموز", titleEn: "Student Absence", icon: UserMinus, description: "غیبت مجاز دانش‌آموز", color: "bg-amber-400", testId: "tab-student-absence" },
        { key: "teacher_absence", title: "غیبت استاد", titleEn: "Teacher Absence", icon: UserCog, description: "غیبت غیرمجاز استاد", color: "bg-rose-400", testId: "tab-teacher-absence" },
      ]
    },
    {
      title: "خروجی",
      titleEn: "Exit",
      stages: [
        { key: "withdrawal", title: "انصراف", titleEn: "Withdrawal", icon: XCircle, description: "متقاضیان منصرف شده", color: "bg-red-500", testId: "tab-withdrawal" },
      ]
    }
  ];

  const allStages = stageGroups.flatMap(g => g.stages);
  const availableGroups = stageGroups.map(group => ({
    ...group,
    stages: group.stages.filter(s => hasStageAccess(s.key))
  })).filter(group => group.stages.length > 0);

  const totalActive = Object.values(stageCounts || {}).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (!hasStageAccess(activeStage) && availableGroups.length > 0) {
      setActiveStage(availableGroups[0].stages[0].key);
    }
  }, [user, activeStage]);

  const renderStageContent = () => {
    if (!hasStageAccess(activeStage)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('callcenter:accessDenied', 'دسترسی محدود')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('callcenter:noPermissionStage', 'شما دسترسی به این مرحله ندارید.')}
          </p>
        </div>
      );
    }
    switch (activeStage) {
      case "contact_desk": return <ContactDesk onNavigateToNewIntake={() => setActiveStage("new_intake")} />;
      case "new_intake": return <NewIntake />;
      case "no_response": return <NoResponse />;
      case "follow_up": return <FollowUp />;
      case "level_assessment": return <LevelAssessment />;
      case "withdrawal": return <Withdrawal />;
      case "no_show": return <NoShow />;
      case "evaluation": return <Evaluation />;
      case "consultation_cc": return <ConsultationCC />;
      case "consultation_sup": return <ConsultationSup />;
      case "pre_registration": return <PreRegistration />;
      case "final_registration": return <FinalRegistration />;
      case "private_class_setup": return <PrivateClassSetup />;
      case "set_class_number": return <SetClassNumber />;
      case "active_private_class": return <ActivePrivateClass />;
      case "charge_renewal": return <ChargeRenewal />;
      case "hold": return <HoldStage />;
      case "private_class_withdrawal": return <PrivateClassWithdrawal />;
      case "completed_private_class": return <CompletedPrivateClass />;
      case "installments": return <Installments />;
      case "cheque": return <Cheque />;
      case "online_attendance": return <OnlineAttendance />;
      case "student_absence": return <StudentAbsence />;
      case "teacher_absence": return <TeacherAbsence />;
      default: return <ContactDesk onNavigateToNewIntake={() => setActiveStage("new_intake")} />;
    }
  };

  const currentStage = allStages.find(s => s.key === activeStage);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('callcenter:workflow.title', 'مرکز تماس یکپارچه')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('callcenter:workflow.description', 'مدیریت کامل فرآیند پذیرش و آموزش')}
              </p>
            </div>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {t('callcenter:workflow.totalActive', 'کل فعال')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {totalActive}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6">
          <div className="hidden lg:block">
            <Card className={`sticky top-24 max-h-[calc(100vh-128px)] overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-[320px]'}`}>
              <div className="flex items-center justify-between p-3 border-b">
                {!sidebarCollapsed && (
                  <CardTitle className="text-sm">{t('callcenter:workflow.stages', 'مراحل کاری')}</CardTitle>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  {isRTL ? (
                    sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  ) : (
                    sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className={`${sidebarCollapsed ? 'p-1' : 'p-3'} space-y-4`}>
                  {availableGroups.map((group, gi) => (
                    <div key={gi}>
                      {!sidebarCollapsed && (
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                          {group.title}
                        </p>
                      )}
                      <div className="space-y-1">
                        {group.stages.map((stage) => {
                          const IconComponent = stage.icon;
                          const count = getCount(stage.key);
                          const isActive = activeStage === stage.key;
                          return (
                            <motion.div
                              key={stage.key}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <button
                                className={`w-full flex items-center gap-2 rounded-lg transition-all duration-150 ${sidebarCollapsed ? 'p-2 justify-center' : 'p-2.5'} ${
                                  isActive
                                    ? "bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-700"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                                onClick={() => setActiveStage(stage.key)}
                                data-testid={stage.testId}
                                title={sidebarCollapsed ? `${stage.title} (${count})` : undefined}
                              >
                                <div className={`p-1.5 rounded-md ${stage.color} bg-opacity-10 flex-shrink-0`}>
                                  <IconComponent className={`h-4 w-4 ${stage.color.replace('bg-', 'text-')}`} />
                                </div>
                                {!sidebarCollapsed && (
                                  <>
                                    <div className="flex-1 text-start min-w-0">
                                      <p className={`text-sm truncate ${isActive ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {stage.title}
                                      </p>
                                    </div>
                                    <Badge variant={isActive ? "default" : "secondary"} className="text-xs min-w-[28px] justify-center">
                                      {count}
                                    </Badge>
                                  </>
                                )}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
          
          <div className="space-y-4">
            <div className="lg:hidden">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2 px-1">
                  {availableGroups.flatMap(g => g.stages).map((stage) => {
                    const IconComponent = stage.icon;
                    const count = getCount(stage.key);
                    const isActive = activeStage === stage.key;
                    return (
                      <button
                        key={stage.key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-all ${
                          isActive
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium ring-1 ring-blue-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                        onClick={() => setActiveStage(stage.key)}
                        data-testid={stage.testId}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span>{stage.title}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="min-h-[600px]">
              <Card>
                <CardHeader className="border-b py-3 sm:py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentStage && (() => {
                        const IconComponent = currentStage.icon;
                        return (
                          <>
                            <div className={`p-2 rounded-lg ${currentStage.color} bg-opacity-10`}>
                              <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${currentStage.color.replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg sm:text-xl">
                                {currentStage.title}
                              </CardTitle>
                              <CardDescription className="hidden sm:block">
                                {currentStage.description}
                              </CardDescription>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {getCount(activeStage)} {t('callcenter:workflow.items', 'مورد')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="min-h-[500px]">
                    {renderStageContent()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
