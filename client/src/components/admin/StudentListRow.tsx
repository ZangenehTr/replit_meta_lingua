import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Eye, Edit3, MessageCircle, Mail } from "lucide-react";

export interface StudentRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  progress: number;
  attendance: number;
  lastActivity?: string;
  profileImage?: string;
  courses?: string[];
  level?: string;
  nationalId?: string;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
  birthday?: string | Date | null;
  guardian?: string;
  enrollmentDate?: string;
  sub_level_code?: string;
}

interface Props {
  student: StudentRow;
  onVoIPCall: (student: StudentRow) => void;
  onEdit: (student: StudentRow) => void;
  onContact: (student: StudentRow) => void;
  getStatusColor: (status: string) => string;
}

function StudentProfileDialogContent({ student }: { student: StudentRow }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div>
          <div className="text-lg font-semibold">{student.firstName} {student.lastName}</div>
          <div className="text-gray-500">ID: {student.id}</div>
          {student.level && <div className="text-gray-500">Level: {student.level}</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="font-medium text-gray-700 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</div>
          <div className="text-gray-600">{student.email}</div>
        </div>
        <div>
          <div className="font-medium text-gray-700 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</div>
          <div className="text-gray-600">{student.phone || "—"}</div>
        </div>
        {student.nationalId && (
          <div>
            <div className="font-medium text-gray-700">National ID</div>
            <div className="text-gray-600">{student.nationalId}</div>
          </div>
        )}
        {student.guardianName && (
          <div>
            <div className="font-medium text-gray-700">Guardian</div>
            <div className="text-gray-600">{student.guardianName} {student.guardianPhone ? `(${student.guardianPhone})` : ""}</div>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="font-medium text-gray-700">Progress</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${student.progress}%` }} />
          </div>
          <span className="text-xs font-medium">{student.progress}%</span>
        </div>
        <div className="text-xs text-gray-500">Attendance: {student.attendance}%</div>
      </div>
      {student.courses && student.courses.length > 0 && (
        <div>
          <div className="font-medium text-gray-700 mb-1">Enrolled Courses</div>
          <div className="flex flex-wrap gap-1">
            {student.courses.map((course, i) => (
              <Badge key={i} variant="outline" className="text-xs">{course}</Badge>
            ))}
          </div>
        </div>
      )}
      {student.notes && (
        <div>
          <div className="font-medium text-gray-700">Notes</div>
          <div className="text-gray-600 text-xs">{student.notes}</div>
        </div>
      )}
      <div className="flex justify-between text-xs text-gray-400">
        <Badge className={`text-xs px-2`}>{student.status}</Badge>
        {student.lastActivity && <span>Last active: {student.lastActivity}</span>}
      </div>
    </div>
  );
}

export function StudentListRow({ student, onVoIPCall, onEdit, onContact, getStatusColor }: Props) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-sm border-0 hover:shadow-md transition-all duration-200 lg:grid lg:grid-cols-12 lg:gap-4 lg:rounded-none lg:bg-transparent lg:shadow-none lg:border-b lg:last:border-b-0 lg:hover:bg-gray-50">
      {/* Mobile layout */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-8 h-8 rounded-full object-cover shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${student.profileImage ? "hidden" : ""}`}
            >
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div>
              <div className="font-semibold text-sm">
                {student.firstName} {student.lastName}
              </div>
              <div className="text-xs text-gray-500">{student.email}</div>
            </div>
          </div>
          <Badge className={`${getStatusColor(student.status)} text-xs px-2 py-1`}>{student.status}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold">{student.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${student.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Attendance: {student.attendance}%</span>
            <span className="text-gray-500">{student.lastActivity}</span>
          </div>
        </div>

        <div className="flex gap-1 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVoIPCall(student)}
            disabled={!student.phone}
            className="flex-1 h-7 border-green-200 hover:bg-green-50 text-xs px-2 disabled:opacity-50"
          >
            <Phone className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfile(true)}
            className="flex-1 h-7 border-blue-200 hover:bg-blue-50 text-xs px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(student)}
            className="flex-1 h-7 border-purple-200 hover:bg-purple-50 text-xs px-2"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onContact(student)}
            className="flex-1 h-7 border-orange-200 hover:bg-orange-50 text-xs px-2"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:contents">
        <div className="col-span-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div>
              <div className="font-medium">
                {student.firstName} {student.lastName}
              </div>
              <div className="text-sm text-gray-500">ID: {student.id}</div>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm">
            <div>{student.email}</div>
            <div className="text-gray-500">{student.phone}</div>
          </div>
        </div>
        <div className="col-span-1">
          <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
        </div>
        <div className="col-span-2">
          {student.courses && student.courses.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {student.courses.map((course, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {course}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No active courses</span>
          )}
        </div>
        <div className="col-span-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{student.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${student.progress}%` }} />
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVoIPCall(student)}
              disabled={!student.phone}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              <Phone className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfile(true)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(student)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContact(student)}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile: {student.firstName} {student.lastName}</DialogTitle>
          </DialogHeader>
          <StudentProfileDialogContent student={student} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
