import React from 'react';
import { DashboardStats } from '@/types/activity';
import { Skeleton } from '@/components/common/Skeleton';
import { FolderKanban, CheckCircle2, ListTodo, Users } from 'lucide-react';

interface StatCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Active Projects',
      value: stats?.active_projects ?? 0,
      totalLabel: `of ${stats?.total_projects ?? 0} total`,
      icon: FolderKanban,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Completed Directives',
      value: stats?.completed_tasks ?? 0,
      totalLabel: `of ${stats?.total_tasks ?? 0} total`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Pending Directives',
      value: (stats?.total_tasks ?? 0) - (stats?.completed_tasks ?? 0),
      totalLabel: 'in progress or todo',
      icon: ListTodo,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Team Operators',
      value: stats?.members?.length ?? 0,
      totalLabel: 'active in squad',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="glass-card p-4 sm:p-5 rounded-2xl flex items-center justify-between border border-white/5"
          >
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {card.value}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">{card.totalLabel}</span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${card.bg}`}
            >
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
