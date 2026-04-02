import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDateInput } from "@/components/ui/simple-date-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { CourseItem, SubLevelItem } from "@/hooks/useStudents";
import type { StudentRow } from "@/components/admin/StudentListRow";

type EditableStudent = StudentRow & { selectedCourses?: number[]; subLevelCode?: string; birthday?: Date | string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStudent: EditableStudent | null;
  setEditingStudent: (student: EditableStudent | null) => void;
  coursesList: CourseItem[];
  subLevels: SubLevelItem[];
  isRTL: boolean;
  onCourseSelection: (courseId: number, selected: boolean) => void;
  onUpdate: () => void;
  onOverrideSubLevel: (args: { studentId: number; subLevelCode: string | null }) => void;
  isUpdating: boolean;
  isOverridingSubLevel: boolean;
}

export function StudentEditDialog({
  open,
  onOpenChange,
  editingStudent,
  setEditingStudent,
  coursesList,
  subLevels,
  isRTL,
  onCourseSelection,
  onUpdate,
  onOverrideSubLevel,
  isUpdating,
  isOverridingSubLevel,
}: Props) {
  const { t } = useTranslation(["admin", "common"]);

  if (!editingStudent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto ${isRTL ? "rtl" : "ltr"}`}>
        <DialogHeader>
          <DialogTitle>{t("admin:students.edit")}</DialogTitle>
          <DialogDescription>{t("admin:students.updateStudentInfo")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="editFirstName">{t("admin:students.firstName")}</Label>
            <Input
              id="editFirstName"
              placeholder={t("admin:students.enterFirstName")}
              value={editingStudent.firstName || ""}
              onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editLastName">{t("admin:students.lastName")}</Label>
            <Input
              id="editLastName"
              placeholder={t("admin:students.enterLastName")}
              value={editingStudent.lastName || ""}
              onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEmail">{t("admin:students.email")}</Label>
            <Input
              id="editEmail"
              type="email"
              placeholder={t("admin:students.enterEmail")}
              value={editingStudent.email || ""}
              onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editPhone">{t("admin:students.phone")}</Label>
            <PhoneInput
              value={editingStudent.phone || ""}
              onChange={(value) => setEditingStudent({ ...editingStudent, phone: value })}
              placeholder={t("admin:students.enterPhone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editNationalId">{t("admin:students.nationalId")}</Label>
            <Input
              id="editNationalId"
              placeholder={t("admin:students.enterNationalId")}
              value={editingStudent.nationalId || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, "");
                setEditingStudent({ ...editingStudent, nationalId: value });
              }}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editLevel">{t("admin:students.level")}</Label>
            <Select value={editingStudent.level || "Beginner"} onValueChange={(value) => setEditingStudent({ ...editingStudent, level: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin:students.selectLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">{t("admin:students.beginner")}</SelectItem>
                <SelectItem value="Intermediate">{t("admin:students.intermediate")}</SelectItem>
                <SelectItem value="Advanced">{t("admin:students.advanced")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editSubLevel">CEFR Sub-Level Override</Label>
            <div className="flex gap-2">
              <Select
                value={editingStudent.subLevelCode || ""}
                onValueChange={(val) => setEditingStudent({ ...editingStudent, subLevelCode: val })}
              >
                <SelectTrigger id="editSubLevel" className="flex-1">
                  <SelectValue placeholder="Select sub-level…" />
                </SelectTrigger>
                <SelectContent>
                  {subLevels.map((sl: SubLevelItem) => (
                    <SelectItem key={sl.id} value={sl.code}>
                      {sl.code} — {sl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!editingStudent?.subLevelCode || isOverridingSubLevel}
                onClick={() => {
                  if (editingStudent?.id && editingStudent?.subLevelCode) {
                    onOverrideSubLevel({ studentId: editingStudent.id, subLevelCode: editingStudent.subLevelCode });
                  }
                }}
                className="whitespace-nowrap"
              >
                {isOverridingSubLevel ? "Saving…" : "Set Level"}
              </Button>
              {editingStudent?.subLevelCode && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isOverridingSubLevel}
                  onClick={() => {
                    if (editingStudent?.id) {
                      onOverrideSubLevel({ studentId: editingStudent.id, subLevelCode: null });
                      setEditingStudent({ ...editingStudent, subLevelCode: "" });
                    }
                  }}
                  className="whitespace-nowrap text-muted-foreground"
                  title="Clear override — level will be re-assigned from next MST result"
                >
                  Auto (MST)
                </Button>
              )}
            </div>
            {editingStudent?.subLevelCode ? (
              <p className="text-xs text-amber-600">This overrides the MST-assigned level for this student.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Level will be automatically derived from MST result.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="editStatus">{t("admin:students.status")}</Label>
            <Select value={editingStudent.status || "active"} onValueChange={(value) => setEditingStudent({ ...editingStudent, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin:students.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("admin:students.active")}</SelectItem>
                <SelectItem value="inactive">{t("admin:students.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editGuardianName">{t("admin:students.guardianName")}</Label>
            <Input
              id="editGuardianName"
              placeholder={t("admin:students.enterGuardian")}
              value={editingStudent.guardianName || ""}
              onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editGuardianPhone">{t("admin:students.guardianPhone")}</Label>
            <PhoneInput
              value={editingStudent.guardianPhone || ""}
              onChange={(value) => setEditingStudent({ ...editingStudent, guardianPhone: value })}
              placeholder={t("admin:students.enterGuardianPhone")}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="editBirthday">{t("admin:students.birthday")}</Label>
            <SimpleDateInput
              value={editingStudent.birthday instanceof Date ? editingStudent.birthday : editingStudent.birthday ? new Date(editingStudent.birthday) : null}
              onChange={(date) => setEditingStudent({ ...editingStudent, birthday: date })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>{t("admin:students.courseEnrollments")}</Label>
            <div className="border rounded-lg p-4 max-h-32 overflow-y-auto">
              {coursesList.map((course: CourseItem) => (
                <div key={course.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-course-${course.id}`}
                      checked={editingStudent.selectedCourses?.includes(course.id) || false}
                      onChange={(e) => onCourseSelection(course.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`edit-course-${course.id}`} className="text-sm font-medium">
                      {course.title}
                    </label>
                  </div>
                  <span className="text-sm text-gray-500">{formatCurrency(course.price || 0, "IRR")}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="editNotes">{t("admin:students.notes")}</Label>
            <Textarea
              id="editNotes"
              placeholder={t("admin:students.additionalNotes")}
              value={editingStudent.notes || ""}
              onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="btn-cancel-edit-student"
          >
            {t("admin:students.cancel")}
          </Button>
          <Button
            onClick={onUpdate}
            disabled={!editingStudent || isUpdating}
            data-testid="btn-save-edit-student"
          >
            {isUpdating ? "Saving..." : t("admin:students.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
