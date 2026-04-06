import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Phone, ClipboardList, UserPlus, PhoneCall, Calendar, AlertCircle, Plus, Download, Printer, BarChart3, Bell, Search, Settings, Zap, Home, Languages, ChevronRight, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { AnalyticsView } from "@/components/frontdesk/AnalyticsView";
import { CustomerDetailSidebar, type CustomerInteraction } from "@/components/frontdesk/CustomerDetailSidebar";
import { DashboardOverview } from "@/components/frontdesk/DashboardOverview";
import { TasksView } from "@/components/frontdesk/TasksView";
import { FollowUpsView } from "@/components/frontdesk/FollowUpsView";
import { TrialsView } from "@/components/frontdesk/TrialsView";
import { apiRequest } from "@/lib/queryClient";
import { parseISO, formatDistanceToNow, isToday, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface FrontDeskOperation { id: number; visitorName: string; visitorPhone?: string; visitType: string; purpose: string; status: string; priority: string; visitedAt: string; handledBy: number; convertedToLead?: boolean; convertedToStudent?: boolean; completedAt?: string; tags: string[]; interestedLanguage?: string; currentLevel?: string; budget?: number; leadScore?: number; notes?: string; }
interface PhoneCallLog { id: number; callerName: string; callerPhone: string; callType: string; callPurpose: string; callResult: string; callTime: string; callDuration?: number; urgencyLevel: string; handledBy: number; tags: string[]; }
interface FrontDeskTask { id: number; title: string; description: string; taskType: string; status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"; priority: "low" | "medium" | "high" | "urgent"; dueDate: string; assignedTo: number; contactName?: string; tags: string[]; }
interface Notification { id: number; type: "info" | "warning" | "error" | "success"; title: string; message: string; timestamp: string; isRead: boolean; actionUrl?: string; actionLabel?: string; category: string; priority: string; }
interface FollowUp { id: number; type: string; customerName: string; customerPhone: string; dueDate: string; priority: "low" | "medium" | "high" | "urgent"; status: string; leadScore: number; conversionProbability: number; contactAttempts: number; maxAttempts: number; preferredContactMethod: string; }
interface TrialLesson { id: number; studentName: string; studentPhone: string; language: string; level: string; scheduledDate: string; scheduledTime: string; duration: number; teacherId: number; teacherName: string; status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"; location: string; type: "in_person" | "online"; }

type ViewType = "overview" | "tasks" | "followups" | "trials" | "analytics";

const fetchAuth = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }).then(r => r.json());

export default function FrontDeskDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation(['frontdesk', 'common']);
  const { isRTL } = useLanguage();

  const [selectedView, setSelectedView] = useState<ViewType>("overview");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerInteractions, setCustomerInteractions] = useState<CustomerInteraction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "overdue" | "completed">("all");
  const [followUpFilter, setFollowUpFilter] = useState<"all" | "urgent" | "today" | "this_week">("all");

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey) { switch (e.key) { case "n": e.preventDefault(); setLocation("/frontdesk/walk-in-intake"); break; case "c": e.preventDefault(); setLocation("/frontdesk/call-logging"); break; case "t": e.preventDefault(); setSelectedView("tasks"); break; case "f": e.preventDefault(); setSelectedView("followups"); break; case "/": e.preventDefault(); document.getElementById("search-input")?.focus(); break; } } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [setLocation]);
  useEffect(() => { const i = setInterval(() => queryClient.invalidateQueries({ queryKey: ["/api/front-desk"] }), 30000); return () => clearInterval(i); }, [queryClient]);

  const { data: operations = [], isLoading: operationsLoading } = useQuery({ queryKey: ["/api/front-desk/operations"], queryFn: () => fetchAuth("/api/front-desk/operations") });
  const { data: calls = [], isLoading: callsLoading } = useQuery({ queryKey: ["/api/front-desk/calls"], queryFn: () => fetchAuth("/api/front-desk/calls") });
  const { data: todayTasks = [] } = useQuery({ queryKey: ["/api/front-desk/tasks/today"], queryFn: () => fetchAuth("/api/front-desk/tasks/today") });
  const { data: overdueTasks = [] } = useQuery({ queryKey: ["/api/front-desk/tasks/overdue"], queryFn: () => fetchAuth("/api/front-desk/tasks/overdue") });
  const { data: followUps = [] } = useQuery({ queryKey: ["/api/front-desk/followups"], queryFn: () => fetchAuth("/api/front-desk/followups") });
  const { data: todayTrials = [] } = useQuery({ queryKey: ["/api/front-desk/trials/today"], queryFn: () => fetchAuth("/api/front-desk/trials/today") });
  const { data: notifications = [] } = useQuery({ queryKey: ["/api/front-desk/notifications"], queryFn: () => fetchAuth("/api/front-desk/notifications") });
  const { data: performanceMetrics } = useQuery({ queryKey: ["/api/front-desk/metrics"], queryFn: () => fetchAuth("/api/front-desk/metrics") });

  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const pendingOperations = Array.isArray(operations) ? operations.filter((op: FrontDeskOperation) => op.status === "pending" || op.status === "in_progress").length : 0;
    const completedToday = Array.isArray(operations) ? operations.filter((op: FrontDeskOperation) => op.status === "completed" && new Date(op.completedAt || "").toDateString() === todayStr).length : 0;
    const callsToday = Array.isArray(calls) ? calls.filter((c: PhoneCallLog) => new Date(c.callTime).toDateString() === todayStr).length : 0;
    const urgentFollowUps = Array.isArray(followUps) ? followUps.filter((f: FollowUp) => f.priority === "urgent" && f.status === "pending").length : 0;
    const todayTrialsCount = Array.isArray(todayTrials) ? todayTrials.length : 0;
    const confirmedTrials = Array.isArray(todayTrials) ? todayTrials.filter((t: TrialLesson) => t.status === "confirmed").length : 0;
    const conversionRate = Array.isArray(operations) && operations.length > 0 ? (operations.filter((op: FrontDeskOperation) => op.convertedToLead || op.convertedToStudent).length / operations.length) * 100 : 0;
    const averageResponseTime = Array.isArray(calls) && calls.length > 0 ? calls.reduce((s: number, c: PhoneCallLog) => s + (c.callDuration || 0), 0) / calls.length : 0;
    const unreadNotifications = Array.isArray(notifications) ? notifications.filter((n: Notification) => !n.isRead).length : 0;
    return { pendingOperations, completedToday, callsToday, urgentFollowUps, todayTrialsCount, confirmedTrials, conversionRate, averageResponseTime, unreadNotifications, priorityNotifications: 0, overdueTasks: overdueTasks.length, totalTasks: todayTasks.length + overdueTasks.length };
  }, [operations, calls, followUps, todayTrials, notifications, overdueTasks, todayTasks]);

  const quickActions = useMemo(() => [
    { id: "new-walk-in", label: t('frontdesk:quickActions.newWalkIn'), icon: UserPlus, action: () => setLocation("/frontdesk/walk-in-intake"), category: "walk_in", description: t('frontdesk:quickActions.registerNewWalkInVisitor'), shortcut: "Ctrl+N" },
    { id: "log-call", label: t('frontdesk:quickActions.logCall'), icon: PhoneCall, action: () => setLocation("/frontdesk/call-logging"), category: "call", description: t('frontdesk:quickActions.logPhoneCallInteraction'), shortcut: "Ctrl+C" },
    { id: "sms-templates", label: t('frontdesk:quickActions.sendSMS'), icon: MessageSquare, action: () => setLocation("/frontdesk/sms-templates"), category: "sms", description: t('frontdesk:quickActions.manageSmsTemplates') },
    { id: "schedule-trial", label: t('frontdesk:quickActions.scheduleTrial'), icon: Calendar, action: () => setLocation("/frontdesk/trial-scheduling"), category: "trial", description: t('frontdesk:quickActions.scheduleTrialLesson') },
    { id: "create-task", label: t('frontdesk:quickActions.newTask'), icon: Plus, action: () => {}, category: "task", description: t('frontdesk:quickActions.createNewTask') },
    { id: "emergency", label: t('frontdesk:quickActions.emergency'), icon: AlertCircle, action: () => toast({ title: t('frontdesk:quickActions.emergencyContact'), description: t('frontdesk:quickActions.supervisorNotified'), variant: "destructive" }), category: "emergency", description: t('frontdesk:quickActions.emergencySupervisorContact') },
  ], [isRTL, setLocation, toast]);

  const getStatusColor = (s: string) => ({ completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" }[s] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200");
  const getPriorityColor = (p: string) => ({ urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }[p] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200");
  const formatTime = (d: Date | string) => (typeof d === "string" ? new Date(d) : d).toLocaleTimeString(isRTL ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: !isRTL });
  const formatDate = (d: Date | string) => (typeof d === "string" ? new Date(d) : d).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  const markNotificationRead = useMutation({ mutationFn: (id: number) => apiRequest(`/api/front-desk/notifications/${id}/read`, { method: "POST" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/front-desk/notifications"] }) });
  const markAllNotificationsRead = useMutation({ mutationFn: () => apiRequest("/api/front-desk/notifications/mark-all-read", { method: "POST" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/front-desk/notifications"] }) });
  const updateTaskStatus = useMutation({ mutationFn: ({ taskId, status }: { taskId: number; status: string }) => apiRequest(`/api/front-desk/tasks/${taskId}/status`, { method: "PUT", body: JSON.stringify({ status }) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/front-desk/tasks"] }); toast({ title: t('frontdesk:common.success'), description: "Task status updated" }); } });

  const navItems = [{ id: "overview", label: t('frontdesk:navigation.overview'), icon: Home }, { id: "tasks", label: t('frontdesk:navigation.tasks'), icon: ClipboardList }, { id: "followups", label: t('frontdesk:navigation.followUps'), icon: Phone }, { id: "trials", label: t('frontdesk:navigation.trialLessons'), icon: Calendar }, { id: "analytics", label: t('frontdesk:navigation.analytics'), icon: BarChart3 }];

  const analyticsViewData = { totalInteractions: (Array.isArray(operations) ? operations.length : 0) + (Array.isArray(calls) ? calls.length : 0), conversionRate: dashboardStats.conversionRate, averageResponseTime: dashboardStats.averageResponseTime, topPerformers: [], conversionFunnel: [], interactionTrends: [], sourceAttribution: [], channelPerformance: [], timeDistribution: [], outcomeBreakdown: [] };
  const analyticsInteractions = [...(Array.isArray(operations) ? operations.map((op: FrontDeskOperation) => ({ id: op.id, type: "walk_in" as const, customerName: op.visitorName, interactionTime: op.visitedAt, status: op.status, outcome: op.status, urgencyLevel: op.priority || "medium", convertedToLead: op.convertedToLead, convertedToStudent: op.convertedToStudent })) : []), ...(Array.isArray(calls) ? calls.map((c: PhoneCallLog) => ({ id: c.id, type: "phone_call" as const, customerName: c.callerName, interactionTime: c.callTime, status: c.callResult, outcome: c.callResult, urgencyLevel: c.urgencyLevel, convertedToLead: false, convertedToStudent: false })) : [])];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="front-desk-dashboard">
      {/* Sticky Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4"><div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('frontdesk:dashboard.title')}</h1><p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(currentTime)} - {user?.firstName} {user?.lastName}</p></div></div>
            <div className="hidden md:block flex-1 max-w-lg mx-8"><div className="relative"><Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><Input id="search-input" type="text" placeholder={t('frontdesk:common.search')} className="ps-10 bg-gray-100 dark:bg-gray-700 border-0" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => i18n.changeLanguage(i18n.language === 'fa' ? 'en' : 'fa')} className="hidden sm:flex"><Languages className="h-4 w-4" /><span className="ms-2">{i18n.language === 'fa' ? "EN" : "فا"}</span></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><Zap className="h-4 w-4" /><span className="hidden sm:inline ms-2">{t('frontdesk:quickActions.title')}</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel>{t('frontdesk:quickActions.title')}</DropdownMenuLabel><DropdownMenuSeparator />
                  {quickActions.slice(0, 4).map(action => { const Icon = action.icon; return <DropdownMenuItem key={action.id} onClick={action.action} className="flex items-center space-x-2"><Icon className="h-4 w-4" /><div className="flex-1"><div className="font-medium">{action.label}</div><div className="text-xs text-gray-500">{action.description}</div></div>{action.shortcut && <kbd className="text-xs bg-gray-100 px-1 rounded">{action.shortcut}</kbd>}</DropdownMenuItem>; })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
                <SheetTrigger asChild><Button variant="ghost" size="sm" className="relative"><Bell className="h-4 w-4" />{dashboardStats.unreadNotifications > 0 && <Badge className="absolute -top-1 -end-1 h-5 w-5 p-0 text-xs bg-red-500">{dashboardStats.unreadNotifications > 99 ? "99+" : dashboardStats.unreadNotifications}</Badge>}</Button></SheetTrigger>
                <SheetContent className="w-96"><SheetHeader><div className="flex items-center justify-between"><SheetTitle>{t('frontdesk:notifications.title')}</SheetTitle>{dashboardStats.unreadNotifications > 0 && <Button variant="ghost" size="sm" onClick={() => markAllNotificationsRead.mutate()}>{isRTL ? "همه را خوانده علامت‌گذاری کن" : "Mark all read"}</Button>}</div></SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-4"><div className="space-y-3">
                    {Array.isArray(notifications) && notifications.map((n: Notification) => (
                      <Card key={n.id} className={cn("p-3 cursor-pointer transition-colors", !n.isRead && "bg-blue-50 dark:bg-blue-950 border-blue-200")} onClick={() => markNotificationRead.mutate(n.id)}>
                        <div className="flex items-start space-x-3"><div className={cn("w-2 h-2 rounded-full mt-2", n.type === "error" && "bg-red-500", n.type === "warning" && "bg-yellow-500", n.type === "success" && "bg-green-500", n.type === "info" && "bg-blue-500")} />
                          <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><h4 className="font-medium text-sm">{n.title}</h4><span className="text-xs text-gray-500">{formatDistanceToNow(parseISO(n.timestamp), { addSuffix: true })}</span></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {notifications.length === 0 && <div className="text-center py-8 text-gray-500"><Bell className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{t('frontdesk:emptyStates.noNotifications')}</p></div>}
                  </div></ScrollArea>
                </SheetContent>
              </Sheet>
              <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Sidebar Nav */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden lg:block"><nav className="mt-4 px-4"><div className="space-y-1">
            {navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setSelectedView(item.id as ViewType)} className={cn("w-full flex items-center px-3 py-2 text-sm font-medium rounded-md", selectedView === item.id ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700")}><Icon className="me-3 h-5 w-5" />{item.label}</button>; })}</div></nav>
          </div>
          {/* Main Area */}
          <div className="flex-1 overflow-y-auto"><div className="p-6">
            {selectedView === "overview" && <DashboardOverview dashboardStats={dashboardStats} operations={operations} performanceMetrics={performanceMetrics} setSelectedView={setSelectedView} setSelectedCustomer={setSelectedCustomer} formatTime={formatTime} getStatusColor={getStatusColor} />}
            {selectedView === "tasks" && <TasksView todayTasks={todayTasks} overdueTasks={overdueTasks} taskFilter={taskFilter} setTaskFilter={setTaskFilter} updateTaskStatus={updateTaskStatus} dashboardStats={dashboardStats} quickActions={quickActions} formatDate={formatDate} getPriorityColor={getPriorityColor} />}
            {selectedView === "followups" && <FollowUpsView followUps={followUps} followUpFilter={followUpFilter} setFollowUpFilter={setFollowUpFilter} dashboardStats={dashboardStats} formatDate={formatDate} getPriorityColor={getPriorityColor} />}
            {selectedView === "trials" && <TrialsView todayTrials={todayTrials} dashboardStats={dashboardStats} formatTime={formatTime} getStatusColor={getStatusColor} />}
            {selectedView === "analytics" && (
              <div className="space-y-6"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">{t('frontdesk:views.analyticsAndReports')}</h2><p className="text-gray-600 dark:text-gray-400">{t('frontdesk:views.performanceAnalysis')}</p></div><div className="flex items-center gap-2"><Button variant="outline"><Download className="h-4 w-4 me-2" />{t('frontdesk:views.exportReport')}</Button><Button variant="outline"><Printer className="h-4 w-4 me-2" />{t('frontdesk:views.print')}</Button></div></div>
                <AnalyticsView analytics={analyticsViewData} interactions={analyticsInteractions} loading={operationsLoading || callsLoading} dateRange={{ from: startOfDay(new Date()), to: endOfDay(new Date()) }} />
              </div>
            )}
          </div></div>
        </div>
      </div>

      {selectedCustomer && <CustomerDetailSidebar customerKey={selectedCustomer} interactions={customerInteractions} onClose={() => setSelectedCustomer(null)} onInteractionSelect={(i) => console.log("Selected interaction:", i)} />}
    </div>
  );
}
