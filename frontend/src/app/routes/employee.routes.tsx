import React from 'react';
import { Route } from 'react-router-dom';
import EmployeeRoutes from '../../portals/employee/routes';
import RoleRoute from '../../auth/role-route';

export const employeeRoutes = (
  <Route
    path="/employee/*"
    element={
      <RoleRoute allowedRoles={['super_admin', 'employee', 'developer', 'qa', 'support', 'finance', 'sales', 'marketing', 'hr']}>
        <EmployeeRoutes />
      </RoleRoute>
    }
  />
);

export default employeeRoutes;

