import { apiClient } from './client';

export const usersApi = {
  listAll: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/users');
    return response.data;
  },
};
