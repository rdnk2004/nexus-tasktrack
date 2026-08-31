import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
      </div>
      <div className="glass-card p-8 rounded-2xl text-center">
        <p className="text-sm text-gray-400">Dashboard implementation scheduled for Commit 7.</p>
      </div>
    </div>
  );
};
