import { useEffect, useState } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  nextAction?: 'click' | 'navigate' | 'complete';
  nextUrl?: string;
}

export const tourSteps: TourStep[] = [
  {
    id: 'daily-focus',
    title: 'Daily Focus',
    description: 'Mulai hari Anda dengan fokus pada tugas prioritas dan progress yang perlu diperbarui',
    target: '[data-tour="daily-focus"]',
    position: 'right',
    nextAction: 'click',
  },
  {
    id: 'goals',
    title: 'Goals (Objectives)',
    description: 'Kelola tujuan organisasi Anda dengan sistem OKR yang terstruktur',
    target: '[data-tour="goals"]',
    position: 'right',
    nextAction: 'click',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Pantau dan kelola semua tugas yang terkait dengan objectives Anda',
    target: '[data-tour="tasks"]',
    position: 'right',
    nextAction: 'click',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Lihat perkembangan progress dalam format timeline yang mudah dipahami',
    target: '[data-tour="timeline"]',
    position: 'right',
    nextAction: 'click',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Analisis performa dan pencapaian tim melalui dashboard yang komprehensif',
    target: '[data-tour="analytics"]',
    position: 'right',
    nextAction: 'click',
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Dapatkan update terbaru tentang aktivitas tim dan perkembangan objectives',
    target: '[data-tour="notifications"]',
    position: 'left',
    nextAction: 'complete',
  },
];

export function useTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('tour-completed');
    const hasSeenOnboarding = localStorage.getItem('onboarding-completed');
    
    if (!hasCompletedTour && hasSeenOnboarding) {
      setIsActive(true);
    }
  }, []);

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    localStorage.removeItem('tour-completed');
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps([...completedSteps, tourSteps[currentStep].id]);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCompletedSteps(completedSteps.filter(id => id !== tourSteps[currentStep].id));
    }
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem('tour-completed', 'true');
  };

  const completeTour = () => {
    setIsActive(false);
    setCompletedSteps([...completedSteps, tourSteps[currentStep].id]);
    localStorage.setItem('tour-completed', 'true');
  };

  const getCurrentStep = () => {
    return tourSteps[currentStep];
  };

  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  return {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    getCurrentStep,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    startTour,
    isStepCompleted,
    completedSteps,
  };
}