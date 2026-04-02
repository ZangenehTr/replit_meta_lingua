import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, UserCheck, UserMinus, AlertCircle, MessageSquare, Eye } from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  reason: string;
  lastObservation?: string;
  rating?: number;
}

interface Student {
  id: number;
  name: string;
  issue: string;
  course: string;
  consecutiveAbsences: number;
  missedHomeworks: number;
  teacher: string;
}

interface TeachersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teachers: Teacher[];
  onScheduleReview: (teacherId: number) => void;
  onSendAlert: (teacher: Teacher) => void;
  isSending: boolean;
}

interface StudentsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: Student[];
  onViewProfile: () => void;
  onSendAlert: (student: Student) => void;
  isSending: boolean;
}

export function TeachersAttentionDialog({ open, onOpenChange, teachers, onScheduleReview, onSendAlert, isSending }: TeachersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserMinus className="h-5 w-5 me-2 text-red-600" />
            Teachers Needing Attention ({teachers?.length || 0})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {teachers?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">All teachers are up to date!</p>
              <p className="text-sm">No teachers currently need attention</p>
            </div>
          ) : teachers?.map((teacher) => (
            <Card key={teacher.id} className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserMinus className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-600">{teacher.reason} • Last observed: {teacher.lastObservation || "Never"}</div>
                      {teacher.rating && <div className="text-xs text-orange-600">Current rating: {teacher.rating}/5.0</div>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onScheduleReview(teacher.id)}>
                      <Calendar className="h-4 w-4 me-1" />Schedule Review
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onSendAlert(teacher)} disabled={isSending}>
                      <MessageSquare className="h-4 w-4 me-1" />SMS Alert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StudentsAttentionDialog({ open, onOpenChange, students, onViewProfile, onSendAlert, isSending }: StudentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 me-2 text-amber-600" />
            Students Needing Attention ({students?.length || 0})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {students?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">All students are doing well!</p>
              <p className="text-sm">No students currently need attention</p>
            </div>
          ) : students?.map((student) => (
            <Card key={student.id} className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{student.issue} issue • {student.course}</div>
                      {student.consecutiveAbsences > 0 && <div className="text-xs text-red-600">{student.consecutiveAbsences} consecutive absences</div>}
                      {student.missedHomeworks > 0 && <div className="text-xs text-orange-600">{student.missedHomeworks} missed homeworks</div>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onViewProfile(); }}>
                      <Eye className="h-4 w-4 me-1" />View Profile
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onSendAlert(student)} disabled={isSending}>
                      <MessageSquare className="h-4 w-4 me-1" />SMS Alert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
