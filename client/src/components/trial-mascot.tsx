import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  MessageCircle,
  Sparkles,
  Heart,
  Star,
  Zap,
  Trophy,
  Target,
  ChevronRight,
  Lightbulb,
  Rocket,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mascot expressions and states
type MascotState = "welcome" | "encouraging" | "celebrating" | "thinking" | "waving" | "pointing";

interface MascotProps {
  className?: string;
}

// SVG Mascot Character Component
const MascotCharacter: React.FC<{ state: MascotState; className?: string }> = ({ state, className }) => {
  const getExpression = () => {
    switch (state) {
      case "welcome":
        return { eyes: "^_^", mouth: "smile", color: "#f59e0b" };
      case "encouraging":
        return { eyes: "o_o", mouth: "determined", color: "#3b82f6" };
      case "celebrating":
        return { eyes: "* *", mouth: "joy", color: "#10b981" };
      case "thinking":
        return { eyes: "- -", mouth: "thinking", color: "#8b5cf6" };
      case "waving":
        return { eyes: "^_^", mouth: "smile", color: "#f59e0b" };
      case "pointing":
        return { eyes: "o_o", mouth: "excited", color: "#ef4444" };
      default:
        return { eyes: "^_^", mouth: "smile", color: "#f59e0b" };
    }
  };

  const expression = getExpression();
  const isAnimated = state === "celebrating" || state === "waving";

  return (
    <div className={cn("relative", className)}>
      {/* Sparkles animation for celebrating state */}
      {state === "celebrating" && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 animate-pulse" />
          <Star className="absolute -top-1 -left-3 h-3 w-3 text-yellow-500 animate-bounce" />
          <Sparkles className="absolute -bottom-2 right-1 h-3 w-3 text-yellow-400 animate-pulse delay-300" />
        </div>
      )}
      
      {/* Main mascot body */}
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "w-16 h-16 drop-shadow-lg",
          isAnimated && "animate-bounce"
        )}
      >
        {/* Shadow */}
        <ellipse cx="50" cy="85" rx="15" ry="3" fill="#00000020" />
        
        {/* Body */}
        <circle
          cx="50"
          cy="60"
          r="18"
          fill={expression.color}
          className="transition-colors duration-300"
        />
        
        {/* Head */}
        <circle
          cx="50"
          cy="35"
          r="20"
          fill={expression.color}
          className="transition-colors duration-300"
        />
        
        {/* Eyes */}
        <circle cx="44" cy="30" r="2" fill="white" />
        <circle cx="56" cy="30" r="2" fill="white" />
        <circle cx="44" cy="30" r="1" fill="black" />
        <circle cx="56" cy="30" r="1" fill="black" />
        
        {/* Mouth */}
        <path
          d={expression.mouth === "smile" ? "M 42 40 Q 50 45 58 40" :
              expression.mouth === "joy" ? "M 40 40 Q 50 48 60 40" :
              expression.mouth === "determined" ? "M 45 40 L 55 40" :
              expression.mouth === "thinking" ? "M 45 40 Q 50 42 55 40" :
              expression.mouth === "excited" ? "M 42 38 Q 50 46 58 38" :
              "M 42 40 Q 50 45 58 40"}
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Arms */}
        <circle cx="28" cy="55" r="6" fill={expression.color} className="transition-colors duration-300" />
        <circle cx="72" cy="55" r="6" fill={expression.color} className="transition-colors duration-300" />
        
        {/* Legs */}
        <circle cx="42" cy="75" r="6" fill={expression.color} className="transition-colors duration-300" />
        <circle cx="58" cy="75" r="6" fill={expression.color} className="transition-colors duration-300" />
        
        {/* Special accessories based on state */}
        {state === "celebrating" && (
          <circle cx="50" cy="20" r="3" fill="#fbbf24" />
        )}
        
        {state === "thinking" && (
          <circle cx="58" cy="25" r="1" fill="#e5e7eb" />
        )}
      </svg>
      
      {/* Floating heart for encouraging state */}
      {state === "encouraging" && (
        <Heart className="absolute -top-2 -right-2 h-4 w-4 text-red-400 animate-ping" />
      )}
      
      {/* Pointing hand for pointing state */}
      {state === "pointing" && (
        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
          <ChevronRight className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default function TrialMascot({ className }: MascotProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentState, setCurrentState] = useState<MascotState>("welcome");
  const [messageIndex, setMessageIndex] = useState(0);

  // Fetch trial data and achievements
  const { data: trialStatus } = useQuery({
    queryKey: ["/api/trial-status"],
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/trial-achievements"],
  });

  // Calculate progress
  const completedAchievements = achievements.filter((a: any) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const progressPercentage = totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0;
  const daysRemaining = trialStatus?.daysRemaining || 14;

  // Contextual messages based on progress and trial status
  const getContextualMessages = () => {
    if (progressPercentage === 0) {
      return [
        {
          state: "welcome" as MascotState,
          title: "Halo! Selamat datang! 👋",
          message: "Saya Orby, panduan virtual Anda! Mari jelajahi fitur-fitur platform ini bersama-sama.",
          action: "Mulai Petualangan",
          icon: Rocket,
        },
        {
          state: "thinking" as MascotState,
          title: "Apa itu Goal dan Angka Target? 🎯",
          message: "Goal adalah tujuan yang ingin dicapai organisasi, sedangkan Angka Target adalah metrik terukur untuk mengevaluasi pencapaian goal tersebut. Contoh: Goal 'Meningkatkan Kepuasan Pelanggan' dengan target 'Rating 4.5/5'.",
          action: "Lihat Panduan",
          icon: Target,
        },
        {
          state: "encouraging" as MascotState,
          title: "Ayo mulai! 🚀",
          message: "Ikuti panduan onboarding di bawah untuk memulai perjalanan Anda. Saya akan membantu setiap langkahnya!",
          action: "Lihat Panduan",
          icon: Target,
        },
        {
          state: "pointing" as MascotState,
          title: "Contoh Goal yang Baik 💡",
          message: "Goal yang efektif adalah SMART: Specific (spesifik), Measurable (terukur), Achievable (dapat dicapai), Relevant (relevan), Time-bound (berbatas waktu). Contoh: 'Meningkatkan pendapatan bulanan sebesar 25% dalam 6 bulan ke depan'.",
          action: "Buat Goal Pertama",
          icon: Lightbulb,
        },
      ];
    } else if (progressPercentage < 30) {
      return [
        {
          state: "encouraging" as MascotState,
          title: "Mulai yang bagus! 💪",
          message: "Anda sudah menyelesaikan beberapa langkah. Terus semangat, masih ada banyak fitur menarik yang menanti!",
          action: "Lanjutkan",
          icon: Zap,
        },
        {
          state: "thinking" as MascotState,
          title: "Memahami Angka Target 📊",
          message: "Angka Target (Key Result) mengukur kemajuan goal secara kuantitatif. Contoh untuk goal 'Meningkatkan Brand Awareness': Target 'Followers Instagram naik 1000 orang', 'Engagement rate naik 15%', 'Reach bulanan 50K'.",
          action: "Tambah Angka Target",
          icon: Target,
        },
        {
          state: "pointing" as MascotState,
          title: "Tip dari Orby! 💡",
          message: "Coba buat objective pertama Anda! Ini akan membantu tim fokus pada tujuan yang jelas.",
          action: "Buat Objective",
          icon: Lightbulb,
        },
        {
          state: "encouraging" as MascotState,
          title: "Hubungan Goal dan Target 🔗",
          message: "Setiap Goal sebaiknya memiliki 2-4 Angka Target untuk mengukur kesuksesan. Target harus spesifik, terukur, dan realistis. Contoh Goal 'Meningkatkan Produktivitas Tim': Target 'Menyelesaikan 90% task tepat waktu', 'Mengurangi meeting 30%'.",
          action: "Pahami Lebih Lanjut",
          icon: Target,
        },
      ];
    } else if (progressPercentage < 70) {
      return [
        {
          state: "celebrating" as MascotState,
          title: "Luar biasa! 🎉",
          message: "Anda sudah mahir menggunakan platform ini! Tim Anda pasti akan terkesan dengan progress yang dibuat.",
          action: "Terus Maju",
          icon: Trophy,
        },
        {
          state: "thinking" as MascotState,
          title: "Saatnya optimasi! 🔧",
          message: "Sekarang coba eksplorasi fitur analytics untuk melihat perkembangan tim secara detail.",
          action: "Lihat Analytics",
          icon: Star,
        },
      ];
    } else {
      return [
        {
          state: "celebrating" as MascotState,
          title: "Anda sudah ahli! 🏆",
          message: "Luar biasa! Anda sudah menguasai sebagian besar fitur. Siap untuk mengelola tim dengan efektif!",
          action: "Explore Lebih",
          icon: Trophy,
        },
        {
          state: "waving" as MascotState,
          title: "Saya bangga! 🌟",
          message: "Upgrade ke paket premium untuk membuka fitur-fitur advanced dan mengelola tim yang lebih besar!",
          action: "Lihat Paket",
          icon: Gift,
        },
      ];
    }
  };

  const messages = getContextualMessages();
  const currentMessage = messages[messageIndex];

  // Auto-rotate messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Update mascot state based on current message
  useEffect(() => {
    setCurrentState(currentMessage.state);
  }, [currentMessage.state]);

  // Auto-hide after 30 seconds for returning users
  useEffect(() => {
    if (progressPercentage > 50) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [progressPercentage]);

  if (!isVisible) return null;

  const IconComponent = currentMessage.icon;

  return (
    <div className={cn("relative", className)}>
      <Card className="relative overflow-hidden border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <MascotCharacter state={currentState} />
              <div className="flex-1">
                <CardTitle className="text-base font-bold text-indigo-800 flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {currentMessage.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    {completedAchievements}/{totalAchievements} selesai
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                    {daysRemaining} hari tersisa
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            <p className="text-sm text-indigo-700 leading-relaxed">
              {currentMessage.message}
            </p>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-indigo-600">
                <span>Progress Trial</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs h-8 flex-1"
                onClick={() => {
                  // Action based on current message
                  const action = currentMessage.action;
                  console.log("Mascot button clicked with action:", action);
                  
                  if (action.includes("Panduan") || action.includes("Petualangan")) {
                    // Scroll to onboarding section
                    document.querySelector('[data-testid="onboarding-missions"]')?.scrollIntoView({ behavior: 'smooth' });
                  } else if (action.includes("Objective") || action.includes("Buat")) {
                    window.location.href = "/dashboard";
                  } else if (action.includes("Analytics") || action.includes("Lihat Analytics")) {
                    window.location.href = "/analytics";
                  } else if (action.includes("Paket") || action.includes("Lihat Paket")) {
                    window.location.href = "/pricing";
                  } else if (action.includes("Lanjutkan") || action.includes("Terus")) {
                    // Stay on current page and cycle to next message
                    setMessageIndex((prev) => (prev + 1) % messages.length);
                  } else if (action.includes("Explore")) {
                    window.location.href = "/analytics";
                  } else if (action.includes("Tambah Angka Target")) {
                    window.location.href = "/dashboard";
                  } else if (action.includes("Buat Goal") || action.includes("Goal Pertama")) {
                    window.location.href = "/dashboard";
                  } else if (action.includes("Pahami Lebih Lanjut")) {
                    // Cycle to next educational message
                    setMessageIndex((prev) => (prev + 1) % messages.length);
                  } else {
                    // Default action - scroll to onboarding
                    document.querySelector('[data-testid="onboarding-missions"]')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                {currentMessage.action}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 w-8 p-0 border-indigo-200 hover:bg-indigo-50"
                onClick={() => setMessageIndex((prev) => (prev + 1) % messages.length)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Message dots indicator */}
            <div className="flex justify-center gap-1">
              {messages.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === messageIndex
                      ? "bg-indigo-500"
                      : "bg-indigo-200 hover:bg-indigo-300"
                  )}
                  onClick={() => setMessageIndex(index)}
                />
              ))}
            </div>
          </div>
        </CardContent>
        
        {/* Floating message bubble */}
        <div className="absolute -top-2 -right-2 opacity-75">
          <MessageCircle className="h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
      </Card>
    </div>
  );
}