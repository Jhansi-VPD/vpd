import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HRLayout from './layout/HRLayout';
import Dashboard from './pages/Dashboard';
import JobOpenings from './pages/JobOpenings';
import Candidates from './pages/Candidates';
import Interviews from './pages/Interviews';
import Onboarding from './pages/Onboarding';
import EmployeeRecords from './pages/EmployeeRecords';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Documents from './pages/Documents';
import EmployeeLifecycle from './pages/EmployeeLifecycle';
import Reports from './pages/Reports';

export const HRRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<HRLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="job-openings" element={<JobOpenings />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="employee-records" element={<EmployeeRecords />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="documents" element={<Documents />} />
        <Route path="employee-lifecycle" element={<EmployeeLifecycle />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
};

export default HRRoutes;

