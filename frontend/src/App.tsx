import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#050507] text-gray-100 flex items-center justify-center p-6">
          <div className="glass-card max-w-lg w-full p-8 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              ⚡
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Nutmeg Workspace</h1>
            <p className="text-sm text-gray-400">
              Frontend architecture initialized with Vite, React, TypeScript, and Tailwind CSS.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ Commit 1 Complete
            </div>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
