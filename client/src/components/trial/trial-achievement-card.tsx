import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface TrialAchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    unlocked: boolean;
    unlockedAt?: string;
    pointsEarned?: number;
  };
  className?: string;
}

const categoryColors = {
  setup: "bg-blue-100 text-blue-800 border-blue-200",
  engagement: "bg-green-100 text-green-800 border-green-200", 
  progress: "bg-orange-100 text-orange-800 border-orange-200",
  completion: "bg-purple-100 text-purple-800 border-purple-200",
};

const categoryLabels = {
  setup: "Setup",
  engagement: "Keterlibatan",
  progress: "Progress",
  completion: "Penyelesaian",
};

export default function TrialAchievementCard({ achievement, className }: TrialAchievementCardProps) {
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;
  const isUnlocked = achievement.unlocked;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isUnlocked 
        ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm" 
        : "bg-gray-50 border-gray-200 opacity-75",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
            isUnlocked 
              ? "bg-orange-500 text-white" 
              : "bg-gray-300 text-gray-500"
          )}>
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={cn(
                "font-medium text-sm",
                isUnlocked ? "text-gray-900" : "text-gray-600"
              )}>
                {achievement.name}
              </h3>
              <div className="flex items-center gap-1">
                {isUnlocked && (
                  <Icons.Check className="w-4 h-4 text-green-600" />
                )}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs px-2 py-0.5",
                    isUnlocked 
                      ? "bg-orange-100 text-orange-700 border-orange-300" 
                      : "bg-gray-100 text-gray-600 border-gray-300"
                  )}
                >
                  +{achievement.points}
                </Badge>
              </div>
            </div>

            <p className={cn(
              "text-xs mb-3 leading-relaxed",
              isUnlocked ? "text-gray-700" : "text-gray-500"
            )}>
              {achievement.description}
            </p>

            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  categoryColors[achievement.category as keyof typeof categoryColors] || categoryColors.setup
                )}
              >
                {categoryLabels[achievement.category as keyof typeof categoryLabels] || achievement.category}
              </Badge>

              {isUnlocked && achievement.unlockedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(achievement.unlockedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short"
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}