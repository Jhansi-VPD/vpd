import React from 'react';
import { Route } from 'react-router-dom';
import ClientRoutes from '../../portals/client/routes';
import RoleRoute from '../../auth/role-route';

export const clientRoutes = (
  <Route
    path="/client/*"
    element={
      <RoleRoute allowedRoles={['super_admin', 'client']}>
        <ClientRoutes />
      </RoleRoute>
    }
  />
);

export default clientRoutes;

