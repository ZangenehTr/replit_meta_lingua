/**
 * Action Confirmation Dialog Component
 * 
 * This component provides consistent confirmation dialogs for actions that require
 * user confirmation before execution.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useButtonAction } from "@/hooks/use-button-action";
import { ActionPayload } from "@/lib/action-registry";

interface ActionConfirmationDialogProps {
  actionType: string;
  payload?: ActionPayload;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const ActionConfirmationDialog = ({
  actionType,
  payload = {},
  onSuccess,
  onError
}: ActionConfirmationDialogProps) => {
  const { 
    showConfirmation, 
    confirmAction, 
    cancelAction, 
    getConfirmationMessage 
  } = useButtonAction();

  const isOpen = showConfirmation === actionType;
  const confirmationMessage = getConfirmationMessage(actionType);

  return (
    <AlertDialog open={isOpen} onOpenChange={() => cancelAction()}>
      <AlertDialogContent data-testid={`confirmation-dialog-${actionType.replace(/\./g, '-')}`}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmationMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={cancelAction}
            data-testid={`cancel-${actionType.replace(/\./g, '-')}`}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => confirmAction(actionType, payload)}
            data-testid={`confirm-${actionType.replace(/\./g, '-')}`}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};