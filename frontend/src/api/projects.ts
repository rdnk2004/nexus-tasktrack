import { apiClient } from './client';
import { Project, ProjectCreateInput, ProjectUpdateInput, ProjectStatus } from '@/types/project';

export interface ListProjectsParams {
  status?: ProjectStatus;
  type?: 'individual' | 'collaborative';
}

export const projectsApi = {
  list: async (params?: ListProjectsParams): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects', { params });
    return response.data;
  },

  getById: async (projectId: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  create: async (projectData: ProjectCreateInput): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', projectData);
    return response.data;
  },

  update: async (projectId: number, projectData: ProjectUpdateInput): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${projectId}`, projectData);
    return response.data;
  },

  delete: async (projectId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/projects/${projectId}`);
    return response.data;
  },
};
