import React from 'react';
import { Route } from 'react-router-dom';
import SalesRoutes from '../../portals/sales-crm/routes';
import RoleRoute from '../../auth/role-route';

export const salesRoutes = (
  <Route
    path="/sales/*"
    element={
      <RoleRoute allowedRoles={['super_admin', 'sales', 'marketing']}>
        <SalesRoutes />
      </RoleRoute>
    }
  />
);

export default salesRoutes;

