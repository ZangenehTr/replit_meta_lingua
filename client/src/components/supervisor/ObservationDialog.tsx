import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { ObservationFormValues, UpcomingSession, TeacherListItem } from "@/hooks/useSupervisorDashboard";

type ScoreFieldName = "teachingMethodology" | "classroomManagement" | "studentEngagement" | "contentDelivery" | "languageSkills" | "timeManagement";
type TextFieldName = "strengths" | "areasForImprovement";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<ObservationFormValues>;
  onSubmit: (data: ObservationFormValues) => void;
  isPending: boolean;
  upcomingSessions: UpcomingSession[];
  allTeachers: TeacherListItem[];
  onSessionSelection: (sessionId: string) => void;
}

const scoreFields: { name: ScoreFieldName; label: string }[] = [
  { name: "teachingMethodology", label: "Teaching Methodology" },
  { name: "classroomManagement", label: "Classroom Management" },
  { name: "studentEngagement", label: "Student Engagement" },
  { name: "contentDelivery", label: "Content Delivery" },
  { name: "languageSkills", label: "Language Skills" },
  { name: "timeManagement", label: "Time Management" },
];

const textFields: { name: TextFieldName; label: string; placeholder: string }[] = [
  { name: "strengths", label: "Strengths", placeholder: "What did the teacher do well?" },
  { name: "areasForImprovement", label: "Areas for Improvement", placeholder: "What can be improved?" },
];

export function ObservationDialog({ open, onOpenChange, form, onSubmit, isPending, upcomingSessions, allTeachers, onSessionSelection }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Observation</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="sessionId" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Upcoming Session *</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(parseInt(v)); onSessionSelection(v); }} value={field.value?.toString()}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an upcoming session" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {upcomingSessions.length === 0 ? (
                        <SelectItem value="no-sessions" disabled>No upcoming sessions available</SelectItem>
                      ) : upcomingSessions.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.teacherName} - {s.courseName} | {new Date(s.scheduledAt).toLocaleDateString()} at {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | {s.deliveryMode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="teacherId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher (Auto-populated)</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                    <FormControl><SelectTrigger className="bg-gray-50"><SelectValue placeholder="Will auto-populate" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {allTeachers.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.firstName} {t.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observationType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observation Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="bg-gray-50"><SelectValue placeholder="Auto-populated" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="live_online">Live Online</SelectItem>
                      <SelectItem value="live_in_person">Live In-Person</SelectItem>
                      <SelectItem value="recorded">Recorded Session</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Date (Auto-populated)</FormLabel>
                  <FormControl><Input type="date" {...field} className="bg-gray-50" readOnly /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="scheduledTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Time (Auto-populated)</FormLabel>
                  <FormControl><Input type="time" {...field} className="bg-gray-50" readOnly /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900">Check-First Protocol Active</h4>
                <p className="text-sm text-blue-800 mt-1">This system automatically prevents duplicate observations. Session details are auto-populated for accuracy.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scoreFields.map(({ name, label }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Score 1-5" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {[["1", "Poor"], ["2", "Below Average"], ["3", "Average"], ["4", "Good"], ["5", "Excellent"]].map(([v, l]) => (
                          <SelectItem key={v} value={v}>{v} - {l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {textFields.map(({ name, label, placeholder }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl><Textarea {...field} placeholder={placeholder} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl><Textarea {...field} placeholder="Any additional observations or comments" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                {isPending ? "Creating..." : "Create Observation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
