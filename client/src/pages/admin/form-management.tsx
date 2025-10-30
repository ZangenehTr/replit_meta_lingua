import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, Edit, Trash2, Eye, FileText, Users, BarChart3, 
  Download, Copy, AlertCircle, CheckCircle, Clock, XCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FormBuilder from "@/components/admin/FormBuilder";
import DynamicForm from "@/components/forms/DynamicForm";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from "date-fns";

const formSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleFa: z.string().optional(),
  titleAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionFa: z.string().optional(),
  descriptionAr: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
  fields: z.array(z.any()).min(1, "At least one field is required"),
  submitButtonTextEn: z.string().optional(),
  submitButtonTextFa: z.string().optional(),
  submitButtonTextAr: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function FormManagement() {
  const { t, i18n } = useTranslation(['admin']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [formFields, setFormFields] = useState<any[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titleEn: "",
      titleFa: "",
      titleAr: "",
      descriptionEn: "",
      descriptionFa: "",
      descriptionAr: "",
      category: "",
      isActive: true,
      fields: [],
      submitButtonTextEn: "Submit",
      submitButtonTextFa: "ارسال",
      submitButtonTextAr: "إرسال",
    }
  });

  // Fetch all forms
  const { data: forms = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/forms'],
  });

  // Fetch submissions for selected form
  const { data: submissions = [] } = useQuery<any[]>({
    queryKey: [`/api/admin/forms/${selectedForm?.id}/submissions`],
    enabled: !!selectedForm && submissionsDialogOpen,
  });

  // Fetch stats for selected form
  const { data: stats } = useQuery<any>({
    queryKey: [`/api/admin/forms/${selectedForm?.id}/stats`],
    enabled: !!selectedForm && submissionsDialogOpen,
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest(`/api/admin/forms`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form created successfully"
      });
      setCreateDialogOpen(false);
      form.reset();
      setFormFields([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/forms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create form",
        variant: "destructive"
      });
    }
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      return await apiRequest(`/api/admin/forms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form updated successfully"
      });
      setEditDialogOpen(false);
      setSelectedForm(null);
      form.reset();
      setFormFields([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/forms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update form",
        variant: "destructive"
      });
    }
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/forms/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/forms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete form",
        variant: "destructive"
      });
    }
  });

  // Update submission status mutation
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      return await apiRequest(`/api/admin/submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission status updated"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/forms/${selectedForm?.id}/submissions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/forms/${selectedForm?.id}/stats`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission",
        variant: "destructive"
      });
    }
  });

  const handleCreateForm = (data: FormData) => {
    createFormMutation.mutate({ ...data, fields: formFields });
  };

  const handleUpdateForm = (data: FormData) => {
    if (selectedForm) {
      updateFormMutation.mutate({ id: selectedForm.id, data: { ...data, fields: formFields } });
    }
  };

  const handleEditClick = (formItem: any) => {
    setSelectedForm(formItem);
    setFormFields(formItem.fields || []);
    form.reset({
      titleEn: formItem.titleEn || formItem.title,
      titleFa: formItem.titleFa || "",
      titleAr: formItem.titleAr || "",
      descriptionEn: formItem.descriptionEn || formItem.description,
      descriptionFa: formItem.descriptionFa || "",
      descriptionAr: formItem.descriptionAr || "",
      category: formItem.category || "",
      isActive: formItem.isActive ?? true,
      fields: formItem.fields || [],
      submitButtonTextEn: formItem.submitButtonTextEn || "Submit",
      submitButtonTextFa: formItem.submitButtonTextFa || "ارسال",
      submitButtonTextAr: formItem.submitButtonTextAr || "إرسال",
    });
    setEditDialogOpen(true);
  };

  const handleDuplicateForm = async (formItem: any) => {
    const duplicatedData = {
      titleEn: `${formItem.titleEn || formItem.title} (Copy)`,
      titleFa: formItem.titleFa ? `${formItem.titleFa} (نسخه)` : "",
      titleAr: formItem.titleAr ? `${formItem.titleAr} (نسخة)` : "",
      descriptionEn: formItem.descriptionEn || formItem.description,
      descriptionFa: formItem.descriptionFa || "",
      descriptionAr: formItem.descriptionAr || "",
      category: formItem.category,
      isActive: false,
      fields: formItem.fields || [],
      submitButtonTextEn: formItem.submitButtonTextEn || "Submit",
      submitButtonTextFa: formItem.submitButtonTextFa || "ارسال",
      submitButtonTextAr: formItem.submitButtonTextAr || "إرسال",
    };
    createFormMutation.mutate(duplicatedData);
  };

  const exportSubmissions = async (exportFormat: 'json' | 'csv') => {
    if (!selectedForm) return;

    if (exportFormat === 'json') {
      const dataStr = JSON.stringify(submissions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedForm.titleEn || 'form'}_submissions_${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      if (submissions.length === 0) {
        toast({
          title: "No data",
          description: "No submissions to export",
          variant: "destructive"
        });
        return;
      }

      const headers = ['ID', 'Submitted At', 'Status', 'Submitted By', ...Object.keys(submissions[0].data || {})];
      const csvRows = [
        headers.join(','),
        ...submissions.map(sub => [
          sub.id,
          format(new Date(sub.submittedAt), 'yyyy-MM-dd HH:mm:ss'),
          sub.status,
          sub.submittedBy || 'Guest',
          ...headers.slice(4).map(h => JSON.stringify(sub.data[h] || ''))
        ].join(','))
      ];

      const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(url);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedForm.titleEn || 'form'}_submissions_${new Date().toISOString()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Success",
      description: `Exported ${submissions.length} submissions as ${exportFormat.toUpperCase()}`
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'} data-testid="form-management-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Form Management</h1>
          <p className="text-gray-600 mt-1">Create and manage dynamic forms for your platform</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-form">
          <Plus className="w-4 h-4 mr-2" /> Create Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
            <p className="text-gray-500 mb-4">Create your first dynamic form to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-form">
              <Plus className="w-4 h-4 mr-2" /> Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((formItem) => (
            <Card key={formItem.id} className="hover:shadow-lg transition-shadow" data-testid={`form-card-${formItem.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {formItem.titleEn || formItem.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formItem.category}
                    </CardDescription>
                  </div>
                  <Badge variant={formItem.isActive ? "default" : "secondary"}>
                    {formItem.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {formItem.descriptionEn || formItem.description || "No description"}
                </p>
                
                <div className="flex gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {formItem.fields?.length || 0} fields
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedForm(formItem);
                      setPreviewDialogOpen(true);
                    }}
                    data-testid={`button-preview-${formItem.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedForm(formItem);
                      setSubmissionsDialogOpen(true);
                    }}
                    data-testid={`button-submissions-${formItem.id}`}
                  >
                    <Users className="w-4 h-4 mr-1" /> Submissions
                  </Button>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(formItem)}
                    data-testid={`button-edit-${formItem.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicateForm(formItem)}
                    data-testid={`button-duplicate-${formItem.id}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
                        deleteFormMutation.mutate(formItem.id);
                      }
                    }}
                    data-testid={`button-delete-${formItem.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Design a new dynamic form with custom fields and validation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleCreateForm)} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Title (English) *</Label>
                  <Input {...form.register("titleEn")} placeholder="Enter form title" data-testid="input-title-en" />
                  {form.formState.errors.titleEn && (
                    <p className="text-sm text-red-500">{form.formState.errors.titleEn.message}</p>
                  )}
                </div>

                <div>
                  <Label>Title (Persian)</Label>
                  <Input {...form.register("titleFa")} placeholder="عنوان فرم" dir="rtl" data-testid="input-title-fa" />
                </div>

                <div>
                  <Label>Title (Arabic)</Label>
                  <Input {...form.register("titleAr")} placeholder="عنوان النموذج" dir="rtl" data-testid="input-title-ar" />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Input {...form.register("category")} placeholder="e.g., Student Registration, Lead Intake" data-testid="input-category" />
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label>Description (English)</Label>
                  <Textarea {...form.register("descriptionEn")} rows={3} placeholder="Form description" data-testid="textarea-description-en" />
                </div>

                <div>
                  <Label>Description (Persian)</Label>
                  <Textarea {...form.register("descriptionFa")} rows={3} placeholder="توضیحات فرم" dir="rtl" data-testid="textarea-description-fa" />
                </div>

                <div>
                  <Label>Description (Arabic)</Label>
                  <Textarea {...form.register("descriptionAr")} rows={3} placeholder="وصف النموذج" dir="rtl" data-testid="textarea-description-ar" />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch 
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                    data-testid="switch-is-active"
                  />
                </div>
              </TabsContent>

              <TabsContent value="fields">
                <FormBuilder
                  initialFields={formFields}
                  onFieldsChange={(fields) => {
                    setFormFields(fields);
                    form.setValue("fields", fields);
                  }}
                />
                {form.formState.errors.fields && (
                  <p className="text-sm text-red-500 mt-2">{form.formState.errors.fields.message}</p>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label>Submit Button Text (English)</Label>
                  <Input {...form.register("submitButtonTextEn")} placeholder="Submit" data-testid="input-submit-text-en" />
                </div>

                <div>
                  <Label>Submit Button Text (Persian)</Label>
                  <Input {...form.register("submitButtonTextFa")} placeholder="ارسال" dir="rtl" data-testid="input-submit-text-fa" />
                </div>

                <div>
                  <Label>Submit Button Text (Arabic)</Label>
                  <Input {...form.register("submitButtonTextAr")} placeholder="إرسال" dir="rtl" data-testid="input-submit-text-ar" />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFormMutation.isPending} data-testid="button-save-form">
                {createFormMutation.isPending ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog - Similar structure to Create */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
            <DialogDescription>
              Update form details and fields
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleUpdateForm)} className="space-y-6">
            {/* Same tab structure as create form */}
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Title (English) *</Label>
                  <Input {...form.register("titleEn")} placeholder="Enter form title" />
                  {form.formState.errors.titleEn && (
                    <p className="text-sm text-red-500">{form.formState.errors.titleEn.message}</p>
                  )}
                </div>

                <div>
                  <Label>Title (Persian)</Label>
                  <Input {...form.register("titleFa")} placeholder="عنوان فرم" dir="rtl" />
                </div>

                <div>
                  <Label>Title (Arabic)</Label>
                  <Input {...form.register("titleAr")} placeholder="عنوان النموذج" dir="rtl" />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Input {...form.register("category")} placeholder="e.g., Student Registration, Lead Intake" />
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label>Description (English)</Label>
                  <Textarea {...form.register("descriptionEn")} rows={3} placeholder="Form description" />
                </div>

                <div>
                  <Label>Description (Persian)</Label>
                  <Textarea {...form.register("descriptionFa")} rows={3} placeholder="توضیحات فرم" dir="rtl" />
                </div>

                <div>
                  <Label>Description (Arabic)</Label>
                  <Textarea {...form.register("descriptionAr")} rows={3} placeholder="وصف النموذج" dir="rtl" />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch 
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="fields">
                <FormBuilder
                  initialFields={formFields}
                  onFieldsChange={(fields) => {
                    setFormFields(fields);
                    form.setValue("fields", fields);
                  }}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label>Submit Button Text (English)</Label>
                  <Input {...form.register("submitButtonTextEn")} placeholder="Submit" />
                </div>

                <div>
                  <Label>Submit Button Text (Persian)</Label>
                  <Input {...form.register("submitButtonTextFa")} placeholder="ارسال" dir="rtl" />
                </div>

                <div>
                  <Label>Submit Button Text (Arabic)</Label>
                  <Input {...form.register("submitButtonTextAr")} placeholder="إرسال" dir="rtl" />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFormMutation.isPending} data-testid="button-update-form">
                {updateFormMutation.isPending ? "Updating..." : "Update Form"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
            <DialogDescription>
              This is how the form will appear to users
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <DynamicForm
              formDefinition={selectedForm}
              onSubmit={async (data) => {
                toast({
                  title: "Preview Mode",
                  description: "This is a preview. Submissions are not saved."
                });
              }}
              showTitle={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Submissions</DialogTitle>
            <DialogDescription>
              Manage and review form submissions
            </DialogDescription>
          </DialogHeader>

          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm text-gray-500">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <p className="text-sm text-gray-500">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <p className="text-sm text-gray-500">Approved</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <p className="text-sm text-gray-500">Rejected</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={() => exportSubmissions('json')} data-testid="button-export-json">
              <Download className="w-4 h-4 mr-1" /> Export JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportSubmissions('csv')} data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.id}</TableCell>
                  <TableCell>{format(new Date(sub.submittedAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>{sub.submittedBy || 'Guest'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {sub.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => updateSubmissionMutation.mutate({ id: sub.id, status: 'approved' })}
                            data-testid={`button-approve-${sub.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => {
                              const reason = prompt('Rejection reason (optional):');
                              updateSubmissionMutation.mutate({ id: sub.id, status: 'rejected', rejectionReason: reason || undefined });
                            }}
                            data-testid={`button-reject-${sub.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          alert(JSON.stringify(sub.data, null, 2));
                        }}
                        data-testid={`button-view-data-${sub.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {submissions.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No submissions yet</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
