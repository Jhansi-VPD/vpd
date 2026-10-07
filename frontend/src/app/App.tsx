import React from 'react';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { QueryProvider } from './providers/QueryProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { LayoutProvider } from './providers/LayoutProvider';
import AppRoutes from './routes/index.routes';
import '../styles/globals.css';

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <LayoutProvider>
              <AppRoutes />
            </LayoutProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default App;

