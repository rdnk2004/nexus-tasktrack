import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050507] text-gray-200 selection:bg-amber-500/30 overflow-x-hidden flex flex-col">
      {/* Ambient Canvas Mesh Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10vw] left-[15vw] w-[45vw] h-[45vw] rounded-full bg-radial-amber filter blur-[100px] opacity-15" />
        <div className="absolute bottom-[-10vw] right-[10vw] w-[40vw] h-[40vw] rounded-full bg-radial-blue filter blur-[100px] opacity-10" />
      </div>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
        <Outlet />
      </main>
    </div>
  );
};
