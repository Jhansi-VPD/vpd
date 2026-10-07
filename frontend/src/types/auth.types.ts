import { User, UserRole } from './common.types';

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  access_token?: string;
  token_type?: string;
}

export interface SessionInfo {
  user: User;
  role: UserRole;
  permissions: string[];
}

