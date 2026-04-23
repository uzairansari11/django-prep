'use client';

import { AppSettingsProvider } from '@/hooks/useAppSettings';

export default function Providers({ children }) {
  return <AppSettingsProvider>{children}</AppSettingsProvider>;
}
