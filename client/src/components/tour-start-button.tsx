import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useTour } from '@/hooks/useTour';

interface TourStartButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function TourStartButton({ className, variant = 'outline', size = 'default' }: TourStartButtonProps) {
  const { startTour } = useTour();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={startTour}
      className={className}
    >
      <Play className="w-4 h-4 mr-2" />
      Mulai Tur
    </Button>
  );
}