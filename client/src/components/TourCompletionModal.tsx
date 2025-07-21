import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Sparkles, 
  Target, 
  Trophy, 
  Lightbulb,
  ArrowRight,
  HelpCircle
} from "lucide-react";

interface TourCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSkipped?: boolean;
}

export default function TourCompletionModal({
  isOpen,
  onClose,
  isSkipped = false,
}: TourCompletionModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Hide confetti after 4 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const title = isSkipped ? "Siap Memulai!" : "Selamat! Tour Selesai!";
  const subtitle = isSkipped 
    ? "Anda siap untuk memulai perjalanan OKR" 
    : "Anda telah menguasai dasar-dasar platform";

  return (
    <>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="confetti" />
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl text-center">
            <div className="relative">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <Sparkles className="h-4 w-4 text-orange-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          {/* Celebration Animation */}
          <div className="flex justify-center items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {subtitle}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Sekarang Anda siap untuk <span className="font-semibold text-orange-600">menciptakan strategi yang tepat dan terukur</span> bersama tim. 
              Platform ini akan membantu Anda mengubah visi menjadi hasil yang nyata.
            </p>
          </div>

          {/* Success Features */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Target className="h-5 w-5 text-orange-500" />
              <span>Buat objektif yang jelas dan terukur</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>Pantau progress secara real-time</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Trophy className="h-5 w-5 text-orange-500" />
              <span>Capai target bersama tim</span>
            </div>
          </div>

          {/* Tour Restart Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800">
                  Butuh mengulang tour?
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Anda dapat memulai ulang tour kapan saja melalui menu "Bantuan" di sidebar kiri
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Mulai Berkarya!
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}