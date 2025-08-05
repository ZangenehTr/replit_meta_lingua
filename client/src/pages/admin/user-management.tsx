import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, UserPlus, Shield, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const { t } = useTranslation(['admin', 'common']);
  // Fetch roles dynamically from API
  const { data: ROLES = [] } = useQuery({
    queryKey: ['/api/admin/user-roles'],
    select: (data: any[]) => data.map(role => ({
      value: role.name,
      label: role.name,
      color: role.colorClass || 'bg-gray-100 text-gray-800'
    }))
  });
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'Student',
    phoneNumber: '',
    password: ''
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateDialogOpen(false);
      toast({
        title: t('common:toast.success'),
        description: t('common:toast.userCreated')
      });
      // Reset form
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'Student',
        phoneNumber: '',
        password: ''
      });
    },
    onError: (error: any) => {
      const isEmailDuplicateError = error.message?.includes("email already exists") || 
                                   error.message?.includes("already registered") ||
                                   error.message?.includes("duplicate key");
      
      toast({
        title: t('common:toast.error'),
        description: isEmailDuplicateError 
          ? t('common:toast.emailAlreadyExists')
          : error.message || t('common:toast.userCreateFailed'),
        variant: "destructive"
      });
    }
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  return (
    <div className="space-y-6" style={{direction: 'inherit', textAlign: 'inherit'}}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{direction: 'inherit'}}>
        <div style={{textAlign: 'inherit', direction: 'inherit'}}>
          <h1 className="text-3xl font-bold" style={{textAlign: 'inherit', direction: 'inherit'}}>{t('admin:users.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300" style={{textAlign: 'inherit', direction: 'inherit'}}>
            {t('admin:users.subtitle')}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('admin:users.createUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin:users.createNewUser')}</DialogTitle>
              <DialogDescription>
                {t('admin:users.fillInformation')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('admin:users.firstName')}</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder={t('admin:userManagement.firstName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('admin:userManagement.lastName')}</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder={t('admin:userManagement.lastName')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('admin:userManagement.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder={t('admin:userManagement.email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('admin:userManagement.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder={t('admin:userManagement.password')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('admin:userManagement.phoneNumber')} ({t('admin:userManagement.optional')})</Label>
                <Input
                  id="phoneNumber"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="+98 912 345 6789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('admin:userManagement.role')}</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {newUser.role === 'Mentor' && t('admin:userManagement.mentorDescription')}
                  {newUser.role === 'Teacher' && t('admin:userManagement.teacherDescription')}
                  {newUser.role === 'Admin' && t('admin:userManagement.adminDescription')}
                  {newUser.role === 'Student' && t('admin:userManagement.studentDescription')}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('admin:userManagement.cancel')}
              </Button>
              <Button 
                onClick={handleCreateUser} 
                disabled={createUserMutation.isPending || !newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password}
              >
                {createUserMutation.isPending ? t('admin:userManagement.creating') : t('admin:userManagement.createUser')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:userManagement.totalUsers')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">{t('admin:userManagement.allRolesCombined')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:userManagement.mentors')}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'Mentor').length}</div>
            <p className="text-xs text-muted-foreground">{t('admin:userManagement.availableForMatching')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:userManagement.teachers')}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'Teacher').length}</div>
            <p className="text-xs text-muted-foreground">{t('admin:userManagement.activeInstructors')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:userManagement.students')}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'Student').length}</div>
            <p className="text-xs text-muted-foreground">{t('admin:userManagement.registeredStudents')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin:userManagement.allUsers')}</CardTitle>
          <CardDescription>{t('admin:userManagement.searchAndFilter')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('admin:userManagement.searchUsers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ltr:pl-10 rtl:pr-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin:userManagement.allRoles')}</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="text-center py-8">{t('admin:userManagement.loadingUsers')}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('admin:userManagement.noUsersFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-start pb-3 font-medium">{t('admin:userManagement.user')}</th>
                    <th className="text-start pb-3 font-medium">{t('admin:userManagement.email')}</th>
                    <th className="text-start pb-3 font-medium">{t('admin:userManagement.role')}</th>
                    <th className="text-start pb-3 font-medium">{t('admin:userManagement.status')}</th>
                    <th className="text-start pb-3 font-medium">{t('admin:userManagement.createdDate')}</th>
                    <th className="text-end pb-3 font-medium">{t('admin:userManagement.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4">
                        <div className="flex items-center gap-3 rtl:flex-row-reverse">
                          <Avatar>
                            <AvatarFallback>
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            {user.phoneNumber && (
                              <p className="text-sm text-gray-500 flex items-center rtl:flex-row-reverse">
                                <Phone className="h-3 w-3 mx-1" />
                                {user.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="flex items-center text-sm rtl:flex-row-reverse">
                          <Mail className="h-3 w-3 mx-1 text-gray-400" />
                          {user.email}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? t('admin:userManagement.active') : t('admin:userManagement.inactive')}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-end">
                        <Button variant="ghost" size="sm" className="mx-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="mx-1">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}