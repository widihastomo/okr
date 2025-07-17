import { useState, useEffect } from 'react';

interface GuidedHighlightsState {
  isActive: boolean;
  isCompleted: boolean;
  currentStep: number;
  hasStarted: boolean;
}

export function useGuidedHighlights() {
  const [state, setState] = useState<GuidedHighlightsState>({
    isActive: false,
    isCompleted: false,
    currentStep: 0,
    hasStarted: false
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('guidedHighlightsState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
      } catch (error) {
        console.error('Error parsing guided highlights state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('guidedHighlightsState', JSON.stringify(state));
  }, [state]);

  const startGuidedHighlights = () => {
    setState({
      isActive: true,
      isCompleted: false,
      currentStep: 0,
      hasStarted: true
    });
  };

  const completeGuidedHighlights = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true
    }));
  };

  const skipGuidedHighlights = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true
    }));
  };

  const resetGuidedHighlights = () => {
    setState({
      isActive: false,
      isCompleted: false,
      currentStep: 0,
      hasStarted: false
    });
    localStorage.removeItem('guidedHighlightsState');
  };

  const setCurrentStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  return {
    ...state,
    startGuidedHighlights,
    completeGuidedHighlights,
    skipGuidedHighlights,
    resetGuidedHighlights,
    setCurrentStep
  };
}