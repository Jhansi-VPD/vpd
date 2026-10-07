import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import LoadingPage from './pages/LoadingPage.jsx';
import ProtectedRoute from './components/portal-shared/ProtectedRoute.jsx';

// Authenticated Portals
import AdminPortal from './portals/admin/AdminPortal.jsx';
import SalesCrmPortal from './portals/sales-crm/SalesCrmPortal.jsx';
import HrPortal from './portals/hr/HrPortal.jsx';
import ProjectDeliveryPortal from './portals/project-delivery/ProjectDeliveryPortal.jsx';
import EmployeePortal from './portals/employee/EmployeePortal.jsx';
import ClientPortal from './portals/client/ClientPortal.jsx';
import PartnerPortal from './portals/partner/PartnerPortal.jsx';

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
            <HrPortal />
          </ProtectedRoute>
        }
      />

      {/* 4. Project / Delivery Portal */}
      <Route
        path="/delivery/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'project_manager', 'developer', 'qa']}>
            <ProjectDeliveryPortal />
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

      {/* 7. Partner Portal */}
      <Route
        path="/partner/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'partner']}>
            <PartnerPortal />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route redirects to /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
