import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { MOBILE_DESIGN_TOKENS } from "@/lib/mobile-design-tokens";

// Enhanced mobile-first button variants
const mobileButtonVariants = cva(
  // Base styles optimized for mobile
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:no-underline",
        // Role-specific variants for visual hierarchy
        admin: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        teacher: "bg-green-500 text-white hover:bg-green-600 active:bg-green-700", 
        student: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
        supervisor: "bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700",
        callCenter: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700",
        mentor: "bg-cyan-500 text-white hover:bg-cyan-600 active:bg-cyan-700",
        accountant: "bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700"
      },
      size: {
        // Mobile-optimized sizes
        xs: "h-8 px-2 text-xs min-w-[2rem]",           // 32px height - minimal
        sm: "h-10 px-3 text-sm min-w-[2.5rem]",        // 40px height - small
        default: "h-12 px-4 text-sm min-w-[3rem]",     // 48px height - comfortable (recommended)
        lg: "h-14 px-6 text-base min-w-[3.5rem]",      // 56px height - large
        xl: "h-16 px-8 text-lg min-w-[4rem]",          // 64px height - extra large
        // Special mobile sizes
        touch: "h-12 px-4 text-sm min-w-[3rem] rounded-xl", // 48px with rounded corners
        fab: "h-14 w-14 rounded-full",                 // Floating action button
        fullWidth: "h-12 px-4 text-sm w-full",        // Full width mobile button
        bottomNav: "h-12 px-2 text-xs flex-1 rounded-none" // Bottom navigation item
      },
      // Touch feedback enhancement
      feedback: {
        none: "",
        subtle: "transition-transform active:scale-[0.98]",
        strong: "transition-transform active:scale-95 active:shadow-inner"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      feedback: "subtle"
    },
  }
);

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // Mobile-specific props
  hapticFeedback?: boolean;
  doubleClickProtection?: boolean;
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    feedback,
    asChild = false, 
    loading = false,
    loadingText = "Loading...",
    leftIcon,
    rightIcon,
    hapticFeedback = false,
    doubleClickProtection = true,
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const [isClicked, setIsClicked] = React.useState(false);
    const Comp = asChild ? Slot : "button";

    // Handle double-click protection
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (doubleClickProtection && isClicked) {
        e.preventDefault();
        return;
      }

      if (doubleClickProtection) {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);
      }

      // Haptic feedback for mobile devices
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }

      onClick?.(e);
    }, [onClick, doubleClickProtection, isClicked, hapticFeedback]);

    const isDisabled = disabled || loading || (doubleClickProtection && isClicked);

    return (
      <Comp
        className={cn(mobileButtonVariants({ variant, size, feedback, className }))}
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">
          {loading ? loadingText : children}
        </span>
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

MobileButton.displayName = "MobileButton";

export { MobileButton, mobileButtonVariants };