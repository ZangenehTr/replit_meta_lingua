import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Plus, 
  TestTube, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  BarChart3,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { z } from 'zod';

// Form schemas
const apiConfigSchema = z.object({
  apiName: z.string().min(1, 'API name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  baseUrl: z.string().url('Must be a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().optional(),
  isEnabled: z.boolean().default(true),
  rateLimit: z.number().min(1).optional(),
  costPerRequest: z.number().min(0).optional(),
  monthlyBudget: z.number().min(0).optional(),
  configuration: z.record(z.any()).optional()
});

type ApiConfigForm = z.infer<typeof apiConfigSchema>;

interface ThirdPartyApi {
  id: number;
  apiName: string;
  displayName: string;
  description?: string;
  baseUrl: string;
  isEnabled: boolean;
  isHealthy: boolean;
  lastHealthCheck?: string;
  usageCount: number;
  usageCountMonth: number;
  errorCount: number;
  lastUsedAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  costPerRequest?: number;
  monthlyBudget?: number;
  currentMonthlyCost?: number;
  hasApiKey: boolean;
  hasApiSecret: boolean;
}

export function ThirdPartyIntegrations() {
  const [selectedApi, setSelectedApi] = useState<ThirdPartyApi | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch third-party APIs
  const { 
    data: apis, 
    isLoading, 
    error 
  } = useQuery<ThirdPartyApi[]>({ 
    queryKey: ['/api/admin/third-party-apis'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Create API mutation
  const createApiMutation = useMutation({
    mutationFn: (data: ApiConfigForm) => 
      apiRequest('/api/admin/third-party-apis', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/third-party-apis'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Third-party API configuration created successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API configuration.',
        variant: 'destructive'
      });
    }
  });

  // Update API mutation
  const updateApiMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApiConfigForm> }) =>
      apiRequest(`/api/admin/third-party-apis/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/third-party-apis'] });
      setIsEditDialogOpen(false);
      setSelectedApi(null);
      toast({
        title: 'Success',
        description: 'API configuration updated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update API configuration.',
        variant: 'destructive'
      });
    }
  });

  // Delete API mutation
  const deleteApiMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/third-party-apis/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/third-party-apis'] });
      toast({
        title: 'Success',
        description: 'API configuration deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API configuration.',
        variant: 'destructive'
      });
    }
  });

  // Test API mutation
  const testApiMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/third-party-apis/${id}/test`, { method: 'POST' }),
    onSuccess: (result: any) => {
      toast({
        title: result.success ? 'Test Successful' : 'Test Failed',
        description: result.success 
          ? `API is working. Latency: ${result.latency}ms` 
          : `Test failed: ${result.error}`,
        variant: result.success ? 'default' : 'destructive'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to test API connectivity.',
        variant: 'destructive'
      });
    }
  });

  // Health check mutation
  const healthCheckMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/third-party-apis/${id}/health-check`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/third-party-apis'] });
      toast({
        title: 'Health Check Complete',
        description: 'API health status updated.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Health Check Failed',
        description: error.message || 'Failed to perform health check.',
        variant: 'destructive'
      });
    }
  });

  // Forms
  const createForm = useForm<ApiConfigForm>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      isEnabled: true,
      rateLimit: 60,
      costPerRequest: 0,
      monthlyBudget: 0
    }
  });

  const editForm = useForm<ApiConfigForm>({
    resolver: zodResolver(apiConfigSchema.partial())
  });

  // Set edit form values when selectedApi changes
  useEffect(() => {
    if (selectedApi && isEditDialogOpen) {
      editForm.reset({
        apiName: selectedApi.apiName,
        displayName: selectedApi.displayName,
        description: selectedApi.description,
        baseUrl: selectedApi.baseUrl,
        isEnabled: selectedApi.isEnabled,
        costPerRequest: selectedApi.costPerRequest,
        monthlyBudget: selectedApi.monthlyBudget
      });
    }
  }, [selectedApi, isEditDialogOpen, editForm]);

  const handleCreateSubmit = (data: ApiConfigForm) => {
    createApiMutation.mutate(data);
  };

  const handleEditSubmit = (data: Partial<ApiConfigForm>) => {
    if (selectedApi) {
      updateApiMutation.mutate({ id: selectedApi.id, data });
    }
  };

  const handleDelete = (api: ThirdPartyApi) => {
    if (confirm(`Are you sure you want to delete the ${api.displayName} API configuration?`)) {
      deleteApiMutation.mutate(api.id);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatUsage = (count: number | undefined) => {
    if (count === undefined || count === null) return '0';
    return count.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Failed to load API configurations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="third-party-integrations">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Third-Party Integrations</h1>
          <p className="text-muted-foreground">
            Manage external API integrations for calendar services, SMS, and other third-party providers.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-api">
              <Plus className="h-4 w-4 mr-2" />
              Add API Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New API Configuration</DialogTitle>
              <DialogDescription>
                Configure a new third-party API integration.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="apiName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="keybit" data-testid="input-api-name" />
                        </FormControl>
                        <FormDescription>
                          Internal identifier for the API
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Keybit Calendar API" data-testid="input-display-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Persian calendar conversion service" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://api.keybit.ir" data-testid="input-base-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showApiKey ? "text" : "password"}
                            placeholder="Enter API key" 
                            data-testid="input-api-key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Limit (req/min)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            placeholder="60"
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-rate-limit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="costPerRequest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost per Request ($)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.0001"
                            placeholder="0.001"
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-cost-per-request"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="monthlyBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Budget ($)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            placeholder="100"
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-monthly-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable API</FormLabel>
                        <FormDescription>
                          Enable this API configuration for use in the application
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createApiMutation.isPending}
                    data-testid="button-save"
                  >
                    {createApiMutation.isPending ? 'Creating...' : 'Create API Configuration'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {apis?.map((api) => (
              <Card key={api.id} data-testid={`api-card-${api.apiName}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {api.displayName}
                        <Badge variant={api.isEnabled ? "default" : "secondary"}>
                          {api.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant={api.isHealthy ? "default" : "destructive"}>
                          {api.isHealthy ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          {api.isHealthy ? "Healthy" : "Unhealthy"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{api.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testApiMutation.mutate(api.id)}
                        disabled={testApiMutation.isPending}
                        data-testid={`button-test-${api.apiName}`}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => healthCheckMutation.mutate(api.id)}
                        disabled={healthCheckMutation.isPending}
                        data-testid={`button-health-check-${api.apiName}`}
                      >
                        <Activity className="h-4 w-4 mr-1" />
                        Health Check
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApi(api);
                          setIsEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-${api.apiName}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(api)}
                        disabled={deleteApiMutation.isPending}
                        data-testid={`button-delete-${api.apiName}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{formatUsage(api.usageCount)}</p>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatUsage(api.usageCountMonth)}</p>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{api.errorCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(api.currentMonthlyCost)}</p>
                      <p className="text-sm text-muted-foreground">Monthly Cost</p>
                    </div>
                  </div>
                  
                  {api.lastErrorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Last Error:</strong> {api.lastErrorMessage}
                      </p>
                      {api.lastErrorAt && (
                        <p className="text-xs text-red-600 mt-1">
                          {new Date(api.lastErrorAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Analytics
                </CardTitle>
                <CardDescription>
                  API usage statistics and cost analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {formatUsage(apis?.reduce((sum, api) => sum + (api.usageCount || 0), 0))}
                    </p>
                    <p className="text-muted-foreground">Total API Calls</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {formatUsage(apis?.reduce((sum, api) => sum + (api.usageCountMonth || 0), 0))}
                    </p>
                    <p className="text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {formatCurrency(apis?.reduce((sum, api) => sum + (api.currentMonthlyCost || 0), 0))}
                    </p>
                    <p className="text-muted-foreground">Total Monthly Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global API Settings</CardTitle>
              <CardDescription>
                Configure global settings for all third-party API integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Health Checks</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically perform health checks every 5 minutes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Fail-safe Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Fall back to local implementations when APIs are unavailable
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Cost Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when monthly costs exceed budget
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit API Configuration</DialogTitle>
            <DialogDescription>
              Update the configuration for {selectedApi?.displayName}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-input-display-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="edit-input-base-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="edit-input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="costPerRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Request ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.0001"
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          data-testid="edit-input-cost-per-request"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="monthlyBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Budget ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          data-testid="edit-input-monthly-budget"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable API</FormLabel>
                      <FormDescription>
                        Enable this API configuration for use in the application
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="edit-switch-enabled"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="edit-button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateApiMutation.isPending}
                  data-testid="edit-button-save"
                >
                  {updateApiMutation.isPending ? 'Updating...' : 'Update Configuration'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}