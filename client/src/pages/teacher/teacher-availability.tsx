import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed Calendar and Popover imports - now using native HTML5 date inputs
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Clock, Calendar as CalendarLucide, Globe, MapPin, Bell, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import DynamicForm from "@/components/forms/DynamicForm";

interface FormDefinition {
  id: number;
  title: string;
  fields: any[];
  [key: string]: any;
}

// Schema removed - now using dynamic form (Form ID: 8)

export default function TeacherAvailabilityPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

  // form and editForm removed - now using DynamicForm (Form ID: 8)

  // Fetch availability periods
  const { data: availabilityPeriods = [], isLoading } = useQuery({
    queryKey: ['/api/teacher/availability-periods'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/availability-periods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response.json();
    }
  });

  // Fetch Teacher Availability form definition (Form ID: 8)
  const { data: availabilityFormDefinition, isLoading: availabilityFormLoading } = useQuery<FormDefinition>({
    queryKey: ['/api/forms', 8],
    enabled: createDialogOpen || editDialogOpen,
  });

  // Create availability period mutation
  const createPeriodMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/teacher/availability-periods', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability period created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability-periods'] });
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create availability period",
        variant: "destructive"
      });
    }
  });

  // Update availability period mutation
  const updatePeriodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/teacher/availability-periods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability period updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability-periods'] });
      setEditDialogOpen(false);
      setSelectedPeriod(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability period",
        variant: "destructive"
      });
    }
  });

  // Delete availability period mutation
  const deletePeriodMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/teacher/availability-periods/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability period deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability-periods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete availability period",
        variant: "destructive"
      });
    }
  });

  // Async handlers for DynamicForm
  const handleCreatePeriod = async (data: any) => {
    return createPeriodMutation.mutateAsync(data);
  };

  const handleUpdatePeriod = async (data: any) => {
    if (!selectedPeriod) throw new Error("No period selected");
    return updatePeriodMutation.mutateAsync({ id: selectedPeriod.id, data });
  };

  const handleEdit = (period: any) => {
    setSelectedPeriod(period);
    setEditDialogOpen(true);
  };

  const handleDelete = (periodId: number) => {
    if (confirm('Are you sure you want to delete this availability period?')) {
      deletePeriodMutation.mutate(periodId);
    }
  };

  const getTimeDivisionIcon = (division: string) => {
    switch (division) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';
      case 'full-day': return '🌞';
      default: return '⏰';
    }
  };

  const getClassFormatIcon = (format: string) => {
    switch (format) {
      case 'online': return <Globe className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      case 'hybrid': return <Users className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getClassFormatColor = (format: string) => {
    switch (format) {
      case 'online': return 'bg-blue-100 text-blue-800';
      case 'in-person': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const timeDivisions = [
    { value: 'morning', label: 'Morning (6:00 AM - 12:00 PM)' },
    { value: 'afternoon', label: 'Afternoon (12:00 PM - 6:00 PM)' },
    { value: 'evening', label: 'Evening (6:00 PM - 11:00 PM)' },
    { value: 'full-day', label: 'Full Day (6:00 AM - 11:00 PM)' }
  ];

  const classFormats = [
    { value: 'online', label: 'Online Classes' },
    { value: 'in-person', label: 'In-Person Classes' },
    { value: 'hybrid', label: 'Hybrid (Online + In-Person)' }
  ];

  const AvailabilityForm = ({ form, onSubmit, isLoading }: any) => {
    console.log('AvailabilityForm rendered with form values:', form.getValues());
    return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      console.log('=== NATIVE DATE INPUT START ===');
                      console.log('Input value:', e.target.value);
                      if (e.target.value) {
                        const newDate = new Date(e.target.value);
                        console.log('Parsed date:', newDate);
                        field.onChange(newDate);
                        form.clearErrors('periodStartDate');
                        console.log('Form updated successfully');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      console.log('=== NATIVE DATE INPUT END ===');
                      console.log('Input value:', e.target.value);
                      if (e.target.value) {
                        const newDate = new Date(e.target.value);
                        console.log('Parsed date:', newDate);
                        field.onChange(newDate);
                        form.clearErrors('periodEndDate');
                        console.log('Form updated successfully');
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Week</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeDivision"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Division</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time division" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeDivisions.map((division) => (
                      <SelectItem key={division.value} value={division.value}>
                        {division.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="classFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Format</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specificHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specific Hours (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g., 9:00 AM - 11:00 AM, 2:00 PM - 4:00 PM"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </form>
    </Form>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Availability Management</h1>
            <p className="text-gray-600">Set your teaching availability periods to inform supervisors and admins</p>
          </div>
          {/* Show header button only when there are existing periods */}
          {availabilityPeriods.length > 0 && (
            <Button className="mt-4 lg:mt-0" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Period
            </Button>
          )}
        </div>


        {/* Availability Periods List */}
        <div className="space-y-6">
          {availabilityPeriods.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarLucide className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No availability periods set</h3>
                <p className="text-gray-600 mb-4">Create your first availability period to let supervisors know when you're available</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Period
                </Button>
              </CardContent>
            </Card>
          ) : (
            availabilityPeriods.map((period: any) => (
              <Card key={period.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getTimeDivisionIcon(period.timeDivision)}</div>
                      <div>
                        <CardTitle className="text-lg">{period.dayOfWeek}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className={getClassFormatColor(period.classFormat)}>
                            <span className="flex items-center space-x-1">
                              {getClassFormatIcon(period.classFormat)}
                              <span>{period.classFormat}</span>
                            </span>
                          </Badge>
                          <Badge variant="secondary">
                            {period.timeDivision}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(period)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(period.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Period Duration</Label>
                      <p className="text-sm text-gray-900">
                        {format(new Date(period.periodStartDate), 'PPP')} - {format(new Date(period.periodEndDate), 'PPP')}
                      </p>
                    </div>
                    {period.specificHours && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Specific Hours</Label>
                        <p className="text-sm text-gray-900">{period.specificHours}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {period.supervisorNotified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <Bell className="w-3 h-3 mr-1" />
                          Supervisor Notified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <Bell className="w-3 h-3 mr-1" />
                          Pending Notification
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {period.adminNotified ? (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <Users className="w-3 h-3 mr-1" />
                          Admin Notified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          Pending Notification
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Dialog - Available regardless of existing periods */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Availability Period</DialogTitle>
              <DialogDescription>
                Set your availability period to inform supervisors when you're available for teaching assignments.
              </DialogDescription>
            </DialogHeader>
            {availabilityFormLoading ? (
              <div className="py-8 text-center">Loading form...</div>
            ) : availabilityFormDefinition ? (
              <DynamicForm
                formDefinition={availabilityFormDefinition}
                onSubmit={handleCreatePeriod}
                disabled={createPeriodMutation.isPending}
                showTitle={false}
              />
            ) : (
              <div className="py-8 text-center text-red-600">Failed to load form definition</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Availability Period</DialogTitle>
              <DialogDescription>
                Update your availability period details and settings.
              </DialogDescription>
            </DialogHeader>
            {availabilityFormLoading ? (
              <div className="py-8 text-center">Loading form...</div>
            ) : availabilityFormDefinition ? (
              <DynamicForm
                formDefinition={availabilityFormDefinition}
                onSubmit={handleUpdatePeriod}
                disabled={updatePeriodMutation.isPending}
                showTitle={false}
                initialValues={selectedPeriod ? {
                  periodStartDate: new Date(selectedPeriod.periodStartDate),
                  periodEndDate: new Date(selectedPeriod.periodEndDate),
                  dayOfWeek: selectedPeriod.dayOfWeek,
                  timeDivision: selectedPeriod.timeDivision,
                  classFormat: selectedPeriod.classFormat,
                  specificHours: selectedPeriod.specificHours || ''
                } : undefined}
              />
            ) : (
              <div className="py-8 text-center text-red-600">Failed to load form definition</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}