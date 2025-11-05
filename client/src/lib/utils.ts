import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'IRR', locale?: string): string {
  if (currency === 'IRR') {
    // Format IRR with thousand separators (commas) for all locales
    const formatted = new Intl.NumberFormat(locale || 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(amount);
    
    // Add IRR suffix
    return `${formatted} IRR`;
  }
  
  return new Intl.NumberFormat(locale || 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Simple number formatter with thousand separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    useGrouping: true,
  }).format(num);
}
