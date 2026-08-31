import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAvatarColor, getFirstName } from '@/utils/colors';

export interface AvatarProps {
  email?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  email = '',
  name,
  size = 'md',
  className,
  showTooltip = true,
}) => {
  const displayName = name || getFirstName(email);
  const initial = displayName.charAt(0).toUpperCase() || 'U';
  const colorClass = getAvatarColor(email);

  const sizeStyles = {
    xs: 'w-5 h-5 text-[10px] rounded-md',
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-8 h-8 text-xs font-bold rounded-lg',
    lg: 'w-10 h-10 text-sm font-bold rounded-xl',
    xl: 'w-14 h-14 text-lg font-extrabold rounded-2xl',
  };

  return (
    <div
      title={showTooltip ? email || displayName : undefined}
      className={twMerge(
        clsx(
          'flex items-center justify-center font-bold select-none shrink-0 border border-neutral-900',
          colorClass,
          sizeStyles[size],
          className
        )
      )}
    >
      {initial}
    </div>
  );
};
