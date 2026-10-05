import React from 'react';
import { getAvatarPreset } from '../../utils/avatars';

interface AvatarDisplayProps {
  avatarId?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  name,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs rounded-lg',
    sm: 'w-8 h-8 text-sm rounded-xl',
    md: 'w-10 h-10 text-base rounded-xl',
    lg: 'w-14 h-14 text-2xl rounded-2xl',
    xl: 'w-20 h-20 text-4xl rounded-3xl'
  };

  const preset = getAvatarPreset(avatarId);

  if (avatarId) {
    return (
      <div
        className={`bg-gradient-to-tr ${preset.bgGradient} ${sizeClasses[size]} border border-white/20 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs select-none ${className}`}
        title={name || preset.label}
      >
        <span>{preset.emoji}</span>
      </div>
    );
  }

  // Initial fallback if no preset selected - architectural monochrome monogram style
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'C';
  return (
    <div
      className={`bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-heading font-bold border border-stone-300 dark:border-stone-700 ${sizeClasses[size]} flex items-center justify-center shrink-0 shadow-2xs select-none ${className}`}
      title={name}
    >
      <span>{initial}</span>
    </div>
  );
};
