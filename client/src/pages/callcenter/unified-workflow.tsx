import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  UserPlus, 
  Clock, 
  Calendar, 
  Target, 
  XCircle,
  Users,
  PhoneCall,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

// Import workflow stage components (to be created)
import ContactDesk from "./workflow-stages/contact-desk";
import NewIntake from "./workflow-stages/new-intake";
import NoResponse from "./workflow-stages/no-response";
import FollowUp from "./workflow-stages/follow-up";
import LevelAssessment from "./workflow-stages/level-assessment";
import Withdrawal from "./workflow-stages/withdrawal";

export type WorkflowStage = 
  | "contact_desk"      // دفتر تلفن  
  | "new_intake"        // ورودی جدید
  | "no_response"       // پاسخ نداده‌ها
  | "follow_up"         // پیگیری
  | "level_assessment"  // تعیین سطح
  | "withdrawal";       // انصراف

interface WorkflowStats {
  contactDesk: number;
  newIntake: number;
  noResponse: number;
  followUp: number;
  levelAssessment: number;
  withdrawal: number;
  totalActive: number;
}

export default function UnifiedCallCenterWorkflow() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const [activeStage, setActiveStage] = useState<WorkflowStage>("contact_desk");

  // Get real workflow statistics from API
  const { data: workflowStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/leads/workflow-stats'],
    enabled: true
  });

  const workflowStats: WorkflowStats = {
    contactDesk: workflowStatsData?.contactDesk || 0,
    newIntake: workflowStatsData?.newIntake || 0,
    noResponse: workflowStatsData?.noResponse || 0,
    followUp: workflowStatsData?.followUp || 0,
    levelAssessment: workflowStatsData?.levelAssessment || 0,
    withdrawal: workflowStatsData?.withdrawal || 0,
    totalActive: workflowStatsData?.total || 0
  };

  const workflowStages = [
    {
      key: "contact_desk" as WorkflowStage,
      title: "دفتر تلفن",
      titleEn: "Contact Desk",
      icon: Phone,
      description: "مدیریت تماس‌ها و اطلاعات تماس",
      count: workflowStats.contactDesk,
      color: "bg-blue-500",
      testId: "tab-contact-desk"
    },
    {
      key: "new_intake" as WorkflowStage,
      title: "ورودی جدید", 
      titleEn: "New Intake",
      icon: UserPlus,
      description: "ثبت متقاضیان جدید", 
      count: workflowStats.newIntake,
      color: "bg-green-500",
      testId: "tab-new-intake"
    },
    {
      key: "no_response" as WorkflowStage,
      title: "پاسخ نداده‌ها",
      titleEn: "No Response", 
      icon: Clock,
      description: "متقاضیانی که پاسخ نداده‌اند",
      count: workflowStats.noResponse,
      color: "bg-orange-500",
      testId: "tab-no-response"
    },
    {
      key: "follow_up" as WorkflowStage,
      title: "پیگیری",
      titleEn: "Follow-up",
      icon: Calendar,
      description: "پیگیری قبل از تعیین سطح",
      count: workflowStats.followUp, 
      color: "bg-purple-500",
      testId: "tab-follow-up"
    },
    {
      key: "level_assessment" as WorkflowStage,
      title: "تعیین سطح",
      titleEn: "Level Assessment",
      icon: Target,
      description: "برنامه‌ریزی جلسات تعیین سطح",
      count: workflowStats.levelAssessment,
      color: "bg-indigo-500", 
      testId: "tab-level-assessment"
    },
    {
      key: "withdrawal" as WorkflowStage,
      title: "انصراف",
      titleEn: "Withdrawal",
      icon: XCircle,
      description: "متقاضیان منصرف شده",
      count: workflowStats.withdrawal,
      color: "bg-red-500",
      testId: "tab-withdrawal"
    }
  ];

  const renderStageContent = () => {
    switch (activeStage) {
      case "contact_desk":
        return <ContactDesk />;
      case "new_intake":
        return <NewIntake />;
      case "no_response": 
        return <NoResponse />;
      case "follow_up":
        return <FollowUp />;
      case "level_assessment":
        return <LevelAssessment />;
      case "withdrawal":
        return <Withdrawal />;
      default:
        return <ContactDesk />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header with Overall Stats */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                مرکز تماس یکپارچه
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                مدیریت کامل فرآیند پذیرش متقاضیان
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">کل فعال</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {workflowStats.totalActive}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {workflowStages.map((stage) => {
              const IconComponent = stage.icon;
              return (
                <motion.div
                  key={stage.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      activeStage === stage.key 
                        ? "ring-2 ring-blue-500 shadow-lg" 
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setActiveStage(stage.key)}
                    data-testid={stage.testId}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stage.color} bg-opacity-10`}>
                          <IconComponent className={`h-5 w-5 ${stage.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {stage.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {stage.titleEn}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {stage.count}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Main Workflow Content */}
        <div className="min-h-[600px]">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentStage = workflowStages.find(s => s.key === activeStage);
                    const IconComponent = currentStage?.icon || Phone;
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${currentStage?.color || 'bg-blue-500'} bg-opacity-10`}>
                          <IconComponent className={`h-6 w-6 ${(currentStage?.color || 'bg-blue-500').replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {currentStage?.title || "دفتر تلفن"}
                          </CardTitle>
                          <CardDescription>
                            {currentStage?.description || "مدیریت تماس‌ها"}
                          </CardDescription>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <Badge variant="outline" className="text-sm">
                  {workflowStages.find(s => s.key === activeStage)?.count || 0} مورد
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
    </AppLayout>
  );
}