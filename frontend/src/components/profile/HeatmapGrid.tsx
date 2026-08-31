import React from 'react';
import { Activity } from '@/types/activity';
import { Flame, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface HeatmapGridProps {
  activities?: Activity[];
  isLoading: boolean;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ activities = [], isLoading }) => {
  // Generate 28 consecutive days ending with today
  const days: { date: Date; dateString: string; count: number }[] = [];
  const activityMap = new Map<string, number>();

  activities.forEach((a) => {
    const dStr = new Date(a.created_at).toISOString().split('T')[0];
    activityMap.set(dStr, (activityMap.get(dStr) || 0) + 1);
  });

  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    days.push({
      date: d,
      dateString,
      count: activityMap.get(dateString) || 0,
    });
  }

  // Calculate current streak
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      currentStreak++;
    } else if (i === days.length - 1 && days[i].count === 0) {
      // If today has 0, check yesterday
      continue;
    } else {
      break;
    }
  }

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-white/5 border-white/5 text-transparent';
    if (count <= 2) return 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300';
    if (count <= 5) return 'bg-emerald-500/50 border-emerald-500/70 text-white';
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)] text-neutral-950 font-bold';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              28-Day Activity Heatmap
            </h3>
            <p className="text-xs text-gray-400">Contribution intensity across past 4 weeks</p>
          </div>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold font-mono">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{currentStreak} Day Streak</span>
        </div>
      </div>

      {/* Heatmap Matrix (7 days x 4 weeks) */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2.5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2.5">
            {days.map((day) => {
              const formattedDate = day.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={day.dateString}
                  title={`${formattedDate}: ${day.count} directive action(s)`}
                  className={clsx(
                    'h-10 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 cursor-pointer hover:scale-110 hover:z-10',
                    getCellColor(day.count)
                  )}
                >
                  <span className="text-[10px] font-mono leading-none">{day.count || ''}</span>
                  <span className="text-[8px] text-gray-400 font-mono mt-0.5 opacity-80">
                    {day.date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-white/5">
          <span>Less active</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white/5 border border-white/5" />
            <span className="w-3 h-3 rounded bg-emerald-500/25 border border-emerald-500/40" />
            <span className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500/70" />
            <span className="w-3 h-3 rounded bg-emerald-400 border border-emerald-300" />
          </div>
          <span>More active</span>
        </div>
      </div>
    </div>
  );
};
