import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

// Mobile-optimized card variants
const mobileCardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "shadow-md border-0",
        outlined: "border-2 shadow-none",
        filled: "bg-muted border-0",
        interactive: "hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      },
      size: {
        sm: "p-3",
        default: "p-4", 
        lg: "p-6",
        // Mobile-specific sizes
        compact: "p-2",           // Tight spacing for lists
        comfortable: "p-4",      // Standard mobile spacing
        spacious: "p-6"          // Generous spacing
      },
      // Role-based styling
      role: {
        none: "",
        admin: "border-l-4 border-l-red-500",
        teacher: "border-l-4 border-l-green-500",
        student: "border-l-4 border-l-blue-500", 
        supervisor: "border-l-4 border-l-purple-500",
        callCenter: "border-l-4 border-l-orange-500",
        mentor: "border-l-4 border-l-cyan-500",
        accountant: "border-l-4 border-l-yellow-500"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      role: "none"
    },
  }
);

export interface MobileCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'>,
    VariantProps<typeof mobileCardVariants> {
  // Mobile-specific features
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  swipeable?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    role,
    collapsible = false,
    defaultCollapsed = false,
    swipeable = false,
    onSwipeLeft,
    onSwipeRight,
    children,
    ...props 
  }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [touchStart, setTouchStart] = React.useState<number | null>(null);
    const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

    // Swipe gesture handling
    const handleTouchStart = (e: React.TouchEvent) => {
      if (!swipeable) return;
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!swipeable) return;
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!swipeable || !touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    };

    return (
      <div
        className={cn(mobileCardVariants({ variant, size, role, className }))}
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {collapsible ? (
          <div>
            <button
              className="flex w-full items-center justify-between p-1 hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <span className="font-medium">
                {React.Children.toArray(children)[0]}
              </span>
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            {!isCollapsed && (
              <div className="mt-2 space-y-2">
                {React.Children.toArray(children).slice(1)}
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
);

MobileCard.displayName = "MobileCard";

// Mobile Card Header Component
const MobileCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-3", className)}
    {...props}
  />
));
MobileCardHeader.displayName = "MobileCardHeader";

// Mobile Card Title Component  
const MobileCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
MobileCardTitle.displayName = "MobileCardTitle";

// Mobile Card Description Component
const MobileCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
MobileCardDescription.displayName = "MobileCardDescription";

// Mobile Card Content Component
const MobileCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-3", className)} {...props} />
));
MobileCardContent.displayName = "MobileCardContent";

// Mobile Card Footer Component
const MobileCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between pt-3 border-t", className)}
    {...props}
  />
));
MobileCardFooter.displayName = "MobileCardFooter";

export {
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardDescription,
  MobileCardContent,
  MobileCardFooter,
  mobileCardVariants,
};