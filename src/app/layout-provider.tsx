'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { SavedVideosProvider } from '@/hooks/use-saved-videos';
import { type ReactNode } from 'react';

export function LayoutProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SavedVideosProvider>
        {children}
      </SavedVideosProvider>
    </AuthProvider>
  );
}
