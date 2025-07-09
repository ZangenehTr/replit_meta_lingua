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
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Fetch teacher availability data
  const { data: teacherAvailability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['/api/admin/callern/teacher-availability'],
  });

  // Fetch available teachers
  const { data: availableTeachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['/api/admin/callern/available-teachers'],
  });

  // Fetch Callern packages
  const { data: callernPackages, isLoading: loadingPackages } = useQuery({
    queryKey: ['/api/admin/callern/packages'],
  });

  // Update teacher availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ teacherId, updates }: { teacherId: number; updates: any }) => {
      const response = await fetch(`/api/admin/callern/teacher-availability/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update teacher availability');
      }

      return response.json();
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

  const toggleTeacherOnline = (teacherId: number, currentStatus: boolean) => {
    updateAvailabilityMutation.mutate({
      teacherId,
      updates: { isOnline: !currentStatus }
    });
  };

  const getOnlineStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getOnlineStatusIcon = (isOnline: boolean) => {
    return isOnline ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Callern Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage teacher availability for on-demand video calls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {teacherAvailability?.filter(t => t.isOnline)?.length || 0} Online
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teacherAvailability?.length || 0} Total Teachers
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="availability">Teacher Availability</TabsTrigger>
          <TabsTrigger value="packages">Callern Packages</TabsTrigger>
          <TabsTrigger value="assignments">Duty Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAvailability ? (
              <div className="col-span-3 text-center py-8">Loading teacher availability...</div>
            ) : (
              teacherAvailability?.map((teacher) => (
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
                      onClick={() => setSelectedTeacher(teacher)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Add New Teacher Button */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <Dialog>
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
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeachers?.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Hourly Rate (IRR)</Label>
                      <Input type="number" placeholder="500000" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Available Hours</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="morning" />
                          <Label htmlFor="morning" className="text-sm">Morning (08:00-12:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="afternoon" />
                          <Label htmlFor="afternoon" className="text-sm">Afternoon (12:00-18:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="evening" />
                          <Label htmlFor="evening" className="text-sm">Evening (18:00-24:00)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="overnight" />
                          <Label htmlFor="overnight" className="text-sm">Overnight (00:00-08:00)</Label>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full">
                      Add Teacher
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
              callernPackages?.map((pkg) => (
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
    </div>
  );
}