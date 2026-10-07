import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DeliveryLayout from './layout/DeliveryLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Milestones from './pages/Milestones';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import RisksIssues from './pages/RisksIssues';
import Files from './pages/Files';
import Timesheets from './pages/Timesheets';
import Reports from './pages/Reports';

export const DeliveryRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<DeliveryLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="project-details" element={<ProjectDetails />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="team" element={<Team />} />
        <Route path="risks-issues" element={<RisksIssues />} />
        <Route path="files" element={<Files />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
};

export default DeliveryRoutes;

