export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    EXPORT: '/users/export',
    BULK: '/users/bulk',
    ACTIVATE: (id: string) => `/users/${id}/activate`,
    DEACTIVATE: (id: string) => `/users/${id}/deactivate`,
    SUSPEND: (id: string) => `/users/${id}/suspend`,
    RESTORE: (id: string) => `/users/${id}/restore`,
    LOCK: (id: string) => `/users/${id}/lock`,
    UNLOCK: (id: string) => `/users/${id}/unlock`,
    FORCE_PASSWORD_RESET: (id: string) => `/users/${id}/force-password-reset`,
    REVOKE_SESSIONS: (id: string) => `/users/${id}/revoke-sessions`,
    ROLES: (id: string) => `/users/${id}/roles`,
    PERMISSIONS: (id: string) => `/users/${id}/permissions`,
    SESSIONS: (id: string) => `/users/${id}/sessions`,
    SESSION: (id: string, sessionId: string) => `/users/${id}/sessions/${sessionId}`,
    LOGIN_HISTORY: (id: string) => `/users/${id}/login-history`,
    ACTIVITY: (id: string) => `/users/${id}/activity`,
  },
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: string) => `/employees/${id}`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: string) => `/departments/${id}`,
  },
  ATTENDANCE: {
    BASE: '/attendance',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    TODAY: '/attendance/today',
  },
  LEAVE: {
    BASE: '/leave-requests',
    BY_ID: (id: string) => `/leave-requests/${id}`,
    APPROVE: (id: string) => `/leave-requests/${id}/approve`,
    REJECT: (id: string) => `/leave-requests/${id}/reject`,
  },
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    MILESTONES: (id: string) => `/projects/${id}/milestones`,
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    STATUS: (id: string) => `/tasks/${id}/status`,
  },
  TIMESHEETS: {
    BASE: '/timesheets',
    BY_ID: (id: string) => `/timesheets/${id}`,
    STATUS: (id: string) => `/timesheets/${id}/status`,
  },
  SALES: {
    PIPELINE: '/leads',
    LEADS: '/leads',
    PROPOSALS: '/proposals',
    CONTRACTS: '/contracts',
  },
  FINANCE: {
    INVOICES: '/finance/invoices',
    PAYMENTS: '/finance/invoices',
    REPORTS: '/reports',
  },
  DOCUMENTS: {
    BASE: '/media',
    UPLOAD: '/media',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
  BACKUPS: {
    BASE: '/backups',
    BY_FILENAME: (filename: string) => `/backups/${filename}`,
    DOWNLOAD: (filename: string) => `/backups/${filename}/download`,
  },
  ACCESS_CONTROL: {
    ROLES: '/access-control/roles',
    ROLE_BY_ID: (id: string) => `/access-control/roles/${id}`,
    ROLE_STATUS: (id: string) => `/access-control/roles/${id}/status`,
    ROLE_PERMISSIONS: (id: string) => `/access-control/roles/${id}/permissions`,
    ROLE_PERMISSION: (roleId: string, permissionId: string) =>
      `/access-control/roles/${roleId}/permissions/${permissionId}`,
    ROLE_USERS: (id: string) => `/access-control/roles/${id}/users`,
    ROLE_ACTIVITY: (id: string) => `/access-control/roles/${id}/activity`,
    PERMISSIONS: '/access-control/permissions',
    PERMISSION_MODULES: '/access-control/permissions/modules',
    PERMISSION_BY_ID: (id: string) => `/access-control/permissions/${id}`,
    PERMISSION_STATUS: (id: string) => `/access-control/permissions/${id}/status`,
    PERMISSION_ROLES: (id: string) => `/access-control/permissions/${id}/roles`,
  },
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
  },
  AUDIT: {
    LOGS: '/audit-logs',
  },
};

export default API_ENDPOINTS;
