import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const COLUMN_CONFIG: Record<
  TaskStatus,
  {
    icon: React.ReactNode;
    color: string;
    border: string;
    countBg: string;
    emptyText: string;
  }
> = {
  todo: {
    icon: <Circle className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    countBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    emptyText: 'No pending directives',
  },
  doing: {
    icon: <Clock className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    countBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    emptyText: 'No directives in progress',
  },
  done: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    countBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    emptyText: 'No completed directives',
  },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
}) => {
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex flex-col h-full bg-[#121218]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl">
      {/* Column Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          {config.icon}
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{title}</h3>
        </div>
        <span
          className={clsx(
            'text-xs font-mono font-bold px-2 py-0.5 rounded-full border',
            config.countBg
          )}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable Task Container */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              'flex-1 min-h-[350px] space-y-3 p-1 rounded-xl transition-colors duration-150',
              snapshot.isDraggingOver && 'bg-amber-500/5 ring-1 ring-amber-500/20'
            )}
          >
            {tasks.length === 0 ? (
              <div className="h-44 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-center p-4">
                <p className="text-xs text-gray-500 font-medium">{config.emptyText}</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={onTaskClick}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
