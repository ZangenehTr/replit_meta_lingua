/**
 * Enhanced Action Button Component
 * 
 * This component integrates with the centralized action registry system to provide
 * consistent button behavior with RBAC enforcement, error handling, and user feedback.
 */

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ActionConfirmationDialog } from "@/components/ui/action-confirmation-dialog";
import { useButtonAction } from "@/hooks/use-button-action";
import { ActionPayload } from "@/lib/action-registry";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends ButtonProps {
  actionType: string;
  payload?: ActionPayload;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  skipConfirmation?: boolean;
  customConfig?: any;
  hideWhenUnauthorized?: boolean;
  disableWhenUnauthorized?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({
    actionType,
    payload = {},
    onSuccess,
    onError,
    skipConfirmation = false,
    customConfig,
    hideWhenUnauthorized = false,
    disableWhenUnauthorized = true,
    loadingText,
    children,
    className,
    disabled,
    onClick,
    'data-testid': dataTestId,
    ...props
  }, ref) => {
    const { executeButtonAction, getButtonState } = useButtonAction();
    const buttonState = getButtonState(actionType);

    // Generate data-testid if not provided
    const testId = dataTestId || `button-${actionType.replace(/\./g, '-')}`;

    // Handle click event
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      
      // Call original onClick if provided
      if (onClick) {
        onClick(event);
      }

      // Execute the action
      executeButtonAction({
        actionType,
        payload,
        onSuccess,
        onError,
        skipConfirmation,
        customConfig
      });
    };

    // Hide button if user is not authorized and hideWhenUnauthorized is true
    if (!buttonState.isAuthorized && hideWhenUnauthorized) {
      return null;
    }

    // Determine if button should be disabled
    const isDisabled = disabled || 
                      buttonState.isLoading || 
                      (!buttonState.isAuthorized && disableWhenUnauthorized);

    return (
      <>
        <Button
          ref={ref}
          className={cn(className)}
          disabled={isDisabled}
          onClick={handleClick}
          data-testid={testId}
          {...props}
        >
          {buttonState.isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {buttonState.isLoading && loadingText ? loadingText : children}
        </Button>
        
        {/* Wire confirmation dialog - CRITICAL FIX */}
        <ActionConfirmationDialog
          actionType={actionType}
          payload={payload}
          onSuccess={onSuccess}
          onError={onError}
        />
      </>
    );
  }
);

ActionButton.displayName = "ActionButton";