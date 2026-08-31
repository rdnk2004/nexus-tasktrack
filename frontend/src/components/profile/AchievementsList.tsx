import React from 'react';
import { Award, Zap, Target, ShieldCheck } from 'lucide-react';

interface AchievementsListProps {
  completedProjectsCount: number;
  completedTasksCount: number;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  completedProjectsCount,
  completedTasksCount,
}) => {
  const achievements = [
    {
      id: 'first-step',
      title: 'First Directive',
      description: 'Complete your first task directive in any sprint.',
      icon: Zap,
      unlocked: completedTasksCount >= 1,
      progress: `${Math.min(completedTasksCount, 1)}/1`,
    },
    {
      id: 'directive-pro',
      title: 'Directive Specialist',
      description: 'Successfully complete 5 task directives.',
      icon: Target,
      unlocked: completedTasksCount >= 5,
      progress: `${Math.min(completedTasksCount, 5)}/5`,
    },
    {
      id: 'project-closer',
      title: 'Sprint Finisher',
      description: 'Complete and deliver 1 full project sprint.',
      icon: Award,
      unlocked: completedProjectsCount >= 1,
      progress: `${Math.min(completedProjectsCount, 1)}/1`,
    },
    {
      id: 'squad-veteran',
      title: 'Squad Pillar',
      description: 'Deliver 3 completed project sprints with your team.',
      icon: ShieldCheck,
      unlocked: completedProjectsCount >= 3,
      progress: `${Math.min(completedProjectsCount, 3)}/3`,
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Milestones &amp; Badges
          </h3>
        </div>
        <span className="text-xs font-mono text-gray-400">
          {achievements.filter((a) => a.unlocked).length} of {achievements.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.unlocked
                  ? 'bg-amber-500/10 border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                  : 'bg-black/30 border-white/5 opacity-50 grayscale'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                    item.unlocked
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-neutral-800 text-gray-500 border-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white tracking-tight truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono text-gray-400">{item.progress}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
