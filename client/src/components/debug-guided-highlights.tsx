import React, { useState, useEffect } from 'react';
import { useGuidedHighlights } from '@/hooks/useGuidedHighlights';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugGuidedHighlights() {
  const [results, setResults] = useState<string[]>([]);
  const guidedHighlights = useGuidedHighlights();

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGuidedHighlights = () => {
    addResult('🚀 Memulai test guided highlights...');
    
    // Cek state awal
    addResult(`State awal: isActive=${guidedHighlights.isActive}, currentStep=${guidedHighlights.currentStep}`);
    
    // Cek apakah element yang dicari ada
    const elements = [
      '[data-tour="today-tasks-card"]',
      '[data-tour="sidebar-menu"]',
      '[data-tour="create-goal-button"]',
      '[data-tour="user-profile-card"]',
      '[data-tour="level-progress-card"]'
    ];
    
    elements.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        addResult(`✅ Element ${index + 1} ditemukan: ${selector}`);
      } else {
        addResult(`❌ Element ${index + 1} tidak ditemukan: ${selector}`);
      }
    });
    
    // Mulai guided highlights
    guidedHighlights.startGuidedHighlights();
    addResult('✅ Guided highlights dimulai');
    
    // Check state setelah dimulai
    setTimeout(() => {
      addResult(`State setelah dimulai: isActive=${guidedHighlights.isActive}, currentStep=${guidedHighlights.currentStep}`);
      
      // Cek apakah overlay ada
      const overlay = document.querySelector('.onboarding-overlay');
      if (overlay) {
        addResult('✅ Overlay ditemukan');
      } else {
        addResult('❌ Overlay tidak ditemukan');
      }
      
      // Cek apakah highlight ada
      const highlight = document.querySelector('.onboarding-highlight');
      if (highlight) {
        addResult('✅ Highlight ditemukan');
      } else {
        addResult('❌ Highlight tidak ditemukan');
      }
    }, 1000);
  };

  const forceShowGuide = () => {
    // Force show guided highlights dengan manipulasi DOM langsung
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    document.body.appendChild(overlay);
    
    const firstElement = document.querySelector('[data-tour="today-tasks-card"]');
    if (firstElement) {
      firstElement.classList.add('onboarding-highlight');
      addResult('✅ Highlight ditambahkan ke element pertama');
    } else {
      addResult('❌ Element pertama tidak ditemukan untuk highlight');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const stopGuidedHighlights = () => {
    guidedHighlights.completeGuidedHighlights();
    addResult('🛑 Guided highlights dihentikan');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Debug Guided Highlights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testGuidedHighlights} variant="outline" size="sm">
            Test Guided Highlights
          </Button>
          <Button onClick={forceShowGuide} variant="outline" size="sm">
            Force Show Guide
          </Button>
          <Button onClick={stopGuidedHighlights} variant="outline" size="sm">
            Stop Guide
          </Button>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">Klik tombol test untuk memulai debug...</p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}