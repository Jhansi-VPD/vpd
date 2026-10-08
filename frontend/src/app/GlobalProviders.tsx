"use client";

import React from 'react';
import { LayoutProvider } from './providers/LayoutProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from '../auth/auth.context';

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </LayoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

