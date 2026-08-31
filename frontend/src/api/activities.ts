import { apiClient } from './client';
import { Activity, DashboardStats } from '@/types/activity';

export const activitiesApi = {
  listRecent: async (limit = 50): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>('/activities', { params: { limit } });
    return response.data;
  },

  listMy: async (limit = 50): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>('/activities/my', { params: { limit } });
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};
