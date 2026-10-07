import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import Login from '../../auth/pages/Login';
import ResetPassword from '../../auth/pages/ResetPassword';
import Unauthorized from '../../auth/pages/Unauthorized';
import SessionExpired from '../../auth/pages/SessionExpired';

// Portal Routes
import adminRoutes from './admin.routes';
import hrRoutes from './hr.routes';
import salesRoutes from './sales.routes';
import deliveryRoutes from './manager.routes';
import employeeRoutes from './employee.routes';
import clientRoutes from './client.routes';

// Loading splash component
import LoadingPage from '../../pages/LoadingPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirects via Loading / Session Verification Splash */}
      <Route path="/" element={<LoadingPage />} />
      <Route path="/loading" element={<LoadingPage />} />

      {/* Authentication routes */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/unauthorized" element={<Unauthorized />} />
      <Route path="/auth/session-expired" element={<SessionExpired />} />

      {/* Six authenticated business portals */}
      {adminRoutes}
      {hrRoutes}
      {salesRoutes}
      {deliveryRoutes}
      {employeeRoutes}
      {clientRoutes}

      {/* Fallback catches unknown paths */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

