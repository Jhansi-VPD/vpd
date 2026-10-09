export interface ApiResponse<T = any> {
  success: boolean;
  status_code: number;
  message?: string;
  data: T;
  meta?: any;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'hr'
  | 'sales'
  | 'marketing'
  | 'project_manager'
  | 'developer'
  | 'qa'
  | 'support'
  | 'finance'
  | 'employee'
  | 'client'
  | 'partner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Portal resolved server-side from the role mapping; null for unmapped roles. */
  portal?: string | null;
  phone?: string | null;
  avatar?: string | null;
  is_active: boolean;
  is_email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

