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
    console.log("🎯 Tour start button clicked!");
    
    // Check if onboarding is completed to determine flow
    const onboardingCompleted = localStorage.getItem('onboarding-completed') === 'true';
    console.log("🔍 Onboarding completed:", onboardingCompleted);
    
    if (onboardingCompleted) {
      // Show welcome screen first, then tour
      console.log("🚀 Dispatching 'startTour' event");
      window.dispatchEvent(new CustomEvent('startTour'));
    } else {
      // Start tour directly if no onboarding
      console.log("🚀 Dispatching 'startTourDirect' event");
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