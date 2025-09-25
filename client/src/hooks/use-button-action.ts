/**
 * Unified Button Action Hook
 * 
 * This hook provides a centralized way to handle all button actions with
 * proper RBAC enforcement, error handling, confirmation dialogs, and user feedback.
 */

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  actionRegistry,
  checkPermission,
  executeAction,
  type ActionPayload,
  type ActionConfig
} from "@/lib/action-registry";

interface ButtonActionOptions {
  actionType: string;
  payload?: ActionPayload;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  skipConfirmation?: boolean;
  customConfig?: Partial<ActionConfig>;
}

interface ButtonActionState {
  isLoading: boolean;
  isAuthorized: boolean;
  needsConfirmation: boolean;
}

export const useButtonAction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  // Main action execution mutation
  const actionMutation = useMutation({
    mutationFn: async ({ actionType, payload = {}, customConfig }: {
      actionType: string;
      payload?: ActionPayload;
      customConfig?: Partial<ActionConfig>;
    }) => {
      const actionConfig = { ...actionRegistry[actionType], ...customConfig };
      
      if (!actionConfig) {
        throw new Error(`Action type '${actionType}' not found in registry`);
      }

      // Check permissions
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!checkPermission(user.role, actionConfig)) {
        throw new Error('Insufficient permissions');
      }

      // Execute the action
      const result = await executeAction(actionType, payload, customConfig);
      
      if (!result.success) {
        throw new Error(result.error || 'Action failed');
      }

      return result;
    },
    onSuccess: (data, variables) => {
      const { actionType, customConfig } = variables;
      const actionConfig = { ...actionRegistry[actionType], ...customConfig };
      
      const successMessage = actionConfig.successMessage || 'Action completed successfully';
      toast({
        title: "Success",
        description: successMessage,
        variant: "default"
      });
    },
    onError: (error: any, variables) => {
      const { actionType, customConfig } = variables;
      const actionConfig = { ...actionRegistry[actionType], ...customConfig };
      
      const errorMessage = actionConfig.errorMessage || error.message || 'Action failed';
      toast({
        title: "Error", 
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Main function to execute button actions
  const executeButtonAction = ({
    actionType,
    payload = {},
    onSuccess,
    onError,
    skipConfirmation = false,
    customConfig
  }: ButtonActionOptions) => {
    const actionConfig = { ...actionRegistry[actionType], ...customConfig };
    
    if (!actionConfig) {
      toast({
        title: "Error",
        description: `Action type '${actionType}' not found`,
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to perform this action",
        variant: "destructive"
      });
      return;
    }

    // Check permissions
    if (!checkPermission(user.role, actionConfig)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to perform this action",
        variant: "destructive"
      });
      return;
    }

    // Handle confirmation if required
    if (actionConfig.confirmationRequired && !skipConfirmation) {
      setShowConfirmation(actionType);
      return;
    }

    // Execute the action
    actionMutation.mutate(
      { actionType, payload, customConfig },
      {
        onSuccess: (data) => {
          onSuccess?.(data);
        },
        onError: (error: any) => {
          onError?.(error.message);
        }
      }
    );
  };

  // Function to get button state (loading, authorized, etc.)
  const getButtonState = (actionType: string): ButtonActionState => {
    const actionConfig = actionRegistry[actionType];
    
    if (!actionConfig) {
      return {
        isLoading: false,
        isAuthorized: false,
        needsConfirmation: false
      };
    }

    const isAuthorized = user ? checkPermission(user.role, actionConfig) : false;
    const needsConfirmation = actionConfig.confirmationRequired || false;

    return {
      isLoading: actionMutation.isPending,
      isAuthorized,
      needsConfirmation
    };
  };

  // Function to confirm pending action
  const confirmAction = (actionType: string, payload: ActionPayload = {}) => {
    if (showConfirmation === actionType) {
      setShowConfirmation(null);
      executeButtonAction({ actionType, payload, skipConfirmation: true });
    }
  };

  // Function to cancel pending action
  const cancelAction = () => {
    setShowConfirmation(null);
  };

  // Get confirmation message for an action
  const getConfirmationMessage = (actionType: string): string => {
    const actionConfig = actionRegistry[actionType];
    return actionConfig?.confirmationMessage || 'Are you sure you want to perform this action?';
  };

  return {
    executeButtonAction,
    getButtonState,
    confirmAction,
    cancelAction,
    getConfirmationMessage,
    showConfirmation,
    isLoading: actionMutation.isPending
  };
};

// ============================================================================
// SPECIALIZED HOOKS FOR COMMON ACTIONS
// ============================================================================

// Hook specifically for CRUD operations
export const useCRUDActions = (entityType: string) => {
  const { executeButtonAction, getButtonState } = useButtonAction();

  return {
    create: (payload: ActionPayload) => 
      executeButtonAction({ actionType: `${entityType}.create`, payload }),
    update: (payload: ActionPayload) => 
      executeButtonAction({ actionType: `${entityType}.update`, payload }),
    delete: (payload: ActionPayload) => 
      executeButtonAction({ actionType: `${entityType}.delete`, payload }),
    getCreateState: () => getButtonState(`${entityType}.create`),
    getUpdateState: () => getButtonState(`${entityType}.update`),
    getDeleteState: () => getButtonState(`${entityType}.delete`)
  };
};

// Hook for navigation actions
export const useNavigationActions = () => {
  const { executeButtonAction } = useButtonAction();

  return {
    refreshData: () => executeButtonAction({ actionType: 'common.refreshData' }),
    exportData: (format: string, filters?: any) => 
      executeButtonAction({ 
        actionType: 'common.exportData', 
        payload: { format, filters } 
      }),
    uploadFile: (file: File, destination?: string) => 
      executeButtonAction({ 
        actionType: 'common.uploadFile', 
        payload: { file, destination } 
      })
  };
};

// Hook for role-specific actions
export const useRoleSpecificActions = (role: string) => {
  const { executeButtonAction, getButtonState } = useButtonAction();
  
  // Fix: Proper role name mapping to match registry prefixes
  const roleMapping: { [key: string]: string } = {
    'Admin': 'admin',
    'Student': 'student', 
    'Teacher': 'teacher',
    'Mentor': 'mentor',
    'Supervisor': 'supervisor',
    'Accountant': 'accountant',
    'Call Center Agent': 'callcenter',  // NOT "call center agent"
    'Front Desk': 'frontdesk'           // NOT "front desk"
  };
  
  const prefix = roleMapping[role] || role.toLowerCase().replace(/\s+/g, '');

  return {
    executeAction: (action: string, payload?: ActionPayload) =>
      executeButtonAction({ actionType: `${prefix}.${action}`, payload }),
    getActionState: (action: string) => 
      getButtonState(`${prefix}.${action}`)
  };
};