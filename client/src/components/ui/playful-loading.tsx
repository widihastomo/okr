import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayfulLoadingProps {
  type?: 'default' | 'saving' | 'loading' | 'uploading' | 'processing' | 'sending';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

// Character components
const LoadingCharacter = ({ type, size }: { type: string; size: string }) => {
  const [currentEmotion, setCurrentEmotion] = useState('thinking');
  
  useEffect(() => {
    const emotions = ['thinking', 'working', 'excited', 'focused'];
    const interval = setInterval(() => {
      setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const eyeVariants = {
    thinking: { scaleY: 0.6, rotateZ: -5 },
    working: { scaleY: 1, rotateZ: 0 },
    excited: { scaleY: 1.2, rotateZ: 5 },
    focused: { scaleY: 0.8, rotateZ: 0 }
  };

  const mouthVariants = {
    thinking: { scaleX: 0.8, rotateZ: -2 },
    working: { scaleX: 1, rotateZ: 0 },
    excited: { scaleX: 1.2, rotateZ: 8 },
    focused: { scaleX: 0.9, rotateZ: 0 }
  };

  return (
    <div className={`relative ${sizeClasses[size as keyof typeof sizeClasses]}`}>
      {/* Character body */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Eyes */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-2 h-2 bg-white rounded-full"
        animate={eyeVariants[currentEmotion as keyof typeof eyeVariants]}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-2 h-2 bg-white rounded-full"
        animate={eyeVariants[currentEmotion as keyof typeof eyeVariants]}
        transition={{ duration: 0.5 }}
      />
      
      {/* Pupils */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-1 h-1 bg-black rounded-full ml-0.5 mt-0.5"
        animate={{
          x: [0, 1, -1, 0],
          y: [0, 0.5, 0, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-1 h-1 bg-black rounded-full mr-0.5 mt-0.5"
        animate={{
          x: [0, -1, 1, 0],
          y: [0, 0.5, 0, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Mouth */}
      <motion.div
        className="absolute bottom-1/3 left-1/2 w-3 h-1 bg-white rounded-full transform -translate-x-1/2"
        animate={mouthVariants[currentEmotion as keyof typeof mouthVariants]}
        transition={{ duration: 0.5 }}
      />
      
      {/* Working particles */}
      <AnimatePresence>
        {type === 'processing' && (
          <motion.div
            className="absolute -top-2 -right-2 w-2 h-2 bg-yellow-400 rounded-full"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
              x: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const LoadingSpinner = ({ type, size }: { type: string; size: string }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const getSpinnerColor = () => {
    switch (type) {
      case 'saving': return 'border-green-500';
      case 'uploading': return 'border-blue-500';
      case 'sending': return 'border-purple-500';
      case 'processing': return 'border-yellow-500';
      default: return 'border-orange-500';
    }
  };

  return (
    <motion.div
      className={`${sizeClasses[size as keyof typeof sizeClasses]} border-2 border-gray-200 rounded-full ${getSpinnerColor()}`}
      style={{ borderTopColor: 'transparent' }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

const ProgressBar = ({ progress, type }: { progress: number; type: string }) => {
  const getProgressColor = () => {
    switch (type) {
      case 'saving': return 'bg-green-500';
      case 'uploading': return 'bg-blue-500';
      case 'sending': return 'bg-purple-500';
      case 'processing': return 'bg-yellow-500';
      default: return 'bg-orange-500';
    }
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
      <motion.div
        className={`h-2 rounded-full ${getProgressColor()}`}
        initial={{ width: '0%' }}
        animate={{ width: `${Math.min(progress, 100)}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  );
};

const getLoadingMessage = (type: string) => {
  const messages = {
    saving: [
      "Menyimpan perubahan...",
      "Hampir selesai...",
      "Sedang memproses data..."
    ],
    loading: [
      "Memuat data...",
      "Sedang mengambil informasi...",
      "Tunggu sebentar..."
    ],
    uploading: [
      "Mengunggah file...",
      "Sedang mengirim...",
      "Hampir selesai..."
    ],
    processing: [
      "Memproses permintaan...",
      "Sedang bekerja...",
      "Menghitung hasil..."
    ],
    sending: [
      "Mengirim email...",
      "Sedang mengirim undangan...",
      "Memproses pengiriman..."
    ],
    default: [
      "Sedang memuat...",
      "Tunggu sebentar...",
      "Hampir selesai..."
    ]
  };

  const typeMessages = messages[type as keyof typeof messages] || messages.default;
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
};

export const PlayfulLoading: React.FC<PlayfulLoadingProps> = ({
  type = 'default',
  size = 'md',
  message,
  className = '',
  showProgress = false,
  progress = 0
}) => {
  const [currentMessage, setCurrentMessage] = useState(message || getLoadingMessage(type));
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage(getLoadingMessage(type));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [type, message]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const containerSizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${containerSizes[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <LoadingCharacter type={type} size={size} />
        <LoadingSpinner type={type} size={size} />
      </div>
      
      <motion.p
        className={`text-gray-600 font-medium text-center ${textSizes[size]}`}
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentMessage}{dots}
      </motion.p>
      
      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <ProgressBar progress={progress} type={type} />
          <p className="text-xs text-gray-500 text-center mt-1">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </motion.div>
  );
};

// Overlay loading component
export const LoadingOverlay: React.FC<PlayfulLoadingProps & { isVisible: boolean }> = ({
  isVisible,
  ...props
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PlayfulLoading {...props} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Button loading component
export const LoadingButton: React.FC<{
  isLoading: boolean;
  loadingType?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  isLoading,
  loadingType = 'default',
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative flex items-center justify-center space-x-2 ${className} ${
        (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            <LoadingSpinner type={loadingType} size="sm" />
            <span>Memproses...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

// Skeleton loading with character
export const SkeletonLoading: React.FC<{
  lines?: number;
  showCharacter?: boolean;
  className?: string;
}> = ({ lines = 3, showCharacter = true, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {showCharacter && (
        <div className="flex items-center space-x-3 mb-4">
          <LoadingCharacter type="loading" size="sm" />
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
};