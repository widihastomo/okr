import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface TourStartButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function TourStartButton({ className, variant = 'outline', size = 'default' }: TourStartButtonProps) {
  const startTour = () => {
    // Check if onboarding is completed to determine flow
    const onboardingCompleted = localStorage.getItem('onboarding-completed') === 'true';
    
    if (onboardingCompleted) {
      // Show welcome screen first, then tour
      window.dispatchEvent(new CustomEvent('startTour'));
    } else {
      // Start tour directly if no onboarding
      window.dispatchEvent(new CustomEvent('startTourDirect'));
    }
  };

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