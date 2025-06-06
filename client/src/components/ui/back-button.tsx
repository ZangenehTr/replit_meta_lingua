import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";

interface BackButtonProps {
  href?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function BackButton({ 
  href = "/dashboard", 
  label, 
  variant = "outline", 
  size = "sm",
  className = ""
}: BackButtonProps) {
  const { currentLanguage, t, isRTL } = useLanguage();
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (href) {
      navigate(href);
    } else {
      window.history.back();
    }
  };

  const backLabel = label || (currentLanguage === 'fa' ? 'بازگشت' : currentLanguage === 'ar' ? 'رجوع' : 'Back');
  const Icon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <Icon className="h-4 w-4" />
      {backLabel}
    </Button>
  );
}