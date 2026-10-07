import React from 'react';
import { Route, Routes } from 'react-router-dom';
import SalesLayout from './layout/SalesLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import Pipeline from './pages/Pipeline';
import Proposals from './pages/Proposals';
import Contracts from './pages/Contracts';
import Activities from './pages/Activities';
import FollowUps from './pages/FollowUps';
import Clients from './pages/Clients';
import Reports from './pages/Reports';

export const SalesRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<SalesLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="activities" element={<Activities />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="clients" element={<Clients />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
};

export default SalesRoutes;

