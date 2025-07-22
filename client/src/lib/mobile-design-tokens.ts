// Mobile-First Design System for Meta Lingua Platform
// Optimized for Persian Language Institute with Iranian Market Compliance

export const MOBILE_DESIGN_TOKENS = {
  // Mobile-optimized spacing system
  spacing: {
    xs: '0.25rem',    // 4px - Tight spacing for compact layouts
    sm: '0.5rem',     // 8px - Small gaps between elements
    md: '0.75rem',    // 12px - Standard spacing
    lg: '1rem',       // 16px - Large spacing for breathing room
    xl: '1.5rem',     // 24px - Section spacing
    xxl: '2rem',      // 32px - Major section breaks
    xxxl: '3rem'      // 48px - Page-level spacing
  },

  // Touch-friendly target sizes (iOS/Android compliance)
  touchTargets: {
    minimum: '44px',      // iOS/Android minimum requirement
    comfortable: '48px',   // Recommended comfortable size
    large: '56px',        // Large buttons for primary actions
    extraLarge: '64px'    // Extra large for critical actions
  },

  // Mobile-optimized typography scale
  typography: {
    mobile: {
      h1: '1.5rem',      // 24px - Page titles
      h2: '1.25rem',     // 20px - Section headers
      h3: '1.125rem',    // 18px - Card titles
      h4: '1rem',        // 16px - Sub-headers
      body: '0.875rem',  // 14px - Body text
      small: '0.75rem',  // 12px - Caption text
      xs: '0.625rem'     // 10px - Micro text
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6'
    }
  },

  // Responsive breakpoints
  breakpoints: {
    mobile: '320px',    // Small phones
    mobileLarge: '375px', // iPhone standard
    tablet: '768px',    // iPad portrait
    tabletLarge: '1024px', // iPad landscape
    desktop: '1280px',  // Desktop
    desktopLarge: '1920px' // Large desktop
  },

  // Color system optimized for mobile visibility
  colors: {
    roles: {
      admin: {
        primary: 'hsl(0, 84%, 60%)',     // Red
        secondary: 'hsl(0, 84%, 95%)',
        text: 'hsl(0, 84%, 20%)'
      },
      teacher: {
        primary: 'hsl(142, 76%, 36%)',   // Green
        secondary: 'hsl(142, 76%, 95%)',
        text: 'hsl(142, 76%, 20%)'
      },
      student: {
        primary: 'hsl(217, 91%, 60%)',   // Blue
        secondary: 'hsl(217, 91%, 95%)',
        text: 'hsl(217, 91%, 20%)'
      },
      supervisor: {
        primary: 'hsl(262, 83%, 58%)',   // Purple
        secondary: 'hsl(262, 83%, 95%)',
        text: 'hsl(262, 83%, 20%)'
      },
      callCenter: {
        primary: 'hsl(25, 95%, 53%)',    // Orange
        secondary: 'hsl(25, 95%, 95%)',
        text: 'hsl(25, 95%, 20%)'
      },
      mentor: {
        primary: 'hsl(200, 94%, 54%)',   // Cyan
        secondary: 'hsl(200, 94%, 95%)',
        text: 'hsl(200, 94%, 20%)'
      },
      accountant: {
        primary: 'hsl(45, 93%, 47%)',    // Yellow
        secondary: 'hsl(45, 93%, 95%)',
        text: 'hsl(45, 93%, 20%)'
      }
    },
    persian: {
      gold: 'hsl(45, 100%, 51%)',      // Persian gold
      turquoise: 'hsl(180, 100%, 50%)', // Persian turquoise
      rose: 'hsl(350, 100%, 88%)'      // Persian rose
    }
  },

  // Animation system for mobile interactions
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: {
      easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)'
    }
  },

  // Mobile-specific layout patterns
  layouts: {
    mobileCard: {
      padding: '1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    },
    mobileList: {
      itemHeight: '4rem',      // 64px for comfortable touch
      spacing: '0.5rem'
    },
    bottomNav: {
      height: '4rem',          // 64px bottom navigation
      padding: '0.5rem'
    }
  },

  // Iranian market specific tokens
  iranian: {
    currency: 'IRR',
    locale: 'fa-IR',
    direction: 'rtl',
    fonts: {
      persian: ['Vazir', 'Tahoma', 'Arial'],
      arabic: ['Noto Sans Arabic', 'Arial'],
      english: ['Inter', 'system-ui', 'sans-serif']
    }
  }
} as const;

// Helper functions for responsive design
export const getSpacing = (size: keyof typeof MOBILE_DESIGN_TOKENS.spacing) => 
  MOBILE_DESIGN_TOKENS.spacing[size];

export const getTouchTarget = (size: keyof typeof MOBILE_DESIGN_TOKENS.touchTargets) => 
  MOBILE_DESIGN_TOKENS.touchTargets[size];

export const getRoleColor = (role: string, variant: 'primary' | 'secondary' | 'text' = 'primary') => {
  const roleKey = role.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof MOBILE_DESIGN_TOKENS.colors.roles;
  return MOBILE_DESIGN_TOKENS.colors.roles[roleKey]?.[variant] || MOBILE_DESIGN_TOKENS.colors.roles.student[variant];
};

// Media query helpers
export const mediaQueries = {
  mobile: `@media (max-width: ${MOBILE_DESIGN_TOKENS.breakpoints.tablet})`,
  tablet: `@media (min-width: ${MOBILE_DESIGN_TOKENS.breakpoints.tablet}) and (max-width: ${MOBILE_DESIGN_TOKENS.breakpoints.desktop})`,
  desktop: `@media (min-width: ${MOBILE_DESIGN_TOKENS.breakpoints.desktop})`,
  touch: '@media (hover: none) and (pointer: coarse)', // Mobile devices
  mouse: '@media (hover: hover) and (pointer: fine)'   // Desktop devices
};