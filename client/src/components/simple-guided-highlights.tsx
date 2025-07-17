import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, X } from 'lucide-react';

interface SimpleGuidedHighlightsProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const HIGHLIGHT_STEPS = [
  {
    selector: '[data-tour="today-tasks-card"]',
    title: 'Kartu Task Hari Ini',
    content: 'Ini adalah kartu yang menampilkan task yang harus diselesaikan hari ini.',
    position: 'bottom'
  },
  {
    selector: '[data-tour="sidebar-menu"]',
    title: 'Menu Navigasi',
    content: 'Gunakan menu ini untuk navigasi ke berbagai fitur dalam aplikasi.',
    position: 'right'
  },
  {
    selector: '[data-tour="create-goal-button"]',
    title: 'Buat Goal Baru',
    content: 'Klik tombol ini untuk membuat objective dan key result baru.',
    position: 'bottom'
  },
  {
    selector: '[data-tour="user-profile-card"]',
    title: 'Profile Pengguna',
    content: 'Informasi profil dan level kemajuan Anda.',
    position: 'bottom'
  },
  {
    selector: '[data-tour="level-progress-card"]',
    title: 'Progress Level',
    content: 'Pantau kemajuan level dan pencapaian Anda.',
    position: 'bottom'
  }
];

function SimpleGuidedHighlights({ isActive, onComplete, onSkip }: SimpleGuidedHighlightsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentElement, setCurrentElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const step = HIGHLIGHT_STEPS[currentStep];
    if (!step) return;

    const element = document.querySelector(step.selector) as HTMLElement;
    if (element) {
      setCurrentElement(element);
      element.classList.add('onboarding-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (element) {
        element.classList.remove('onboarding-highlight');
      }
    };
  }, [isActive, currentStep]);

  const nextStep = () => {
    if (currentStep < HIGHLIGHT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (currentElement) {
      currentElement.classList.remove('onboarding-highlight');
    }
    onComplete();
  };

  const handleSkip = () => {
    if (currentElement) {
      currentElement.classList.remove('onboarding-highlight');
    }
    onSkip();
  };

  if (!isActive) return null;

  const step = HIGHLIGHT_STEPS[currentStep];
  const rect = currentElement?.getBoundingClientRect();

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" />
      
      {/* Tooltip */}
      {rect && (
        <div 
          className="fixed z-[1052] bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
          style={{
            left: rect.left + rect.width / 2 - 150,
            top: rect.bottom + 10,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{step.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-xs"
              >
                Sebelumnya
              </Button>
              <span className="text-xs text-gray-500">
                {currentStep + 1} dari {HIGHLIGHT_STEPS.length}
              </span>
            </div>
            
            <Button
              onClick={nextStep}
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs"
            >
              {currentStep === HIGHLIGHT_STEPS.length - 1 ? 'Selesai' : 'Selanjutnya'}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default SimpleGuidedHighlights;