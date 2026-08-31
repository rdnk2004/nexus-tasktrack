import { apiClient } from './client';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStatusUpdateInput } from '@/types/task';

export interface TaskStatusResponse {
  message: string;
  task_status: string;
  your_status: string;
}

export const tasksApi = {
  listByProject: async (projectId: number): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  },

  listMyTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/user/tasks');
    return response.data;
  },

  create: async (projectId: number, taskData: TaskCreateInput): Promise<Task> => {
    const response = await apiClient.post<Task>(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  update: async (taskId: number, taskData: TaskUpdateInput): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  updateMyStatus: async (taskId: number, statusData: TaskStatusUpdateInput): Promise<TaskStatusResponse> => {
    const response = await apiClient.put<TaskStatusResponse>(`/tasks/${taskId}/my-status`, statusData);
    return response.data;
  },

  delete: async (taskId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/tasks/${taskId}`);
    return response.data;
  },
};
