"use client";
import React from 'react';
import BaseSidebar, { BaseNavItem, BaseNavGroup } from '../../../shared/layout/BaseSidebar';

export type AdminNavItem = BaseNavItem;
export type AdminNavGroup = BaseNavGroup;

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: 'home' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Organization', path: '/admin/organization', icon: 'building' },
      { label: 'Workforce Users', path: '/admin/users', icon: 'users' },
      { label: 'Employees', path: '/admin/employees', icon: 'user-check' },
      { label: 'Departments', path: '/admin/departments', icon: 'grid' },
      { label: 'Roles & Permissions', path: '/admin/roles-permissions', icon: 'shield' },
    ],
  },
  {
    title: 'Workforce Ops',
    items: [
      { label: 'Active Sessions', path: '/admin/sessions', icon: 'monitor' },
      { label: 'Attendance Logs', path: '/admin/attendance', icon: 'clock' },
      { label: 'Leave Approvals', path: '/admin/leave-management', icon: 'calendar' },
    ],
  },
  {
    title: 'Delivery',
    items: [
      { label: 'Projects', path: '/admin/projects', icon: 'folder' },
      { label: 'Tasks', path: '/admin/tasks', icon: 'check' },
      { label: 'Timesheets', path: '/admin/timesheets', icon: 'clipboard' },
      { label: 'Documents', path: '/admin/documents', icon: 'file' },
      { label: 'Announcements', path: '/admin/announcements', icon: 'megaphone' },
    ],
  },
  {
    title: 'Insights & Finance',
    items: [
      { label: 'Reports', path: '/admin/reports', icon: 'chart' },
      { label: 'Finance (Restricted)', path: '/admin/finance', icon: 'dollar' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Integrations', path: '/admin/integrations', icon: 'link' },
      { label: 'Notifications', path: '/admin/notifications', icon: 'bell' },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'list' },
      { label: 'System Settings', path: '/admin/settings', icon: 'settings' },
      { label: 'Disaster Recovery', path: '/admin/backups', icon: 'database' },
    ],
  },
];

export const AdminSidebar: React.FC = () => (
  <BaseSidebar
    portalKey="/admin"
    portalName="VPD Admin"
    portalSubtitle="Operations HQ"
    navGroups={adminNavGroups}
    statusTitle="SOC 2 Type II"
    statusSubtitle="99.99% Uptime"
  />
);

export default AdminSidebar;
