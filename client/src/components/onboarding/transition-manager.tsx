import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransitionManagerProps {
  isVisible: boolean;
  onStartGuidedHighlights: () => void;
  onSkip: () => void;
}

export default function TransitionManager({ 
  isVisible, 
  onStartGuidedHighlights, 
  onSkip 
}: TransitionManagerProps) {
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Small delay to allow onboarding completion animation to finish
      setTimeout(() => setShowTransition(true), 500);
    } else {
      setShowTransition(false);
    }
  }, [isVisible]);

  if (!showTransition) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Onboarding Selesai!
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Selamat! Anda telah menyelesaikan setup awal. Mari kita lanjutkan dengan tur interaktif untuk mengenal fitur-fitur utama.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Benefits list */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Yang akan Anda pelajari:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Navigasi menu utama dan fitur-fitur penting</li>
                <li>• Cara mengelola goals dan track progress</li>
                <li>• Tips produktivitas untuk daily focus</li>
                <li>• Fitur kolaborasi tim yang powerful</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onStartGuidedHighlights}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Mulai Tur Interaktif
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={onSkip}
                variant="outline"
                className="px-6 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-1" />
                Lewati
              </Button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 text-center">
              Anda bisa memulai tur kapan saja dari menu pengaturan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}