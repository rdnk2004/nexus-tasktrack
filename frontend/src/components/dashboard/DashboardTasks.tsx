import React from 'react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus } from '@/types/task';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/common/Badge';
import { formatDate } from '@/utils/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardTasksProps {
  tasks?: Task[];
  isLoading: boolean;
  onUpdateStatus: (taskId: number, status: TaskStatus) => void;
  isUpdating?: boolean;
}

export const DashboardTasks: React.FC<DashboardTasksProps> = ({
  tasks,
  isLoading,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const { user } = useAuthStore();

  // Filter tasks that are todo or doing for the current user
  const pendingTasks = (tasks || []).filter((task) => {
    const myAssignment = task.assignees?.find((a) => a.email === user?.email);
    const myStatus = myAssignment ? myAssignment.status : task.status;
    return myStatus !== 'done';
  });

  const priorityVariants: Record<string, 'rose' | 'amber' | 'blue'> = {
    high: 'rose',
    medium: 'amber',
    low: 'blue',
  };

  return (
    <section className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5 tracking-tight">
            <ListTodo className="w-5 h-5 text-amber-400" />
            My Pending Directives
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
              {pendingTasks.length}
            </span>
          </h2>
          <Link
            to="/tasks"
            className="text-xs text-gray-400 hover:text-amber-400 font-bold transition-colors"
          >
            Kanban Board →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">All directives are completed!</p>
            <p className="text-[11px] text-gray-500 mt-1">Enjoy your cleared pipeline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.slice(0, 5).map((task) => {
              const myAssignment = task.assignees?.find((a) => a.email === user?.email);
              const myStatus = myAssignment ? myAssignment.status : task.status;
              const isOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now();

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/20 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                        {task.title}
                      </h4>
                      <Badge variant={priorityVariants[task.priority] || 'neutral'} size="xs">
                        {task.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span
                        className={clsx(
                          'flex items-center gap-1 font-medium',
                          isOverdue ? 'text-rose-400 font-bold' : 'text-gray-400'
                        )}
                      >
                        {isOverdue ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        {task.deadline ? formatDate(task.deadline) : 'No deadline'}
                      </span>
                      <span className="capitalize text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        {myStatus}
                      </span>
                    </div>
                  </div>

                  {/* Complete Action Button */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus(task.id, 'done')}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shrink-0 active:scale-95 disabled:opacity-50"
                    title="Mark directive as completed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5">
        <Link
          to="/tasks"
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 font-bold transition-colors w-full py-1.5 rounded-lg hover:bg-white/5"
        >
          Open full Kanban board →
        </Link>
      </div>
    </section>
  );
};
