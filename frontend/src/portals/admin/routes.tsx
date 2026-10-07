import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import Users from './pages/Users';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import RolesPermissions from './pages/RolesPermissions';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Timesheets from './pages/Timesheets';
import Documents from './pages/Documents';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import Finance from './pages/Finance';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Backups from './pages/Backups';
import Sessions from './pages/Sessions';
import Integrations from './pages/Integrations';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="organization" element={<Organization />} />
        <Route path="users" element={<Users />} />
        <Route path="employees" element={<Employees />} />
        <Route path="departments" element={<Departments />} />
        <Route path="roles-permissions" element={<RolesPermissions />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="documents" element={<Documents />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="reports" element={<Reports />} />
        <Route path="finance" element={<Finance />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="backups" element={<Backups />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="integrations" element={<Integrations />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
