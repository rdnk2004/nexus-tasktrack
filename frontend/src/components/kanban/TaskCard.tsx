import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/types/task';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { formatDate } from '@/utils/colors';
import { Clock, AlertCircle, GripVertical, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface TaskCardProps {
  task: Task;
  index: number;
  onClick?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const isOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now();

  const priorityVariants: Record<string, 'rose' | 'amber' | 'blue'> = {
    high: 'rose',
    medium: 'amber',
    low: 'blue',
  };

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onClick?.(task)}
          className={clsx(
            'p-4 rounded-xl border transition-all select-none cursor-pointer group text-left relative overflow-hidden',
            snapshot.isDragging
              ? 'bg-[#181822] border-amber-500/60 shadow-[0_16px_36px_rgba(0,0,0,0.85)] scale-[1.02] rotate-1 z-50'
              : 'bg-[#0c0c10]/90 hover:bg-[#121218] border-white/5 hover:border-amber-500/30 shadow-lg'
          )}
        >
          {/* Card Drag Handle & Priority */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant={priorityVariants[task.priority] || 'neutral'} size="xs">
              {task.priority}
            </Badge>

            <div
              {...provided.dragHandleProps}
              className="text-gray-600 hover:text-gray-400 p-1 rounded transition-colors cursor-grab active:cursor-grabbing"
              title="Drag directive"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
            {task.title}
          </h4>

          {/* Description snippet */}
          {task.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Footer: Deadline & Assignees */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
            {/* Deadline */}
            <span
              className={clsx(
                'flex items-center gap-1 font-mono text-[11px]',
                isOverdue && task.status !== 'done'
                  ? 'text-rose-400 font-bold'
                  : 'text-gray-500'
              )}
            >
              {isOverdue && task.status !== 'done' ? (
                <AlertCircle className="w-3 h-3 text-rose-400" />
              ) : (
                <Clock className="w-3 h-3 text-gray-500" />
              )}
              {task.deadline ? formatDate(task.deadline) : 'No date'}
            </span>

            {/* Assignee Avatars */}
            <div className="flex items-center -space-x-1.5">
              {task.assignees?.slice(0, 3).map((a) => (
                <div key={a.email} className="relative group/avatar">
                  <Avatar email={a.email} size="xs" />
                  {a.status === 'done' && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-neutral-950 rounded-full w-3 h-3 flex items-center justify-center">
                      <CheckCircle className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              ))}
              {(task.assignees?.length || 0) > 3 && (
                <span className="w-5 h-5 rounded-md bg-neutral-800 text-gray-400 text-[9px] font-bold flex items-center justify-center border border-neutral-900">
                  +{task.assignees.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
