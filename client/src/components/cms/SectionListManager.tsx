import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ChevronUp, ChevronDown, Edit2, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SectionTypeSelector } from "./SectionTypeSelector";
import { SectionContentEditor } from "./SectionContentEditor";
import { AnimationPanel, SectionStyles, DEFAULT_STYLES } from "./AnimationPanel";
import type { CmsPageSection } from "@shared/schema";

interface Props {
  pageId: number;
  pageName: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  features: "Features",
  text: "Rich Text",
  cta: "Call to Action",
  testimonials: "Testimonials",
  stats: "Stats",
  spacer: "Spacer",
};

const BADGE_COLORS: Record<string, string> = {
  hero: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  features: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  text: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  cta: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  testimonials: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  stats: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  spacer: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

function contentPreview(section: CmsPageSection): string {
  const c = section.content as Record<string, any>;
  if (section.sectionType === "hero") return c.headline || "(no headline)";
  if (section.sectionType === "features") return c.title || `${(c.items || []).length} features`;
  if (section.sectionType === "text") return (c.html || "").replace(/<[^>]+>/g, "").slice(0, 60) || "(empty)";
  if (section.sectionType === "cta") return c.headline || "(no headline)";
  if (section.sectionType === "testimonials") return c.title || `${(c.items || []).length} testimonials`;
  if (section.sectionType === "stats") return `${(c.items || []).length} stats`;
  if (section.sectionType === "spacer") return `${c.height || "md"} spacer`;
  return "";
}

export function SectionListManager({ pageId, pageName }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CmsPageSection | null>(null);
  const [editContent, setEditContent] = useState<Record<string, any>>({});
  const [editStyles, setEditStyles] = useState<SectionStyles>(DEFAULT_STYLES);

  const { data: sections = [], isLoading } = useQuery<CmsPageSection[]>({
    queryKey: [`/api/cms/pages/${pageId}/sections`],
  });

  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  const createMutation = useMutation({
    mutationFn: async (data: { sectionType: string; content: any; styles: any; sortOrder: number }) => {
      return apiRequest(`/api/cms/pages/${pageId}/sections`, { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/pages/${pageId}/sections`] });
      setAddDialogOpen(false);
      toast({ title: "Section added" });
    },
    onError: () => toast({ title: "Failed to add section", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content, styles }: { id: number; content: any; styles: any }) => {
      return apiRequest(`/api/cms/page-sections/${id}`, { method: "PUT", body: { content, styles } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/pages/${pageId}/sections`] });
      setEditingSection(null);
      toast({ title: "Section updated" });
    },
    onError: () => toast({ title: "Failed to update section", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/page-sections/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/pages/${pageId}/sections`] });
      toast({ title: "Section deleted" });
    },
    onError: () => toast({ title: "Failed to delete section", variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, sortOrder }: { id: number; sortOrder: number }) => {
      return apiRequest(`/api/cms/page-sections/${id}`, { method: "PUT", body: { sortOrder } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cms/pages/${pageId}/sections`] });
    },
  });

  const handleAddSection = (type: string) => {
    const defaultContent: Record<string, Record<string, any>> = {
      hero: { headline: "", subheadline: "", ctaPrimary: { text: "", href: "" }, ctaSecondary: { text: "", href: "" }, backgroundType: "gradient", backgroundValue: "linear-gradient(135deg, #1e1b4b, #312e81)", minHeight: "80vh" },
      features: { title: "", subtitle: "", columns: 3, items: [] },
      text: { html: "", alignment: "left", maxWidth: "prose" },
      cta: { headline: "", subtext: "", buttons: [] },
      testimonials: { title: "", items: [] },
      stats: { items: [] },
      spacer: { height: "md", style: "none" },
    };
    createMutation.mutate({
      sectionType: type,
      content: defaultContent[type] || {},
      styles: DEFAULT_STYLES,
      sortOrder: sorted.length,
    });
  };

  const handleEdit = (section: CmsPageSection) => {
    setEditingSection(section);
    setEditContent((section.content as Record<string, any>) || {});
    setEditStyles({ ...DEFAULT_STYLES, ...((section.styles as Record<string, any>) || {}) });
  };

  const handleSaveEdit = () => {
    if (!editingSection) return;
    updateMutation.mutate({ id: editingSection.id, content: editContent, styles: editStyles });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSorted = [...sorted];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSorted.length) return;
    const a = newSorted[index];
    const b = newSorted[swapIdx];
    reorderMutation.mutate({ id: a.id, sortOrder: b.sortOrder });
    reorderMutation.mutate({ id: b.id, sortOrder: a.sortOrder });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading sections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-base">{pageName}</h3>
          <p className="text-xs text-muted-foreground">{sorted.length} section{sorted.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)} className="h-8 text-xs">
          <Plus className="w-3 h-3 me-1" /> Add Section
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">No sections yet. Add your first section to start building.</p>
          <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-3 h-3 me-1" /> Add First Section
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((section, index) => (
          <div
            key={section.id}
            className="flex items-center gap-2 border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${BADGE_COLORS[section.sectionType] || "bg-gray-100 text-gray-800"}`}>
              {SECTION_LABELS[section.sectionType] || section.sectionType}
            </span>
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {contentPreview(section)}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveSection(index, "up")} disabled={index === 0}>
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveSection(index, "down")} disabled={index === sorted.length - 1}>
                <ChevronDown className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(section)}>
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => { if (confirm("Delete this section?")) deleteMutation.mutate(section.id); }}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <SectionTypeSelector onSelect={handleAddSection} />
        </DialogContent>
      </Dialog>

      <Sheet open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>
              Edit {editingSection ? SECTION_LABELS[editingSection.sectionType] || editingSection.sectionType : ""} Section
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              <Tabs defaultValue="content">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                  <TabsTrigger value="animation" className="flex-1">Animations</TabsTrigger>
                </TabsList>
                <TabsContent value="content">
                  {editingSection && (
                    <SectionContentEditor
                      sectionType={editingSection.sectionType}
                      content={editContent}
                      onChange={setEditContent}
                    />
                  )}
                </TabsContent>
                <TabsContent value="animation">
                  <AnimationPanel styles={editStyles} onChange={setEditStyles} />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
          <div className="px-6 py-4 border-t flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
