import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit3, Trash2, Tag } from "lucide-react";

type ExamTag = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
};

const emptyTag = (): Partial<ExamTag> => ({
  name: "",
  code: "",
  description: "",
  order_index: 0,
  is_active: true,
});

export default function AdminExamTagsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ExamTag>>(emptyTag());
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: tags = [], isLoading } = useQuery<ExamTag[]>({
    queryKey: ["/api/courses/exam-tags"],
    queryFn: () => apiRequest("/api/courses/exam-tags"),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ExamTag>) =>
      apiRequest("/api/admin/exam-tags", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/exam-tags"] });
      toast({ title: "Created", description: `Exam tag "${editing.code}" created.` });
      setIsDialogOpen(false);
      setEditing(emptyTag());
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message ?? "Failed to create exam tag.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<ExamTag> & { id: number }) =>
      apiRequest(`/api/admin/exam-tags/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/exam-tags"] });
      toast({ title: "Updated", description: "Exam tag updated." });
      setIsDialogOpen(false);
      setEditing(emptyTag());
      setIsEditing(false);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message ?? "Failed to update exam tag.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/exam-tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/exam-tags"] });
      toast({ title: "Deactivated", description: "Exam tag deactivated." });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate exam tag.", variant: "destructive" });
    },
  });

  function openCreate() {
    setEditing(emptyTag());
    setIsEditing(false);
    setIsDialogOpen(true);
  }

  function openEdit(tag: ExamTag) {
    setEditing({ ...tag });
    setIsEditing(true);
    setIsDialogOpen(true);
  }

  function handleSave() {
    if (!editing.name || !editing.code) {
      toast({ title: "Validation", description: "Name and code are required.", variant: "destructive" });
      return;
    }
    if (isEditing && editing.id) {
      updateMutation.mutate(editing as ExamTag & { id: number });
    } else {
      createMutation.mutate(editing);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-7 w-7" />
            Exam Tags
          </h1>
          <p className="text-muted-foreground">
            Manage exam-focus tags for courses (IELTS, TOEFL, DELF, etc.)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Focus Tags</CardTitle>
          <CardDescription>
            Tags help students filter courses by the exam they are preparing for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="text-muted-foreground text-sm">No exam tags configured yet.</p>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={tag.is_active ? "default" : "secondary"}>
                      {tag.code}
                    </Badge>
                    <div>
                      <p className="font-medium">{tag.name}</p>
                      {tag.description && (
                        <p className="text-xs text-muted-foreground">{tag.description}</p>
                      )}
                    </div>
                    {!tag.is_active && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(tag)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    {tag.is_active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(tag.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditing(emptyTag()); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Exam Tag" : "New Exam Tag"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details for this exam tag." : "Create a new exam focus tag."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tag-name">Name *</Label>
              <Input
                id="tag-name"
                placeholder="e.g. IELTS Academic"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tag-code">Code *</Label>
              <Input
                id="tag-code"
                placeholder="e.g. IELTS"
                value={editing.code ?? ""}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">Short uppercase identifier used as a filter key.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tag-desc">Description</Label>
              <Textarea
                id="tag-desc"
                placeholder="Optional description…"
                rows={2}
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tag-order">Display Order</Label>
              <Input
                id="tag-order"
                type="number"
                value={editing.order_index ?? 0}
                onChange={(e) => setEditing({ ...editing, order_index: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            {isEditing && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Create Tag"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Exam Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the tag from student filters. It will not delete existing course associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
