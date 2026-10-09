"use client";
import React from 'react';
import BaseSidebar, { BaseNavItem, BaseNavGroup } from '../../../shared/layout/BaseSidebar';

export type HRNavItem = BaseNavItem;
export type HRNavGroup = BaseNavGroup;

export const hrNavGroups: HRNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/hr', icon: 'home' },
    ],
  },
  {
    title: 'Workforce & People',
    items: [
      { label: 'Employees', path: '/hr/employees', icon: 'users' },
      { label: 'Workforce Users', path: '/hr/users', icon: 'user-check' },
      { label: 'Departments', path: '/hr/departments', icon: 'grid' },
      { label: 'Recruitment (ATS)', path: '/hr/recruitment', icon: 'briefcase' },
    ],
  },
  {
    title: 'Time & Attendance',
    items: [
      { label: 'Workforce Attendance', path: '/hr/attendance', icon: 'clock' },
      { label: 'Leave Management', path: '/hr/leave', icon: 'calendar' },
      { label: 'Timesheets', path: '/hr/timesheets', icon: 'clipboard' },
    ],
  },
  {
    title: 'Finance & Talent Growth',
    items: [
      { label: 'Payroll & Payslips', path: '/hr/payroll', icon: 'wallet' },
      { label: 'Performance Reviews', path: '/hr/performance', icon: 'trending' },
      { label: 'Training & Courses', path: '/hr/training', icon: 'cap' },
      { label: 'Document Vault', path: '/hr/documents', icon: 'file' },
    ],
  },
];

export const HRSidebar: React.FC = () => (
  <BaseSidebar
    portalKey="/hr"
    portalName="HR PORTAL"
    portalSubtitle="People & Operations"
    navGroups={hrNavGroups}
    statusTitle="HR Operations Live"
    statusSubtitle="Workforce · Active"
  />
);

export default HRSidebar;
