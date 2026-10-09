"use client";
import React from 'react';
import BaseSidebar, { BaseNavItem, BaseNavGroup } from '../../../shared/layout/BaseSidebar';

export type ClientNavItem = BaseNavItem;
export type ClientNavGroup = BaseNavGroup;

export const clientNavGroups: ClientNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Client Overview', path: '/client', icon: 'home' },
    ],
  },
  {
    title: 'Project & SOW',
    items: [
      { label: 'Active Projects', path: '/client/projects', icon: 'folder' },
      { label: 'Project Milestones', path: '/client/milestones', icon: 'calendar' },
      { label: 'SOW Deliverables', path: '/client/deliverables', icon: 'check' },
      { label: 'Deliverable Files', path: '/client/files', icon: 'database' },
    ],
  },
  {
    title: 'Commercial & Financials',
    items: [
      { label: 'Contracts & MSAs', path: '/client/contracts', icon: 'clipboard' },
      { label: 'Billing & Invoices', path: '/client/invoices', icon: 'file' },
      { label: 'Payment Receipts', path: '/client/payments', icon: 'wallet' },
    ],
  },
  {
    title: 'Communication & Reports',
    items: [
      { label: 'Scheduled Meetings', path: '/client/meetings', icon: 'users' },
      { label: 'Support & SLA Tickets', path: '/client/support', icon: 'shield' },
      { label: 'Executive Reports', path: '/client/reports', icon: 'chart' },
      { label: 'Notifications', path: '/client/notifications', icon: 'bell' },
    ],
  },
];

export const ClientSidebar: React.FC = () => (
  <BaseSidebar
    portalKey="/client"
    portalName="CLIENT PORTAL"
    portalSubtitle="Executive Workspace"
    navGroups={clientNavGroups}
    statusTitle="Encrypted Workspace"
    statusSubtitle="SLA Tier 1 · Active"
  />
);

export default ClientSidebar;
