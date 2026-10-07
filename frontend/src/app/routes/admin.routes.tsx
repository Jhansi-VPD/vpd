import React from 'react';
import { Route } from 'react-router-dom';
import AdminRoutes from '../../portals/admin/routes';
import RoleRoute from '../../auth/role-route';

export const adminRoutes = (
  <Route
    path="/admin/*"
    element={
      <RoleRoute allowedRoles={['super_admin', 'admin', 'finance']}>
        <AdminRoutes />
      </RoleRoute>
    }
  />
);

export default adminRoutes;

