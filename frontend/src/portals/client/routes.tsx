import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ClientLayout from './layout/ClientLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Milestones from './pages/Milestones';
import Deliverables from './pages/Deliverables';
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Files from './pages/Files';
import Meetings from './pages/Meetings';
import Support from './pages/Support';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';

export const ClientRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="deliverables" element={<Deliverables />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="payments" element={<Payments />} />
        <Route path="files" element={<Files />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="support" element={<Support />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
};

export default ClientRoutes;

