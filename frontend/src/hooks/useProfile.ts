import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { activitiesApi } from '@/api/activities';
import { PasswordChangeRequest } from '@/types/auth';
import { toast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/api/client';

export function useUserStatsQuery() {
  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => authApi.getUserStats(),
  });
}

export function useMyActivitiesQuery(limit = 100) {
  return useQuery({
    queryKey: ['activities', 'my', limit],
    queryFn: () => activitiesApi.listMy(limit),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) => authApi.changePassword(data),
    onSuccess: (res) => {
      toast(res.message || 'Password updated successfully!', 'success');
    },
    onError: (error) => {
      toast(extractErrorMessage(error, 'Failed to update password'), 'error');
    },
  });
}
