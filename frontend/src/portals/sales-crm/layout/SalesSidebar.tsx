"use client";
import React from 'react';
import BaseSidebar, { BaseNavItem, BaseNavGroup } from '../../../shared/layout/BaseSidebar';

export type SalesNavItem = BaseNavItem;
export type SalesNavGroup = BaseNavGroup;

export const salesNavGroups: SalesNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/sales', icon: 'home' },
    ],
  },
  {
    title: 'Pipeline & Deals',
    items: [
      { label: 'Leads', path: '/sales/leads', icon: 'users' },
      { label: 'Opportunities', path: '/sales/opportunities', icon: 'trending' },
      { label: 'Deal Pipeline', path: '/sales/pipeline', icon: 'grid' },
    ],
  },
  {
    title: 'Commercial & Legal',
    items: [
      { label: 'Proposals', path: '/sales/proposals', icon: 'file' },
      { label: 'Contracts', path: '/sales/contracts', icon: 'clipboard' },
      { label: 'Client Accounts', path: '/sales/clients', icon: 'building' },
    ],
  },
  {
    title: 'Engagement & Intel',
    items: [
      { label: 'Activities', path: '/sales/activities', icon: 'check' },
      { label: 'Follow-ups', path: '/sales/follow-ups', icon: 'calendar' },
      { label: 'Sales Reports', path: '/sales/reports', icon: 'chart' },
    ],
  },
];

export const SalesSidebar: React.FC = () => (
  <BaseSidebar
    portalKey="/sales"
    portalName="VPD CRM"
    portalSubtitle="Revenue Engine"
    navGroups={salesNavGroups}
    statusTitle="CRM Pipeline Live"
    statusSubtitle="Q4 Targets · On Track"
  />
);

export default SalesSidebar;
