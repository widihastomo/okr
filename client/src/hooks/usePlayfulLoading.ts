import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  type: string;
  message?: string;
  progress?: number;
}

interface LoadingOptions {
  type?: 'default' | 'saving' | 'loading' | 'uploading' | 'processing' | 'sending';
  message?: string;
  showProgress?: boolean;
  duration?: number;
}

export const usePlayfulLoading = (initialState: LoadingState = { isLoading: false, type: 'default' }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>(initialState);

  const startLoading = useCallback((options: LoadingOptions = {}) => {
    const { type = 'default', message, showProgress = false, duration } = options;
    
    setLoadingState({
      isLoading: true,
      type,
      message,
      progress: showProgress ? 0 : undefined
    });

    // Auto-stop loading after duration if specified
    if (duration) {
      setTimeout(() => {
        setLoadingState(prev => ({ ...prev, isLoading: false }));
      }, duration);
    }
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({ ...prev, progress }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({ ...prev, message }));
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    startLoading(options);
    try {
      const result = await asyncFunction();
      stopLoading();
      return result;
    } catch (error) {
      stopLoading();
      throw error;
    }
  }, [startLoading, stopLoading]);

  // Simulate progress for operations without real progress tracking
  const startProgressSimulation = useCallback((duration: number = 3000) => {
    setLoadingState(prev => ({ ...prev, progress: 0 }));
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 95); // Never reach 100% through simulation
      
      setLoadingState(prev => ({ ...prev, progress }));
      
      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 50);
    
    return interval;
  }, []);

  const completeProgress = useCallback(() => {
    setLoadingState(prev => ({ ...prev, progress: 100 }));
    setTimeout(() => {
      stopLoading();
    }, 500);
  }, [stopLoading]);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    withLoading,
    startProgressSimulation,
    completeProgress
  };
};

// Global loading context for app-wide loading states
import { createContext, useContext, ReactNode } from 'react';

interface GlobalLoadingContextType {
  globalLoading: LoadingState;
  setGlobalLoading: (state: LoadingState) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const GlobalLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState<LoadingState>({ isLoading: false, type: 'default' });

  return (
    <GlobalLoadingContext.Provider value={{ globalLoading, setGlobalLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
};

// Predefined loading configurations for common operations
export const LOADING_CONFIGS = {
  SAVING_OBJECTIVE: {
    type: 'saving' as const,
    message: 'Menyimpan objective...',
    showProgress: true
  },
  LOADING_DATA: {
    type: 'loading' as const,
    message: 'Memuat data...',
    showProgress: false
  },
  UPLOADING_FILE: {
    type: 'uploading' as const,
    message: 'Mengunggah file...',
    showProgress: true
  },
  PROCESSING_REQUEST: {
    type: 'processing' as const,
    message: 'Memproses permintaan...',
    showProgress: true
  },
  SENDING_EMAIL: {
    type: 'sending' as const,
    message: 'Mengirim email...',
    showProgress: true
  },
  COMPLETING_ONBOARDING: {
    type: 'processing' as const,
    message: 'Menyelesaikan onboarding...',
    showProgress: true
  },
  CREATING_ACCOUNT: {
    type: 'processing' as const,
    message: 'Membuat akun...',
    showProgress: true
  },
  VERIFYING_EMAIL: {
    type: 'processing' as const,
    message: 'Memverifikasi email...',
    showProgress: true
  },
  LOADING_DASHBOARD: {
    type: 'loading' as const,
    message: 'Memuat dashboard...',
    showProgress: false
  },
  SENDING_INVITATION: {
    type: 'sending' as const,
    message: 'Mengirim undangan...',
    showProgress: true
  }
};