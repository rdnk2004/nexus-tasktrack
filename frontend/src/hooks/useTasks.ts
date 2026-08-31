import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStatus } from '@/types/task';
import { toast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/api/client';

export function useProjectTasksQuery(projectId: number) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => tasksApi.listByProject(projectId),
    enabled: !isNaN(projectId) && projectId > 0,
  });
}

export function useOptimisticTaskStatusMutation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      tasksApi.updateMyStatus(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['projects', projectId, 'tasks']);

      // Optimistically update cache
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['projects', projectId, 'tasks'],
          previousTasks.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
      }

      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      // Rollback cache to snapshot if mutation failed
      if (context?.previousTasks) {
        queryClient.setQueryData(['projects', projectId, 'tasks'], context.previousTasks);
      }
      toast(extractErrorMessage(err, 'Failed to update task status'), 'error');
    },
    onSettled: () => {
      // Invalidate to ensure sync with server state
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'tasks'] });
    },
  });
}

export function useCreateTaskMutation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreateInput) => tasksApi.create(projectId, data),
    onSuccess: (newTask) => {
      toast(`Directive "${newTask.title}" added to board!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to create directive'), 'error');
    },
  });
}

export function useUpdateTaskMutation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskUpdateInput }) =>
      tasksApi.update(taskId, data),
    onSuccess: (updatedTask) => {
      toast(`Directive "${updatedTask.title}" updated`, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to update directive'), 'error');
    },
  });
}

export function useDeleteTaskMutation(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onSuccess: () => {
      toast('Directive removed from board', 'info');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to delete directive'), 'error');
    },
  });
}
