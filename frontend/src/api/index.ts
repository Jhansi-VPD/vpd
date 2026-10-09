import apiClient, { RequestOptions } from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse } from '../types/common.types';
import {
  BulkActionResult,
  BulkUserAction,
  LoginHistoryEntry,
  UserActivityEntry,
  UserDetail,
  UserListItem,
  UserListParams,
  UserPermissionsInfo,
  UserRolesInfo,
  UserSessionInfo,
} from '../types/user.types';
import {
  ModuleSummary,
  PermissionBase,
  PermissionCreatePayload,
  PermissionDetail,
  PermissionListItem,
  PermissionListParams,
  PermissionRoleEntry,
  RoleActivityEntry,
  RoleCreatePayload,
  RoleDetail,
  RoleListItem,
  RoleListParams,
  RolePermissionSummary,
  RoleUpdatePayload,
  RoleUserEntry,
} from '../types/role.types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string;
  designation?: string;
  department_id?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  /** Explicit null clears the column to NULL (empty string would store ''). */
  phone?: string | null;
  avatar?: string;
  role?: string;
  is_active?: boolean;
}

export const usersApi = {
  getAll: (params?: UserListParams) =>
    apiClient.get<ApiResponse<UserListItem[]>>(API_ENDPOINTS.USERS.BASE, { params } as RequestOptions),
  getById: (id: string) => apiClient.get<ApiResponse<UserDetail>>(API_ENDPOINTS.USERS.BY_ID(id)),
  create: (data: CreateUserPayload) =>
    apiClient.post<ApiResponse<UserDetail & { invite_sent: boolean }>>(API_ENDPOINTS.USERS.BASE, data),
  update: (id: string, data: UpdateUserPayload) =>
    apiClient.put<ApiResponse<UserDetail>>(API_ENDPOINTS.USERS.BY_ID(id), data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.USERS.BY_ID(id)),

  activate: (id: string) => apiClient.patch<ApiResponse<UserListItem>>(API_ENDPOINTS.USERS.ACTIVATE(id)),
  deactivate: (id: string) => apiClient.patch<ApiResponse<UserListItem>>(API_ENDPOINTS.USERS.DEACTIVATE(id)),
  suspend: (id: string) => apiClient.patch<ApiResponse<UserListItem>>(API_ENDPOINTS.USERS.SUSPEND(id)),
  restore: (id: string) => apiClient.patch<ApiResponse<UserListItem>>(API_ENDPOINTS.USERS.RESTORE(id)),

  lock: (id: string) => apiClient.post<ApiResponse<UserListItem>>(API_ENDPOINTS.USERS.LOCK(id)),
  unlock: (id: string) => apiClient.post<ApiResponse<UserListItem>>(API_ENDPOINTS.USERS.UNLOCK(id)),
  forcePasswordReset: (id: string) =>
    apiClient.post<ApiResponse<{ email_sent: boolean }>>(API_ENDPOINTS.USERS.FORCE_PASSWORD_RESET(id)),
  revokeSessions: (id: string) => apiClient.post<ApiResponse<null>>(API_ENDPOINTS.USERS.REVOKE_SESSIONS(id)),

  bulkAction: (action: BulkUserAction, userIds: string[]) =>
    apiClient.post<ApiResponse<BulkActionResult>>(API_ENDPOINTS.USERS.BULK, { action, user_ids: userIds }),

  getRoles: (id: string) => apiClient.get<ApiResponse<UserRolesInfo>>(API_ENDPOINTS.USERS.ROLES(id)),
  updateRoles: (id: string, role: string) =>
    apiClient.put<ApiResponse<{ role: string }>>(API_ENDPOINTS.USERS.ROLES(id), { roles: [role] }),

  getPermissions: (id: string) =>
    apiClient.get<ApiResponse<UserPermissionsInfo>>(API_ENDPOINTS.USERS.PERMISSIONS(id)),

  getSessions: (id: string) => apiClient.get<ApiResponse<UserSessionInfo[]>>(API_ENDPOINTS.USERS.SESSIONS(id)),
  revokeSession: (id: string, sessionId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.USERS.SESSION(id, sessionId)),

  getLoginHistory: (id: string, limit?: number) =>
    apiClient.get<ApiResponse<LoginHistoryEntry[]>>(API_ENDPOINTS.USERS.LOGIN_HISTORY(id), {
      params: limit ? { limit } : undefined,
    } as RequestOptions),

  getActivity: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<UserActivityEntry[]>>(API_ENDPOINTS.USERS.ACTIVITY(id), {
      params,
    } as RequestOptions),

  /** Raw CSV response — the caller extracts the blob + Content-Disposition filename. */
  exportCsv: (params?: UserListParams) =>
    apiClient.getResponse(API_ENDPOINTS.USERS.EXPORT, { params } as RequestOptions),
};

export const employeesApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.EMPLOYEES.BASE, { params } as any),
  getById: (id: string) => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.EMPLOYEES.BY_ID(id)),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.EMPLOYEES.BASE, data),
  update: (id: string, data: any) => apiClient.put<ApiResponse<any>>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), data),
};

export const departmentsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.DEPARTMENTS.BASE),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.DEPARTMENTS.BASE, data),
};

export const attendanceApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.ATTENDANCE.BASE, { params } as any),
  checkIn: (data?: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ATTENDANCE.CHECK_IN, data),
  checkOut: (data?: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ATTENDANCE.CHECK_OUT, data),
  getToday: () => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.ATTENDANCE.TODAY),
};

export const leaveApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.LEAVE.BASE, { params } as any),
  apply: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEAVE.BASE, data),
  approve: (id: string) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEAVE.APPROVE(id)),
  reject: (id: string, reason?: string) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEAVE.REJECT(id), { reason }),
};

export const projectsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.PROJECTS.BASE, { params } as any),
  getById: (id: string) => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.PROJECTS.BY_ID(id)),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.PROJECTS.BASE, data),
  update: (id: string, data: any) => apiClient.put<ApiResponse<any>>(API_ENDPOINTS.PROJECTS.BY_ID(id), data),
};

export const milestonesApi = {
  getByProject: (projectId: string) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.PROJECTS.MILESTONES(projectId)),
};

export const tasksApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.TASKS.BASE, { params } as any),
  getById: (id: string) => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TASKS.BY_ID(id)),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.TASKS.BASE, data),
  updateStatus: (id: string, status: string) => apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.TASKS.STATUS(id), { status }),
};

export const timesheetsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TIMESHEETS.BASE, { params } as any),
  logTime: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.TIMESHEETS.BASE, data),
  updateStatus: (id: string, status: string) => apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.TIMESHEETS.STATUS(id), { status }),
  approve: (id: string) => apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.TIMESHEETS.STATUS(id), { status: 'approved' }),
  reject: (id: string, notes?: string) => apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.TIMESHEETS.STATUS(id), { status: 'rejected', notes }),
};

export const salesApi = {
  getPipeline: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SALES.PIPELINE),
};

export const leadsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SALES.LEADS, { params } as any),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.SALES.LEADS, data),
};

export const proposalsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SALES.PROPOSALS),
};

export const contractsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SALES.CONTRACTS),
};

export const hrApi = {
  getOverview: () => apiClient.get<ApiResponse<any>>('/hr/overview'),
};

export const recruitmentApi = {
  getJobs: () => apiClient.get<ApiResponse<any[]>>('/recruitment/jobs'),
  getCandidates: () => apiClient.get<ApiResponse<any[]>>('/recruitment/candidates'),
};

export const clientsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>('/clients'),
  getById: (id: string) => apiClient.get<ApiResponse<any>>(`/clients/${id}`),
};

export const invoicesApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.FINANCE.INVOICES),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.FINANCE.INVOICES, data),
};

export const paymentsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.FINANCE.PAYMENTS),
};

export const documentsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.DOCUMENTS.BASE),
};

export const notificationsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.NOTIFICATIONS.BASE),
  markAsRead: (id: string) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),
};

export const reportsApi = {
  getExecutiveSummary: () => apiClient.get<ApiResponse<any>>('/reports/summary'),
};

export const financeApi = {
  getSummary: () => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.FINANCE.REPORTS),
};

export const uploadsApi = {
  uploadFile: (formData: FormData) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.DOCUMENTS.UPLOAD, formData),
};


export const backupsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.BACKUPS.BASE),
  create: () => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.BACKUPS.BASE),
  delete: (filename: string) => apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.BACKUPS.BY_FILENAME(filename)),
};

export const rolesApi = {
  getAll: (params?: RoleListParams) =>
    apiClient.get<ApiResponse<RoleListItem[]>>(API_ENDPOINTS.ACCESS_CONTROL.ROLES, { params } as RequestOptions),
  getById: (id: string) =>
    apiClient.get<ApiResponse<RoleDetail>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_BY_ID(id)),
  create: (data: RoleCreatePayload) =>
    apiClient.post<ApiResponse<RoleDetail>>(API_ENDPOINTS.ACCESS_CONTROL.ROLES, data),
  update: (id: string, data: RoleUpdatePayload) =>
    apiClient.put<ApiResponse<RoleDetail>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_BY_ID(id), data),
  setStatus: (id: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<RoleDetail>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_STATUS(id), {
      is_active: isActive,
    }),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_BY_ID(id)),

  getPermissions: (id: string) =>
    apiClient.get<ApiResponse<RolePermissionSummary>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_PERMISSIONS(id)),
  setPermissions: (id: string, permissionIds: string[]) =>
    apiClient.put<ApiResponse<RolePermissionSummary>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_PERMISSIONS(id), {
      permission_ids: permissionIds,
    }),
  addPermission: (id: string, permissionId: string) =>
    apiClient.post<ApiResponse<PermissionBase>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_PERMISSIONS(id), {
      permission_id: permissionId,
    }),
  removePermission: (id: string, permissionId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_PERMISSION(id, permissionId)),

  getUsers: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<ApiResponse<RoleUserEntry[]>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_USERS(id), {
      params,
    } as RequestOptions),
  getActivity: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<RoleActivityEntry[]>>(API_ENDPOINTS.ACCESS_CONTROL.ROLE_ACTIVITY(id), {
      params,
    } as RequestOptions),
};

export const permissionsApi = {
  getAll: (params?: PermissionListParams) =>
    apiClient.get<ApiResponse<PermissionListItem[]>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSIONS, {
      params,
    } as RequestOptions),
  getModules: () =>
    apiClient.get<ApiResponse<ModuleSummary[]>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSION_MODULES),
  getById: (id: string) =>
    apiClient.get<ApiResponse<PermissionDetail>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSION_BY_ID(id)),
  create: (data: PermissionCreatePayload) =>
    apiClient.post<ApiResponse<PermissionDetail>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSIONS, data),
  update: (id: string, data: { description?: string | null }) =>
    apiClient.put<ApiResponse<PermissionDetail>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSION_BY_ID(id), data),
  setStatus: (id: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<PermissionDetail>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSION_STATUS(id), {
      is_active: isActive,
    }),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSION_BY_ID(id)),
  getRoles: (id: string) =>
    apiClient.get<ApiResponse<PermissionRoleEntry[]>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSION_ROLES(id)),
};

export const auditLogsApi = {
  getAll: (params?: { page?: number; limit?: number; user_id?: string; action?: string; entity_type?: string }) =>
    apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.AUDIT.LOGS, { params } as RequestOptions),
};

export const dashboardApi = {
  getOverview: () => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.DASHBOARD.OVERVIEW),
};
