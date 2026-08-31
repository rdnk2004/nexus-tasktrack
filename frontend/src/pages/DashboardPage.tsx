import React from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  useDashboardStatsQuery,
  useActiveProjectsQuery,
  useMyTasksQuery,
  useActivitiesQuery,
  useUpdateMyTaskStatusMutation,
} from '@/hooks/useDashboard';
import { StatCards } from '@/components/dashboard/StatCards';
import { DashboardProjects } from '@/components/dashboard/DashboardProjects';
import { DashboardTasks } from '@/components/dashboard/DashboardTasks';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const userName = user?.email ? user.email.split('@')[0].toUpperCase() : 'OPERATOR';

  const { data: stats, isLoading: isStatsLoading } = useDashboardStatsQuery();
  const { data: activeProjects, isLoading: isProjectsLoading } = useActiveProjectsQuery();
  const { data: myTasks, isLoading: isTasksLoading } = useMyTasksQuery();
  const { data: activities, isLoading: isActivitiesLoading } = useActivitiesQuery(30);

  const updateStatusMutation = useUpdateMyTaskStatusMutation();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Workspace Directive Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Real-time project governance, task directives, and team throughput metrics.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-mono text-gray-400">{formattedDate}</p>
          <span className="inline-block text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
            ⚡ Systems Operational
          </span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <StatCards stats={stats} isLoading={isStatsLoading} />

      {/* 3-Column Dashboard Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        <DashboardProjects projects={activeProjects} isLoading={isProjectsLoading} />

        <DashboardTasks
          tasks={myTasks}
          isLoading={isTasksLoading}
          onUpdateStatus={(taskId, status) =>
            updateStatusMutation.mutate({ taskId, status })
          }
          isUpdating={updateStatusMutation.isPending}
        />

        <ActivityFeed activities={activities} isLoading={isActivitiesLoading} />
      </div>
    </div>
  );
};
