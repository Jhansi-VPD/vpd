"use client";
import React from 'react';
import BaseSidebar, { BaseNavItem, BaseNavGroup } from '../../../shared/layout/BaseSidebar';

export type DeliveryNavItem = BaseNavItem;
export type DeliveryNavGroup = BaseNavGroup;

export const deliveryNavGroups: DeliveryNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/delivery', icon: 'home' },
    ],
  },
  {
    title: 'Execution & Delivery',
    items: [
      { label: 'Projects', path: '/delivery/projects', icon: 'folder' },
      { label: 'Project Details', path: '/delivery/project-details', icon: 'file' },
      { label: 'Milestones', path: '/delivery/milestones', icon: 'calendar' },
      { label: 'Tasks (Kanban)', path: '/delivery/tasks', icon: 'check' },
    ],
  },
  {
    title: 'Team & Governance',
    items: [
      { label: 'Delivery Team', path: '/delivery/team', icon: 'users' },
      { label: 'Risks & Issues', path: '/delivery/risks-issues', icon: 'shield' },
      { label: 'Timesheets', path: '/delivery/timesheets', icon: 'clock' },
    ],
  },
  {
    title: 'Assets & Insights',
    items: [
      { label: 'Files & Assets', path: '/delivery/files', icon: 'database' },
      { label: 'Sprint Reports', path: '/delivery/reports', icon: 'chart' },
    ],
  },
];

export const DeliverySidebar: React.FC = () => (
  <BaseSidebar
    portalKey="/delivery"
    portalName="PROJECT MANAGER"
    portalSubtitle="Operations & Agile Hub"
    navGroups={deliveryNavGroups}
    statusTitle="Agile Engine Online"
    statusSubtitle="Sprint 14 · Active"
  />
);

export default DeliverySidebar;
