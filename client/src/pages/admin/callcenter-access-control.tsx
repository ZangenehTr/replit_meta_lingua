import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Users, 
  Shield, 
  UserPlus, 
  Clock, 
  Target, 
  XCircle,
  CheckCircle,
  Settings,
  Edit,
  Save
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';

interface CallCenterUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  callCenterPermissions?: CallCenterPermissions;
}

interface CallCenterPermissions {
  canAccessContactDesk: boolean;
  canAccessNewIntake: boolean;
  canAccessNoResponse: boolean;
  canAccessFollowUp: boolean;
  canAccessLevelAssessment: boolean;
  canAccessWithdrawal: boolean;
  canManageLeads: boolean;
  canMakeCalls: boolean;
  canViewReports: boolean;
  canManageCampaigns: boolean;
  accessLevel: 'read' | 'write' | 'admin';
}

const defaultPermissions: CallCenterPermissions = {
  canAccessContactDesk: true,
  canAccessNewIntake: false,
  canAccessNoResponse: false,
  canAccessFollowUp: false,
  canAccessLevelAssessment: false,
  canAccessWithdrawal: false,
  canManageLeads: false,
  canMakeCalls: false,
  canViewReports: false,
  canManageCampaigns: false,
  accessLevel: 'read'
};

export default function CallCenterAccessControl() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<CallCenterUser | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<CallCenterPermissions>(defaultPermissions);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch users with call center related roles
  const { data: callCenterUsers = [], isLoading } = useQuery<CallCenterUser[]>({
    queryKey: ['/api/admin/callcenter-users'],
    queryFn: async () => {
      const users = await apiRequest('/api/users');
      return users.filter((user: CallCenterUser) => 
        ['Admin', 'Supervisor', 'Call Center Agent', 'Mentor'].includes(user.role)
      ).map((user: CallCenterUser) => ({
        ...user,
        callCenterPermissions: user.callCenterPermissions || defaultPermissions
      }));
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: CallCenterPermissions }) => {
      return apiRequest(`/api/admin/callcenter-permissions/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/callcenter-users'] });
      toast({
        title: t('common:toast.success'),
        description: 'Call center permissions updated successfully'
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common:toast.error'),
        description: 'Failed to update permissions'
      });
    }
  });

  const handleEditPermissions = (user: CallCenterUser) => {
    setSelectedUser(user);
    setEditingPermissions(user.callCenterPermissions || defaultPermissions);
    setIsEditDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: editingPermissions
    });
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-green-100 text-green-800', 
      admin: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[level as keyof typeof colors]}>{level.toUpperCase()}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      'Admin': 'bg-red-100 text-red-800',
      'Supervisor': 'bg-purple-100 text-purple-800',
      'Call Center Agent': 'bg-blue-100 text-blue-800',
      'Mentor': 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[role as keyof typeof colors]}>{role}</Badge>;
  };

  return (
    <AppLayout>
      <div data-testid="callcenter-access-control">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('admin:callCenterAccessControl.title', 'Call Center Access Control')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:callCenterAccessControl.description', 'Manage access levels and permissions for call center workflow stages')}
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users & Permissions
            </TabsTrigger>
            <TabsTrigger value="roles" data-testid="tab-roles">
              <Shield className="w-4 h-4 mr-2" />
              Role Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Call Center Users</CardTitle>
                <CardDescription>
                  Manage individual user permissions for call center workflow stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div>Loading users...</div>
                  ) : (
                    callCenterUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`user-card-${user.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="flex gap-2 mt-1">
                              {getRoleBadge(user.role)}
                              {getAccessLevelBadge(user.callCenterPermissions?.accessLevel || 'read')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-muted-foreground">
                            {Object.values(user.callCenterPermissions || defaultPermissions)
                              .filter(Boolean).length - 1} permissions enabled
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPermissions(user)}
                            data-testid={`edit-permissions-${user.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Permissions
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Role Permission Templates</CardTitle>
                <CardDescription>
                  Quick setup templates for different call center roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Call Center Agent</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Basic access to handle incoming calls and leads
                    </p>
                    <div className="space-y-1 text-xs">
                      <div>✓ Contact Desk</div>
                      <div>✓ New Intake</div>
                      <div>✓ Follow Up</div>
                      <div>✓ Make Calls</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Supervisor</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Full access to all workflow stages and reporting
                    </p>
                    <div className="space-y-1 text-xs">
                      <div>✓ All Workflow Stages</div>
                      <div>✓ Lead Management</div>
                      <div>✓ View Reports</div>
                      <div>✓ Manage Campaigns</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Mentor</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Limited access for mentoring and level assessment
                    </p>
                    <div className="space-y-1 text-xs">
                      <div>✓ Level Assessment</div>
                      <div>✓ Follow Up</div>
                      <div>✓ View Reports</div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Permissions Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Edit Call Center Permissions for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Access Level */}
              <div>
                <Label className="text-base font-medium">Access Level</Label>
                <Select
                  value={editingPermissions.accessLevel}
                  onValueChange={(value: 'read' | 'write' | 'admin') =>
                    setEditingPermissions(prev => ({ ...prev, accessLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="write">Read & Write</SelectItem>
                    <SelectItem value="admin">Full Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workflow Stage Permissions */}
              <div>
                <Label className="text-base font-medium mb-4 block">Workflow Stage Access</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'canAccessContactDesk', label: 'Contact Desk', icon: Phone },
                    { key: 'canAccessNewIntake', label: 'New Intake', icon: UserPlus },
                    { key: 'canAccessNoResponse', label: 'No Response', icon: Clock },
                    { key: 'canAccessFollowUp', label: 'Follow Up', icon: Target },
                    { key: 'canAccessLevelAssessment', label: 'Level Assessment', icon: CheckCircle },
                    { key: 'canAccessWithdrawal', label: 'Withdrawal', icon: XCircle }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={editingPermissions[key as keyof CallCenterPermissions] as boolean}
                        onCheckedChange={(checked) =>
                          setEditingPermissions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Icon className="w-4 h-4" />
                      <Label>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Permissions */}
              <div>
                <Label className="text-base font-medium mb-4 block">Additional Permissions</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'canManageLeads', label: 'Manage Leads' },
                    { key: 'canMakeCalls', label: 'Make Calls' },
                    { key: 'canViewReports', label: 'View Reports' },
                    { key: 'canManageCampaigns', label: 'Manage Campaigns' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={editingPermissions[key as keyof CallCenterPermissions] as boolean}
                        onCheckedChange={(checked) =>
                          setEditingPermissions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePermissions}
                  disabled={updatePermissionsMutation.isPending}
                  data-testid="save-permissions"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}