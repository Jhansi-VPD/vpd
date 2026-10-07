import { authApi } from '../api/auth.api';
import { LoginRequest } from '../types/auth.types';

export const authService = {
  login: async (creds: LoginRequest) => {
    return authApi.login(creds);
  },
  logout: async () => {
    return authApi.logout();
  },
  getCurrentUser: async () => {
    return authApi.getMe();
  },
  forgotPassword: async (email: string) => {
    return authApi.forgotPassword(email);
  },
  resetPassword: async (token: string, pass: string) => {
    return authApi.resetPassword({ token, password: pass });
  },
};

export default authService;

