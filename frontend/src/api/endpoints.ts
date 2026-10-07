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
    LOCK: (id: string) => `/users/${id}/lock`,
    UNLOCK: (id: string) => `/users/${id}/unlock`,
    FORCE_PASSWORD_RESET: (id: string) => `/users/${id}/force-password-reset`,
    REVOKE_SESSIONS: (id: string) => `/users/${id}/revoke-sessions`,
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
  },
  SALES: {
    PIPELINE: '/sales/pipeline',
    LEADS: '/leads',
    PROPOSALS: '/proposals',
    CONTRACTS: '/contracts',
  },
  FINANCE: {
    INVOICES: '/invoices',
    PAYMENTS: '/payments',
    REPORTS: '/finance/reports',
  },
  DOCUMENTS: {
    BASE: '/documents',
    UPLOAD: '/uploads',
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
    PERMISSIONS: '/access-control/permissions',
  },
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
  },
  AUDIT: {
    LOGS: '/audit-logs',
  },
};

export default API_ENDPOINTS;
