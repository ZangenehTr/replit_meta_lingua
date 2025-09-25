import { MobileCard } from "@/components/ui/mobile-card";
import { WidgetLoadingProps } from "./types";
import { cn } from "@/lib/utils";

export function WidgetLoading({ 
  height = "h-32", 
  animate = true 
}: WidgetLoadingProps) {
  return (
    <MobileCard 
      className={cn(height, animate && "animate-pulse")}
      data-testid="widget-loading"
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-5 bg-muted rounded w-20"></div>
            <div className="h-4 bg-muted rounded w-16"></div>
          </div>
          <div className="h-6 bg-muted rounded w-12"></div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded w-full"></div>
          <div className="h-3 bg-muted rounded w-24"></div>
        </div>
      </div>
    </MobileCard>
  );
}