import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleDateInput } from "@/components/ui/simple-date-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Upload } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { CourseItem } from "@/hooks/useStudents";

export interface NewStudentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  birthday: Date | null;
  level: string;
  status: string;
  guardianName: string;
  guardianPhone: string;
  profileImage: File | null;
  notes: string;
  courses: string[];
  selectedCourses: number[];
  totalFee: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newStudentData: NewStudentData;
  setNewStudentData: (data: NewStudentData) => void;
  coursesList: CourseItem[];
  isRTL: boolean;
  onCourseSelection: (courseId: number, selected: boolean) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateStudent: () => void;
  isPending: boolean;
}

export function StudentCreateDialog({
  open,
  onOpenChange,
  newStudentData,
  setNewStudentData,
  coursesList,
  isRTL,
  onCourseSelection,
  onImageUpload,
  onCreateStudent,
  isPending,
}: Props) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto ${isRTL ? "rtl" : "ltr"}`}>
        <DialogHeader>
          <DialogTitle>{t("admin:students.addNewStudent")}</DialogTitle>
          <DialogDescription>{t("admin:students.createProfile")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("admin:students.firstName")}</Label>
            <Input
              id="firstName"
              placeholder={t("admin:students.enterFirstName")}
              value={newStudentData.firstName}
              onChange={(e) => setNewStudentData({ ...newStudentData, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t("admin:students.lastName")}</Label>
            <Input
              id="lastName"
              placeholder={t("admin:students.enterLastName")}
              value={newStudentData.lastName}
              onChange={(e) => setNewStudentData({ ...newStudentData, lastName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("admin:students.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("admin:students.enterEmail")}
              value={newStudentData.email}
              onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("admin:students.phoneNumber")}</Label>
            <PhoneInput
              value={newStudentData.phone}
              onChange={(value) => setNewStudentData({ ...newStudentData, phone: value })}
              placeholder={t("admin:students.enterPhone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">{t("admin:students.nationalId")}</Label>
            <Input
              id="nationalId"
              placeholder={t("admin:students.enterNationalId")}
              value={newStudentData.nationalId}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, "");
                setNewStudentData({ ...newStudentData, nationalId: value });
              }}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">{t("admin:students.birthday")}</Label>
            <SimpleDateInput
              value={newStudentData.birthday}
              onChange={(date) => setNewStudentData({ ...newStudentData, birthday: date })}
              placeholder={t("admin:students.selectBirthday")}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">{t("admin:students.level")}</Label>
            <Select value={newStudentData.level} onValueChange={(value) => setNewStudentData({ ...newStudentData, level: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin:students.selectLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{t("admin:students.beginner")}</SelectItem>
                <SelectItem value="intermediate">{t("admin:students.intermediate")}</SelectItem>
                <SelectItem value="advanced">{t("admin:students.advanced")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{t("admin:students.status")}</Label>
            <Select value={newStudentData.status} onValueChange={(value) => setNewStudentData({ ...newStudentData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin:students.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("admin:students.active")}</SelectItem>
                <SelectItem value="inactive">{t("admin:students.inactive")}</SelectItem>
                <SelectItem value="pending">{t("admin:students.pending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian">{t("admin:students.guardian")}</Label>
            <Input
              id="guardian"
              placeholder={t("admin:students.enterGuardian")}
              value={newStudentData.guardianName}
              onChange={(e) => setNewStudentData({ ...newStudentData, guardianName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">{t("admin:students.guardianPhone")}</Label>
            <PhoneInput
              value={newStudentData.guardianPhone}
              onChange={(value) => setNewStudentData({ ...newStudentData, guardianPhone: value })}
              placeholder={t("admin:students.enterGuardianPhone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileImage">{t("admin:students.profileImage")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="file:me-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="col-span-2 space-y-4">
            <div>
              <Label>{t("admin:students.courseRegistration")}</Label>
              <p className="text-sm text-gray-600 mb-3">{t("admin:students.selectCoursesDesc")}</p>
              <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                {coursesList && coursesList.length > 0 ? (
                  coursesList.map((course: CourseItem) => (
                    <div key={course.id} className="flex items-center justify-between space-x-3 p-2 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`course-${course.id}`}
                          checked={newStudentData.selectedCourses.includes(course.id)}
                          onChange={(e) => onCourseSelection(course.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-gray-600">
                            {course.level} • {course.language}
                          </div>
                        </label>
                      </div>
                      <div className="text-sm font-medium">{course.price ? formatCurrency(course.price, "IRR") : "Free"}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">No courses available. Create courses first.</div>
                )}
              </div>
              {newStudentData.selectedCourses.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Fee:</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(newStudentData.totalFee, "IRR")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Initial Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special notes or requirements..."
              value={newStudentData.notes}
              onChange={(e) => setNewStudentData({ ...newStudentData, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="btn-cancel-create-student"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateStudent}
            disabled={isPending}
            data-testid="btn-create-student-submit"
          >
            {isPending ? "Creating..." : "Create Student Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
