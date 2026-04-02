import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";

interface LessonFormData { title: string; description: string; difficulty: string; lessonType: string; language: string; isPublished: boolean; }

interface LessonFormProps {
  data: LessonFormData;
  onChange: (data: LessonFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  mode: "create" | "edit";
}

export function LessonForm({ data, onChange, onSave, onCancel, isLoading, mode }: LessonFormProps) {
  const update = (key: keyof LessonFormData, value: LessonFormData[keyof LessonFormData]) => onChange({ ...data, [key]: value });
  const testPrefix = mode === "create" ? "" : "edit-";

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2"><Label>Title *</Label><Input value={data.title} onChange={(e) => update("title", e.target.value)} placeholder="Enter lesson title" data-testid={`input-${testPrefix}lesson-title`} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={data.description} onChange={(e) => update("description", e.target.value)} placeholder="Enter lesson description" rows={3} data-testid={`input-${testPrefix}lesson-description`} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Difficulty</Label>
          <Select value={data.difficulty} onValueChange={(v) => update("difficulty", v)}>
            <SelectTrigger data-testid={`select-${testPrefix}difficulty`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="elementary">Elementary</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="upper_intermediate">Upper Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Lesson Type</Label>
          <Select value={data.lessonType} onValueChange={(v) => update("lessonType", v)}>
            <SelectTrigger data-testid={`select-${testPrefix}lesson-type`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="interactive">Interactive</SelectItem>
              <SelectItem value="vocabulary">Vocabulary</SelectItem>
              <SelectItem value="grammar">Grammar</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="listening">Listening</SelectItem>
              <SelectItem value="speaking">Speaking</SelectItem>
              <SelectItem value="writing">Writing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label>Language</Label>
        <Select value={data.language} onValueChange={(v) => update("language", v)}>
          <SelectTrigger data-testid={`select-${testPrefix}language`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fa">Persian (فارسی)</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ar">Arabic (العربية)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id={`${testPrefix}published`} checked={data.isPublished} onCheckedChange={(v) => update("isPublished", v)} data-testid={`switch-${testPrefix}published`} />
        <Label htmlFor={`${testPrefix}published`}>{mode === "create" ? "Publish immediately" : "Published"}</Label>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} data-testid={`button-cancel-${mode}`}>Cancel</Button>
        <Button onClick={onSave} disabled={!data.title || isLoading} data-testid={`button-save-${mode}`}>
          {isLoading ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />{mode === "create" ? "Creating..." : "Updating..."}</> : <><Save className="h-4 w-4 me-2" />{mode === "create" ? "Create Lesson" : "Update Lesson"}</>}
        </Button>
      </div>
    </div>
  );
}
