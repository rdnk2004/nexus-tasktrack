import React from 'react';
import { DashboardMemberStat } from '@/types/activity';
import { Avatar } from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/Skeleton';
import { Trophy, Medal } from 'lucide-react';
import { clsx } from 'clsx';

interface LeaderboardTableProps {
  members?: DashboardMemberStat[];
  currentUserEmail?: string;
  isLoading: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  members = [],
  currentUserEmail,
  isLoading,
}) => {
  // Filter out any legacy nutmeg emails and sort by completed tasks this week descending
  const sortedMembers = members
    .filter((m) => !m.email.toLowerCase().includes('@nutmeg.com'))
    .sort((a, b) => b.completed_tasks_this_week - a.completed_tasks_this_week);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
          <Trophy className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-6 h-6 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/30 flex items-center justify-center font-bold text-xs">
          <Medal className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-6 h-6 rounded-lg bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center font-bold text-xs">
          <Medal className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-lg bg-white/5 text-gray-400 font-mono text-xs flex items-center justify-center">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Squad Leaderboard</h3>
            <p className="text-xs text-gray-400">Directives delivered this week</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : sortedMembers.length === 0 ? (
        <p className="text-xs text-gray-500 py-6 text-center">No squad data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Operator</th>
                <th className="pb-3 text-center">Active Projects</th>
                <th className="pb-3 text-right pr-2">Completed (7d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedMembers.map((member, index) => {
                const isMe = member.email === currentUserEmail;

                return (
                  <tr
                    key={member.email}
                    className={clsx(
                      'transition-colors hover:bg-white/5',
                      isMe && 'bg-amber-500/10'
                    )}
                  >
                    <td className="py-3 pl-2">{getRankBadge(index)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar email={member.email} size="sm" />
                        <div>
                          <p className="font-bold text-white leading-tight flex items-center gap-1.5">
                            {member.name}
                            {isMe && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono text-gray-300">
                      {member.active_projects}
                    </td>
                    <td className="py-3 text-right pr-2 font-mono font-bold text-emerald-400">
                      {member.completed_tasks_this_week}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
