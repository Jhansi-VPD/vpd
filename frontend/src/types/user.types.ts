import { UserRole } from './common.types';

/** Built-in slugs plus custom role slugs created via Role Management. */
export type RoleSlug = UserRole | (string & {});

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: RoleSlug;
  phone?: string;
  avatar?: string;
  department_id?: string;
  department_name?: string;
  designation?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface RolePermission {
  role: RoleSlug;
  permissions: string[];
  description: string;
}

/** Derived status, mirrors backend User.status precedence:
 * suspended > inactive > locked > pending > active */
export type AdminUserStatus = 'active' | 'inactive' | 'suspended' | 'locked' | 'pending';

/** GET /users row (UserListOut) */
export interface UserListItem {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: RoleSlug;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at: string | null;
  status: AdminUserStatus;
  employee_code: string | null;
  department_name: string | null;
  designation: string | null;
}

export interface UserEmployeeSummary {
  employee_code: string;
  designation: string | null;
  date_of_joining: string | null;
  department_id: string | null;
  department_name: string | null;
}

/** GET /users/{id} (UserDetailOut) */
export interface UserDetail extends UserListItem {
  is_locked: boolean;
  locked_until: string | null;
  failed_login_attempts: number;
  suspended_at: string | null;
  email_verified_at: string | null;
  password_changed_at: string | null;
  mfa_enabled: boolean;
  employee_profile: UserEmployeeSummary | null;
}

export interface UserSessionInfo {
  id: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_current: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  event: 'login' | 'login_failed';
  timestamp: string;
  status: 'active' | 'revoked' | 'expired' | 'failed';
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
}

export interface UserActivityEntry {
  id: string;
  action: string;
  timestamp: string;
  actor_id: string | null;
  actor_name: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PermissionInfo {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export interface UserRolesInfo {
  current: RoleSlug;
  available: RoleSlug[];
}

/** GET /users/{id}/permissions — role-derived, read-only (no per-user grants in schema) */
export interface UserPermissionsInfo {
  role: RoleSlug;
  source: string;
  permissions: PermissionInfo[];
}

export type BulkUserAction = 'activate' | 'deactivate' | 'suspend' | 'restore';

export interface BulkActionResult {
  action: BulkUserAction;
  total: number;
  succeeded: string[];
  failed: Array<{ user_id: string; reason: string }>;
}

/** Filters accepted by GET /users and GET /users/export */
export interface UserListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  role?: RoleSlug;
  status?: AdminUserStatus;
  is_active?: boolean;
  department_id?: string;
  designation?: string;
  created_from?: string;
  created_to?: string;
}
