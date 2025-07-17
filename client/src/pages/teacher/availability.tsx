import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

export default function TeacherAvailabilityPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teacher availability
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['/api/teacher/availability']
  });

  // Create availability slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: any) => {
      return apiRequest('/api/teacher/availability', {
        method: 'POST',
        body: JSON.stringify(slotData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      toast({
        title: 'Success',
        description: 'Availability slot created successfully'
      });
      setCreateDialogOpen(false);
      setNewSlot({ dayOfWeek: '', startTime: '', endTime: '', isActive: true });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create availability slot',
        variant: 'destructive'
      });
    }
  });

  // Update availability slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotId, updates }: { slotId: number; updates: any }) => {
      return apiRequest(`/api/teacher/availability/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      toast({
        title: 'Success',
        description: 'Availability slot updated successfully'
      });
      setEditDialogOpen(false);
      setSelectedSlot(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update availability slot',
        variant: 'destructive'
      });
    }
  });

  // Delete availability slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      return apiRequest(`/api/teacher/availability/${slotId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/availability'] });
      toast({
        title: 'Success',
        description: 'Availability slot deleted successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete availability slot',
        variant: 'destructive'
      });
    }
  });

  // Toggle slot active status
  const toggleSlotStatus = (slot: any) => {
    updateSlotMutation.mutate({
      slotId: slot.id,
      updates: { isActive: !slot.isActive }
    });
  };

  const handleCreateSlot = () => {
    if (!newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    createSlotMutation.mutate(newSlot);
  };

  const handleEditSlot = () => {
    if (!selectedSlot) return;

    updateSlotMutation.mutate({
      slotId: selectedSlot.id,
      updates: {
        dayOfWeek: selectedSlot.dayOfWeek,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        isActive: selectedSlot.isActive
      }
    });
  };

  const openEditDialog = (slot: any) => {
    setSelectedSlot({ ...slot });
    setEditDialogOpen(true);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayLabel = (day: string) => {
    return daysOfWeek.find(d => d.value === day)?.label || day;
  };

  // Group availability by day of week
  const groupedAvailability = daysOfWeek.map(day => ({
    day: day.value,
    label: day.label,
    slots: availability.filter((slot: any) => slot.dayOfWeek === day.value)
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Availability</h1>
            <p className="text-gray-600">Set your available time slots for administrators to assign classes</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 lg:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Availability Slot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Day of Week</Label>
                  <Select value={newSlot.dayOfWeek} onValueChange={(value) => setNewSlot({ ...newSlot, dayOfWeek: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSlot.isActive}
                    onCheckedChange={(checked) => setNewSlot({ ...newSlot, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSlot} disabled={createSlotMutation.isPending}>
                    {createSlotMutation.isPending ? 'Creating...' : 'Create Slot'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Information Alert */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How Availability Works</h3>
                <p className="text-blue-800 text-sm">
                  Teachers can only set monthly availability slots. Administrators will assign specific classes
                  to your available time slots. You cannot create classes directly - only set when you're available to teach.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <div className="grid grid-cols-1 gap-6">
          {groupedAvailability.map((dayGroup) => (
            <Card key={dayGroup.day}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    {dayGroup.label}
                  </div>
                  <Badge variant="outline">
                    {dayGroup.slots.length} slot{dayGroup.slots.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayGroup.slots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No availability set for {dayGroup.label}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayGroup.slots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          slot.isActive 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${slot.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {slot.isActive ? 'Available for class assignments' : 'Not available'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={slot.isActive}
                            onCheckedChange={() => toggleSlotStatus(slot)}
                            disabled={updateSlotMutation.isPending}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(slot)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteSlotMutation.mutate(slot.id)}
                            disabled={deleteSlotMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Availability Slot</DialogTitle>
            </DialogHeader>
            {selectedSlot && (
              <div className="space-y-4">
                <div>
                  <Label>Day of Week</Label>
                  <Select 
                    value={selectedSlot.dayOfWeek} 
                    onValueChange={(value) => setSelectedSlot({ ...selectedSlot, dayOfWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={selectedSlot.startTime}
                      onChange={(e) => setSelectedSlot({ ...selectedSlot, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={selectedSlot.endTime}
                      onChange={(e) => setSelectedSlot({ ...selectedSlot, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedSlot.isActive}
                    onCheckedChange={(checked) => setSelectedSlot({ ...selectedSlot, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSlot} disabled={updateSlotMutation.isPending}>
                    {updateSlotMutation.isPending ? 'Updating...' : 'Update Slot'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}