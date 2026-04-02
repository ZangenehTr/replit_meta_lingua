import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Plus, Edit, MoreHorizontal, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ElementType } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

interface FrontDeskTask { id: number; title: string; description: string; taskType: string; status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"; priority: "low" | "medium" | "high" | "urgent"; dueDate: string; assignedTo: number; contactName?: string; tags: string[]; }

interface QuickAction { id: string; label: string; icon: ElementType; action: () => void; category: string; description?: string; shortcut?: string; }

interface UpdateTaskStatusVars { taskId: number; status: string; }

interface Props { todayTasks: FrontDeskTask[]; overdueTasks: FrontDeskTask[]; taskFilter: "all" | "pending" | "overdue" | "completed"; setTaskFilter: (v: "all" | "pending" | "overdue" | "completed") => void; updateTaskStatus: UseMutationResult<unknown, Error, UpdateTaskStatusVars>; dashboardStats: { totalTasks: number; overdueTasks: number; }; quickActions: QuickAction[]; formatDate: (d: Date | string) => string; getPriorityColor: (p: string) => string; }

export function TasksView({ todayTasks, overdueTasks, taskFilter, setTaskFilter, updateTaskStatus, dashboardStats, quickActions, formatDate, getPriorityColor }: Props) {
  const { t } = useTranslation(['frontdesk']);

  const filteredTasks = todayTasks.filter((task) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "overdue") return overdueTasks.some(o => o.id === task.id);
    return task.status === taskFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">{t('frontdesk:views.taskManagement')}</h2><p className="text-gray-600 dark:text-gray-400">{t('frontdesk:views.manageDailyTasks')}</p></div>
        <div className="flex items-center gap-2">
          <Select value={taskFilter} onValueChange={(v) => setTaskFilter(v as "all" | "pending" | "overdue" | "completed")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('frontdesk:common.all')}</SelectItem>
              <SelectItem value="pending">{t('frontdesk:tasks.pending')}</SelectItem>
              <SelectItem value="overdue">{t('frontdesk:tasks.overdue')}</SelectItem>
              <SelectItem value="completed">{t('frontdesk:tasks.completed')}</SelectItem>
            </SelectContent>
          </Select>
          <Button><Plus className="h-4 w-4 me-2" />{t('frontdesk:tasks.newTask')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card><CardHeader><CardTitle>{t('frontdesk:tasks.todaysTasks')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" checked={task.status === "completed"} onChange={() => updateTaskStatus.mutate({ taskId: task.id, status: task.status === "completed" ? "pending" : "completed" })} className="w-4 h-4 text-blue-600 rounded" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn("font-medium", task.status === "completed" && "line-through text-gray-500")}>{task.title}</h4>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">{task.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        {task.contactName && <p className="text-xs text-gray-500 mt-1">{t('frontdesk:tasks.contact')}: {task.contactName}</p>}
                        <p className="text-xs text-gray-500 mt-1">{t('frontdesk:tasks.due')}: {formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>{t('frontdesk:common.edit')}</DropdownMenuItem>
                          <DropdownMenuItem>{t('frontdesk:tasks.reassign')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">{t('frontdesk:common.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && <div className="text-center py-8 text-gray-500"><ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{t('frontdesk:emptyStates.noTasksFound')}</p></div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle>{t('frontdesk:tasks.taskSummary')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm">{t('frontdesk:tasks.totalTasks')}</span><span className="font-bold text-lg">{dashboardStats.totalTasks}</span></div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>{t('frontdesk:tasks.completed')}</span><span className="text-green-600 font-medium">{dashboardStats.totalTasks - dashboardStats.overdueTasks}</span></div>
                <div className="flex justify-between text-sm"><span>{t('frontdesk:tasks.overdue')}</span><span className="text-red-600 font-medium">{dashboardStats.overdueTasks}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>{t('frontdesk:quickActions.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quickActions.filter(a => a.category === "task").map(action => { const Icon = action.icon; return <Button key={action.id} variant="outline" className="w-full justify-start" onClick={action.action}><Icon className="h-4 w-4 me-2" />{action.label}</Button>; })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
