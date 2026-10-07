import { UserRole } from '../../types/common.types';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['admin:access', 'users:manage', 'employees:manage', 'departments:manage', 'reports:view', 'finance:view'],
  hr: ['hr:access', 'recruitment:manage', 'employees:view', 'attendance:manage', 'leave:manage'],
  sales: ['sales:access', 'leads:manage', 'proposals:manage', 'contracts:manage', 'pipeline:manage'],
  marketing: ['sales:access', 'leads:manage', 'campaigns:manage'],
  project_manager: ['delivery:access', 'projects:manage', 'tasks:manage', 'milestones:manage', 'timesheets:review'],
  developer: ['delivery:access', 'employee:access', 'tasks:edit', 'timesheets:log'],
  employee: ['employee:access', 'attendance:self', 'leave:apply', 'tasks:view', 'timesheets:log'],
  client: ['client:access', 'projects:view', 'invoices:view', 'tickets:create'],
  partner: ['partner:access', 'alliances:view', 'referrals:create'],
};

export function hasPermission(role: string, permission: string): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  if (allowed.includes('*')) return true;
  return allowed.includes(permission);
}

export function usePermissions(userRole?: UserRole) {
  const role = userRole || 'employee';
  const check = (permission: string) => hasPermission(role, permission);
  return {
    role,
    check,
    permissions: ROLE_PERMISSIONS[role] || [],
  };
}

