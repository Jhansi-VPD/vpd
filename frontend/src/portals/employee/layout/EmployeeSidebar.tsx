"use client";
import React from 'react';
import BaseSidebar, { BaseNavItem, BaseNavGroup } from '../../../shared/layout/BaseSidebar';

export type EmployeeNavItem = BaseNavItem;
export type EmployeeNavGroup = BaseNavGroup;

export const employeeNavGroups: EmployeeNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'My Dashboard', path: '/employee', icon: 'home' },
    ],
  },
  {
    title: 'Time & Attendance',
    items: [
      { label: 'Attendance Clock', path: '/employee/attendance', icon: 'clock' },
      { label: 'Apply Leave', path: '/employee/leave', icon: 'calendar' },
      { label: 'Timesheet Logger', path: '/employee/timesheets', icon: 'clipboard' },
    ],
  },
  {
    title: 'My Work',
    items: [
      { label: 'My Tasks', path: '/employee/my-tasks', icon: 'check' },
      { label: 'My Projects', path: '/employee/my-projects', icon: 'folder' },
    ],
  },
  {
    title: 'Personal',
    items: [
      { label: 'My Profile', path: '/employee/my-profile', icon: 'user' },
      { label: 'My Documents', path: '/employee/documents', icon: 'file' },
      { label: 'Payslips & Comp', path: '/employee/payslips', icon: 'wallet' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Training & Skills', path: '/employee/training', icon: 'cap' },
      { label: 'Performance Review', path: '/employee/performance', icon: 'trending' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Announcements', path: '/employee/announcements', icon: 'megaphone' },
      { label: 'Notifications', path: '/employee/notifications', icon: 'bell' },
    ],
  },
];

export const EmployeeSidebar: React.FC = () => (
  <BaseSidebar
    portalKey="/employee"
    portalName="My Workspace"
    portalSubtitle="Employee Portal"
    navGroups={employeeNavGroups}
    statusTitle="VPD Employee Hub"
    statusSubtitle="Encrypted & Synced"
  />
);

export default EmployeeSidebar;
