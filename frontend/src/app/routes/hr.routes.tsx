import React from 'react';
import { Route } from 'react-router-dom';
import HRRoutes from '../../portals/hr/routes';
import RoleRoute from '../../auth/role-route';

export const hrRoutes = (
  <Route
    path="/hr/*"
    element={
      <RoleRoute allowedRoles={['super_admin', 'hr', 'admin']}>
        <HRRoutes />
      </RoleRoute>
    }
  />
);

export default hrRoutes;

