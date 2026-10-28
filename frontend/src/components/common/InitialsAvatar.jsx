import React from 'react';
import { cn } from '../../utils/cn';

/**
 * InitialsAvatar enforces the Psyco AI privacy & storage invariant:
 * Strictly text/SVG/CSS based. NO file uploaders, NO base64 images, NO binary storage.
 */
export function InitialsAvatar({ name = '', email = '', size = 'md', className = '' }) {
  const getInitials = () => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'PA';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-3xl font-bold',
  };

  // Generate deterministic subtle gradient hue based on name
  const getGradient = () => {
    const charCode = (name || email || 'P').charCodeAt(0);
    const hues = [
      'from-teal-600 to-emerald-700 text-teal-100 border-teal-400/30',
      'from-cyan-600 to-blue-700 text-cyan-100 border-cyan-400/30',
      'from-indigo-600 to-sky-700 text-indigo-100 border-indigo-400/30',
      'from-emerald-600 to-teal-800 text-emerald-100 border-emerald-400/30',
    ];
    return hues[charCode % hues.length];
  };

  return (
    <div
      aria-label={`Avatar for ${name || email || 'User'}`}
      className={cn(
        'rounded-full bg-gradient-to-br border flex items-center justify-center select-none shadow-sm flex-shrink-0 font-medium tracking-wide',
        sizeClasses[size] || sizeClasses.md,
        getGradient(),
        className
      )}
    >
      <span>{getInitials()}</span>
    </div>
  );
}
