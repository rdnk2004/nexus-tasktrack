import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: number, newStatus: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onUpdateStatus,
  onTaskClick,
}) => {
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doingTasks = tasks.filter((t) => t.status === 'doing');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside or in same position
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const taskId = Number(draggableId);

    if (!isNaN(taskId)) {
      onUpdateStatus(taskId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <KanbanColumn
          status="todo"
          title="To Do"
          tasks={todoTasks}
          onTaskClick={onTaskClick}
        />
        <KanbanColumn
          status="doing"
          title="In Progress"
          tasks={doingTasks}
          onTaskClick={onTaskClick}
        />
        <KanbanColumn
          status="done"
          title="Done"
          tasks={doneTasks}
          onTaskClick={onTaskClick}
        />
      </div>
    </DragDropContext>
  );
};
