import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Eye, Edit3, MessageCircle, Mail, CalendarIcon, Clock, Users, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StudentRow } from "@/components/admin/StudentListRow";

interface StudentCardProps {
  student: StudentRow;
  onVoIPCall: (student: StudentRow) => void;
  onEdit: (student: StudentRow) => void;
  onContact: (student: StudentRow) => void;
  getStatusColor: (status: string) => string;
  getLevelColor: (level: string) => string;
}

export function StudentCard({
  student,
  onVoIPCall,
  onEdit,
  onContact,
  getStatusColor,
  getLevelColor,
}: StudentCardProps) {
  const { t } = useTranslation(["admin"]);

  return (
    <Card className="hover:shadow-xl transition-all duration-200 overflow-hidden border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg flex-shrink-0 ${student.profileImage ? "hidden" : ""}`}
            >
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base lg:text-lg leading-tight truncate font-semibold">
                {student.firstName} {student.lastName}
              </CardTitle>
              <p className="text-xs text-gray-500 truncate mt-0.5">{student.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`${getStatusColor(student.status)} text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}>
              <span className="hidden sm:inline">{student.status}</span>
              <span className="sm:hidden text-xs font-bold">{student.status === "active" ? "A" : "I"}</span>
            </Badge>
            <Badge className={`${getLevelColor(student.level)} text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}>
              <span className="hidden sm:inline">{student.level}</span>
              <span className="sm:hidden text-xs">{student.level[0]}</span>
            </Badge>
            {student.sub_level_code && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-indigo-300 text-indigo-700 bg-indigo-50">
                {student.sub_level_code}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Progress</span>
            <span className="font-semibold text-gray-800">{student.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Attendance:</span>
            <span className="text-xs font-bold text-green-600">{student.attendance}%</span>
          </div>
          <div className="text-xs text-gray-500">{student.lastActivity}</div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">Courses:</p>
          <div className="flex flex-wrap gap-1">
            {student.courses && student.courses.length > 0 ? (
              <>
                {student.courses.slice(0, 1).map((course: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5 max-w-full border-blue-200 text-blue-700">
                    <span className="truncate max-w-[120px] sm:max-w-full">{course}</span>
                  </Badge>
                ))}
                {student.courses.length > 1 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600">
                    +{student.courses.length - 1}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-gray-400 text-xs">No courses</span>
            )}
          </div>
        </div>

        <div className="flex gap-1 sm:gap-2 pt-2 sm:pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVoIPCall(student)}
            disabled={!student.phone}
            className="flex-1 h-7 sm:h-8 border-green-200 hover:bg-green-50 text-xs sm:text-sm px-2 sm:px-3 disabled:opacity-50"
            title={!student.phone ? "No phone number available" : `Call ${student.firstName} ${student.lastName}`}
          >
            <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline sm:ms-1">{t("admin:students.call")}</span>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-8 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-3">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline sm:ms-1">{t("admin:students.view")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Student Profile: {student.firstName} {student.lastName}
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{student.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span>Enrolled: {student.enrollmentDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Last Active: {student.lastActivity}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Guardian Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{student.guardian}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{student.guardianPhone}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <MessageCircle className="h-4 w-4 me-2" />
                          Contact Guardian
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="academic" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Current Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={`${getLevelColor(student.level)} text-lg p-2`}>{student.level}</Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Attendance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{student.attendance}%</div>
                        <p className="text-sm text-gray-600">Last 30 days</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{student.progress}%</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="communication" className="space-y-4">
                  <p className="text-gray-500">Communication history and tools</p>
                </TabsContent>
                <TabsContent value="reports" className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">Monthly Progress Report</p>
                            <p className="text-sm text-gray-600">Generated recently</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 me-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 sm:h-8 border-purple-200 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => onEdit(student)}
          >
            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline sm:ms-1">{t("admin:students.edit")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 sm:h-8 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => onContact(student)}
          >
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline sm:ms-1">Contact</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
