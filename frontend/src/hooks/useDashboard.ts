import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '@/api/activities';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { toast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/api/client';
import { TaskStatus } from '@/types/task';

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => activitiesApi.getDashboardStats(),
    refetchInterval: 30000, // Background poll every 30s
  });
}

export function useActivitiesQuery(limit = 30) {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: () => activitiesApi.listRecent(limit),
    refetchInterval: 20000, // Live pulse every 20s
  });
}

export function useMyTasksQuery() {
  return useQuery({
    queryKey: ['user', 'tasks'],
    queryFn: () => tasksApi.listMyTasks(),
  });
}

export function useActiveProjectsQuery() {
  return useQuery({
    queryKey: ['projects', 'active'],
    queryFn: () => projectsApi.list({ status: 'active' }),
  });
}

export function useUpdateMyTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      tasksApi.updateMyStatus(taskId, { status }),
    onSuccess: (data) => {
      toast(`Status updated: ${data.your_status.toUpperCase()}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['user', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to update task status'), 'error');
    },
  });
}
