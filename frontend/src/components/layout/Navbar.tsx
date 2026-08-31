import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuthStore';
import { toast } from '@/hooks/useToast';
import { Avatar } from '@/components/common/Avatar';
import { Layers, LayoutDashboard, FolderKanban, User, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast('Signed out successfully', 'info');
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="bg-neutral-950/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Brand Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">NUTMEG</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded ml-2 border border-amber-400/20">
                Workspace
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    clsx(
                      'text-sm font-semibold transition-all flex items-center gap-2 py-1',
                      isActive
                        ? 'text-amber-400 border-b-2 border-amber-400'
                        : 'text-gray-400 hover:text-white'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4 sm:gap-6">
            <NavLink
              to="/profile"
              className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10 hover:opacity-90 transition-opacity"
            >
              <Avatar email={user?.email || ''} size="md" />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {user?.email ? user.email.split('@')[0].toUpperCase() : 'USER'}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">Team Member</p>
              </div>
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="group bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-all border border-white/10 hover:border-rose-500/40 flex items-center gap-2 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-rose-400 transition-colors" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav className="md:hidden border-t border-white/10 px-4 py-2 flex gap-2 bg-black/60 backdrop-blur-md">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              clsx(
                'flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors',
                isActive
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : 'text-gray-400 hover:bg-white/5'
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};
