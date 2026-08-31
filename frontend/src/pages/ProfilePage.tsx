import React, { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useUserStatsQuery, useMyActivitiesQuery } from '@/hooks/useProfile';
import { useDashboardStatsQuery } from '@/hooks/useDashboard';
import { HeatmapGrid } from '@/components/profile/HeatmapGrid';
import { AchievementsList } from '@/components/profile/AchievementsList';
import { LeaderboardTable } from '@/components/profile/LeaderboardTable';
import { PasswordModal } from '@/components/profile/PasswordModal';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common';
import { Skeleton } from '@/components/common/Skeleton';
import { User, KeyRound, FolderKanban, CheckCircle2, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { data: userStats, isLoading: isUserStatsLoading } = useUserStatsQuery();
  const { data: myActivities, isLoading: isActivitiesLoading } = useMyActivitiesQuery(100);
  const { data: dashboardStats, isLoading: isDashboardStatsLoading } = useDashboardStatsQuery();

  const userName = user?.email ? user.email.split('@')[0].toUpperCase() : 'OPERATOR';

  // Calculate completed directives from activities
  const completedTasksCount = (myActivities || []).filter(
    (a) => a.activity_type === 'task_completed'
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Operator Header Hero */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar email={user?.email || ''} size="xl" className="text-xl" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {userName}
                </h1>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" /> Active Operator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 font-mono">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPasswordModalOpen(true)}
            leftIcon={<KeyRound className="w-4 h-4 text-amber-400" />}
          >
            Change Password
          </Button>
        </div>

        {/* Quick Stat Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5">
          {isUserStatsLoading ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Active Projects
                  </p>
                  <p className="text-xl font-bold text-white font-mono">
                    {userStats?.active_count ?? 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Completed Sprints
                  </p>
                  <p className="text-xl font-bold text-white font-mono">
                    {userStats?.done_count ?? 0}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Total Sprints
                  </p>
                  <p className="text-xl font-bold text-white font-mono">
                    {userStats?.total ?? 0}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid: 28-Day Heatmap & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <HeatmapGrid activities={myActivities} isLoading={isActivitiesLoading} />

        <AchievementsList
          completedProjectsCount={userStats?.done_count ?? 0}
          completedTasksCount={completedTasksCount}
        />
      </div>

      {/* Squad Leaderboard */}
      <LeaderboardTable
        members={dashboardStats?.members}
        currentUserEmail={user?.email}
        isLoading={isDashboardStatsLoading}
      />

      {/* Change Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
