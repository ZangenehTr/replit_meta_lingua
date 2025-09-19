import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  SUBSYSTEM_TREE, 
  DEFAULT_ROLE_PERMISSIONS, 
  SubsystemPermission,
  RolePermissions,
  getAllSubsystemIds 
} from "@shared/subsystem-permissions";
import * as Icons from "lucide-react";
import { Save, RefreshCw, Settings, Shield, Users, Building2 } from "lucide-react";

// Available roles - must match database role values
const AVAILABLE_ROLES = [
  { key: "Admin", name: "مدیر", nameEn: "Administrator", color: "bg-red-500" },
  { key: "Supervisor", name: "سرپرست", nameEn: "Supervisor", color: "bg-orange-500" },  
  { key: "Teacher/Tutor", name: "معلم", nameEn: "Teacher/Tutor", color: "bg-blue-500" },
  { key: "Call Center Agent", name: "پشتیبان", nameEn: "Call Center Agent", color: "bg-green-500" },
  { key: "Mentor", name: "منتور", nameEn: "Mentor", color: "bg-purple-500" },
  { key: "Student", name: "دانش‌آموز", nameEn: "Student", color: "bg-indigo-500" },
  { key: "Accountant", name: "حسابدار", nameEn: "Accountant", color: "bg-yellow-500" }
];

export default function SubsystemPermissions() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState<string>("Admin");
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get current role permissions from backend
  const { data: backendPermissions, isLoading } = useQuery({
    queryKey: ['/api/admin/role-permissions'],
    onSuccess: (data) => {
      if (data && typeof data === 'object') {
        setRolePermissions(data);
      }
    }
  });

  // Save role permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async (permissions: RolePermissions) => {
      return apiRequest('/api/admin/role-permissions', {
        method: 'POST',
        body: JSON.stringify(permissions)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/role-permissions'] });
      toast({
        title: t('admin:toast.success'),
        description: t('admin:subsystemPermissions.permissionsSaved', 'Role permissions have been successfully updated')
      });
    },
    onError: (error: any) => {
      toast({
        title: t('admin:toast.error'),
        description: error.message || t('admin:subsystemPermissions.permissionsSaveFailed', 'Failed to save permissions'),
        variant: "destructive"
      });
    }
  });

  // Reset to defaults mutation  
  const resetDefaultsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/role-permissions/reset', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/role-permissions'] });
      toast({
        title: t('admin:toast.success'),
        description: t('admin:subsystemPermissions.defaultsRestored', 'Default permissions have been restored')
      });
    }
  });

  // Toggle subsystem permission for a role
  const toggleSubsystemPermission = (roleKey: string, subsystemId: string) => {
    setRolePermissions(prev => {
      const currentPermissions = prev[roleKey]?.subsystems || [];
      const hasPermission = currentPermissions.includes(subsystemId);
      
      return {
        ...prev,
        [roleKey]: {
          subsystems: hasPermission 
            ? currentPermissions.filter(id => id !== subsystemId)
            : [...currentPermissions, subsystemId]
        }
      };
    });
  };

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Render subsystem tree
  const renderSubsystemTree = (subsystems: SubsystemPermission[], level = 0) => {
    return subsystems.map((subsystem) => {
      const hasChildren = subsystem.children && subsystem.children.length > 0;
      const isExpanded = expandedNodes.has(subsystem.id);
      const isLeaf = !hasChildren;
      const currentRolePermissions = rolePermissions[activeRole]?.subsystems || [];
      const hasPermission = isLeaf && currentRolePermissions.includes(subsystem.id);
      
      // Get icon component
      const IconComponent = subsystem.icon ? (Icons as any)[subsystem.icon] : Settings;

      return (
        <div key={subsystem.id} className={`${level > 0 ? 'ml-4' : ''}`}>
          <div className="flex items-center space-x-2 py-2">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleNodeExpansion(subsystem.id)}
                data-testid={`toggle-${subsystem.id}`}
              >
                {isExpanded ? '▼' : '▶'}
              </Button>
            )}
            
            {!hasChildren && <div className="w-6" />}
            
            <div className="flex items-center space-x-2 flex-1">
              <IconComponent className="h-4 w-4 text-gray-500" />
              
              {isLeaf ? (
                <Checkbox
                  id={`permission-${subsystem.id}`}
                  checked={hasPermission}
                  onCheckedChange={() => toggleSubsystemPermission(activeRole, subsystem.id)}
                  data-testid={`checkbox-${subsystem.id}`}
                />
              ) : (
                <div className="w-4" />
              )}
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {isRTL ? subsystem.name : subsystem.nameEn}
                </span>
                {subsystem.description && (
                  <span className="text-xs text-gray-500">{subsystem.description}</span>
                )}
              </div>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="border-l-2 border-gray-200 ml-3 pl-2">
              {renderSubsystemTree(subsystem.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Get statistics for current role
  const getCurrentRoleStats = () => {
    const currentPermissions = rolePermissions[activeRole]?.subsystems || [];
    const totalSubsystems = getAllSubsystemIds().length;
    const accessibleSubsystems = currentPermissions.length;
    
    return {
      total: totalSubsystems,
      accessible: accessibleSubsystems,
      restricted: totalSubsystems - accessibleSubsystems
    };
  };

  const stats = getCurrentRoleStats();
  const currentRole = AVAILABLE_ROLES.find(role => role.key === activeRole);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {t('admin:subsystemPermissions.title', 'Subsystem Permissions')}
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                {t('admin:subsystemPermissions.description', 'Define role-based access to all platform subsystems and features')}
              </p>
              <div className="mt-4 flex items-center gap-4 text-blue-100">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {AVAILABLE_ROLES.length} Roles
                </span>
                <span className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {getAllSubsystemIds().length} Subsystems
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => resetDefaultsMutation.mutate()}
                disabled={resetDefaultsMutation.isPending}
                data-testid="button-reset-defaults"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('admin:subsystemPermissions.resetDefaults', 'Reset to Defaults')}
              </Button>
              
              <Button 
                onClick={() => savePermissionsMutation.mutate(rolePermissions)}
                disabled={savePermissionsMutation.isPending}
                data-testid="button-save-permissions"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('admin:subsystemPermissions.savePermissions', 'Save Permissions')}
              </Button>
            </div>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('admin:subsystemPermissions.selectRole', 'Select Role to Configure')}
            </CardTitle>
            <CardDescription>
              {t('admin:subsystemPermissions.roleDescription', 'Choose a role to view and modify its subsystem access permissions')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1">
                {AVAILABLE_ROLES.map((role) => (
                  <TabsTrigger
                    key={role.key}
                    value={role.key}
                    className="flex flex-col items-center p-3 min-h-[80px]"
                    data-testid={`tab-role-${role.key.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Shield className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">
                      {isRTL ? role.name : role.nameEn}
                    </span>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {rolePermissions[role.key]?.subsystems?.length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Role Statistics */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentRole?.color}`} />
                    <span className="font-medium">
                      {isRTL ? currentRole?.name : currentRole?.nameEn}
                    </span>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      {t('admin:subsystemPermissions.accessible', 'Accessible')}: {stats.accessible}
                    </span>
                    <span className="text-red-600">
                      {t('admin:subsystemPermissions.restricted', 'Restricted')}: {stats.restricted}
                    </span>
                    <span className="text-gray-500">
                      {t('admin:subsystemPermissions.total', 'Total')}: {stats.total}
                    </span>
                  </div>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Subsystem Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t('admin:subsystemPermissions.subsystemAccess', 'Subsystem Access Configuration')}
            </CardTitle>
            <CardDescription>
              {t('admin:subsystemPermissions.subsystemDescription', 'Check the boxes to grant access to specific subsystems for the selected role')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-2" data-testid="subsystem-tree">
                {renderSubsystemTree(SUBSYSTEM_TREE)}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setRolePermissions(DEFAULT_ROLE_PERMISSIONS)}
            data-testid="button-discard-changes"
          >
            {t('common:discard', 'Discard Changes')}
          </Button>
          
          <Button 
            onClick={() => savePermissionsMutation.mutate(rolePermissions)}
            disabled={savePermissionsMutation.isPending}
            data-testid="button-save-final"
          >
            <Save className="w-4 h-4 mr-2" />
            {savePermissionsMutation.isPending 
              ? t('common:saving', 'Saving...') 
              : t('common:saveChanges', 'Save Changes')
            }
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}