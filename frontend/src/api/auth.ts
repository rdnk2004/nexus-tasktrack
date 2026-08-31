import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  User,
  PasswordChangeRequest,
  ResetPasswordRequest,
  UserStats,
} from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/me');
    return response.data;
  },

  changePassword: async (data: PasswordChangeRequest): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>('/me/password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/reset-password', data);
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/user/stats');
    return response.data;
  },
};
