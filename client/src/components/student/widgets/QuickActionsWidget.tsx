import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import { 
  Play, 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Trophy, 
  Users,
  Video,
  PenTool,
  Headphones,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, QuickAction, themeConfig } from "./types";
import { useLocation } from "wouter";

interface QuickActionsWidgetProps extends BaseWidgetProps {
  actions?: QuickAction[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
}

export function QuickActionsWidget({ 
  theme = 'learner',
  className,
  actions,
  columns = 2,
  compact = false
}: QuickActionsWidgetProps) {
  const [, setLocation] = useLocation();
  const currentTheme = themeConfig[theme];

  // Default quick actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: 'continue-learning',
      label: 'Continue Learning',
      icon: Play,
      action: () => setLocation("/courses"),
      color: currentTheme.primary
    },
    {
      id: 'ai-practice',
      label: 'AI Practice',
      icon: MessageSquare,
      action: () => setLocation("/ai-practice")
    },
    {
      id: 'upcoming-sessions',
      label: 'Sessions',
      icon: Calendar,
      action: () => setLocation("/sessions")
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: FileText,
      action: () => setLocation("/assignments")
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: Trophy,
      action: () => setLocation("/progress")
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      action: () => setLocation("/community")
    },
    {
      id: 'speaking-practice',
      label: 'Speaking',
      icon: Video,
      action: () => setLocation("/speaking-practice")
    },
    {
      id: 'listening-practice',
      label: 'Listening',
      icon: Headphones,
      action: () => setLocation("/listening-practice")
    },
    {
      id: 'writing-practice',
      label: 'Writing',
      icon: PenTool,
      action: () => setLocation("/writing-practice")
    },
    {
      id: 'reading-practice',
      label: 'Reading',
      icon: BookOpen,
      action: () => setLocation("/reading-practice")
    }
  ];

  const quickActions = actions || defaultActions.slice(0, columns * 2);
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-4'
  };

  return (
    <MobileCard 
      variant="default"
      className={className}
      data-testid="quick-actions-widget"
    >
      {!compact && (
        <MobileCardHeader>
          <MobileCardTitle className="flex items-center gap-2">
            <Play className={cn("h-5 w-5", currentTheme.text)} />
            Quick Actions
          </MobileCardTitle>
        </MobileCardHeader>
      )}
      <MobileCardContent className={compact ? "p-3" : undefined}>
        <div className={cn(
          "grid gap-3",
          gridCols[columns]
        )}>
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <MobileButton
                key={action.id}
                variant={action.color ? "default" : "outline"}
                size={compact ? "sm" : "lg"}
                leftIcon={<IconComponent className="h-5 w-5" />}
                onClick={action.action}
                disabled={action.disabled}
                className={cn(
                  "flex-col gap-2 text-center",
                  compact ? "h-12 text-xs" : "h-16 text-sm",
                  action.color && `bg-gradient-to-r ${action.color}`,
                  "hover:scale-105 active:scale-95 transition-transform"
                )}
                data-testid={`quick-action-${action.id}`}
              >
                {action.label}
              </MobileButton>
            );
          })}
        </div>
        
        {!compact && quickActions.length > columns * 2 && (
          <div className="text-center pt-3 border-t border-border mt-3">
            <MobileButton 
              variant="ghost" 
              size="sm"
              data-testid="button-more-actions"
            >
              More actions...
            </MobileButton>
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
}