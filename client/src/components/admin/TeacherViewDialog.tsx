import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TeacherRecord } from "@/hooks/useTeachers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherRecord;
  onEdit: () => void;
}

export function TeacherViewDialog({ open, onOpenChange, teacher, onEdit }: Props) {
  const { t } = useTranslation(["admin"]);

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin:teacherManagement.dialogs.viewTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin:teacherManagement.dialogs.viewDescription", {
              name: `${teacher.firstName} ${teacher.lastName}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-lg font-medium">
                {teacher.firstName} {teacher.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.email")}</label>
              <p>{teacher.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.phone")}</label>
              <p>{teacher.phoneNumber || t("admin:teacherManagement.notSpecified")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.status")}</label>
              <div className="mt-1">
                <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                  {teacher.isActive !== false ? t("admin:teacherManagement.status.active") : t("admin:teacherManagement.status.inactive")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.specialization")}</label>
              <p>{teacher.specialization || t("admin:teacherManagement.notSpecified")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.experience")}</label>
              <p>{teacher.experience || t("admin:teacherManagement.notSpecified")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.hourlyRate")}</label>
              <p className="text-lg font-medium">
                {new Intl.NumberFormat("fa-IR").format(teacher.hourlyRate || 500000)} تومان/ساعت
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.languages")}</label>
              <p>{teacher.languages || t("admin:teacherManagement.notSpecified")}</p>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.qualifications")}</label>
              <p className="mt-1 text-sm">{teacher.qualifications || t("admin:teacherManagement.notSpecified")}</p>
            </div>
            {teacher.bio && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.biography")}</label>
                <p className="mt-1 text-sm">{teacher.bio}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t("admin:teacherManagement.labels.memberSince")}</label>
              <p className="text-sm">{new Date(teacher.createdAt).toLocaleDateString("fa-IR")}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("admin:teacherManagement.actions.close")}
          </Button>
          <Button onClick={onEdit}>
            <Edit3 className="h-4 w-4 me-2" />
            {t("admin:teacherManagement.actions.editTeacher")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
