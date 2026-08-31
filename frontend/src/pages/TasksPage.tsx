import React from 'react';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Kanban Task Board</h1>
      </div>
      <div className="glass-card p-8 rounded-2xl text-center">
        <p className="text-sm text-gray-400">Kanban Board implementation scheduled for Commit 9 & 10.</p>
      </div>
    </div>
  );
};
