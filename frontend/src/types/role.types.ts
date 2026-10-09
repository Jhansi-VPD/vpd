import { AdminUserStatus } from './user.types';

/** Portal slugs accepted by the backend (Role.portal). 'partner' is assignable
 * but has no routed portal in this frontend — it lands on /employee. */
export type PortalValue =
  | 'admin'
  | 'sales'
  | 'hr'
  | 'delivery'
  | 'employee'
  | 'client'
  | 'partner';

export const PORTAL_OPTIONS: Array<{ value: PortalValue; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'HR' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'employee', label: 'Employee' },
  { value: 'client', label: 'Client' },
  { value: 'partner', label: 'Partner' },
];

export type SystemFilter = 'system' | 'custom';
export type ActiveStatusFilter = 'active' | 'inactive';

/** GET /access-control/roles row (RoleListOut) */
export interface RoleListItem {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  portal: string | null;
  user_count: number;
  permission_count: number;
}

/** GET /access-control/roles/{id} (RoleDetailOut) */
export interface RoleDetail extends RoleListItem {
  implicit_all_permissions: boolean;
}

/** GET /access-control/roles/{id}/users row (RoleUserEntry) */
export interface RoleUserEntry {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  status: AdminUserStatus;
}

/** GET /access-control/roles/{id}/activity row (RoleActivityEntry) */
export interface RoleActivityEntry {
  id: string;
  action: string;
  timestamp: string;
  actor_id: string | null;
  actor_name: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
}

/** Shared permission shape (PermissionOut) */
export interface PermissionBase {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
}

/** GET /access-control/permissions row (PermissionListOut) */
export interface PermissionListItem extends PermissionBase {
  role_count: number;
}

/** GET /access-control/permissions/{id}/roles row (PermissionRoleEntry) */
export interface PermissionRoleEntry {
  id: string;
  name: string;
  slug: string;
  is_system: boolean;
}

/** GET /access-control/permissions/{id} (PermissionDetailOut) */
export interface PermissionDetail extends PermissionBase {
  roles: PermissionRoleEntry[];
}

/** GET /access-control/permissions/modules row (ModuleSummary) */
export interface ModuleSummary {
  module: string;
  permission_count: number;
}

/** GET/PUT /access-control/roles/{id}/permissions (RolePermissionSummary) */
export interface RolePermissionSummary {
  role_id: string;
  role_slug: string;
  implicit_all_permissions: boolean;
  permissions: PermissionBase[];
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  portal?: PortalValue | '';
  status?: ActiveStatusFilter | '';
  type?: SystemFilter | '';
}

export interface PermissionListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  module?: string;
  action?: string;
  status?: ActiveStatusFilter | '';
  type?: SystemFilter | '';
}

export interface RoleCreatePayload {
  name: string;
  slug?: string;
  description?: string;
  portal: PortalValue;
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  portal?: PortalValue;
}

export interface PermissionCreatePayload {
  module: string;
  action: string;
  description?: string;
}
