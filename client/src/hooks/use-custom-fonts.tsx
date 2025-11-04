import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { CustomFont } from '@shared/schema';

export function useCustomFonts() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'fa';

  // Fetch active fonts
  const { data: fonts = [] } = useQuery<CustomFont[]>({
    queryKey: ['/api/cms/fonts/active'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    // Remove any existing custom font styles
    const existingStyle = document.getElementById('custom-fonts-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Find the active font for the current language
    const activeFont = fonts.find(
      font => font.isActive && font.language === currentLanguage
    );

    if (!activeFont) {
      return;
    }

    // Create @font-face declaration
    const fontFormat = activeFont.fileFormat === 'woff2' 
      ? 'woff2' 
      : activeFont.fileFormat === 'woff' 
      ? 'woff' 
      : 'truetype';

    const fontFaceCSS = `
      @font-face {
        font-family: '${activeFont.fontFamily}';
        src: url('${activeFont.fileUrl}') format('${fontFormat}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;

    // Apply the font globally to the body and common elements
    const globalFontCSS = `
      body,
      .custom-font-applied {
        font-family: '${activeFont.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
      }
    `;

    // Inject the styles
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-fonts-style';
    styleElement.textContent = fontFaceCSS + globalFontCSS;
    document.head.appendChild(styleElement);

    // Store the active font family in a CSS variable for optional use
    document.documentElement.style.setProperty('--custom-font-family', activeFont.fontFamily);

  }, [fonts, currentLanguage]);

  return { fonts };
}
