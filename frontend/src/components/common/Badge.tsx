import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'amber' | 'emerald' | 'purple' | 'blue' | 'rose' | 'neutral';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    neutral: 'bg-white/5 text-gray-300 border-white/10',
  };

  const dotColors: Record<BadgeVariant, string> = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
    blue: 'bg-blue-400',
    rose: 'bg-rose-400',
    neutral: 'bg-gray-400',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-semibold rounded-lg border tracking-wide uppercase',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  );
};
