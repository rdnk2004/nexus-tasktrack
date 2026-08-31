import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, ListProjectsParams } from '@/api/projects';
import { usersApi } from '@/api/users';
import { ProjectCreateInput, ProjectUpdateInput } from '@/types/project';
import { toast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/api/client';

export function useProjectsQuery(params?: ListProjectsParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.list(params),
  });
}

export function useProjectDetailQuery(projectId: number) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !isNaN(projectId) && projectId > 0,
  });
}

export function useAllUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.listAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectCreateInput) => projectsApi.create(data),
    onSuccess: (newProject) => {
      toast(`Project "${newProject.name}" initialized successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to create project'), 'error');
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: ProjectUpdateInput }) =>
      projectsApi.update(projectId, data),
    onSuccess: (updatedProject) => {
      toast(`Project "${updatedProject.name}" updated successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to update project'), 'error');
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => projectsApi.delete(projectId),
    onSuccess: () => {
      toast('Project permanently removed', 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to delete project'), 'error');
    },
  });
}
