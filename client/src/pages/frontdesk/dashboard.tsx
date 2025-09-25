import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Phone, 
  ClipboardList, 
  UserPlus, 
  PhoneCall,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface FrontDeskOperation {
  id: number;
  visitorName: string;
  visitType: string;
  purpose: string;
  status: string;
  visitedAt: string;
  handledBy: number;
  convertedToLead?: boolean;
  completedAt?: string;
}

interface PhoneCallLog {
  id: number;
  callerName: string;
  callerPhone: string;
  callType: string;
  callResult: string;
  callTime: string;
  duration?: number;
  handledBy: number;
}

interface FrontDeskTask {
  id: number;
  title: string;
  description: string;
  taskType: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: number;
  createdBy: number;
  contactName?: string;
  contactPhone?: string;
}

export default function FrontDeskDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('operations');

  // Fetch front desk operations
  const { data: operations = [], isLoading: operationsLoading, refetch: refetchOperations } = useQuery({
    queryKey: ['/api/front-desk/operations'],
    queryFn: () => fetch('/api/front-desk/operations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json())
  });

  // Fetch phone call logs
  const { data: calls = [], isLoading: callsLoading, refetch: refetchCalls } = useQuery({
    queryKey: ['/api/front-desk/calls'],
    queryFn: () => fetch('/api/front-desk/calls', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json())
  });

  // Fetch today's tasks
  const { data: todayTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/front-desk/tasks/today'],
    queryFn: () => fetch('/api/front-desk/tasks/today', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json())
  });

  // Fetch overdue tasks
  const { data: overdueTasks = [], refetch: refetchOverdue } = useQuery({
    queryKey: ['/api/front-desk/tasks/overdue'],
    queryFn: () => fetch('/api/front-desk/tasks/overdue', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }).then(res => res.json())
  });

  // Calculate stats
  const pendingOperations = operations.filter((op: FrontDeskOperation) => 
    op.status === 'pending' || op.status === 'in_progress'
  ).length;
  
  const completedToday = operations.filter((op: FrontDeskOperation) => 
    op.status === 'completed' && 
    new Date(op.completedAt || '').toDateString() === new Date().toDateString()
  ).length;

  const callsToday = calls.filter((call: PhoneCallLog) => 
    new Date(call.callTime).toDateString() === new Date().toDateString()
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="front-desk-dashboard">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Front Desk Dashboard</h1>
          <p className="text-gray-600">Manage walk-ins, phone calls, and tasks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Operations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-operations">
              {pendingOperations}
            </div>
            <p className="text-xs text-muted-foreground">
              Walk-ins needing attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-completed-today">
              {completedToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Operations completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-calls-today">
              {callsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Phone calls handled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-overdue-tasks">
              {overdueTasks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations" data-testid="tab-operations">Walk-in Operations</TabsTrigger>
          <TabsTrigger value="calls" data-testid="tab-calls">Phone Calls</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
        </TabsList>

        {/* Walk-in Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Walk-in Operations</CardTitle>
                  <CardDescription>Track and manage visitor inquiries</CardDescription>
                </div>
                <Button data-testid="btn-new-operation">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Walk-in
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {operationsLoading ? (
                <div className="text-center py-8">Loading operations...</div>
              ) : operations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No operations recorded yet</div>
              ) : (
                <div className="space-y-4">
                  {operations.slice(0, 10).map((operation: FrontDeskOperation) => (
                    <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`operation-${operation.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{operation.visitorName}</h3>
                          <Badge className={getStatusColor(operation.status)}>
                            {operation.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{operation.visitType}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{operation.purpose}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(operation.visitedAt).toLocaleDateString()} at {new Date(operation.visitedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" data-testid={`btn-view-operation-${operation.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {operation.status !== 'completed' && (
                          <Button variant="outline" size="sm" data-testid={`btn-edit-operation-${operation.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phone Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Phone Calls</CardTitle>
                  <CardDescription>Log and track phone interactions</CardDescription>
                </div>
                <Button data-testid="btn-new-call">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="text-center py-8">Loading calls...</div>
              ) : calls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No calls logged yet</div>
              ) : (
                <div className="space-y-4">
                  {calls.slice(0, 10).map((call: PhoneCallLog) => (
                    <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`call-${call.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{call.callerName}</h3>
                          <Badge variant="outline">{call.callType}</Badge>
                          <Badge className={call.callResult === 'successful' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {call.callResult}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{call.callerPhone}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(call.callTime).toLocaleDateString()} at {new Date(call.callTime).toLocaleTimeString()}
                          {call.duration && ` • ${call.duration}s`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" data-testid={`btn-view-call-${call.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Tasks</CardTitle>
                    <CardDescription>Tasks due today</CardDescription>
                  </div>
                  <Button data-testid="btn-new-task">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="text-center py-4">Loading tasks...</div>
                ) : todayTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No tasks for today</div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map((task: FrontDeskTask) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`task-${task.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)} variant="secondary">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          {task.contactName && (
                            <p className="text-xs text-gray-500 mt-1">Contact: {task.contactName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`btn-complete-task-${task.id}`}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Overdue Tasks</CardTitle>
                <CardDescription>Tasks past their due date</CardDescription>
              </CardHeader>
              <CardContent>
                {overdueTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No overdue tasks</div>
                ) : (
                  <div className="space-y-3">
                    {overdueTasks.map((task: FrontDeskTask) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50" data-testid={`overdue-task-${task.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-red-800">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)} variant="secondary">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-red-700 mt-1">{task.description}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="border-red-200" data-testid={`btn-complete-overdue-task-${task.id}`}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}