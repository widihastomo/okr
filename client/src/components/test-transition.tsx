import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGuidedHighlights } from '@/hooks/useGuidedHighlights';
import { CheckCircle, PlayCircle, RotateCcw, TestTube } from 'lucide-react';

export default function TestTransition() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const guidedHighlights = useGuidedHighlights();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const resetTest = () => {
    setTestResults([]);
    guidedHighlights.resetGuidedHighlights();
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('transitionState');
    addTestResult('✅ Test direset - semua state dibersihkan');
  };

  const testTransition = () => {
    addTestResult('🚀 Memulai test sistem transisi...');
    
    // Simulasi onboarding selesai
    localStorage.setItem('onboardingCompleted', 'true');
    addTestResult('✅ Onboarding ditandai selesai');
    
    // Mulai guided highlights
    guidedHighlights.startGuidedHighlights();
    addTestResult('✅ Guided highlights dimulai');
    
    // Periksa state
    setTimeout(() => {
      const state = localStorage.getItem('guidedHighlightsState');
      if (state) {
        const parsed = JSON.parse(state);
        addTestResult(`📊 State guided highlights: ${parsed.isActive ? 'Aktif' : 'Tidak aktif'}`);
      }
    }, 500);
  };

  const testStepNavigation = () => {
    addTestResult('🎯 Testing navigasi langkah-langkah...');
    
    // Test next step
    guidedHighlights.setCurrentStep(1);
    addTestResult('➡️ Pindah ke langkah 2');
    
    setTimeout(() => {
      guidedHighlights.setCurrentStep(2);
      addTestResult('➡️ Pindah ke langkah 3');
    }, 1000);
    
    setTimeout(() => {
      guidedHighlights.setCurrentStep(0);
      addTestResult('⬅️ Kembali ke langkah 1');
    }, 2000);
  };

  const completeTest = () => {
    addTestResult('✅ Menyelesaikan guided highlights...');
    guidedHighlights.completeGuidedHighlights();
    addTestResult('✅ Guided highlights selesai');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <Card className="w-96 bg-white shadow-2xl border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Sistem Transisi
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Test untuk memverifikasi sistem transisi onboarding ke guided highlights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={resetTest}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            <Button
              onClick={testTransition}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              <PlayCircle className="w-3 h-3 mr-1" />
              Test Transisi
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={testStepNavigation}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🎯 Test Navigasi
            </Button>
            <Button
              onClick={completeTest}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-gray-700 mb-2">Test Results:</p>
            {testResults.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Belum ada hasil test</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <p key={index} className="text-xs text-gray-700 font-mono">
                    {result}
                  </p>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Status:</strong> {guidedHighlights.isActive ? 'Aktif' : 'Tidak aktif'} | 
              Step: {guidedHighlights.currentStep + 1} | 
              {guidedHighlights.isCompleted ? 'Selesai' : 'Belum selesai'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}