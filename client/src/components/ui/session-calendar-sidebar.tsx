import { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { PersianCalendar } from "@/components/ui/persian-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { 
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Dot
} from "lucide-react";

interface Session {
  id: number;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  type: 'group' | 'individual';
  status: string;
  examType?: 'midterm' | 'final' | null;
  holidays?: any[];
  culturalEvents?: any[];
}

interface SessionCalendarSidebarProps {
  sessions: Session[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onSessionFilter?: (sessionIds: number[]) => void;
  compact?: boolean;
  className?: string;
}

export function SessionCalendarSidebar({
  sessions,
  selectedDate,
  onDateSelect,
  onSessionFilter,
  compact = false,
  className
}: SessionCalendarSidebarProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Get holidays for the current month
  const { data: holidays = [] } = useQuery({
    queryKey: ['/api/calendar/holidays-for-range', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `/api/calendar/holidays-for-range?start=${startOfMonth.toISOString().split('T')[0]}&end=${endOfMonth.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    
    sessions.forEach(session => {
      const dateKey = session.sessionDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    
    return grouped;
  }, [sessions]);

  // Get sessions for selected date
  const sessionsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return sessionsByDate[dateKey] || [];
  }, [selectedDate, sessionsByDate]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    onDateSelect?.(date);
    
    // Filter sessions for selected date
    const dateKey = date.toISOString().split('T')[0];
    const sessionsForDate = sessionsByDate[dateKey] || [];
    onSessionFilter?.(sessionsForDate.map(s => s.id));
  };

  // Custom day renderer to show session indicators
  const renderCalendarDay = (day: number, isCurrentMonth: boolean, date: Date) => {
    if (!isCurrentMonth || day === 0) return null;

    const dateKey = date.toISOString().split('T')[0];
    const sessionsForDay = sessionsByDate[dateKey] || [];
    const hasExam = sessionsForDay.some(s => s.examType);
    const hasHoliday = holidays.some((h: any) => h.gregorianDate === dateKey);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={cn(
          "relative z-10",
          sessionsForDay.length > 0 && "font-semibold"
        )}>
          {day}
        </span>
        
        {/* Session indicators */}
        {sessionsForDay.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {sessionsForDay.slice(0, 3).map((session, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  session.type === 'group' ? "bg-blue-500" : "bg-purple-500",
                  hasExam && "bg-red-500"
                )}
              />
            ))}
            {sessionsForDay.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        )}

        {/* Holiday indicator */}
        {hasHoliday && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
        )}
      </div>
    );
  };

  return (
    <Card className={cn(
      "h-fit",
      compact ? "w-80" : "w-96",
      className
    )} data-testid="session-calendar-sidebar">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('student:sessionCalendar', 'Session Calendar')}
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-4">
            {/* Calendar Component */}
            <div className="mb-4">
              <PersianCalendar
                onDateSelect={handleDateSelect}
                selectedDate={currentDate}
                showHolidays={true}
                showEvents={true}
                compact={compact}
                mode="auto"
                allowTypeSwitch={true}
                className="border rounded-lg"
              />
            </div>

            {/* Session Summary */}
            <div className="space-y-3">
              {/* Legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>{t('student:groupSession', 'Group')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span>{t('student:individualSession', 'Individual')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>{t('student:examSession', 'Exam')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>{t('student:holiday', 'Holiday')}</span>
                </div>
              </div>

              {/* Selected Date Sessions */}
              {selectedDate && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-2">
                    {t('student:sessionsOnDate', 'Sessions on {{date}}', { 
                      date: selectedDate.toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    })}
                  </h4>
                  
                  {sessionsForSelectedDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('student:noSessionsOnDate', 'No sessions scheduled')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sessionsForSelectedDate.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Dot className={cn(
                              "w-4 h-4",
                              session.type === 'group' ? "text-blue-500" : "text-purple-500",
                              session.examType && "text-red-500"
                            )} />
                            <div>
                              <p className="text-sm font-medium">{session.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {session.startTime} - {session.endTime}
                              </p>
                            </div>
                          </div>
                          
                          {session.examType && (
                            <Badge variant="secondary" className="text-xs">
                              {session.examType === 'midterm' ? '📝' : '🎓'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateSelect(new Date())}
                  className="flex-1"
                >
                  {t('common:today', 'Today')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSessionFilter?.(sessions.map(s => s.id))}
                  className="flex-1"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  {t('student:showAll', 'Show All')}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}