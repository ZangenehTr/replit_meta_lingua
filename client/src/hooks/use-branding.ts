import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export interface BrandingSettings {
  id: number;
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  favicon: string | null;
  loginBackgroundImage: string | null;
  fontFamily: string;
  borderRadius: string;
  updatedAt: string;
}

export function useBranding() {
  const { data: branding, isLoading, error } = useQuery<BrandingSettings>({
    queryKey: ["/api/branding"],
    // Only fetch branding if user has token or if it's a public endpoint
    enabled: true, // Branding should be public - will be loaded regardless of auth status
    retry: (failureCount, error: any) => {
      // Don't retry auth errors since branding should be public
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Don't retry if it's a server error, but retry network errors
      if (error?.response?.status >= 500) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    // Don't block the app if branding fails to load
    throwOnError: false,
  });

  // Apply branding to CSS variables when branding data changes
  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      
      // Convert hex colors to HSL for CSS variables
      const hexToHsl = (hex: string | undefined) => {
        // Return default HSL if hex is undefined or invalid
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
          return '210 11% 15%'; // Default dark color
        }
        
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      // Apply colors as CSS variables with safe fallbacks
      root.style.setProperty('--primary', hexToHsl(branding.primaryColor));
      root.style.setProperty('--secondary', hexToHsl(branding.secondaryColor));
      root.style.setProperty('--accent', hexToHsl(branding.accentColor));
      root.style.setProperty('--background', hexToHsl(branding.backgroundColor));
      root.style.setProperty('--foreground', hexToHsl(branding.textColor));
      
      // Apply font family with fallback
      root.style.setProperty('--font-family', branding.fontFamily || 'Inter, sans-serif');
      
      // Apply border radius with fallback
      root.style.setProperty('--radius', branding.borderRadius || '0.5rem');

      // Update document title and favicon
      document.title = branding.name;
      if (branding.favicon) {
        let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = branding.favicon;
      }
    }
  }, [branding]);

  return {
    branding,
    isLoading,
  };
}