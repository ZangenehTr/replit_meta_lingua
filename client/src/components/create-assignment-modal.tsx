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
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateAssignmentModalProps {
  children: React.ReactNode;
}

export function CreateAssignmentModal({ children }: CreateAssignmentModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [maxPoints, setMaxPoints] = useState("");
  const [instructions, setInstructions] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAssignment = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/assignments'] });
      toast({
        title: "Assignment Created",
        description: "The assignment has been successfully created and assigned to students.",
      });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCourse("");
    setDueDate(undefined);
    setMaxPoints("");
    setInstructions("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !course || !dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createAssignment.mutate({
      title,
      description,
      course,
      dueDate: dueDate.toISOString(),
      maxPoints: parseInt(maxPoints) || 100,
      instructions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Persian Grammar - Past Tense Exercise"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the assignment"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Maximum Points</Label>
              <Input
                id="maxPoints"
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                placeholder="100"
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Detailed Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide detailed instructions for students..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAssignment.isPending}>
              {createAssignment.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}