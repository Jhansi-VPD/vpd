import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import { ApiResponse, User } from '../types/common.types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.AUTH.LOGIN, data),

  logout: () =>
    apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT),

  getMe: () =>
    apiClient.get<ApiResponse<{ user: User }>>(API_ENDPOINTS.AUTH.ME),

  refreshToken: () =>
    apiClient.post<ApiResponse<{ access_token: string }>>(API_ENDPOINTS.AUTH.REFRESH),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),

  resetPassword: (payload: { token: string; password: string }) =>
    apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload),
};

export default authApi;

