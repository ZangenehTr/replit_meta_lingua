import { AlertCircle, RefreshCw } from "lucide-react";
import { MobileCard, MobileCardContent } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import { WidgetErrorProps } from "./types";
import { cn } from "@/lib/utils";

export function WidgetError({ 
  message, 
  onRetry, 
  compact = false 
}: WidgetErrorProps) {
  return (
    <MobileCard 
      variant="outlined" 
      className={cn(
        "border-destructive/20 bg-destructive/5",
        compact && "p-2"
      )}
      data-testid="widget-error"
    >
      <MobileCardContent className={cn(
        "flex items-center justify-center",
        compact ? "py-2" : "py-4"
      )}>
        <div className="text-center space-y-2">
          <AlertCircle className={cn(
            "text-destructive mx-auto",
            compact ? "h-4 w-4" : "h-6 w-6"
          )} />
          <p className={cn(
            "text-destructive font-medium",
            compact ? "text-xs" : "text-sm"
          )}>
            {message}
          </p>
          {onRetry && (
            <MobileButton
              variant="ghost"
              size={compact ? "xs" : "sm"}
              onClick={onRetry}
              leftIcon={<RefreshCw className="h-3 w-3" />}
              data-testid="button-retry-widget"
            >
              Retry
            </MobileButton>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}