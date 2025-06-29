import { Users } from "lucide-react";
import * as React from "react";

interface UserAvatarProps {
  name: string;
  type: 'user' | 'team';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, type, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (type === 'team') {
    return (
      <div className={`${sizeClasses[size]} bg-blue-100 rounded-full flex items-center justify-center ${className}`}>
        <Users className="w-3 h-3 text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center text-white font-medium ${className}`}>
      {getInitials(name)}
    </div>
  );
}

// Legacy shadcn/ui Avatar components for compatibility
export const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={`aspect-square h-full w-full ${className}`}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 ${className}`}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";