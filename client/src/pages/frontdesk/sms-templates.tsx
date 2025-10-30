import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Send,
  Search,
  Filter,
  Eye,
  Copy,
  Star,
  StarOff,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  MessageCircle,
  Smartphone,
  Hash,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  Globe,
  ChevronDown,
  MoreHorizontal,
  ArrowLeft,
  Home,
  FileText,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Types from shared schema
interface SmsTemplate {
  id: number;
  name: string;
  content: string;
  categoryId: number;
  categoryName?: string;
  status: 'active' | 'inactive' | 'archived';
  tags: string[];
  variables: string[];
  usageCount: number;
  successfulSends: number;
  failedSends: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByName?: string;
}

interface SmsTemplateCategory {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SmsTemplateVariable {
  id: number;
  variableName: string;
  displayName: string;
  description?: string;
  category: string;
  dataType: 'text' | 'date' | 'time' | 'number' | 'boolean';
  defaultValue?: string;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SendSmsRequest {
  recipients: Array<{
    phone: string;
    name?: string;
    variableData?: Record<string, string>;
  }>;
  variableData?: Record<string, string>;
  sendingType: 'individual' | 'bulk';
  contextType?: string;
  contextId?: string;
  idempotencyKey: string;
}

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  content: z.string().min(1, 'Template content is required'),
  categoryId: z.number().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

const sendSmsSchema = z.object({
  recipients: z.string().min(1, 'Recipients are required'),
  variableData: z.record(z.string()).optional(),
});

type SendSmsFormData = z.infer<typeof sendSmsSchema>;

export default function SmsTemplatesPage() {
  const { t, i18n } = useTranslation(['common', 'frontdesk']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('templates');

  // Data fetching with React Query
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['/api/sms-templates', { search: searchQuery, categoryId: selectedCategory !== 'all' ? selectedCategory : undefined, status: selectedStatus !== 'all' ? selectedStatus : undefined }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      return apiRequest(`/api/sms-templates?${params.toString()}`);
    }
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/sms-templates/categories'],
    queryFn: () => apiRequest('/api/sms-templates/categories')
  });

  const { data: variables = [], isLoading: variablesLoading } = useQuery({
    queryKey: ['/api/sms-templates/variables'],
    queryFn: () => apiRequest('/api/sms-templates/variables')
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/sms-templates/analytics'],
    queryFn: () => apiRequest('/api/sms-templates/analytics')
  });

  // Ref for content textarea (for variable insertion)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormData) => 
      apiRequest('/api/sms-templates', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      setShowCreateDialog(false);
      toast({
        title: isRTL ? 'قالب ایجاد شد' : 'Template Created',
        description: isRTL ? 'قالب پیامک با موفقیت ایجاد شد' : 'SMS template created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: isRTL ? 'خطا در ایجاد قالب' : 'Error Creating Template',
        description: error.message || (isRTL ? 'خطایی رخ داده است' : 'An error occurred'),
        variant: 'destructive',
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TemplateFormData }) =>
      apiRequest(`/api/sms-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      setShowEditDialog(false);
      setSelectedTemplate(null);
      toast({
        title: isRTL ? 'قالب به‌روزرسانی شد' : 'Template Updated',
        description: isRTL ? 'قالب پیامک با موفقیت به‌روزرسانی شد' : 'SMS template updated successfully',
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sms-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      toast({
        title: isRTL ? 'قالب حذف شد' : 'Template Deleted',
        description: isRTL ? 'قالب پیامک با موفقیت حذف شد' : 'SMS template deleted successfully',
      });
    }
  });

  const sendSmsMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: SendSmsRequest }) =>
      apiRequest(`/api/sms-templates/${templateId}/send`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
      setShowSendDialog(false);
      toast({
        title: isRTL ? 'پیامک ارسال شد' : 'SMS Sent',
        description: isRTL ? `پیامک به ${result.sentCount} نفر ارسال شد` : `SMS sent to ${result.sentCount} recipients`,
      });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      isFavorite 
        ? apiRequest(`/api/sms-templates/${id}/favorite`, { method: 'DELETE' })
        : apiRequest(`/api/sms-templates/${id}/favorite`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-templates'] });
    }
  });

  const createForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      content: '',
      categoryId: 0,
      tags: [],
      status: 'draft',
    }
  });

  const editForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      content: '',
      categoryId: 0,
      tags: [],
      status: 'draft',
    }
  });

  const sendForm = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      recipients: '',
      variableData: {}
    }
  });

  // Helper functions
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  };

  const getCharacterCount = (content: string): number => content.length;

  const getSmsCount = (content: string): number => Math.ceil(content.length / 160);

  const replaceVariables = (content: string, variableData: Record<string, string>): string => {
    let result = content;
    Object.entries(variableData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'trial_reminders': return Calendar;
      case 'follow_ups': return Users;
      case 'confirmations': return CheckCircle2;
      case 'notifications': return MessageCircle;
      case 'promotional': return Target;
      default: return MessageSquare;
    }
  };

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template: SmsTemplate) => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.categoryId.toString() === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [templates, searchQuery, selectedCategory, selectedStatus]);

  // Event handlers
  const handleCreateTemplate = (data: TemplateFormData) => {
    createTemplateMutation.mutate({
      ...data,
      variables: extractVariables(data.content)
    } as any);
  };

  const handleEditTemplate = (data: TemplateFormData) => {
    if (!selectedTemplate) return;
    updateTemplateMutation.mutate({ 
      id: selectedTemplate.id, 
      data: {
        ...data,
        variables: extractVariables(data.content)
      } as any
    });
  };

  const handleDeleteTemplate = (template: SmsTemplate) => {
    if (confirm(isRTL ? 'آیا مطمئن هستید که می‌خواهید این قالب را حذف کنید؟' : 'Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleSendSms = (data: SendSmsFormData) => {
    if (!selectedTemplate) return;

    const recipients = data.recipients.split(/[,\n]/).map(line => {
      const parts = line.trim().split(/[\s,]+/);
      return {
        phone: parts[0],
        name: parts[1] || '',
        variableData: data.variableData
      };
    }).filter(r => r.phone);

    const sendData: SendSmsRequest = {
      recipients,
      variableData: data.variableData,
      sendingType: recipients.length > 1 ? 'bulk' : 'individual',
      contextType: 'frontdesk_template',
      contextId: selectedTemplate.id.toString(),
      idempotencyKey: crypto.randomUUID()
    };

    sendSmsMutation.mutate({ templateId: selectedTemplate.id, data: sendData });
  };

  const handleEditButtonClick = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    editForm.reset({
      name: template.name,
      content: template.content,
      categoryId: template.categoryId,
      tags: template.tags,
      status: template.status as 'active' | 'inactive' | 'draft',
    });
    setShowEditDialog(true);
  };

  const handlePreviewTemplate = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleInsertVariable = (variableName: string, formName: 'create' | 'edit') => {
    if (!contentTextareaRef.current) return;
    
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formName === 'create' ? createForm.getValues('content') : editForm.getValues('content');
    const variableText = `{{${variableName}}}`;
    
    const newValue = currentValue.substring(0, start) + variableText + currentValue.substring(end);
    
    if (formName === 'create') {
      createForm.setValue('content', newValue);
    } else {
      editForm.setValue('content', newValue);
    }
    
    // Set focus and cursor position after variable
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  if (templatesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{isRTL ? 'در حال بارگذاری...' : 'Loading templates...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", isRTL && "rtl")} dir={isRTL ? 'rtl' : 'ltr'} data-testid="sms-templates-page">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'مدیریت قالب‌های پیامک' : 'SMS Template Management'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isRTL ? 'ایجاد، ویرایش و مدیریت قالب‌های پیامک' : 'Create, edit and manage SMS templates'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-template"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isRTL ? 'قالب جدید' : 'New Template'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">{isRTL ? 'قالب‌ها' : 'Templates'}</TabsTrigger>
            <TabsTrigger value="analytics">{isRTL ? 'آمار' : 'Analytics'}</TabsTrigger>
            <TabsTrigger value="categories">{isRTL ? 'دسته‌بندی‌ها' : 'Categories'}</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isRTL ? 'فیلترها و جستجو' : 'Filters & Search'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">{isRTL ? 'جستجو' : 'Search'}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder={isRTL ? 'جستجو در قالب‌ها...' : 'Search templates...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">{isRTL ? 'دسته‌بندی' : 'Category'}</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder={isRTL ? 'همه دسته‌ها' : 'All categories'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'همه دسته‌ها' : 'All categories'}</SelectItem>
                        {categories.map((category: SmsTemplateCategory) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {isRTL ? category.displayName : category.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">{isRTL ? 'وضعیت' : 'Status'}</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder={isRTL ? 'همه وضعیت‌ها' : 'All statuses'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRTL ? 'همه وضعیت‌ها' : 'All statuses'}</SelectItem>
                        <SelectItem value="active">{isRTL ? 'فعال' : 'Active'}</SelectItem>
                        <SelectItem value="inactive">{isRTL ? 'غیرفعال' : 'Inactive'}</SelectItem>
                        <SelectItem value="archived">{isRTL ? 'آرشیو شده' : 'Archived'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => refetchTemplates()}
                      disabled={templatesLoading}
                      data-testid="button-refresh"
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", templatesLoading && "animate-spin")} />
                      {isRTL ? 'بروزرسانی' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: SmsTemplate) => {
                const CategoryIcon = getCategoryIcon(template.categoryName);
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-5 w-5 text-gray-500" />
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {template.categoryName}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {isRTL ? 'پیش‌نمایش' : 'Preview'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditButtonClick(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRTL ? 'ویرایش' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedTemplate(template);
                              setShowSendDialog(true);
                            }}>
                              <Send className="h-4 w-4 mr-2" />
                              {isRTL ? 'ارسال' : 'Send'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isRTL ? 'حذف' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {template.content}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="secondary" className={getStatusColor(template.status)}>
                            {isRTL ? 
                              (template.status === 'active' ? 'فعال' : template.status === 'inactive' ? 'غیرفعال' : 'آرشیو شده') :
                              template.status.charAt(0).toUpperCase() + template.status.slice(1)
                            }
                          </Badge>
                          <div className="text-gray-500">
                            {getCharacterCount(template.content)}/1000
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{isRTL ? 'تعداد استفاده:' : 'Used:'} {template.usageCount}</span>
                          <span>{isRTL ? 'موفق:' : 'Success:'} {template.successfulSends}</span>
                        </div>

                        {template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && !templatesLoading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {isRTL ? 'هیچ قالبی یافت نشد' : 'No templates found'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {isRTL ? 'قالب جدیدی ایجاد کنید یا فیلترها را تغییر دهید' : 'Create a new template or adjust your filters'}
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isRTL ? 'ایجاد اولین قالب' : 'Create First Template'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{isRTL ? 'کل قالب‌ها' : 'Total Templates'}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{templates.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'قالب فعال' : 'active templates'}: {templates.filter((t: SmsTemplate) => t.status === 'active').length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{isRTL ? 'کل ارسال‌ها' : 'Total Sends'}</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.reduce((sum: number, t: SmsTemplate) => sum + t.usageCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'پیامک امروز' : 'messages today'}: {analytics?.todaySends || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{isRTL ? 'نرخ موفقیت' : 'Success Rate'}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates.length > 0 ? 
                      Math.round(
                        (templates.reduce((sum: number, t: SmsTemplate) => sum + t.successfulSends, 0) /
                         Math.max(templates.reduce((sum: number, t: SmsTemplate) => sum + t.usageCount, 0), 1)) * 100
                      ) : 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'بر اساس کل ارسال‌ها' : 'based on total sends'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{isRTL ? 'محبوب‌ترین دسته' : 'Top Category'}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {categories.find((c: SmsTemplateCategory) => 
                      c.id === templates.reduce((topCategoryId: number, t: SmsTemplate) => {
                        const categoryCount = templates.filter((temp: SmsTemplate) => temp.categoryId === t.categoryId).length;
                        const currentTopCount = templates.filter((temp: SmsTemplate) => temp.categoryId === topCategoryId).length;
                        return categoryCount > currentTopCount ? t.categoryId : topCategoryId;
                      }, templates[0]?.categoryId || 0)
                    )?.displayName || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'بیشترین استفاده' : 'most used category'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category: SmsTemplateCategory) => {
                const CategoryIcon = getCategoryIcon(category.name);
                const templatesInCategory = templates.filter((t: SmsTemplate) => t.categoryId === category.id).length;
                
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="h-6 w-6" style={{ color: category.color || '#6B7280' }} />
                        <div>
                          <CardTitle>{category.displayName}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{isRTL ? 'تعداد قالب‌ها:' : 'Templates:'}</span>
                          <span>{templatesInCategory}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{isRTL ? 'وضعیت:' : 'Status:'}</span>
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? (isRTL ? 'فعال' : 'Active') : (isRTL ? 'غیرفعال' : 'Inactive')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'ایجاد قالب جدید' : 'Create New Template'}</DialogTitle>
            <DialogDescription>
              {isRTL ? 'قالب پیامک جدید ایجاد کنید' : 'Create a new SMS template'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateTemplate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'نام قالب' : 'Template Name'}</FormLabel>
                    <FormControl>
                      <Input placeholder={isRTL ? 'نام قالب را وارد کنید' : 'Enter template name'} {...field} data-testid="input-template-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'دسته‌بندی' : 'Category'}</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder={isRTL ? 'یک دسته‌بندی انتخاب کنید' : 'Select a category'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: SmsTemplateCategory) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'محتوای پیامک' : 'Message Content'}</FormLabel>
                    <FormControl>
                      <Textarea
                        ref={contentTextareaRef}
                        placeholder={isRTL ? 'محتوای پیامک را وارد کنید' : 'Enter message content'}
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-content"
                      />
                    </FormControl>
                    <FormDescription>
                      {isRTL ? 'از {{متغیر}} برای قرار دادن متغیرها استفاده کنید' : 'Use {{variable}} to insert variables'}
                    </FormDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['firstName', 'lastName', 'courseName', 'date', 'time'].map((varName) => (
                        <Button
                          key={varName}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInsertVariable(varName, 'create')}
                          data-testid={`button-insert-${varName}`}
                        >
                          {isRTL ? `درج {{${varName}}}` : `Insert {{${varName}}}`}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'برچسب‌ها' : 'Tags'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isRTL ? 'برچسب‌ها (با کاما جدا شوند)' : 'Tags (comma-separated)'}
                        value={field.value.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                          field.onChange(tags);
                        }}
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'وضعیت' : 'Status'}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{isRTL ? 'پیش‌نویس' : 'Draft'}</SelectItem>
                        <SelectItem value="active">{isRTL ? 'فعال' : 'Active'}</SelectItem>
                        <SelectItem value="inactive">{isRTL ? 'غیرفعال' : 'Inactive'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-create"
                >
                  {isRTL ? 'انصراف' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createTemplateMutation.isPending ? (isRTL ? 'در حال ایجاد...' : 'Creating...') : (isRTL ? 'ایجاد' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'ویرایش قالب' : 'Edit Template'}</DialogTitle>
            <DialogDescription>
              {isRTL ? 'قالب پیامک را ویرایش کنید' : 'Edit the SMS template'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditTemplate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'نام قالب' : 'Template Name'}</FormLabel>
                    <FormControl>
                      <Input placeholder={isRTL ? 'نام قالب را وارد کنید' : 'Enter template name'} {...field} data-testid="input-edit-template-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'دسته‌بندی' : 'Category'}</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-category">
                          <SelectValue placeholder={isRTL ? 'یک دسته‌بندی انتخاب کنید' : 'Select a category'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: SmsTemplateCategory) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'محتوای پیامک' : 'Message Content'}</FormLabel>
                    <FormControl>
                      <Textarea
                        ref={contentTextareaRef}
                        placeholder={isRTL ? 'محتوای پیامک را وارد کنید' : 'Enter message content'}
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-edit-content"
                      />
                    </FormControl>
                    <FormDescription>
                      {isRTL ? 'از {{متغیر}} برای قرار دادن متغیرها استفاده کنید' : 'Use {{variable}} to insert variables'}
                    </FormDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['firstName', 'lastName', 'courseName', 'date', 'time'].map((varName) => (
                        <Button
                          key={varName}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInsertVariable(varName, 'edit')}
                          data-testid={`button-edit-insert-${varName}`}
                        >
                          {isRTL ? `درج {{${varName}}}` : `Insert {{${varName}}}`}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'برچسب‌ها' : 'Tags'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isRTL ? 'برچسب‌ها (با کاما جدا شوند)' : 'Tags (comma-separated)'}
                        value={field.value.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                          field.onChange(tags);
                        }}
                        data-testid="input-edit-tags"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'وضعیت' : 'Status'}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{isRTL ? 'پیش‌نویس' : 'Draft'}</SelectItem>
                        <SelectItem value="active">{isRTL ? 'فعال' : 'Active'}</SelectItem>
                        <SelectItem value="inactive">{isRTL ? 'غیرفعال' : 'Inactive'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit"
                >
                  {isRTL ? 'انصراف' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateTemplateMutation.isPending ? (isRTL ? 'در حال به‌روزرسانی...' : 'Updating...') : (isRTL ? 'به‌روزرسانی' : 'Update')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Send SMS Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'ارسال پیامک' : 'Send SMS'}</DialogTitle>
            <DialogDescription>
              {isRTL ? `ارسال پیامک با قالب: ${selectedTemplate?.name}` : `Send SMS using template: ${selectedTemplate?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(handleSendSms)} className="space-y-4">
              <FormField
                control={sendForm.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? 'گیرندگان' : 'Recipients'}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={isRTL ? 
                          'یک شماره تلفن در هر خط یا جدا شده با کاما:\n09123456789\n09123456790 احمد\n09123456791, علی' :
                          'One phone number per line or comma-separated:\n09123456789\n09123456790 Ahmad\n09123456791, Ali'
                        }
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormDescription>
                      {isRTL ? 'شماره تلفن و اسم (اختیاری) را در هر خط وارد کنید' : 'Enter phone number and name (optional) on each line'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variable inputs */}
              {selectedTemplate && extractVariables(selectedTemplate.content).length > 0 && (
                <div className="space-y-4">
                  <Label>{isRTL ? 'مقادیر متغیرها' : 'Variable Values'}</Label>
                  {extractVariables(selectedTemplate.content).map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={`var-${variable}`}>{variable}</Label>
                      <Input
                        id={`var-${variable}`}
                        placeholder={isRTL ? `مقدار برای ${variable}` : `Value for ${variable}`}
                        onChange={(e) => {
                          const currentData = sendForm.getValues('variableData') || {};
                          sendForm.setValue('variableData', {
                            ...currentData,
                            [variable]: e.target.value
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label>{isRTL ? 'پیش‌نمایش پیامک' : 'SMS Preview'}</Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm">
                      {replaceVariables(
                        selectedTemplate.content, 
                        sendForm.watch('variableData') || {}
                      )}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>
                        {getCharacterCount(replaceVariables(
                          selectedTemplate.content, 
                          sendForm.watch('variableData') || {}
                        ))}/1000
                      </span>
                      <span>
                        {getSmsCount(replaceVariables(
                          selectedTemplate.content, 
                          sendForm.watch('variableData') || {}
                        ))} SMS
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSendDialog(false)}
                >
                  {isRTL ? 'لغو' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={sendSmsMutation.isPending}
                  data-testid="button-send-sms"
                >
                  {sendSmsMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {isRTL ? 'در حال ارسال...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {isRTL ? 'ارسال پیامک' : 'Send SMS'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'پیش‌نمایش قالب' : 'Template Preview'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <p className="text-sm whitespace-pre-wrap">
                {selectedTemplate ? replaceVariables(selectedTemplate.content, previewData) : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>{isRTL ? 'تعداد کاراکتر' : 'Character Count'}</Label>
                <p>{selectedTemplate ? getCharacterCount(selectedTemplate.content) : 0}/1000</p>
              </div>
              <div>
                <Label>{isRTL ? 'تعداد پیامک' : 'SMS Count'}</Label>
                <p>{selectedTemplate ? getSmsCount(selectedTemplate.content) : 0}</p>
              </div>
              <div>
                <Label>{isRTL ? 'دسته‌بندی' : 'Category'}</Label>
                <p>{selectedTemplate?.categoryName || 'N/A'}</p>
              </div>
              <div>
                <Label>{isRTL ? 'وضعیت' : 'Status'}</Label>
                <Badge className={getStatusColor(selectedTemplate?.status || 'inactive')}>
                  {selectedTemplate?.status || 'N/A'}
                </Badge>
              </div>
            </div>

            {selectedTemplate && extractVariables(selectedTemplate.content).length > 0 && (
              <div className="space-y-2">
                <Label>{isRTL ? 'متغیرهای موجود' : 'Available Variables'}</Label>
                <div className="flex flex-wrap gap-2">
                  {extractVariables(selectedTemplate.content).map((variable, index) => (
                    <Badge key={index} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
            >
              {isRTL ? 'بستن' : 'Close'}
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate) {
                  setShowPreviewDialog(false);
                  setShowSendDialog(true);
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              {isRTL ? 'ارسال این قالب' : 'Send This Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}