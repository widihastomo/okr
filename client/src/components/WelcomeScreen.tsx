import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Compass,
  Target,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Play,
} from "lucide-react";
import TourCompletionModal from "./TourCompletionModal";

interface WelcomeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export default function WelcomeScreen({
  isOpen,
  onClose,
  onStartTour,
}: WelcomeScreenProps) {
  const { toast } = useToast();
  const startTourButtonRef = useRef<HTMLButtonElement>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // Focus on "Mulai Tour" button when modal opens
  useEffect(() => {
    if (isOpen && startTourButtonRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        startTourButtonRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const updateOnboardingProgress = async (step: string) => {
    try {
      const response = await fetch('/api/auth/update-onboarding-progress', {
        method: 'POST',
        body: JSON.stringify({ step }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Onboarding progress updated: ${step}`);
    } catch (error) {
      console.error('Failed to update onboarding progress:', error);
    }
  };

  const handleStartTour = async () => {
    try {
      // Update tour started status in database
      const response = await fetch('/api/tour/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Tour started status updated in database');
      
      // Mark missions completed when user starts the tour
      await updateOnboardingProgress('missions_completed');
      onStartTour();
    } catch (error) {
      console.error('Failed to update tour started status:', error);
      // Still proceed with tour even if API call fails
      await updateOnboardingProgress('missions_completed');
      onStartTour();
    }
  };

  const handleSkipTour = async () => {
    try {
      // Update tour completed status in database when user skips tour
      const response = await fetch('/api/tour/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Tour completed status updated in database (skipped)');
      
      // Mark missions completed even if user skips tour
      await updateOnboardingProgress('missions_completed');
      
      // Close welcome screen and show completion modal
      onClose();
      setIsSkipped(true);
      setShowCompletionModal(true);
      
    } catch (error) {
      console.error('Failed to update tour completed status:', error);
      // Still proceed with closing even if API call fails
      await updateOnboardingProgress('missions_completed');
      onClose();
      setIsSkipped(true);
      setShowCompletionModal(true);
    }
  };

  const features = [
    {
      icon: <Target className="h-5 w-5 text-orange-500" />,
      title: "Kelola Tujuan Dengan Strategi Terukur",
      description:
        "Tetapkan tujuan yang jelas dan pantau hasilnya secara nyata dan terukur",
    },
    {
      icon: <Users className="h-5 w-5 text-blue-500" />,
      title: "Alignment Tim",
      description:
        "Menyelaraskan tujuan dengan tim dan tetapkan kontribusi masing - masing terhadap goals bersama.",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Analytics & Progress",
      description:
        "Analisis performa dan progress dengan visualisasi yang jelas dan realtime",
    },
    {
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      title: "Daily Focus",
      description: "Bangun kebiasaan kerja yang konsisten dan berdampak lewat check-in harian. Fokus setiap hari = progres setiap minggu.",
    },
  ];

  const tourHighlights = [
    "Navigasi utama dan fitur-fitur penting",
    "Cara membuat dan mengelola goals",
    "Sistem notifikasi dan reminder",
    "Analytics dan laporan progress",
    "Pengaturan tim dan organisasi",
  ];

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Selamat Datang di Refokus
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Terima kasih telah bergabung! Kami akan membantu Anda memahami
              fitur utama untuk memaksimalkan produktivitas tim dan pencapaian
              goals.
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Compass className="h-5 w-5 text-orange-500" />
              Fitur Utama Platform
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {feature.icon}
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tour Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              Yang Akan Anda Pelajari
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ul className="space-y-2">
                {tourHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleSkipTour} className="flex-1">
              Lewati Tour
            </Button>
            <Button
              ref={startTourButtonRef}
              onClick={handleStartTour}
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 tour-mobile-pulse"
            >
              <Play className="h-4 w-4 mr-2" />
              Mulai Tour
            </Button>
          </div>

          {/* Tour Info */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>
              Tour interaktif ini akan memandu Anda melalui 10 fitur utama
              platform (~5 menit)
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <TourCompletionModal
      isOpen={showCompletionModal}
      onClose={() => setShowCompletionModal(false)}
      isSkipped={isSkipped}
    />
    </>
  );
}
