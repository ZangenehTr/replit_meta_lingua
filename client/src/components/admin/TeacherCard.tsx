import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit3, Camera, Video, VideoOff, Mail, Phone, BookOpen, Calendar, Clock, Star, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TeacherRecord } from "@/hooks/useTeachers";

interface Props {
  teacher: TeacherRecord;
  callernTeachers: TeacherRecord[];
  onView: (teacher: TeacherRecord) => void;
  onEdit: (teacher: TeacherRecord) => void;
  onCallernToggle: (teacher: TeacherRecord) => void;
  onPhotoUpload: (teacher: TeacherRecord) => void;
  isCallernAuthorized: (teacherId: number) => boolean;
}

export function TeacherCard({ teacher, callernTeachers, onView, onEdit, onCallernToggle, onPhotoUpload, isCallernAuthorized }: Props) {
  const { t } = useTranslation(["admin"]);
  const authorized = isCallernAuthorized(teacher.id);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <img
                  src={`/uploads/teacher-photos/${teacher.id}.jpg`}
                  alt={`${teacher.firstName} ${teacher.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                  }}
                />
                <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                  <User className="h-8 w-8" />
                </div>
              </div>
              <Button
                size="sm"
                className="absolute -bottom-1 -end-1 h-6 w-6 rounded-full p-0"
                onClick={() => onPhotoUpload(teacher)}
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {teacher.firstName} {teacher.lastName}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                  {teacher.isActive !== false ? t("admin:teacherManagement.status.active") : t("admin:teacherManagement.status.inactive")}
                </Badge>
                {authorized && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <Video className="h-3 w-3 me-1" />
                    Callern
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(teacher)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(teacher)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCallernToggle(teacher)}
              title={authorized ? "Revoke Callern Access" : "Grant Callern Access"}
            >
              {authorized ? <VideoOff className="h-4 w-4 text-red-600" /> : <Video className="h-4 w-4 text-green-600" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{teacher.email}</span>
          </div>
          {teacher.phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{teacher.phoneNumber}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t("admin:teacherManagement.labels.specialization")}:</span>
            <span>{teacher.specialization || t("admin:teacherManagement.notSpecified")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t("admin:teacherManagement.labels.experience")}:</span>
            <span>{teacher.experience || t("admin:teacherManagement.notSpecified")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t("admin:teacherManagement.labels.rate")}:</span>
            <span>{new Intl.NumberFormat("fa-IR").format(teacher.hourlyRate || 500000)} تومان/ساعت</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t("admin:teacherManagement.labels.rating")}:</span>
            <span>4.8/5.0</span>
          </div>
        </div>
        {teacher.qualifications && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>{t("admin:teacherManagement.labels.qualifications")}:</strong> {teacher.qualifications}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
