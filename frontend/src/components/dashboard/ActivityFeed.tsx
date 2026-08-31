import React from 'react';
import { Activity } from '@/types/activity';
import { Avatar } from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/Skeleton';
import { Activity as PulseIcon, Radio } from 'lucide-react';

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isLoading }) => {
  return (
    <section className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5 tracking-tight">
            <PulseIcon className="w-5 h-5 text-amber-400" />
            Live Team Pulse
          </h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Radio className="w-3 h-3 animate-pulse" /> Live
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
            <PulseIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No team activity logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3 transition-colors hover:bg-neutral-900"
              >
                <Avatar email={activity.user_email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-200 leading-snug">
                    <span className="font-bold text-white">{activity.user_name}</span>{' '}
                    <span className="text-gray-400">{activity.description.replace(`${activity.user_name} `, '')}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {activity.humanized_time}
                    </span>
                    {activity.project_name && (
                      <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono truncate max-w-[140px]">
                        {activity.project_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 text-center">
        <p className="text-[11px] text-gray-500 font-mono">
          Auto-synchronized with backend events
        </p>
      </div>
    </section>
  );
};
