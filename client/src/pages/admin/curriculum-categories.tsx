import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  BookOpen,
  Eye,
  Save,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type CurriculumCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

function SortableCategoryRow({ category, onEdit, onDelete, onToggle }: {
  category: CurriculumCategory;
  onEdit: (category: CurriculumCategory) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, isActive: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { t } = useTranslation(['admin', 'common']);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-card border rounded-lg mb-2"
      data-testid={`category-row-${category.id}`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{category.name}</h3>
            {!category.isActive && (
              <Badge variant="secondary">{t('common:inactive')}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{category.slug}</p>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={category.isActive}
            onCheckedChange={(checked) => onToggle(category.id, checked)}
            data-testid={`toggle-active-${category.id}`}
          />
          <span className="text-sm text-muted-foreground">
            {category.isActive ? t('common:active') : t('common:inactive')}
          </span>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category)}
          data-testid={`button-edit-${category.id}`}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category.id)}
          data-testid={`button-delete-${category.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function CurriculumCategoriesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CurriculumCategory | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      isActive: true,
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<CurriculumCategory[]>({
    queryKey: ['/api/cms/curriculum-categories'],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return await apiRequest('/api/cms/curriculum-categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:curriculum.categoryCreated') });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/curriculum-categories'] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => {
      return await apiRequest(`/api/cms/curriculum-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:curriculum.categoryUpdated') });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/curriculum-categories'] });
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/cms/curriculum-categories/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:curriculum.categoryDeleted') });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/curriculum-categories'] });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:error'), 
        description: error.message, 
        variant: 'destructive' 
      });
      setDeletingId(null);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (categoryOrders: { id: number; displayOrder: number }[]) => {
      return await apiRequest('/api/cms/curriculum-categories/reorder', {
        method: 'PUT',
        body: JSON.stringify({ categoryOrders }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/curriculum-categories'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest(`/api/cms/curriculum-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/curriculum-categories'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      const categoryOrders = newCategories.map((cat, index) => ({
        id: cat.id,
        displayOrder: index,
      }));

      // Optimistic update
      queryClient.setQueryData(['/api/cms/curriculum-categories'], newCategories);
      
      reorderMutation.mutate(categoryOrders);
    }
  };

  const handleSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: CurriculumCategory) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      isActive: category.isActive,
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId !== null) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:curriculum.title')}</h1>
          <p className="text-muted-foreground">{t('admin:curriculum.description')}</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-category">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:curriculum.createCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:curriculum.createCategory')}</DialogTitle>
              <DialogDescription>{t('admin:curriculum.createCategoryDesc')}</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:name')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t('admin:curriculum.namePlaceholder')}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!editingCategory) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                          data-testid="input-category-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:curriculum.slug')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="test-preparation" data-testid="input-category-slug" />
                      </FormControl>
                      <FormDescription>{t('admin:curriculum.slugDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={t('admin:curriculum.descriptionPlaceholder')}
                          rows={3}
                          data-testid="input-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:curriculum.icon')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="BookOpen" data-testid="input-category-icon" />
                      </FormControl>
                      <FormDescription>{t('admin:curriculum.iconDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>{t('common:active')}</FormLabel>
                        <FormDescription>{t('admin:curriculum.activeDesc')}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-category-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    {t('common:cancel')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-category">
                    <Save className="h-4 w-4 mr-2" />
                    {t('common:save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:curriculum.editCategory')}</DialogTitle>
              <DialogDescription>{t('admin:curriculum.editCategoryDesc')}</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:name')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('admin:curriculum.namePlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:curriculum.slug')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="test-preparation" />
                      </FormControl>
                      <FormDescription>{t('admin:curriculum.slugDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:description')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={t('admin:curriculum.descriptionPlaceholder')} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:curriculum.icon')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="BookOpen" />
                      </FormControl>
                      <FormDescription>{t('admin:curriculum.iconDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>{t('common:active')}</FormLabel>
                        <FormDescription>{t('admin:curriculum.activeDesc')}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                    {t('common:cancel')}
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {t('common:save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin:curriculum.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin:curriculum.categories')}</CardTitle>
          <CardDescription>{t('admin:curriculum.dragToReorder')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common:loading')}</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin:curriculum.noCategories')}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
