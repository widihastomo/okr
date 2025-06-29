import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Trophy, Star } from "lucide-react";

interface AchievementNotificationProps {
  achievement: {
    name: string;
    description: string;
    points: number;
    badgeColor: string;
    rarity: string;
  };
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="w-80 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-yellow-800">Achievement Unlocked!</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                <Badge className="bg-purple-100 text-purple-800">
                  {achievement.rarity}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{achievement.description}</p>
              
              <div className="flex items-center text-sm text-yellow-600 font-medium">
                <Star className="h-4 w-4 mr-1" />
                +{achievement.points} points earned
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}