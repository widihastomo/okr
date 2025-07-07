import React, { useState } from "react";
import { useOnboarding, ONBOARDING_TOURS } from "@/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  HelpCircle, 
  Play, 
  CheckCircle, 
  MapPin, 
  Clock,
  Users,
  Target,
  Calendar
} from "lucide-react";

const tourIcons = {
  welcome: Target,
  "daily-focus": Calendar,
  "create-okr": Users
};

export const TourLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { startTour, completedTours, isFirstTimeUser } = useOnboarding();

  const handleStartTour = (tourId: string) => {
    startTour(tourId);
    setIsOpen(false);
  };

  const completionPercentage = (completedTours.length / ONBOARDING_TOURS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Panduan
          {isFirstTimeUser && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            Panduan Interaktif
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Progress Anda</CardTitle>
                <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                  {completedTours.length}/{ONBOARDING_TOURS.length} Tour
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Kemajuan Onboarding</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              
              {completionPercentage === 100 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Selamat! Anda telah menyelesaikan semua tour.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Tours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tour yang Tersedia</h3>
            
            <div className="grid gap-4">
              {ONBOARDING_TOURS.map((tour) => {
                const isCompleted = completedTours.includes(tour.id);
                const Icon = tourIcons[tour.id as keyof typeof tourIcons] || Target;
                
                return (
                  <Card 
                    key={tour.id} 
                    className={`transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'hover:shadow-md'}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Icon className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {tour.title}
                              {isCompleted && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  Selesai
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {tour.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{tour.steps.length} langkah</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>~{Math.ceil(tour.steps.length * 0.5)} menit</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleStartTour(tour.id)}
                          size="sm"
                          variant={isCompleted ? "outline" : "default"}
                          className={!isCompleted ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600" : ""}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {isCompleted ? "Ulangi Tour" : "Mulai Tour"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-900">Tips Cepat</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Anda dapat mengakses panduan kapan saja melalui tombol "Panduan" di header</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Tour dapat dilewati atau dihentikan kapan saja dengan tombol X</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Tour yang sudah selesai dapat diulang untuk refresher</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};