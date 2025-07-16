import React from 'react';

interface TimelineIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'muted';
}

export const TimelineIcon: React.FC<TimelineIconProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    primary: 'text-orange-600',
    secondary: 'text-blue-600',
    success: 'text-green-600',
    muted: 'text-gray-500'
  };

  return (
    <svg
      className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer circle with dashed border */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeDasharray="3 3"
        fill="none"
      />
      
      {/* Inner circle with checkmark */}
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
      />
      
      {/* Checkmark */}
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};