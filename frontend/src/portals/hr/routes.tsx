import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HRLayout from './layout/HRLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Timesheets from './pages/Timesheets';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Training from './pages/Training';
import Recruitment from './pages/Recruitment';
import Documents from './pages/Documents';

export const HRRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<HRLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="performance" element={<Performance />} />
        <Route path="training" element={<Training />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="documents" element={<Documents />} />
      </Route>
    </Routes>
  );
};

export default HRRoutes;
