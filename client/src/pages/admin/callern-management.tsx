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
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    teacherId: '',
    hourlyRate: '',
    availableHours: []
  });
  const [newPackageForm, setNewPackageForm] = useState({
    packageName: '',
    totalHours: '',
    price: '',
    description: '',
    isActive: true
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
        title: t('common:toast.success'),
        description: t('common:toast.availabilityUpdated')
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/callern/teacher-availability'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.error'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create Callern package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      return await apiRequest('/api/admin/callern/packages', {
        method: 'POST',
        body: packageData
      });
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: t('admin:callernManagement.packageCreatedSuccessfully')
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/callern/packages'] });
      setIsCreatePackageDialogOpen(false);
      setNewPackageForm({
        packageName: '',
        totalHours: '',
        price: '',
        description: '',
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.error'),
        description: error.message || t('admin:callernManagement.packageCreationFailed'),
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
        title: t('common:toast.success'),
        description: t('common:toast.teacherAddedToCallern')
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
          title: t('admin:callernManagement.scheduleConflict'),
          description: error.message,
          variant: "destructive",
          duration: 7000 // Longer duration for conflict messages
        });
      } else if (error.message.includes('Authentication failed')) {
        toast({
          title: t('admin:callernManagement.authenticationError'),
          description: t('admin:callernManagement.pleaseLoginAgain'),
          variant: "destructive"
        });
        // Redirect to login
        window.location.href = '/api/login';
      } else {
        toast({
          title: t('common:toast.error'),
          description: error.message || t('common:toast.teacherAddFailed'),
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
        title: t('common:toast.error'),
        description: t('common:toast.selectTeacher'),
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

  // Check if user has admin or supervisor access (case-insensitive)
  const normalizedRole = user?.role?.toLowerCase();
  if (user && !['admin', 'supervisor'].includes(normalizedRole)) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 p-4 sm:p-6 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">{t('admin:callernManagement.accessDenied')}</CardTitle>
            <CardDescription>
              {t('admin:callernManagement.adminSupervisorOnly')} {t('admin:callernManagement.yourCurrentRole')}: {user.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('admin:callernManagement.pleaseLoginAgain')}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/login'}
            >
              {t('admin:callernManagement.switchAccount')}
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
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{t('admin:callernManagement.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:callernManagement.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 border-purple-200">
            <Phone className="h-3 w-3" />
            <span className="hidden sm:inline">{Array.isArray(teacherAvailability) ? teacherAvailability.filter(t => t.isOnline)?.length : 0} {t('admin:callernManagement.online')}</span>
            <span className="sm:hidden">{Array.isArray(teacherAvailability) ? teacherAvailability.filter(t => t.isOnline)?.length : 0}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 border-indigo-200">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">{Array.isArray(teacherAvailability) ? teacherAvailability.length : 0} {t('common:total')}</span>
            <span className="sm:hidden">{Array.isArray(teacherAvailability) ? teacherAvailability.length : 0}</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="availability" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">{t('admin:callernManagement.teacherAvailability')}</span>
            <span className="sm:hidden">{t('admin:callernManagement.availableTeachers')}</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">{t('admin:callernManagement.callernPackages')}</span>
            <span className="sm:hidden">{t('admin:callernManagement.callernPackages')}</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">{t('admin:callernManagement.teacherManagement')}</span>
            <span className="sm:hidden">{t('admin:callernManagement.teacherManagement')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAvailability ? (
              <div className="col-span-3 text-center py-8">{t('common:loading')}</div>
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
                          {teacher.isOnline ? t('admin:callernManagement.online') : t('admin:callernManagement.offline')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('admin:callernManagement.toggleOnlineStatus')}</Label>
                      <Switch
                        checked={teacher.isOnline}
                        onCheckedChange={() => toggleTeacherOnline(teacher.teacherId, teacher.isOnline)}
                        disabled={updateAvailabilityMutation.isPending}
                      />
                    </div>
                    
                    {teacher.hourlyRate && (
                      <div className="text-sm flex items-center gap-1">
                        <span className="text-gray-500">{t('admin:callernManagement.hourlyRate')}:</span>
                        <span className="font-medium">{teacher.hourlyRate} IRR</span>
                      </div>
                    )}
                    
                    {teacher.lastActiveAt && (
                      <div className="text-sm text-gray-500">
                        {t('admin:callernManagement.lastActive')}: {new Date(teacher.lastActiveAt).toLocaleDateString()}
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
                      <Settings className="h-3 w-3" />
                      <span>{t('admin:callernManagement.configure')}</span>
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">{t('admin:callernManagement.noAvailabilityData')}</div>
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
                    {t('admin:callernManagement.addTeacherToCallern')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('admin:callernManagement.addTeacherToCallern')}</DialogTitle>
                    <DialogDescription>
                      {t('admin:callernManagement.enableForOnDemandCalls')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('admin:callernManagement.selectATeacher')}</Label>
                      <Select 
                        value={newTeacherForm.teacherId} 
                        onValueChange={(value) => setNewTeacherForm(prev => ({...prev, teacherId: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:callernManagement.chooseTeacher')} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingTeachers ? (
                            <SelectItem value="loading" disabled>{t('admin:callernManagement.loadingTeachers')}</SelectItem>
                          ) : (
                            Array.isArray(availableTeachers) && availableTeachers.length > 0 ? 
                            availableTeachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.firstName} {teacher.lastName}
                              </SelectItem>
                            )) : (
                              <SelectItem value="no-teachers" disabled>{t('admin:callernManagement.noTeachersAvailable')}</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('admin:callernManagement.hourlyRate')} (IRR)</Label>
                      <Input 
                        type="number" 
                        placeholder="500000"
                        value={newTeacherForm.hourlyRate}
                        onChange={(e) => setNewTeacherForm(prev => ({...prev, hourlyRate: e.target.value}))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('admin:callernManagement.availableHours')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="morning"
                            checked={newTeacherForm.availableHours.includes('08:00-12:00')}
                            onChange={(e) => handleAvailableHourChange('morning', e.target.checked)}
                          />
                          <Label htmlFor="morning" className="text-sm">{t('admin:callernManagement.morning')} (08:00-12:00)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="afternoon"
                            checked={newTeacherForm.availableHours.includes('12:00-18:00')}
                            onChange={(e) => handleAvailableHourChange('afternoon', e.target.checked)}
                          />
                          <Label htmlFor="afternoon" className="text-sm">{t('admin:callernManagement.afternoon')} (12:00-18:00)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="evening"
                            checked={newTeacherForm.availableHours.includes('18:00-24:00')}
                            onChange={(e) => handleAvailableHourChange('evening', e.target.checked)}
                          />
                          <Label htmlFor="evening" className="text-sm">{t('admin:callernManagement.evening')} (18:00-24:00)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id="overnight"
                            checked={newTeacherForm.availableHours.includes('00:00-08:00')}
                            onChange={(e) => handleAvailableHourChange('overnight', e.target.checked)}
                          />
                          <Label htmlFor="overnight" className="text-sm">{t('admin:callernManagement.overnight')} (00:00-08:00)</Label>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {t('admin:callernManagement.scheduleConflictTip')}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={handleSubmitNewTeacher}
                      disabled={addTeacherMutation.isPending}
                    >
                      {addTeacherMutation.isPending ? t('common:loading') : t('admin:callernManagement.addTeacher')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          {/* Add Package Button */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('admin:callernManagement.callernPackages')}</CardTitle>
                  <CardDescription>{t('admin:callernManagement.managePackages')}</CardDescription>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setIsCreatePackageDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t('admin:callernManagement.createPackage')}
                </Button>
              </div>
            </CardHeader>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingPackages ? (
              <div className="col-span-3 text-center py-8">{t('common:loading')}</div>
            ) : (
              Array.isArray(callernPackages) && callernPackages?.length > 0 ? callernPackages?.map((pkg) => (
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
              )) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-muted-foreground">{t('admin:callernManagement.noPackagesAvailable')}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t('admin:callernManagement.createYourFirstPackage')}</p>
                </div>
              )
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
                        <Plus className="h-3 w-3" />
                        <span>Assign</span>
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Package Dialog */}
      <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin:callernManagement.createPackage')}</DialogTitle>
            <DialogDescription>
              {t('admin:callernManagement.createPackageDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin:callernManagement.packageName')}</Label>
              <Input 
                placeholder={t('admin:callernManagement.packageNamePlaceholder')}
                value={newPackageForm.packageName}
                onChange={(e) => setNewPackageForm(prev => ({...prev, packageName: e.target.value}))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('admin:callernManagement.hours')}</Label>
              <Input 
                type="number" 
                placeholder="10"
                value={newPackageForm.totalHours}
                onChange={(e) => setNewPackageForm(prev => ({...prev, totalHours: e.target.value}))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('admin:callernManagement.price')} (IRR)</Label>
              <Input 
                type="number" 
                placeholder="5000000"
                value={newPackageForm.price}
                onChange={(e) => setNewPackageForm(prev => ({...prev, price: e.target.value}))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('admin:callernManagement.description')}</Label>
              <Input 
                placeholder={t('admin:callernManagement.descriptionPlaceholder')}
                value={newPackageForm.description}
                onChange={(e) => setNewPackageForm(prev => ({...prev, description: e.target.value}))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="package-active"
                checked={newPackageForm.isActive}
                onCheckedChange={(checked) => setNewPackageForm(prev => ({...prev, isActive: checked}))}
              />
              <Label htmlFor="package-active">{t('admin:callernManagement.active')}</Label>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => {
                if (!newPackageForm.packageName || !newPackageForm.totalHours || !newPackageForm.price) {
                  toast({
                    title: t('common:toast.error'),
                    description: t('admin:callernManagement.fillRequiredFields'),
                    variant: "destructive"
                  });
                  return;
                }
                createPackageMutation.mutate({
                  packageName: newPackageForm.packageName,
                  totalHours: parseInt(newPackageForm.totalHours),
                  price: parseFloat(newPackageForm.price),
                  description: newPackageForm.description,
                  isActive: newPackageForm.isActive
                });
              }}
              disabled={createPackageMutation.isPending}
            >
              {createPackageMutation.isPending ? t('common:loading') : t('admin:callernManagement.createPackage')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="config-morning"
                      defaultChecked={selectedTeacher.availableHours?.includes('08:00-12:00')}
                    />
                    <Label htmlFor="config-morning" className="text-sm">Morning (08:00-12:00)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="config-afternoon"
                      defaultChecked={selectedTeacher.availableHours?.includes('12:00-18:00')}
                    />
                    <Label htmlFor="config-afternoon" className="text-sm">Afternoon (12:00-18:00)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="config-evening"
                      defaultChecked={selectedTeacher.availableHours?.includes('18:00-24:00')}
                    />
                    <Label htmlFor="config-evening" className="text-sm">Evening (18:00-24:00)</Label>
                  </div>
                  <div className="flex items-center gap-2">
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