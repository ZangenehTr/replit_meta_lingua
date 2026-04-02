import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { TiptapEditor } from "@/components/teacher/TiptapEditor";
import { AudioRecorder } from "@/components/teacher/AudioRecorder";
import type { Editor } from "@tiptap/react";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/hooks/useAssignments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<AssignmentFormValues>;
  assignmentType: string;
  onAssignmentTypeChange: (v: string) => void;
  editor: Editor | null;
  wordCount: number;
  audioFiles: File[];
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAudio: (index: number) => void;
  students: { id: number; name: string }[];
  courses: { id: number; title: string }[];
  onSubmit: (data: AssignmentFormValues) => void;
  isPending: boolean;
}

export function CreateAssignmentDialog({
  open, onOpenChange, form, assignmentType, onAssignmentTypeChange,
  editor, wordCount, audioFiles, isRecording, recordingTime,
  onStartRecording, onStopRecording, onAudioUpload, onRemoveAudio,
  students, courses, onSubmit, isPending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="mt-4 lg:mt-0"><Plus className="w-4 h-4 me-2" />Create Assignment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create New Assignment</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Assignment Title</FormLabel><FormControl><Input placeholder="Enter assignment title" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the assignment requirements" className="min-h-24" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="assignmentType" render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Type</FormLabel>
                <Select onValueChange={(v) => { field.onChange(v); onAssignmentTypeChange(v); if (v === "writing") editor?.commands.setContent(""); }} defaultValue={field.value}>
                  <FormControl><SelectTrigger data-testid="select-assignment-type"><SelectValue placeholder="Select assignment type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {[["general", "General"], ["writing", "Writing (Rich Text Editor)"], ["speaking", "Speaking (Audio Recorder)"], ["reading", "Reading"], ["listening", "Listening"]].map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {assignmentType === "writing" && editor && <TiptapEditor editor={editor} wordCount={wordCount} />}
            {assignmentType === "speaking" && (
              <AudioRecorder audioFiles={audioFiles} isRecording={isRecording} recordingTime={recordingTime} onStart={onStartRecording} onStop={onStopRecording} onUpload={onAudioUpload} onRemove={onRemoveAudio} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="studentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger></FormControl>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="courseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger></FormControl>
                    <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button type="button" variant="outline" className={`w-full ps-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={(d) => { if (d) field.onChange(d); }} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; }} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxScore" render={({ field }) => (
                <FormItem><FormLabel>Max Score</FormLabel><FormControl><Input type="number" placeholder="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="instructions" render={({ field }) => (
              <FormItem><FormLabel>Additional Instructions (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional instructions for the student" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Assignment"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
