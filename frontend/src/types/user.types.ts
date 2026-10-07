import { UserRole } from './common.types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  department_id?: string;
  department_name?: string;
  designation?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface RolePermission {
  role: UserRole;
  permissions: string[];
  description: string;
}

