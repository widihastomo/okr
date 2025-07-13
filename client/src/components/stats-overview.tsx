import { Card, CardContent } from "@/components/ui/card";
import { Target, CheckCircle, AlertTriangle, TrendingUp, Clock, Trophy } from "lucide-react";
import type { OKRWithKeyResults } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { StatsOverviewSkeleton } from "@/components/skeletons/dashboard-skeleton";

interface StatsOverviewProps {
  okrs: OKRWithKeyResults[];
  isLoading?: boolean;
}

export default function StatsOverview({ okrs, isLoading }: StatsOverviewProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate stats from filtered Goal data
  const calculateStats = () => {
    if (!okrs || okrs.length === 0) {
      return {
        totalGoals: 0,
        onTrack: 0,
        atRisk: 0,
        completed: 0,
        behind: 0,
        avgProgress: 0
      };
    }

    const statusCounts = okrs.reduce((acc, okr) => {
      const status = okr.status;
      if (status === 'on_track') acc.onTrack++;
      else if (status === 'at_risk') acc.atRisk++;
      else if (status === 'completed') acc.completed++;
      else if (status === 'behind') acc.behind++;
      return acc;
    }, { onTrack: 0, atRisk: 0, completed: 0, behind: 0 });

    const totalProgress = okrs.reduce((sum, okr) => {
      const progress = okr.keyResults.reduce((keyResultSum, kr) => {
        const currentValue = parseFloat(kr.currentValue || '0');
        const targetValue = parseFloat(kr.targetValue);
        const baseValue = parseFloat(kr.baseValue || '0');
        
        if (kr.keyResultType === 'increase_to') {
          return keyResultSum + Math.min(100, Math.max(0, ((currentValue - baseValue) / (targetValue - baseValue)) * 100));
        } else if (kr.keyResultType === 'decrease_to') {
          return keyResultSum + Math.min(100, Math.max(0, ((baseValue - currentValue) / (baseValue - targetValue)) * 100));
        } else {
          return keyResultSum + (currentValue >= targetValue ? 100 : 0);
        }
      }, 0);
      
      return sum + (okr.keyResults.length > 0 ? progress / okr.keyResults.length : 0);
    }, 0);

    return {
      totalGoals: okrs.length,
      ...statusCounts,
      avgProgress: okrs.length > 0 ? Math.round(totalProgress / okrs.length) : 0
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: "Total Goals",
      value: stats.totalGoals.toString(),
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.completed.toString(),
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Behind",
      value: stats.behind.toString(),
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
    {
      title: "Avg Progress",
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  // Auto-rotate cards on mobile - only runs after component mounts
  useEffect(() => {
    const checkAndSetupAutoRotate = () => {
      const isMobile = window.innerWidth < 640;
      if (!isMobile) return;

      const interval = setInterval(() => {
        setCurrentCard((prev) => (prev + 1) % statCards.length);
      }, 3000);

      return interval;
    };

    const interval = checkAndSetupAutoRotate();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statCards.length]);

  // Handle touch/mouse events for swipe
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    setStartX(pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (!sliderRef.current) return;
    
    const cardWidth = sliderRef.current.offsetWidth;
    const scrollPosition = sliderRef.current.scrollLeft;
    const newIndex = Math.round(scrollPosition / cardWidth);
    setCurrentCard(Math.max(0, Math.min(newIndex, statCards.length - 1)));
    
    // Snap to card
    sliderRef.current.scrollTo({
      left: newIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  const goToCard = (index: number) => {
    setCurrentCard(index);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: index * sliderRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return <StatsOverviewSkeleton />;
  }

  return (
    <>
      {/* Mobile Slider */}
      <div className="sm:hidden mb-6">
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="w-full flex-shrink-0 snap-center px-4">
                  <Card className={cn(
                    "shadow-lg border border-gray-200 transition-all duration-300",
                    currentCard === index ? "scale-105" : "scale-95 opacity-80"
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                          <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          
          {/* Dot indicators */}
          <div className="flex justify-center mt-4 gap-2">
            {statCards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToCard(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentCard === index 
                    ? "bg-blue-600 w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm border border-gray-200">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 truncate">{stat.title}</p>
                    <p className="text-lg lg:text-2xl font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}