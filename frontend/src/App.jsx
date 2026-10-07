import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import LoadingPage from './pages/LoadingPage.jsx';
import ProtectedRoute from './components/portal-shared/ProtectedRoute.jsx';

// Authenticated Portals
import AdminPortal from './portals/admin/AdminPortal.jsx';
import SalesCrmPortal from './portals/sales-crm/SalesCrmPortal.jsx';
import HRRoutes from './portals/hr/routes';
import ProjectManagerPortal from './portals/project-manager/ProjectManagerPortal.jsx';
import EmployeePortal from './portals/employee/EmployeePortal.jsx';
import ClientPortal from './portals/client/ClientPortal.jsx';

export default function App() {
  return (
    <Routes>
      {/* Central Loading / Entry Splash Gate */}
      <Route path="/" element={<LoadingPage />} />
      <Route path="/loading" element={<LoadingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* 1. Admin / Super Admin Portal (Includes Finance Module) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'finance']}>
            <AdminPortal />
          </ProtectedRoute>
        }
      />

      {/* 2. Sales / CRM Portal */}
      <Route
        path="/sales/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'sales', 'marketing']}>
            <SalesCrmPortal />
          </ProtectedRoute>
        }
      />

      {/* 3. HR Portal */}
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'hr', 'admin']}>
            <HRRoutes />
          </ProtectedRoute>
        }
      />

      {/* 4. Project Manager / Delivery Portal */}
      <Route
        path="/delivery/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'project_manager', 'developer', 'qa']}>
            <ProjectManagerPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project-manager/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'project_manager', 'developer', 'qa']}>
            <ProjectManagerPortal />
          </ProtectedRoute>
        }
      />

      {/* 5. Employee Portal (Personal Workforce Workspace) */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'employee', 'developer', 'qa', 'support', 'finance', 'sales', 'marketing', 'hr']}>
            <EmployeePortal />
          </ProtectedRoute>
        }
      />

      {/* 6. Client Portal */}
      <Route
        path="/client/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'client']}>
            <ClientPortal />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route redirects to /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

