import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  User, 
  Calendar, 
  Clock, 
  Star, 
  GraduationCap, 
  Languages, 
  Users, 
  Target,
  Zap,
  Settings,
  AlertCircle,
  CheckCircle,
  Brain,
  BarChart3,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  specializations: string[];
  languageExpertise: string[];
  experience: number;
  rating?: number;
  totalStudents?: number;
  totalTrialLessons?: number;
  trialConversionRate?: number;
  averageStudentSatisfaction?: number;
  preferredStudentTypes?: string[];
  teachingMethods?: string[];
  maxDailyLessons: number;
  currentWorkload: number;
  isAvailable: boolean;
  availabilityScore: number;
  expertiseMatch: number;
  workloadBalance: number;
  performanceScore: number;
  lastAssigned?: string;
}

interface AssignmentRule {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
  description: string;
}

interface TrialLessonRequest {
  id?: number;
  studentName: string;
  targetLanguage: string;
  currentLevel: string;
  lessonType: string;
  scheduledDate: string;
  scheduledTime: string;
  genderPreference?: string;
  specialRequests?: string;
  priority: number;
}

interface TeacherAssignmentSystemProps {
  className?: string;
}

export function TeacherAssignmentSystem({ className }: TeacherAssignmentSystemProps) {
  const [selectedRequest, setSelectedRequest] = useState<TrialLessonRequest | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string>("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending assignment requests
  const { data: assignmentRequests = [], isLoading: requestsLoading } = useQuery<TrialLessonRequest[]>({
    queryKey: ['/api/trial-lessons/assignment-requests'],
    queryFn: async () => {
      const response = await fetch('/api/trial-lessons?status=pending&assignment=null');
      const data = await response.json();
      return data.lessons || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch available teachers with assignment scores
  const { data: teachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/assignment-ready', filterLanguage, filterAvailability],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterLanguage) params.append('language', filterLanguage);
      if (filterAvailability !== 'all') params.append('availability', filterAvailability);
      params.append('includeScores', 'true');
      
      const response = await fetch(`/api/teachers/assignment-ready?${params}`);
      return response.json();
    }
  });

  // Fetch assignment rules
  const { data: assignmentRules = [], isLoading: rulesLoading } = useQuery<AssignmentRule[]>({
    queryKey: ['/api/trial-lessons/assignment-rules'],
    queryFn: async () => {
      const response = await fetch('/api/trial-lessons/assignment-rules');
      return response.json();
    }
  });

  // Auto-assign teacher mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest(`/api/trial-lessons/auto-assign/${requestId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Teacher assigned automatically",
        description: `${data.teacherName} has been assigned to the trial lesson.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
    },
    onError: (error: any) => {
      toast({
        title: "Auto-assignment failed",
        description: error.message || "Could not auto-assign teacher.",
        variant: "destructive"
      });
    }
  });

  // Manual assign teacher mutation
  const manualAssignMutation = useMutation({
    mutationFn: async ({ requestId, teacherId }: { requestId: number; teacherId: number }) => {
      return apiRequest(`/api/trial-lessons/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedTeacherId: teacherId })
      });
    },
    onSuccess: () => {
      toast({
        title: "Teacher assigned successfully",
        description: "Manual teacher assignment completed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      setAssignmentDialogOpen(false);
      setSelectedRequest(null);
      setSelectedTeacher(null);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Could not assign teacher.",
        variant: "destructive"
      });
    }
  });

  // Update assignment rules mutation
  const updateRulesMutation = useMutation({
    mutationFn: async (rules: AssignmentRule[]) => {
      return apiRequest('/api/trial-lessons/assignment-rules', {
        method: 'PUT',
        body: JSON.stringify(rules)
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment rules updated",
        description: "Teacher assignment preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons/assignment-rules'] });
      setRulesDialogOpen(false);
    }
  });

  // Calculate overall assignment score
  const calculateOverallScore = (teacher: Teacher) => {
    const { availabilityScore, expertiseMatch, workloadBalance, performanceScore } = teacher;
    const rules = assignmentRules.filter(rule => rule.enabled);
    
    let totalScore = 0;
    let totalWeight = 0;

    rules.forEach(rule => {
      let score = 0;
      switch (rule.id) {
        case 'availability':
          score = availabilityScore;
          break;
        case 'expertise':
          score = expertiseMatch;
          break;
        case 'workload':
          score = workloadBalance;
          break;
        case 'performance':
          score = performanceScore;
          break;
      }
      totalScore += score * rule.weight;
      totalWeight += rule.weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Handle auto-assign
  const handleAutoAssign = (request: TrialLessonRequest) => {
    if (request.id) {
      autoAssignMutation.mutate(request.id);
    }
  };

  // Handle manual assignment
  const handleManualAssign = (request: TrialLessonRequest) => {
    setSelectedRequest(request);
    setAssignmentDialogOpen(true);
  };

  // Confirm manual assignment
  const confirmManualAssignment = () => {
    if (selectedRequest?.id && selectedTeacher) {
      manualAssignMutation.mutate({
        requestId: selectedRequest.id,
        teacherId: selectedTeacher.id
      });
    }
  };

  // Filter teachers based on current criteria
  const filteredTeachers = teachers.filter(teacher => {
    if (filterLanguage && !teacher.languageExpertise.includes(filterLanguage)) {
      return false;
    }
    if (filterAvailability === 'available' && !teacher.isAvailable) {
      return false;
    }
    if (filterAvailability === 'overloaded' && teacher.currentWorkload < teacher.maxDailyLessons * 0.8) {
      return false;
    }
    return true;
  });

  // Sort teachers by overall score
  const sortedTeachers = filteredTeachers
    .map(teacher => ({ ...teacher, overallScore: calculateOverallScore(teacher) }))
    .sort((a, b) => b.overallScore - a.overallScore);

  if (requestsLoading || teachersLoading) {
    return (
      <div className="space-y-4" data-testid="assignment-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teacher-assignment-system">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Teacher Assignment System</h2>
          <p className="text-muted-foreground">
            Automated and manual teacher assignment for trial lessons
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoAssignEnabled}
              onCheckedChange={setAutoAssignEnabled}
              data-testid="auto-assign-toggle"
            />
            <Label>Auto-assign</Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRulesDialogOpen(true)}
            data-testid="configure-rules"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Rules
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending-assignments">
              {assignmentRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting teacher assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-available-teachers">
              {teachers.filter(t => t.isAvailable).length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-assigned Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-auto-assigned">
              12
            </div>
            <p className="text-xs text-muted-foreground">Automatic assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Success</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-success-rate">
              94%
            </div>
            <p className="text-xs text-muted-foreground">Success rate today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignment Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Assignment Requests</CardTitle>
                <CardDescription>Trial lessons needing teacher assignment</CardDescription>
              </div>
              <Badge variant="secondary">
                {assignmentRequests.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {assignmentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  All trial lessons have been assigned!
                </div>
              ) : (
                <div className="space-y-3">
                  {assignmentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      data-testid={`assignment-request-${request.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{request.studentName}</h4>
                          <Badge className="capitalize">
                            {request.targetLanguage}
                          </Badge>
                          <Badge variant="outline">
                            {request.currentLevel}
                          </Badge>
                          {request.priority > 1 && (
                            <Badge className="bg-red-100 text-red-800">
                              Priority
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>
                            {format(new Date(request.scheduledDate), 'MMM dd, yyyy')} at {request.scheduledTime}
                          </p>
                          <p className="capitalize">{request.lessonType} lesson</p>
                          {request.genderPreference && request.genderPreference !== 'any' && (
                            <p>Prefers {request.genderPreference} teacher</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {autoAssignEnabled ? (
                          <Button
                            size="sm"
                            onClick={() => handleAutoAssign(request)}
                            disabled={autoAssignMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                            data-testid={`auto-assign-${request.id}`}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Auto Assign
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManualAssign(request)}
                            data-testid={`manual-assign-${request.id}`}
                          >
                            <User className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Teacher Availability & Scores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Teacher Availability & Scores</CardTitle>
                <CardDescription>Ranked by assignment compatibility</CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="persian">Persian</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="overloaded">Overloaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {sortedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`p-4 border rounded-lg ${
                      selectedTeacher?.id === teacher.id ? 'border-blue-500 bg-blue-50' : ''
                    } ${teacher.isAvailable ? '' : 'opacity-60'}`}
                    data-testid={`teacher-card-${teacher.id}`}
                  >
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.profilePhoto} />
                        <AvatarFallback>
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold truncate">{teacher.name}</h4>
                          <div className="flex items-center space-x-2">
                            <div className={`text-lg font-bold ${getScoreColor(teacher.overallScore)}`}>
                              {teacher.overallScore}
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                        </div>
                        
                        <div className="mt-1 space-y-2">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{teacher.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <GraduationCap className="h-3 w-3" />
                              <span>{teacher.experience}y</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{teacher.totalStudents || 0}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {teacher.languageExpertise.slice(0, 3).map(lang => (
                              <Badge key={lang} variant="secondary" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                            {teacher.languageExpertise.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{teacher.languageExpertise.length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Workload</span>
                              <span>{teacher.currentWorkload}/{teacher.maxDailyLessons}</span>
                            </div>
                            <Progress 
                              value={(teacher.currentWorkload / teacher.maxDailyLessons) * 100}
                              className="h-1"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <Badge className={teacher.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {teacher.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            {teacher.lastAssigned && (
                              <span className="text-gray-500">
                                Last assigned: {format(new Date(teacher.lastAssigned), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Manual Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Teacher Manually</DialogTitle>
            <DialogDescription>
              Select a teacher for {selectedRequest?.studentName}'s {selectedRequest?.targetLanguage} trial lesson
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Request Details */}
            {selectedRequest && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Student:</strong> {selectedRequest.studentName}
                    </div>
                    <div>
                      <strong>Language:</strong> {selectedRequest.targetLanguage}
                    </div>
                    <div>
                      <strong>Level:</strong> {selectedRequest.currentLevel}
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedRequest.lessonType}
                    </div>
                    <div>
                      <strong>Date:</strong> {format(new Date(selectedRequest.scheduledDate), 'MMM dd, yyyy')}
                    </div>
                    <div>
                      <strong>Time:</strong> {selectedRequest.scheduledTime}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Teacher Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {sortedTeachers.filter(t => t.isAvailable).map((teacher) => (
                <Card
                  key={teacher.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTeacher?.id === teacher.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTeacher(teacher)}
                  data-testid={`select-teacher-${teacher.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={teacher.profilePhoto} />
                        <AvatarFallback>
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{teacher.name}</h4>
                          <div className={`text-sm font-bold ${getScoreColor(teacher.overallScore)}`}>
                            {teacher.overallScore}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{teacher.rating?.toFixed(1) || 'N/A'}</span>
                            <span>•</span>
                            <span>{teacher.experience}y exp</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {teacher.languageExpertise.slice(0, 2).map(lang => (
                              <Badge key={lang} variant="secondary" className="text-xs px-1 py-0">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setAssignmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmManualAssignment}
              disabled={!selectedTeacher || manualAssignMutation.isPending}
            >
              {manualAssignMutation.isPending ? "Assigning..." : "Assign Teacher"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Rules Dialog */}
      <Dialog open={rulesDialogOpen} onOpenChange={setRulesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Rules Configuration</DialogTitle>
            <DialogDescription>
              Configure the weighting and priorities for automatic teacher assignment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {assignmentRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => {
                        const updatedRules = assignmentRules.map(r => 
                          r.id === rule.id ? { ...r, enabled } : r
                        );
                        updateRulesMutation.mutate(updatedRules);
                      }}
                    />
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`weight-${rule.id}`} className="text-sm">
                    Weight:
                  </Label>
                  <Input
                    id={`weight-${rule.id}`}
                    type="number"
                    min="0"
                    max="100"
                    value={rule.weight}
                    onChange={(e) => {
                      const updatedRules = assignmentRules.map(r => 
                        r.id === rule.id ? { ...r, weight: Number(e.target.value) } : r
                      );
                      updateRulesMutation.mutate(updatedRules);
                    }}
                    className="w-16"
                    disabled={!rule.enabled}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setRulesDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}