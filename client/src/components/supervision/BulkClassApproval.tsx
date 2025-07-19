import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  MapPin,
  Video,
  CheckSquare,
  Square
} from "lucide-react";

interface TeacherClass {
  id: number;
  title: string;
  courseName: string;
  studentName: string;
  scheduledAt: string;
  duration: number;
  status: string;
  roomName: string;
  deliveryMode: string;
  isObservable: boolean;
  isGroupClass?: boolean;
  sessionIds?: number[];
}

export default function BulkClassApproval() {
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/supervision/teachers'],
    enabled: true
  });

  // Fetch teacher classes when teacher is selected
  const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/supervision/teacher-classes', selectedTeacher],
    enabled: !!selectedTeacher
  });

  // Approve classes mutation
  const approveClassesMutation = useMutation({
    mutationFn: async (data: { teacherId: number; classIds: number[]; approvalNotes: string }) => {
      return apiRequest(`/api/supervision/approve-classes`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Classes Approved Successfully",
        description: `${result.approvedClasses} classes approved for observation. Teacher has been notified via SMS.`,
      });
      
      // Clear selections
      setSelectedClasses([]);
      setApprovalNotes("");
      setApprovalDialogOpen(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/pending-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/scheduled-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/teacher-classes', selectedTeacher] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve classes for observation",
        variant: "destructive",
      });
    },
  });

  const handleTeacherSelect = (teacherId: number) => {
    setSelectedTeacher(teacherId);
    setSelectedClasses([]); // Clear selected classes when changing teacher
  };

  const handleClassSelect = (classId: number, checked: boolean) => {
    setSelectedClasses(prev => 
      checked 
        ? [...prev, classId]
        : prev.filter(id => id !== classId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedClasses(
      checked 
        ? teacherClasses.filter(cls => cls.isObservable).map(cls => cls.id)
        : []
    );
  };

  const handleApproveClasses = () => {
    if (!selectedTeacher || selectedClasses.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a teacher and at least one class to approve",
        variant: "destructive",
      });
      return;
    }

    approveClassesMutation.mutate({
      teacherId: selectedTeacher,
      classIds: selectedClasses,
      approvalNotes: approvalNotes
    });
  };

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);
  const observableClasses = teacherClasses.filter(cls => cls.isObservable);
  const allSelected = observableClasses.length > 0 && selectedClasses.length === observableClasses.length;
  const someSelected = selectedClasses.length > 0 && selectedClasses.length < observableClasses.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Bulk Class Approval for Observation
          </CardTitle>
          <CardDescription>
            Select a teacher and multiple classes to approve for scheduled observations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Teacher Selection and Class List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Teacher
            </CardTitle>
            <CardDescription>
              Choose a teacher to review their classes for bulk approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <div className="text-center py-4">Loading teachers...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teachers.map((teacher: any) => (
                  <div
                    key={teacher.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeacher === teacher.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTeacherSelect(teacher.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        {teacher.specialization && (
                          <p className="text-xs text-gray-500">{teacher.specialization}</p>
                        )}
                      </div>
                      <Badge variant={teacher.isActive ? "default" : "secondary"}>
                        {teacher.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Classes for Approval
            </CardTitle>
            <CardDescription>
              {selectedTeacher 
                ? `Select classes to approve for observation (${selectedClasses.length} selected)` 
                : "Select a teacher to view their classes"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTeacher ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a teacher to view their classes</p>
              </div>
            ) : classesLoading ? (
              <div className="text-center py-4">Loading classes...</div>
            ) : observableClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No observable classes found for this teacher</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Select All Checkbox */}
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className={someSelected ? "data-[state=checked]:bg-blue-500" : ""}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All Observable Classes ({observableClasses.length})
                  </Label>
                </div>

                {/* Class List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {observableClasses.map((classItem: TeacherClass) => (
                    <div
                      key={classItem.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedClasses.includes(classItem.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`class-${classItem.id}`}
                          checked={selectedClasses.includes(classItem.id)}
                          onCheckedChange={(checked) => handleClassSelect(classItem.id, checked as boolean)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{classItem.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{classItem.courseName}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {classItem.studentName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {classItem.duration}min
                            </span>
                            <span className="flex items-center gap-1">
                              {classItem.deliveryMode === 'online' ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              {classItem.roomName}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(classItem.scheduledAt).toLocaleString()}
                            </span>
                            <div className="flex gap-2">
                              <Badge variant={classItem.status === 'scheduled' ? 'default' : 'secondary'}>
                                {classItem.status}
                              </Badge>
                              {classItem.isGroupClass && (
                                <Badge variant="outline">Group Class</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Actions */}
      {selectedClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Approve Selected Classes
            </CardTitle>
            <CardDescription>
              {selectedClasses.length} classes selected for {selectedTeacherData?.firstName} {selectedTeacherData?.lastName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any specific notes or instructions for the observation..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve {selectedClasses.length} Classes
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Class Approval</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p>Are you sure you want to approve {selectedClasses.length} classes for observation?</p>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium">Teacher: {selectedTeacherData?.firstName} {selectedTeacherData?.lastName}</p>
                        <p className="text-sm text-gray-600">Classes: {selectedClasses.length} selected</p>
                        {approvalNotes && (
                          <p className="text-sm text-gray-600 mt-1">Notes: {approvalNotes}</p>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        This will create scheduled observations and send SMS notification to the teacher.
                      </p>
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setApprovalDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApproveClasses}
                          disabled={approveClassesMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {approveClassesMutation.isPending ? "Approving..." : "Confirm Approval"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedClasses([])}
                  disabled={selectedClasses.length === 0}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}