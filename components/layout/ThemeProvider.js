'use client';

import { useTheme } from '@/hooks/useTheme';

/**
 * Applies the dark/light class to the <html> element.
 * Renders no DOM output — purely a side-effect component.
 * Must be a Client Component because it reads localStorage.
 */
export default function ThemeProvider({ children }) {
  // useTheme handles applying the class to document.documentElement
  useTheme();
  return <>{children}</>;
}
