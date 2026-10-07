import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, User } from '../types/common.types';

export const usersApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<User[]>>(API_ENDPOINTS.USERS.BASE, { params } as any),
  getById: (id: string) => apiClient.get<ApiResponse<User>>(API_ENDPOINTS.USERS.BY_ID(id)),
  create: (data: Partial<User>) => apiClient.post<ApiResponse<User>>(API_ENDPOINTS.USERS.BASE, data),
  update: (id: string, data: Partial<User>) => apiClient.put<ApiResponse<User>>(API_ENDPOINTS.USERS.BY_ID(id), data),
  delete: (id: string) => apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.USERS.BY_ID(id)),
  lock: (id: string) => apiClient.post<ApiResponse<void>>(API_ENDPOINTS.USERS.LOCK(id)),
  unlock: (id: string) => apiClient.post<ApiResponse<void>>(API_ENDPOINTS.USERS.UNLOCK(id)),
  forcePasswordReset: (id: string) => apiClient.post<ApiResponse<void>>(API_ENDPOINTS.USERS.FORCE_PASSWORD_RESET(id)),
  revokeSessions: (id: string) => apiClient.post<ApiResponse<void>>(API_ENDPOINTS.USERS.REVOKE_SESSIONS(id)),
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
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.TIMESHEETS.BASE, { params } as any),
  logTime: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.TIMESHEETS.BASE, data),
};

export const salesApi = {
  getPipeline: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SALES.PIPELINE),
};

export const leadsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SALES.LEADS),
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
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.ACCESS_CONTROL.ROLES, { params } as any),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACCESS_CONTROL.ROLES, data),
  update: (id: string, data: any) => apiClient.put<ApiResponse<any>>(`${API_ENDPOINTS.ACCESS_CONTROL.ROLES}/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`${API_ENDPOINTS.ACCESS_CONTROL.ROLES}/${id}`),
};

export const permissionsApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSIONS, { params } as any),
  create: (data: any) => apiClient.post<ApiResponse<any>>(API_ENDPOINTS.ACCESS_CONTROL.PERMISSIONS, data),
  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`${API_ENDPOINTS.ACCESS_CONTROL.PERMISSIONS}/${id}`),
};

export const dashboardApi = {
  getOverview: () => apiClient.get<ApiResponse<any>>(API_ENDPOINTS.DASHBOARD.OVERVIEW),
};
