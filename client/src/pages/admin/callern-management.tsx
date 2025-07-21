import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Phone, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Settings,
  AlertCircle,
  Shield,
  Timer,
  UserCheck
} from "lucide-react";

export function CallernManagement() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    teacherId: '',
    hourlyRate: '',
    availableHours: []
  });

  // Fetch teacher availability data
  const { data: teacherAvailability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['/api/admin/callern/teacher-availability'],
    queryFn: async () => {
      const response = await fetch('/api/admin/callern/teacher-availability', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`);
      }
      const data = await response.json();
      console.log('Teacher availability data:', data);
      return data;
    }
  });

  // Fetch available teachers
  const { data: availableTeachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['/api/admin/callern/available-teachers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/callern/available-teachers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.error('Failed to fetch teachers:', response.status, response.statusText);
        throw new Error(`Failed to fetch teachers: ${response.status}`);
      }
      const teachers = await response.json();
      console.log('Available teachers data:', teachers);
      return teachers;
    }
  });

  // Fetch Callern packages
  const { data: callernPackages, isLoading: loadingPackages } = useQuery({
    queryKey: ['/api/admin/callern/packages'],
    queryFn: async () => {
      const response = await fetch('/api/admin/callern/packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch packages: ${response.status}`);
      }
      return response.json();
    }
  });

  // Update teacher availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ teacherId, updates }: { teacherId: number; updates: any }) => {
      return await apiRequest(`/api/admin/callern/teacher-availability/${teacherId}`, {
        method: 'PUT',
        body: updates
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher availability updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/callern/teacher-availability'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add teacher to Callern mutation
  const addTeacherMutation = useMutation({
    mutationFn: async (teacherData: any) => {
      return await apiRequest('/api/admin/callern/teacher-availability', {
        method: 'POST',
        body: teacherData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher added to Callern successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/callern/teacher-availability'] });
      setIsAddDialogOpen(false);
      setNewTeacherForm({
        teacherId: '',
        hourlyRate: '',
        availableHours: []
      });
    },
    onError: (error: any) => {
      console.error('Add teacher error:', error);
      
      // Check if error message contains schedule conflict details
      if (error.message.includes('scheduled sessions:')) {
        toast({
          title: "Schedule Conflict - Cannot Add Teacher",
          description: error.message,
          variant: "destructive",
          duration: 7000 // Longer duration for conflict messages
        });
      } else if (error.message.includes('Authentication failed')) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
        // Redirect to login
        window.location.href = '/api/login';
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add teacher to Callern",
          variant: "destructive"
        });
      }
    }
  });

  const toggleTeacherOnline = (teacherId: number, currentStatus: boolean) => {
    console.log('Toggling teacher:', teacherId, 'from', currentStatus, 'to', !currentStatus);
    updateAvailabilityMutation.mutate({
      teacherId,
      updates: { isOnline: !currentStatus }
    });
  };

  const handleAvailableHourChange = (timeSlot: string, checked: boolean) => {
    const timeSlotMap = {
      'morning': '08:00-12:00',
      'afternoon': '12:00-18:00', 
      'evening': '18:00-24:00',
      'overnight': '00:00-08:00'
    };

    const timeRange = timeSlotMap[timeSlot];
    const newHours = checked 
      ? [...newTeacherForm.availableHours, timeRange]
      : newTeacherForm.availableHours.filter(hour => hour !== timeRange);
    
    setNewTeacherForm(prev => ({
      ...prev,
      availableHours: newHours
    }));
  };

  const handleSubmitNewTeacher = () => {
    if (!newTeacherForm.teacherId) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive"
      });
      return;
    }

    addTeacherMutation.mutate({
      teacherId: newTeacherForm.teacherId,
      hourlyRate: newTeacherForm.hourlyRate ? parseFloat(newTeacherForm.hourlyRate) : null,
      availableHours: newTeacherForm.availableHours
    });
  };

  const getOnlineStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getOnlineStatusIcon = (isOnline: boolean) => {
    return isOnline ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  // Check if user has admin or supervisor access
  if (user && !['Admin', 'Supervisor'].includes(user.role)) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 p-4 sm:p-6 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Only administrators and supervisors can access Callern Management. Your current role is: {user.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please log in with an admin or supervisor account to manage Callern settings.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/login'}
            >
              Switch Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Callern Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage teacher availability for on-demand video calls
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 border-purple-200">
            <Phone className="h-3 w-3" />
            <span className="hidden sm:inline">{Array.isArray(teacherAvailability) ? teacherAvailability.filter(t => t.isOnline)?.length : 0} Online</span>
            <span className="sm:hidden">{Array.isArray(teacherAvailability) ? teacherAvailability.filter(t => t.isOnline)?.length : 0}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 border-indigo-200">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">{Array.isArray(teacherAvailability) ? teacherAvailability.length : 0} Total</span>
            <span className="sm:hidden">{Array.isArray(teacherAvailability) ? teacherAvailability.length : 0}</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="availability" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Teacher Availability</span>
            <span className="sm:hidden">Availability</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Callern Packages</span>
            <span className="sm:hidden">Packages</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Duty Assignments</span>
            <span className="sm:hidden">Assignments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAvailability ? (
              <div className="col-span-3 text-center py-8">Loading teacher availability...</div>
            ) : (
              Array.isArray(teacherAvailability) ? teacherAvailability?.map((teacher) => (
                <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {teacher.teacherName} {teacher.teacherLastName}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {teacher.teacherEmail}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getOnlineStatusIcon(teacher.isOnline)}
                        <Badge className={getOnlineStatusColor(teacher.isOnline)}>
                          {teacher.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Available for Calls</Label>
                      <Switch
                        checked={teacher.isOnline}
                        onCheckedChange={() => toggleTeacherOnline(teacher.teacherId, teacher.isOnline)}
                        disabled={updateAvailabilityMutation.isPending}
                      />
                    </div>
                    
                    {teacher.hourlyRate && (
                      <div className="text-sm">
                        <span className="text-gray-500">Hourly Rate:</span>
                        <span className="font-medium ml-1">{teacher.hourlyRate} IRR</span>
                      </div>
                    )}
                    
                    {teacher.lastActiveAt && (
                      <div className="text-sm text-gray-500">
                        Last Active: {new Date(teacher.lastActiveAt).toLocaleDateString()}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {teacher.availableHours?.map((hours, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {hours}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setIsConfigDialogOpen(true);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">No teacher availability data.</div>
              )
            )}
          </div>
          
          {/* Add New Teacher Button */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Teacher to Callern
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Teacher to Callern</DialogTitle>
                    <DialogDescription>
                      Select a teacher to enable for on-demand Callern video calls
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Teacher</Label>
                      <Select 
                        value={newTeacherForm.teacherId} 
                        onValueChange={(value) => setNewTeacherForm(prev => ({...prev, teacherId: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingTeachers ? (
                            <SelectItem value="loading" disabled>Loading teachers...</SelectItem>
                          ) : (
                            Array.isArray(availableTeachers) && availableTeachers.length > 0 ? 
                            availableTeachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.firstName} {teacher.lastName}
                              </SelectItem>
                            )) : (
                              <SelectItem value="no-teachers" disabled>No teachers available</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hourly Rate (IRR)</Label>
                      <Input 
                        type="number" 
                        placeholder="500000"
                        value={newTeacherForm.hourlyRate}
                        onChange={(e) => setNewTeacherForm(prev => ({...prev, hourlyRate: e.target.value}))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Available Hours</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="morning"
                            checked={newTeacherForm.availableHours.includes('08:00-12:00')}
                            onChange={(e) => handleAvailableHourChange('morning', e.target.checked)}
                          />
                          <Label htmlFor="morning" className="text-sm">Morning (08:00-12:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="afternoon"
                            checked={newTeacherForm.availableHours.includes('12:00-18:00')}
                            onChange={(e) => handleAvailableHourChange('afternoon', e.target.checked)}
                          />
                          <Label htmlFor="afternoon" className="text-sm">Afternoon (12:00-18:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="evening"
                            checked={newTeacherForm.availableHours.includes('18:00-24:00')}
                            onChange={(e) => handleAvailableHourChange('evening', e.target.checked)}
                          />
                          <Label htmlFor="evening" className="text-sm">Evening (18:00-24:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="overnight"
                            checked={newTeacherForm.availableHours.includes('00:00-08:00')}
                            onChange={(e) => handleAvailableHourChange('overnight', e.target.checked)}
                          />
                          <Label htmlFor="overnight" className="text-sm">Overnight (00:00-08:00)</Label>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        💡 Tip: If you get schedule conflicts, try different hours that don't overlap with the teacher's existing classes
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={handleSubmitNewTeacher}
                      disabled={addTeacherMutation.isPending}
                    >
                      {addTeacherMutation.isPending ? 'Adding...' : 'Add Teacher'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingPackages ? (
              <div className="col-span-3 text-center py-8">Loading Callern packages...</div>
            ) : (
              Array.isArray(callernPackages) && callernPackages?.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Hours:</span>
                      <span className="font-medium">{pkg.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-medium">{pkg.price.toLocaleString()} IRR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge className={pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Overnight Duty Assignments
              </CardTitle>
              <CardDescription>
                Manage teacher assignments for 24/7 Callern coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                  <div>Sunday</div>
                  <div>Monday</div>
                  <div>Tuesday</div>
                  <div>Wednesday</div>
                  <div>Thursday</div>
                  <div>Friday</div>
                  <div>Saturday</div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, index) => (
                    <Card key={index} className="p-3">
                      <div className="text-xs text-gray-500 mb-2">Night Shift</div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">Ahmad R.</Badge>
                        <Badge variant="outline" className="text-xs">Sara H.</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Teacher Availability</DialogTitle>
            <DialogDescription>
              Update {selectedTeacher?.teacherName} {selectedTeacher?.teacherLastName}'s Callern settings
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hourly Rate (IRR)</Label>
                <Input 
                  type="number" 
                  defaultValue={selectedTeacher.hourlyRate || ''}
                  placeholder="500000"
                  id="config-hourly-rate"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Available Hours</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="config-morning"
                      defaultChecked={selectedTeacher.availableHours?.includes('08:00-12:00')}
                    />
                    <Label htmlFor="config-morning" className="text-sm">Morning (08:00-12:00)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="config-afternoon"
                      defaultChecked={selectedTeacher.availableHours?.includes('12:00-18:00')}
                    />
                    <Label htmlFor="config-afternoon" className="text-sm">Afternoon (12:00-18:00)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="config-evening"
                      defaultChecked={selectedTeacher.availableHours?.includes('18:00-24:00')}
                    />
                    <Label htmlFor="config-evening" className="text-sm">Evening (18:00-24:00)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="config-overnight"
                      defaultChecked={selectedTeacher.availableHours?.includes('00:00-08:00')}
                    />
                    <Label htmlFor="config-overnight" className="text-sm">Overnight (00:00-08:00)</Label>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => {
                  const hourlyRateInput = document.getElementById('config-hourly-rate') as HTMLInputElement;
                  const morningChecked = (document.getElementById('config-morning') as HTMLInputElement).checked;
                  const afternoonChecked = (document.getElementById('config-afternoon') as HTMLInputElement).checked;
                  const eveningChecked = (document.getElementById('config-evening') as HTMLInputElement).checked;
                  const overnightChecked = (document.getElementById('config-overnight') as HTMLInputElement).checked;
                  
                  const availableHours = [];
                  if (morningChecked) availableHours.push('08:00-12:00');
                  if (afternoonChecked) availableHours.push('12:00-18:00');
                  if (eveningChecked) availableHours.push('18:00-24:00');
                  if (overnightChecked) availableHours.push('00:00-08:00');
                  
                  updateAvailabilityMutation.mutate({
                    teacherId: selectedTeacher.teacherId,
                    updates: {
                      hourlyRate: hourlyRateInput.value ? parseFloat(hourlyRateInput.value) : null,
                      availableHours
                    }
                  });
                  
                  setIsConfigDialogOpen(false);
                }}
                disabled={updateAvailabilityMutation.isPending}
              >
                {updateAvailabilityMutation.isPending ? 'Updating...' : 'Update Configuration'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}