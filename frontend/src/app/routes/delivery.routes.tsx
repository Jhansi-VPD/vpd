import React from 'react';
import { Route } from 'react-router-dom';
import DeliveryRoutes from '../../portals/project-delivery/routes';
import RoleRoute from '../../auth/role-route';

export const deliveryRoutes = (
  <Route
    path="/delivery/*"
    element={
      <RoleRoute allowedRoles={['super_admin', 'project_manager', 'developer', 'qa']}>
        <DeliveryRoutes />
      </RoleRoute>
    }
  />
);

export default deliveryRoutes;

