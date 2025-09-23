import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { 
  FileText,
  GraduationCap,
  BookOpen,
  Award
} from "lucide-react";

type ExamType = 'midterm' | 'final' | 'quiz' | 'assignment';

interface ExamTypeIndicatorProps {
  examType: ExamType;
  compact?: boolean;
  className?: string;
}

const getExamIcon = (type: ExamType) => {
  switch (type) {
    case 'midterm':
      return <FileText className="w-3 h-3" />;
    case 'final':
      return <GraduationCap className="w-3 h-3" />;
    case 'quiz':
      return <BookOpen className="w-3 h-3" />;
    case 'assignment':
      return <Award className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
};

const getExamTypeStyles = (type: ExamType) => {
  const baseStyles = "text-white border-none shadow-sm font-semibold";
  
  switch (type) {
    case 'midterm':
      return `${baseStyles} bg-gradient-to-r from-orange-500 to-amber-600`;
    case 'final':
      return `${baseStyles} bg-gradient-to-r from-red-500 to-rose-600`;
    case 'quiz':
      return `${baseStyles} bg-gradient-to-r from-blue-500 to-indigo-600`;
    case 'assignment':
      return `${baseStyles} bg-gradient-to-r from-purple-500 to-violet-600`;
    default:
      return `${baseStyles} bg-gradient-to-r from-gray-500 to-slate-600`;
  }
};

const getExamTypeKey = (type: ExamType) => {
  switch (type) {
    case 'midterm':
      return 'calendar:midtermExam';
    case 'final':
      return 'calendar:finalExam';
    case 'quiz':
      return 'calendar:quiz';
    case 'assignment':
      return 'calendar:assignment';
    default:
      return 'calendar:exam';
  }
};

const getExamTypeEmoji = (type: ExamType) => {
  switch (type) {
    case 'midterm':
      return '📝';
    case 'final':
      return '🎓';
    case 'quiz':
      return '📚';
    case 'assignment':
      return '📋';
    default:
      return '📝';
  }
};

export function ExamTypeIndicator({ examType, compact = false, className }: ExamTypeIndicatorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  const examLabel = t(getExamTypeKey(examType), examType);
  const examEmoji = getExamTypeEmoji(examType);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
              getExamTypeStyles(examType),
              compact && "px-2 py-0.5 text-xs",
              className
            )}
            data-testid={`exam-type-${examType}`}
          >
            {getExamIcon(examType)}
            <span className="flex items-center gap-1">
              {examEmoji}
              <span className={cn("max-w-[100px] truncate", compact && "max-w-[60px]")}>
                {examLabel}
              </span>
            </span>
          </Badge>
        </TooltipTrigger>
        
        <TooltipContent 
          side={isRTL ? "left" : "right"}
          data-testid={`exam-tooltip-${examType}`}
        >
          <div className={cn("space-y-1", isRTL && "text-right")}>
            <div className="font-semibold flex items-center gap-2">
              {examEmoji}
              {examLabel}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {examType === 'midterm' && t('calendar:midtermDescription', 'Mid-semester examination')}
              {examType === 'final' && t('calendar:finalDescription', 'Final examination - prepare well!')}
              {examType === 'quiz' && t('calendar:quizDescription', 'Quick assessment quiz')}
              {examType === 'assignment' && t('calendar:assignmentDescription', 'Assignment submission due')}
            </p>

            {(examType === 'midterm' || examType === 'final') && (
              <div className="pt-1">
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  ⚠️ {t('calendar:importantExam', 'Important exam session')}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}