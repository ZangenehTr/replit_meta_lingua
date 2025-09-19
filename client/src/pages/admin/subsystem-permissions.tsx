import React, { useState } from "react";
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
    queryKey: ['/api/admin/role-permissions']
  });

  // Update local state when data changes
  React.useEffect(() => {
    if (backendPermissions && typeof backendPermissions === 'object') {
      setRolePermissions(backendPermissions as RolePermissions);
    }
  }, [backendPermissions]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
        {/* Simplified Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin:subsystemPermissions.title', 'Subsystem Permissions')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('admin:subsystemPermissions.description', 'Define role-based access to all platform subsystems and features')}
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {AVAILABLE_ROLES.length} Roles
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {getAllSubsystemIds().length} Subsystems
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Role Selection - Primary Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Users className="w-5 h-5" />
                  {t('admin:subsystemPermissions.selectRole', 'Select Role to Configure')}
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  {t('admin:subsystemPermissions.roleDescription', 'Choose a role to view and modify its subsystem access permissions')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {AVAILABLE_ROLES.map((role) => (
                    <button
                      key={role.key}
                      onClick={() => setActiveRole(role.key)}
                      className={`w-full p-4 rounded-lg border transition-all duration-200 ${
                        activeRole === role.key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      data-testid={`tab-role-${role.key.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${role.color}`} />
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {isRTL ? role.name : role.nameEn}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('admin:subsystemPermissions.permissionCount', '{{count}} permissions', { 
                                count: rolePermissions[role.key]?.subsystems?.length || 0 
                              })}
                            </div>
                          </div>
                        </div>
                        <Shield className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Current Role Statistics */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${currentRole?.color}`} />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {isRTL ? currentRole?.name : currentRole?.nameEn}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400">
                        {t('admin:subsystemPermissions.accessible', 'Accessible')}
                      </span>
                      <span className="font-medium">{stats.accessible}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 dark:text-red-400">
                        {t('admin:subsystemPermissions.restricted', 'Restricted')}
                      </span>
                      <span className="font-medium">{stats.restricted}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('admin:subsystemPermissions.total', 'Total')}
                      </span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subsystem Tree - Secondary Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                      <Building2 className="w-5 h-5" />
                      {t('admin:subsystemPermissions.subsystemAccess', 'Subsystem Access Configuration')}
                    </CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300 mt-1">
                      {t('admin:subsystemPermissions.subsystemDescription', 'Check the boxes to grant access to specific subsystems for the selected role')}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => resetDefaultsMutation.mutate()}
                      disabled={resetDefaultsMutation.isPending}
                      data-testid="button-reset-defaults"
                      className="bg-white/80 hover:bg-white border-green-200 text-green-800 hover:text-green-900"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('admin:subsystemPermissions.resetDefaults', 'Reset')}
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={() => savePermissionsMutation.mutate(rolePermissions)}
                      disabled={savePermissionsMutation.isPending}
                      data-testid="button-save-permissions"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t('admin:subsystemPermissions.savePermissions', 'Save')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[60vh] md:h-[70vh] w-full">
                  <div className="space-y-2" data-testid="subsystem-tree">
                    {renderSubsystemTree(SUBSYSTEM_TREE)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center gap-4 py-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => setRolePermissions(DEFAULT_ROLE_PERMISSIONS)}
            data-testid="button-discard-changes"
            className="px-8"
          >
            {t('common:discard', 'Discard Changes')}
          </Button>
          
          <Button 
            onClick={() => savePermissionsMutation.mutate(rolePermissions)}
            disabled={savePermissionsMutation.isPending}
            data-testid="button-save-final"
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {savePermissionsMutation.isPending 
              ? t('common:saving', 'Saving...') 
              : t('common:saveChanges', 'Save All Changes')
            }
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}