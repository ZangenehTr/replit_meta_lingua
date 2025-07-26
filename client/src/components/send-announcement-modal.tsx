import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface SendAnnouncementModalProps {
  children: React.ReactNode;
}

export function SendAnnouncementModal({ children }: SendAnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [scheduleForLater, setScheduleForLater] = useState(false);
  
  const { toast } = useToast();
  const { t } = useTranslation(['common']);
  const queryClient = useQueryClient();

  const sendAnnouncement = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/teacher/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/announcements'] });
      toast({
        title: t('common:toast.announcementSent'),
        description: "Your announcement has been successfully sent to students.",
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t('common:toast.error'),
        description: "Failed to send announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setPriority("normal");
    setSendToAll(true);
    setSelectedCourses([]);
    setScheduleForLater(false);
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      toast({
        title: t('common:toast.missingInformation'),
        description: "Please provide both a title and message.",
        variant: "destructive",
      });
      return;
    }

    sendAnnouncement.mutate({
      title,
      message,
      priority,
      sendToAll,
      courses: sendToAll ? [] : selectedCourses,
      scheduleForLater,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Send Announcement</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Announcement Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Class Schedule Change - Persian Grammar"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement message here..."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendToAll"
                  checked={sendToAll}
                  onCheckedChange={(checked) => setSendToAll(checked === true)}
                />
                <Label htmlFor="sendToAll">Send to all my students</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scheduleForLater"
                  checked={scheduleForLater}
                  onCheckedChange={(checked) => setScheduleForLater(checked === true)}
                />
                <Label htmlFor="scheduleForLater">Schedule for later</Label>
              </div>
            </div>
          </div>

          {!sendToAll && (
            <div className="space-y-2">
              <Label>Select Courses</Label>
              <div className="space-y-2 border rounded-lg p-4">
                {[
                  { id: "persian-grammar", name: "Persian Grammar Fundamentals" },
                  { id: "persian-literature", name: "Advanced Persian Literature" },
                  { id: "business-english", name: "Business English" },
                  { id: "arabic-basics", name: "Arabic for Persian Speakers" }
                ].map((course) => (
                  <div key={course.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={course.id}
                      checked={selectedCourses.includes(course.id)}
                      onCheckedChange={() => handleCourseToggle(course.id)}
                    />
                    <Label htmlFor={course.id}>{course.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendAnnouncement.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendAnnouncement.isPending ? "Sending..." : "Send Announcement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}