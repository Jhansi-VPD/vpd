import React from 'react';
import { Route, Routes } from 'react-router-dom';
import EmployeeLayout from './layout/EmployeeLayout';
import Dashboard from './pages/Dashboard';
import MyProfile from './pages/MyProfile';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import MyTasks from './pages/MyTasks';
import MyProjects from './pages/MyProjects';
import Timesheets from './pages/Timesheets';
import Documents from './pages/Documents';
import Payslips from './pages/Payslips';
import Training from './pages/Training';
import Performance from './pages/Performance';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';

export const EmployeeRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="my-profile" element={<MyProfile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="my-projects" element={<MyProjects />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="documents" element={<Documents />} />
        <Route path="payslips" element={<Payslips />} />
        <Route path="training" element={<Training />} />
        <Route path="performance" element={<Performance />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
};

export default EmployeeRoutes;

