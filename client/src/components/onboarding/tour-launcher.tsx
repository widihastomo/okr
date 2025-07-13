import React, { useState } from "react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Play, 
  CheckCircle, 
  Calendar,
  Target,
  Users,
  BarChart3,
  Sun,
  Sparkles
} from "lucide-react";

export default function TourLauncher() {
  const { 
    startTour, 
    completedTours, 
    isOnboardingActive,
    currentTour
  } = useOnboarding();

  // Import tours directly
  const ONBOARDING_TOURS = [
    {
      id: "welcome",
      name: "Welcome Tour",
      title: "Selamat Datang di Goal Management!",
      description: "Mari kenali fitur-fitur utama platform ini",
      steps: []
    },
    {
      id: "daily-focus",
      name: "Daily Focus Tour", 
      title: "Mengelola Aktivitas Harian",
      description: "Pelajari cara menggunakan Daily Focus untuk produktivitas optimal",
      steps: []
    },
    {
      id: "goal-creation",
      name: "Goal Creation Tour",
      title: "Membuat Goal Pertama",
      description: "Tutorial lengkap membuat Objective dan Key Results",
      steps: []
    },
    {
      id: "team-collaboration",
      name: "Team Collaboration Tour",
      title: "Kolaborasi Tim",
      description: "Pelajari cara berkolaborasi dengan tim dalam mencapai objectives",
      steps: []
    },
    {
      id: "progress-tracking",
      name: "Progress Tracking Tour",
      title: "Tracking Progress",
      description: "Pelajari cara memantau dan update progress objectives",
      steps: []
    }
  ];

  // Define tour icons
  const getTourIcon = (tourId: string) => {
    switch (tourId) {
      case "welcome":
        return <Sparkles className="w-4 h-4" />;
      case "daily-focus":
        return <Sun className="w-4 h-4" />;
      case "goal-creation":
        return <Target className="w-4 h-4" />;
      case "team-collaboration":
        return <Users className="w-4 h-4" />;
      case "progress-tracking":
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const availableTours = ONBOARDING_TOURS;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="relative"
          disabled={isOnboardingActive}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Panduan
          {/* Show notification dot if there are unfinished tours */}
          {completedTours.length < availableTours.length && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-semibold">
          Tutorial Interaktif
        </DropdownMenuLabel>
        <div className="px-2 pb-2 text-xs text-gray-500">
          Pilih tutorial yang ingin Anda pelajari
        </div>
        <DropdownMenuSeparator />
        
        {availableTours.map((tour) => {
          const isCompleted = completedTours.includes(tour.id);
          const isCurrent = currentTour?.id === tour.id;
          
          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => !isOnboardingActive && startTour(tour.id)}
              className="flex items-start p-3 cursor-pointer hover:bg-gray-50"
              disabled={isOnboardingActive}
            >
              <div className="flex items-center w-full">
                <div className="flex-shrink-0 mr-3">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    getTourIcon(tour.id)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {tour.title}
                    </h4>
                    {isCompleted && (
                      <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                        Selesai
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="default" className="ml-2 text-xs bg-orange-100 text-orange-700">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {tour.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-400">
                      {tour.steps.length} langkah
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress:</span>
            <span className="font-medium">
              {completedTours.length}/{availableTours.length} selesai
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-orange-600 to-orange-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedTours.length / availableTours.length) * 100}%` }}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}