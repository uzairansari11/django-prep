'use client';

import { Toaster } from 'sonner';
import { AppSettingsProvider, useAppSettings } from '@/hooks/useAppSettings';

function ToasterWrapper() {
  const { isDark } = useAppSettings();
  return (
    <Toaster
      theme={isDark ? 'dark' : 'light'}
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        },
        className: 'sonner-toast',
      }}
    />
  );
}

export default function Providers({ children }) {
  return (
    <AppSettingsProvider>
      {children}
      <ToasterWrapper />
    </AppSettingsProvider>
  );
}
