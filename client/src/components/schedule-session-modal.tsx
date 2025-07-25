import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface ScheduleSessionModalProps {
  children: React.ReactNode;
}

export function ScheduleSessionModal({ children }: ScheduleSessionModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [objectives, setObjectives] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  const scheduleSession = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/teacher/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/sessions'] });
      toast({
        title: t('toast.success'),
        description: t('toast.created'),
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t('toast.error'),
        description: t('toast.failed'),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setCourse("");
    setDate(undefined);
    setTime("");
    setDuration("");
    setDescription("");
    setMaterials("");
    setObjectives("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !course || !date || !time || !duration) {
      toast({
        title: t('toast.missingInformation'),
        description: t('toast.fillRequiredFields'),
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

    scheduleSession.mutate({
      title,
      course,
      scheduledAt: scheduledDateTime.toISOString(),
      duration: parseInt(duration),
      description,
      materials: materials.split('\n').filter(m => m.trim()),
      objectives: objectives.split('\n').filter(o => o.trim()),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Teaching Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('placeholders.sessionTitle')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectCourse')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persian-grammar">Persian Grammar Fundamentals</SelectItem>
                  <SelectItem value="persian-literature">Advanced Persian Literature</SelectItem>
                  <SelectItem value="business-english">Business English</SelectItem>
                  <SelectItem value="arabic-basics">Arabic for Persian Speakers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Session Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('placeholders.sessionDescription')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectDuration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materials">Teaching Materials</Label>
            <Textarea
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="List materials needed (one per line)&#10;Grammar workbook&#10;Audio exercises&#10;Whiteboard"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Learning Objectives</Label>
            <Textarea
              id="objectives"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="List learning objectives (one per line)&#10;Learn conditional forms&#10;Practice with examples&#10;Apply in conversation"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={scheduleSession.isPending}>
              {scheduleSession.isPending ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}